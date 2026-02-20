// ═══════════════════════════════════════════════════════════════
// STYLE PRESETS — Save, Manage & Apply Design Styles
// Extends the Element Inspector's pick/apply workflow:
//   • Save captured styles as named, reusable presets
//   • Preset library with categories and search
//   • Batch apply to all elements matching a selector
//   • Import/export preset collections as JSON
//   • Live preview on hover
// ═══════════════════════════════════════════════════════════════

const StylePresets = {

    // ── State ──────────────────────────────────────────────
    _panelEl: null,
    _isOpen: false,
    _presets: [],       // [{ id, name, category, style:{}, source:{}, createdAt }]
    _editing: null,     // preset id being edited
    _undoStack: [],     // [{ el, iframe, screenId, originalStyle }]

    CATEGORIES: [
        { id: 'card', name: 'Cards', icon: '🃏' },
        { id: 'button', name: 'Buttons', icon: '🔘' },
        { id: 'text', name: 'Typography', icon: '📝' },
        { id: 'container', name: 'Containers', icon: '📦' },
        { id: 'nav', name: 'Navigation', icon: '🧭' },
        { id: 'custom', name: 'Custom', icon: '✨' }
    ],


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('sp-panel');
        this._loadPresets();
        this._setupEvents();
        if (this._panelEl) {
            FloatingWindows.setupDrag(this._panelEl, this._panelEl.querySelector('.sp-header'));
        }
    },

    open() {
        if (!this._panelEl) return;
        this._isOpen = true;
        const pos = FloatingWindows.getStaggeredPosition();
        this._panelEl.style.right = pos.right + 'px';
        this._panelEl.style.top = pos.top + 'px';
        this._panelEl.style.left = 'auto';
        this._panelEl.classList.add('open');
        FloatingWindows.bringToFront(this._panelEl);
        document.getElementById('btn-presets')?.classList.add('on');
        this._renderPresets();
    },

    close() {
        this._isOpen = false;
        this._panelEl?.classList.remove('open');
        document.getElementById('btn-presets')?.classList.remove('on');
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },


    // ═════════════════════════════════════════════════════
    //  SAVING  PRESETS
    // ═════════════════════════════════════════════════════

    /** Save the current inspector's captured style as a preset */
    saveFromInspector(name, category) {
        if (typeof ElementInspector === 'undefined' || !ElementInspector._styleClipboard) {
            toast('No style captured — use Inspector\'s "Pick" first');
            return null;
        }

        const clip = ElementInspector._styleClipboard;
        const preset = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name || `${clip.source.tag} style`,
            category: category || this._guessCategory(clip.source.tag, clip.source.classes),
            style: { ...clip.style },
            source: { ...clip.source },
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        this._presets.unshift(preset);
        this._savePresets();
        this._renderPresets();
        toast(`Preset "${preset.name}" saved`);
        return preset;
    },

    /** Save from a selected element directly (no need to pick first) */
    saveFromElement(el, iframe, screenId, name, category) {
        if (!el || !iframe) {
            toast('No element to capture');
            return null;
        }

        const computed = iframe.contentWindow.getComputedStyle(el);
        const style = {};
        const importantProps = [
            'background', 'background-color', 'background-image', 'background-size',
            'color', 'font-family', 'font-size', 'font-weight', 'font-style',
            'line-height', 'letter-spacing', 'text-align', 'text-transform',
            'border', 'border-radius', 'box-shadow', 'text-shadow',
            'padding', 'opacity', 'backdrop-filter'
        ];

        importantProps.forEach(p => {
            const v = computed.getPropertyValue(p);
            if (v && !this._isDefaultValue(p, v)) style[p] = v;
        });

        const tag = el.tagName.toLowerCase();
        const classes = el.className && typeof el.className === 'string' ? el.className : '';

        const preset = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name || `${tag} style`,
            category: category || this._guessCategory(tag, classes),
            style,
            source: { tag, classes, screenId, app: window.curApp?.id },
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        this._presets.unshift(preset);
        this._savePresets();
        this._renderPresets();
        toast(`Preset "${preset.name}" saved`);
        return preset;
    },


    // ═════════════════════════════════════════════════════
    //  APPLYING PRESETS
    // ═════════════════════════════════════════════════════

    /** Apply a preset to the currently selected element in Inspector */
    applyToSelected(presetId) {
        const preset = this._presets.find(p => p.id === presetId);
        if (!preset) { toast('Preset not found'); return; }

        if (typeof ElementInspector === 'undefined' || !ElementInspector.selectedEl) {
            toast('Select an element first (use Inspector)');
            return;
        }

        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        const screenId = ElementInspector.selectedScreenId;

        // Save undo state
        const originalStyle = el.getAttribute('style') || '';
        this._undoStack.push({ el, iframe, screenId, originalStyle, presetId, presetName: preset.name });

        // Apply styles
        for (const [prop, val] of Object.entries(preset.style)) {
            el.style.setProperty(prop, val);
        }

        preset.usageCount = (preset.usageCount || 0) + 1;
        this._savePresets();

        toast(`Applied "${preset.name}"`);

        // Refresh inspector panel
        ElementInspector.showPanel(el, iframe, screenId);
    },

    /** Batch apply a preset to all matching elements across all iframes */
    batchApply(presetId, selector) {
        const preset = this._presets.find(p => p.id === presetId);
        if (!preset) { toast('Preset not found'); return; }

        let applied = 0;
        const iframes = document.querySelectorAll('.ss iframe');

        for (const iframe of iframes) {
            let doc;
            try { doc = iframe.contentDocument; } catch (e) { continue; }
            if (!doc || !doc.body) continue;

            const screenId = iframe.closest('.ss')?.dataset.scr || 'unknown';
            const elements = doc.querySelectorAll(selector);

            elements.forEach(el => {
                const originalStyle = el.getAttribute('style') || '';
                this._undoStack.push({ el, iframe, screenId, originalStyle, presetId, presetName: preset.name });

                for (const [prop, val] of Object.entries(preset.style)) {
                    el.style.setProperty(prop, val);
                }
                applied++;
            });
        }

        preset.usageCount = (preset.usageCount || 0) + applied;
        this._savePresets();
        toast(`Applied "${preset.name}" to ${applied} element(s)`);
    },

    /** Undo the last style application */
    undo() {
        if (this._undoStack.length === 0) { toast('Nothing to undo'); return; }

        const entry = this._undoStack.pop();
        try {
            entry.el.setAttribute('style', entry.originalStyle);
            toast(`Undid "${entry.presetName}"`);

            if (typeof ElementInspector !== 'undefined' &&
                ElementInspector.selectedEl === entry.el) {
                ElementInspector.showPanel(entry.el, entry.iframe, entry.screenId);
            }
        } catch (e) {
            toast('Undo failed — element may have been removed');
        }
    },

    /** Undo all style applications */
    undoAll() {
        if (this._undoStack.length === 0) { toast('Nothing to undo'); return; }
        const count = this._undoStack.length;
        while (this._undoStack.length > 0) {
            const entry = this._undoStack.pop();
            try { entry.el.setAttribute('style', entry.originalStyle); } catch (e) { }
        }
        toast(`Reverted ${count} style change(s)`);
    },


    // ═════════════════════════════════════════════════════
    //  PRESET MANAGEMENT
    // ═════════════════════════════════════════════════════

    deletePreset(id) {
        this._presets = this._presets.filter(p => p.id !== id);
        this._savePresets();
        this._renderPresets();
        toast('Preset deleted');
    },

    renamePreset(id, newName) {
        const preset = this._presets.find(p => p.id === id);
        if (preset) {
            preset.name = newName;
            this._savePresets();
            this._renderPresets();
        }
    },

    duplicatePreset(id) {
        const orig = this._presets.find(p => p.id === id);
        if (!orig) return;
        const copy = {
            ...JSON.parse(JSON.stringify(orig)),
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: orig.name + ' (copy)',
            createdAt: new Date().toISOString(),
            usageCount: 0
        };
        this._presets.unshift(copy);
        this._savePresets();
        this._renderPresets();
        toast('Preset duplicated');
    },


    // ═════════════════════════════════════════════════════
    //  IMPORT / EXPORT
    // ═════════════════════════════════════════════════════

    exportJSON() {
        if (this._presets.length === 0) { toast('No presets to export'); return; }
        const blob = new Blob([JSON.stringify(this._presets, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `style-presets-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`Exported ${this._presets.length} presets`);
    },

    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (!Array.isArray(imported)) throw new Error('Not an array');
                    const valid = imported.filter(p => p.id && p.name && p.style);
                    // Generate new IDs to avoid conflicts
                    valid.forEach(p => {
                        p.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                    });
                    this._presets = [...valid, ...this._presets];
                    this._savePresets();
                    this._renderPresets();
                    toast(`Imported ${valid.length} presets`);
                } catch (err) {
                    toast('Invalid preset file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },


    // ═════════════════════════════════════════════════════
    //  RENDERING
    // ═════════════════════════════════════════════════════

    _renderPresets() {
        const body = document.getElementById('sp-body');
        if (!body) return;

        const filter = document.getElementById('sp-search')?.value?.toLowerCase() || '';
        const catFilter = this._activeCategoryFilter || 'all';

        let filtered = this._presets;
        if (filter) filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(filter) ||
            p.source?.tag?.includes(filter)
        );
        if (catFilter !== 'all') filtered = filtered.filter(p => p.category === catFilter);

        let html = '';

        // Category filter chips
        html += `<div class="sp-cat-strip">
            <span class="sp-cat-chip ${catFilter === 'all' ? 'active' : ''}" data-cat="all">All</span>`;
        this.CATEGORIES.forEach(c => {
            const count = this._presets.filter(p => p.category === c.id).length;
            if (count > 0) {
                html += `<span class="sp-cat-chip ${catFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name} <small>${count}</small></span>`;
            }
        });
        html += `</div>`;

        if (filtered.length === 0) {
            html += `<div class="sp-empty">${this._presets.length === 0
                ? 'No presets yet — use Inspector\'s <strong>Pick</strong>, then <strong>Save Preset</strong>'
                : 'No matching presets'}</div>`;
        } else {
            filtered.forEach(p => {
                html += this._renderPresetCard(p);
            });
        }

        body.innerHTML = html;

        // Wire up events
        body.querySelectorAll('.sp-cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this._activeCategoryFilter = chip.dataset.cat;
                this._renderPresets();
            });
        });

        body.querySelectorAll('.sp-preset-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyToSelected(btn.dataset.id);
            });
        });

        body.querySelectorAll('.sp-preset-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePreset(btn.dataset.id);
            });
        });

        body.querySelectorAll('.sp-preset-dup').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.duplicatePreset(btn.dataset.id);
            });
        });
    },

    _renderPresetCard(preset) {
        const cat = this.CATEGORIES.find(c => c.id === preset.category);
        const stylePreview = this._buildStylePreview(preset.style);
        const styleCount = Object.keys(preset.style).length;
        const ago = this._timeAgo(preset.createdAt);

        return `<div class="sp-card" data-id="${preset.id}">
            <div class="sp-card-header">
                <span class="sp-card-icon">${cat?.icon || '✨'}</span>
                <div class="sp-card-info">
                    <span class="sp-card-name">${this._escHtml(preset.name)}</span>
                    <span class="sp-card-meta">${styleCount} props · ${preset.source?.tag || '?'} · ${ago}</span>
                </div>
                <div class="sp-card-actions">
                    <button class="sp-preset-apply" data-id="${preset.id}" title="Apply to selected">
                        <span class="material-symbols-outlined" style="font-size:13px">format_paint</span>
                    </button>
                    <button class="sp-preset-dup" data-id="${preset.id}" title="Duplicate">
                        <span class="material-symbols-outlined" style="font-size:13px">content_copy</span>
                    </button>
                    <button class="sp-preset-delete" data-id="${preset.id}" title="Delete">
                        <span class="material-symbols-outlined" style="font-size:13px">delete</span>
                    </button>
                </div>
            </div>
            <div class="sp-card-preview" style="${stylePreview}">
                <span>Aa</span>
            </div>
        </div>`;
    },

    /** Build a safe inline style from preset for preview display */
    _buildStylePreview(style) {
        const safe = {};
        const allowed = [
            'background', 'background-color', 'background-image',
            'color', 'font-family', 'font-size', 'font-weight',
            'border-radius', 'box-shadow', 'text-shadow', 'opacity'
        ];
        allowed.forEach(p => {
            if (style[p]) safe[p] = style[p];
        });
        return Object.entries(safe).map(([k, v]) => `${k}:${v}`).join(';');
    },


    // ═════════════════════════════════════════════════════
    //  SAVE DIALOG (inline in panel)
    // ═════════════════════════════════════════════════════

    showSaveDialog() {
        if (typeof ElementInspector === 'undefined' || !ElementInspector._styleClipboard) {
            // Try to capture from selected element
            if (ElementInspector?.selectedEl && ElementInspector?.selectedIframe) {
                ElementInspector.pickStyle();
            } else {
                toast('Pick a style first — select an element and click "Pick" in Inspector');
                return;
            }
        }

        const clip = ElementInspector._styleClipboard;
        const guessedCat = this._guessCategory(clip.source.tag, clip.source.classes);
        const guessedName = `${clip.source.tag} ${guessedCat}`;

        const body = document.getElementById('sp-body');
        if (!body) return;

        let html = `<div class="sp-save-dialog">
            <div class="sp-save-title">Save New Preset</div>
            <input type="text" id="sp-save-name" class="sp-input" placeholder="Preset name" value="${this._escHtml(guessedName)}" />
            <div class="sp-save-cats">`;
        this.CATEGORIES.forEach(c => {
            html += `<label class="sp-cat-radio">
                <input type="radio" name="sp-cat" value="${c.id}" ${c.id === guessedCat ? 'checked' : ''}>
                ${c.icon} ${c.name}
            </label>`;
        });
        html += `</div>
            <div class="sp-save-preview" style="${this._buildStylePreview(clip.style)}"><span>Preview</span></div>
            <div class="sp-save-actions">
                <button class="sp-btn sp-btn-cancel" id="sp-save-cancel">Cancel</button>
                <button class="sp-btn sp-btn-save" id="sp-save-confirm">Save Preset</button>
            </div>
        </div>`;

        body.innerHTML = html;

        document.getElementById('sp-save-cancel')?.addEventListener('click', () => this._renderPresets());
        document.getElementById('sp-save-confirm')?.addEventListener('click', () => {
            const name = document.getElementById('sp-save-name')?.value?.trim() || guessedName;
            const cat = body.querySelector('input[name="sp-cat"]:checked')?.value || 'custom';
            this.saveFromInspector(name, cat);
        });

        // Auto-focus name input
        setTimeout(() => document.getElementById('sp-save-name')?.select(), 100);
    },


    // ═════════════════════════════════════════════════════
    //  PERSISTENCE
    // ═════════════════════════════════════════════════════

    _loadPresets() {
        try {
            this._presets = JSON.parse(localStorage.getItem('sp-presets') || '[]');
        } catch {
            this._presets = [];
        }
    },

    _savePresets() {
        localStorage.setItem('sp-presets', JSON.stringify(this._presets));
    },


    // ═════════════════════════════════════════════════════
    //  UTILITIES
    // ═════════════════════════════════════════════════════

    _guessCategory(tag, classes) {
        if (!tag) return 'custom';
        const t = tag.toLowerCase();
        const c = (classes || '').toLowerCase();

        if (t === 'button' || t === 'a' || c.includes('btn') || c.includes('button')) return 'button';
        if (t === 'nav' || c.includes('nav') || c.includes('tab') || c.includes('menu')) return 'nav';
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label'].includes(t)) return 'text';
        if (c.includes('card') || c.includes('tile') || c.includes('panel')) return 'card';
        if (t === 'div' || t === 'section' || t === 'main' || t === 'article') {
            if (c.includes('card') || c.includes('tile')) return 'card';
            return 'container';
        }
        return 'custom';
    },

    _isDefaultValue(prop, value) {
        if (!value || value === '' || value === 'none' || value === 'auto' || value === 'normal') return true;
        if (value === '0px' || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return true;
        if (prop === 'opacity' && value === '1') return true;
        if (prop === 'font-weight' && value === '400') return true;
        if (prop === 'font-style' && value === 'normal') return true;
        return false;
    },

    _timeAgo(dateStr) {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    },

    _escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    _setupEvents() {
        document.getElementById('sp-close')?.addEventListener('click', () => this.close());
        document.getElementById('sp-save-new')?.addEventListener('click', () => this.showSaveDialog());
        document.getElementById('sp-undo')?.addEventListener('click', () => this.undo());
        document.getElementById('sp-undo-all')?.addEventListener('click', () => this.undoAll());
        document.getElementById('sp-import')?.addEventListener('click', () => this.importJSON());
        document.getElementById('sp-export-all')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('sp-search')?.addEventListener('input', () => this._renderPresets());
    }

};
