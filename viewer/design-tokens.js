// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS INSPECTOR — Cross-Screen Design Analysis
// Scans all visible screen iframes to extract and analyze:
//   • Color palette with frequency counts
//   • Typography patterns (fonts, sizes, weights)
//   • Spacing consistency (padding/margin/gap values)
//   • Border radius patterns
// Displays results in a slide-out panel with visual swatches.
// ═══════════════════════════════════════════════════════════════

const DesignTokens = {

    // ── State ──────────────────────────────────────────────
    _panelEl: null,
    _isOpen: false,
    _lastScan: null,     // cached scan results
    _scanning: false,

    // ── Edit State ─────────────────────────────────────────
    _editHistory: [],    // [{ type, prop, oldValue, newValue, elements: [...] }]
    _editIndex: -1,      // current position in history (for undo/redo)
    _editCount: 0,       // total pending edits

    // ── Curated property sets to scan ─────────────────────
    COLOR_PROPS: [
        'color', 'background-color', 'border-top-color', 'border-right-color',
        'border-bottom-color', 'border-left-color', 'outline-color',
        'text-decoration-color', 'fill', 'stroke'
    ],
    SKIP_COLORS: new Set([
        'rgba(0, 0, 0, 0)', 'transparent', 'inherit', 'currentcolor',
        'rgb(0, 0, 0)', 'rgb(255, 255, 255)'  // pure black/white often unintentional
    ]),
    FONT_PROPS: ['font-family', 'font-size', 'font-weight', 'line-height'],
    SPACING_PROPS: [
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'gap', 'row-gap', 'column-gap'
    ],
    RADIUS_PROPS: [
        'border-top-left-radius', 'border-top-right-radius',
        'border-bottom-right-radius', 'border-bottom-left-radius'
    ],


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('dt-panel');
        this._setupEvents();
        if (this._panelEl) {
            FloatingWindows.setupDrag(this._panelEl, this._panelEl.querySelector('.dt-header'));
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
        document.getElementById('btn-tokens')?.classList.add('on');
        this.scan();
    },

    close() {
        this._isOpen = false;
        this._panelEl?.classList.remove('open');
        document.getElementById('btn-tokens')?.classList.remove('on');
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },


    // ═════════════════════════════════════════════════════
    //  SCANNING ENGINE
    // ═════════════════════════════════════════════════════

    /** Scan all visible iframes and extract design tokens */
    async scan() {
        if (this._scanning) return;
        this._scanning = true;
        this._showLoading();

        const results = {
            colors: {},       // { rgba(...): { count, screens: Set, elements: [] } }
            fonts: {},        // { "Inter": { count, screens: Set } }
            fontSizes: {},    // { "16px": { count, screens: Set } }
            fontWeights: {},  // { "700": { count } }
            spacing: {},      // { "16px": { count, props: Set } }
            radii: {},        // { "8px": { count } }
            totalElements: 0,
            screensScanned: 0
        };

        const iframes = document.querySelectorAll('.ss iframe');

        for (const iframe of iframes) {
            let doc;
            try { doc = iframe.contentDocument; } catch (e) { continue; }
            if (!doc || !doc.body) continue;

            const screenId = iframe.closest('.ss')?.dataset.scr || 'unknown';
            results.screensScanned++;

            // Walk all visible elements
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
                acceptNode: (node) => {
                    const tag = node.tagName;
                    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'BR', 'HR'].includes(tag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip our own inspector overlays
                    if (node.id && node.id.startsWith('ei-')) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            let el;
            while (el = walker.nextNode()) {
                results.totalElements++;
                const cs = iframe.contentWindow.getComputedStyle(el);

                // ── Colors ──
                for (const prop of this.COLOR_PROPS) {
                    const val = cs.getPropertyValue(prop);
                    if (!val || this.SKIP_COLORS.has(val.toLowerCase())) continue;
                    const normalized = this._normalizeColor(val);
                    if (!normalized) continue;
                    if (!results.colors[normalized]) {
                        results.colors[normalized] = { count: 0, screens: new Set(), raw: val };
                    }
                    results.colors[normalized].count++;
                    results.colors[normalized].screens.add(screenId);
                }

                // ── Fonts ──
                const fontFamily = cs.getPropertyValue('font-family');
                if (fontFamily) {
                    const primary = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
                    if (primary && primary !== 'serif' && primary !== 'sans-serif' && primary !== 'monospace') {
                        if (!results.fonts[primary]) results.fonts[primary] = { count: 0, screens: new Set() };
                        results.fonts[primary].count++;
                        results.fonts[primary].screens.add(screenId);
                    }
                }

                const fontSize = cs.getPropertyValue('font-size');
                if (fontSize && fontSize !== '0px') {
                    if (!results.fontSizes[fontSize]) results.fontSizes[fontSize] = { count: 0, screens: new Set() };
                    results.fontSizes[fontSize].count++;
                    results.fontSizes[fontSize].screens.add(screenId);
                }

                const fontWeight = cs.getPropertyValue('font-weight');
                if (fontWeight && fontWeight !== '400') {
                    if (!results.fontWeights[fontWeight]) results.fontWeights[fontWeight] = { count: 0 };
                    results.fontWeights[fontWeight].count++;
                }

                // ── Spacing ──
                for (const prop of this.SPACING_PROPS) {
                    const val = cs.getPropertyValue(prop);
                    if (!val || val === '0px' || val === 'auto' || val === 'normal') continue;
                    const rounded = Math.round(parseFloat(val)) + 'px';
                    if (!results.spacing[rounded]) results.spacing[rounded] = { count: 0, props: new Set() };
                    results.spacing[rounded].count++;
                    results.spacing[rounded].props.add(prop.replace(/-(top|right|bottom|left)$/, ''));
                }

                // ── Border Radius ──
                for (const prop of this.RADIUS_PROPS) {
                    const val = cs.getPropertyValue(prop);
                    if (!val || val === '0px') continue;
                    const rounded = Math.round(parseFloat(val)) + 'px';
                    if (!results.radii[rounded]) results.radii[rounded] = { count: 0 };
                    results.radii[rounded].count++;
                }
            }

            // Yield to keep UI responsive
            await new Promise(r => setTimeout(r, 0));
        }

        this._lastScan = results;
        this._scanning = false;
        this._renderResults(results);
    },


    // ═════════════════════════════════════════════════════
    //  COLOR NORMALIZATION
    // ═════════════════════════════════════════════════════

    /** Normalize CSS color to a consistent rgba( ) string */
    _normalizeColor(val) {
        if (!val) return null;
        val = val.trim().toLowerCase();
        if (val === 'transparent' || val === 'inherit' || val === 'currentcolor') return null;

        // Already rgb/rgba
        const rgbaMatch = val.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
        if (rgbaMatch) {
            const r = Math.round(parseFloat(rgbaMatch[1]));
            const g = Math.round(parseFloat(rgbaMatch[2]));
            const b = Math.round(parseFloat(rgbaMatch[3]));
            const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
            if (a < 0.02) return null; // Effectively transparent
            return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(2)})` : `rgb(${r},${g},${b})`;
        }

        // Hex
        if (val.startsWith('#')) {
            return this._hexToRgb(val);
        }

        return val; // fallback
    },

    _hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length === 8) {
            const a = parseInt(hex.slice(6, 8), 16) / 255;
            if (a < 0.02) return null;
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
        return `rgb(${r},${g},${b})`;
    },

    /** Convert an rgb(r,g,b) string to hex */
    _rgbToHex(rgb) {
        const m = rgb.match(/(\d+)/g);
        if (!m || m.length < 3) return rgb;
        return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    },

    /** Calculate relative luminance for contrast grouping */
    _luminance(rgb) {
        const m = rgb.match(/(\d+)/g);
        if (!m) return 0.5;
        const [r, g, b] = m.map(n => {
            const c = parseInt(n) / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },

    /** Group a color as 'dark', 'mid', or 'light' for display sorting */
    _colorGroup(rgb) {
        const l = this._luminance(rgb);
        if (l < 0.15) return 'dark';
        if (l > 0.6) return 'light';
        return 'mid';
    },


    // ═════════════════════════════════════════════════════
    //  RENDER RESULTS
    // ═════════════════════════════════════════════════════

    _showLoading() {
        const body = document.getElementById('dt-body');
        if (body) {
            body.innerHTML = `
                <div class="dt-loading">
                    <div class="dt-spinner"></div>
                    <div>Scanning screens…</div>
                </div>`;
        }
    },

    _renderResults(r) {
        const body = document.getElementById('dt-body');
        if (!body) return;

        let html = '';

        // ── Stats Bar ──
        html += `<div class="dt-stats">
            <span>${r.screensScanned} screens</span>
            <span>${r.totalElements} elements</span>
            <span>${Object.keys(r.colors).length} colors</span>
            <span>${Object.keys(r.fonts).length} fonts</span>
        </div>`;

        // ── Color Palette ──
        html += this._renderColorSection(r.colors);

        // ── Typography ──
        html += this._renderTypographySection(r.fonts, r.fontSizes, r.fontWeights);

        // ── Spacing Scale ──
        html += this._renderSpacingSection(r.spacing);

        // ── Border Radii ──
        html += this._renderRadiiSection(r.radii);

        body.innerHTML = html;

        // Setup collapsible sections
        body.querySelectorAll('.dt-group-header').forEach(h => {
            h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
        });

        // Setup copy on single-click, edit on double-click for colors
        body.querySelectorAll('.dt-color-swatch[data-color]').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const hex = swatch.dataset.hex || swatch.dataset.color;
                navigator.clipboard.writeText(hex).then(() => toast(`Copied ${hex}`));
            });
            swatch.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this._openColorEditor(swatch, swatch.dataset.color);
            });
            swatch.title += ' · Double-click to edit';
        });

        // Setup double-click editing for font sizes
        body.querySelectorAll('.dt-size-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                const valSpan = item.querySelector('.dt-size-val');
                if (valSpan) {
                    const size = valSpan.textContent.trim() + 'px';
                    this._openValueEditor(item, 'fontSize', 'font-size', size);
                }
            });
            item.style.cursor = 'pointer';
            item.title = (item.title || '') + ' · Double-click to edit';
        });

        // Setup double-click editing for spacing
        body.querySelectorAll('.dt-spacing-row').forEach(row => {
            row.addEventListener('dblclick', () => {
                const valSpan = row.querySelector('.dt-spacing-val');
                if (valSpan) {
                    this._openValueEditor(row, 'spacing', '', valSpan.textContent.trim());
                }
            });
            row.style.cursor = 'pointer';
            row.title = (row.title || '') + ' · Double-click to edit';
        });

        // Setup double-click editing for radii
        body.querySelectorAll('.dt-radius-chip').forEach(chip => {
            chip.addEventListener('dblclick', () => {
                const valSpan = chip.querySelector('span:nth-child(2)');
                if (valSpan && valSpan.textContent !== '∞') {
                    this._openValueEditor(chip, 'radius', '', valSpan.textContent.trim());
                }
            });
            chip.style.cursor = 'pointer';
        });
    },

    _renderColorSection(colors) {
        const sorted = Object.entries(colors)
            .sort((a, b) => b[1].count - a[1].count);

        if (sorted.length === 0) return '';

        // Group by luminance
        const groups = { dark: [], mid: [], light: [] };
        sorted.forEach(([color, data]) => {
            const group = this._colorGroup(color);
            groups[group].push([color, data]);
        });

        let html = `<div class="dt-group">
            <div class="dt-group-header">
                <span class="dt-group-icon">◐</span>
                <span class="dt-group-name">Color Palette</span>
                <span class="dt-group-count">${sorted.length}</span>
                <span class="dt-group-arrow">▾</span>
            </div>
            <div class="dt-group-body">`;

        // Top 12 colors as large swatches
        html += `<div class="dt-palette-grid">`;
        sorted.slice(0, 12).forEach(([color, data]) => {
            const hex = this._rgbToHex(color);
            const textColor = this._luminance(color) > 0.4 ? '#09090b' : '#fafafa';
            html += `<div class="dt-color-swatch" data-color="${color}" data-hex="${hex}"
                title="${hex} — used ${data.count}× across ${data.screens.size} screen(s)" 
                style="background:${color}; color:${textColor}">
                <span class="dt-swatch-hex">${hex}</span>
                <span class="dt-swatch-count">${data.count}×</span>
            </div>`;
        });
        html += `</div>`;

        // Remaining colors as small dots
        if (sorted.length > 12) {
            html += `<div class="dt-palette-overflow">`;
            sorted.slice(12, 48).forEach(([color, data]) => {
                const hex = this._rgbToHex(color);
                html += `<span class="dt-color-dot" data-color="${color}" data-hex="${hex}"
                    style="background:${color}" title="${hex} — ${data.count}×"></span>`;
            });
            if (sorted.length > 48) {
                html += `<span class="dt-overflow-more">+${sorted.length - 48} more</span>`;
            }
            html += `</div>`;
        }

        html += `</div></div>`;
        return html;
    },

    _renderTypographySection(fonts, sizes, weights) {
        const sortedFonts = Object.entries(fonts).sort((a, b) => b[1].count - a[1].count);
        const sortedSizes = Object.entries(sizes)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
        const sortedWeights = Object.entries(weights).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        if (sortedFonts.length === 0 && sortedSizes.length === 0) return '';

        let html = `<div class="dt-group">
            <div class="dt-group-header">
                <span class="dt-group-icon">Aa</span>
                <span class="dt-group-name">Typography</span>
                <span class="dt-group-count">${sortedFonts.length} fonts · ${sortedSizes.length} sizes</span>
                <span class="dt-group-arrow">▾</span>
            </div>
            <div class="dt-group-body">`;

        // Font families
        if (sortedFonts.length > 0) {
            html += `<div class="dt-sub-label">Font Families</div>`;
            sortedFonts.forEach(([font, data]) => {
                const bar = Math.min(100, (data.count / sortedFonts[0][1].count) * 100);
                html += `<div class="dt-font-row">
                    <span class="dt-font-name" style="font-family:'${font}',sans-serif">${font}</span>
                    <div class="dt-bar-track"><div class="dt-bar-fill" style="width:${bar}%"></div></div>
                    <span class="dt-font-meta">${data.count}× · ${data.screens.size} scr</span>
                </div>`;
            });
        }

        // Font size scale
        if (sortedSizes.length > 0) {
            html += `<div class="dt-sub-label">Size Scale</div>`;
            html += `<div class="dt-size-strip">`;
            sortedSizes.forEach(([size, data]) => {
                const px = parseFloat(size);
                const display = px >= 10 ? Math.round(px) : px.toFixed(1);
                const bar = Math.min(100, (data.count / sortedSizes.reduce((m, [, d]) => Math.max(m, d.count), 0)) * 100);
                html += `<div class="dt-size-item" title="${size} — ${data.count}× across ${data.screens.size} screen(s)">
                    <span class="dt-size-val" style="font-size:${Math.min(px, 20)}px">${display}</span>
                    <div class="dt-bar-track dt-bar-sm"><div class="dt-bar-fill dt-bar-blue" style="width:${bar}%"></div></div>
                    <span class="dt-size-count">${data.count}</span>
                </div>`;
            });
            html += `</div>`;
        }

        // Font weights
        if (sortedWeights.length > 0) {
            html += `<div class="dt-sub-label">Weights</div>`;
            html += `<div class="dt-weights">`;
            sortedWeights.forEach(([w, data]) => {
                const names = { '100': 'Thin', '200': 'ExLight', '300': 'Light', '400': 'Regular', '500': 'Medium', '600': 'Semi', '700': 'Bold', '800': 'ExBold', '900': 'Black' };
                html += `<span class="dt-weight-chip" style="font-weight:${w}" title="${data.count}×">${names[w] || w} <small>${data.count}</small></span>`;
            });
            html += `</div>`;
        }

        html += `</div></div>`;
        return html;
    },

    _renderSpacingSection(spacing) {
        const sorted = Object.entries(spacing)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

        if (sorted.length === 0) return '';

        const maxCount = sorted.reduce((m, [, d]) => Math.max(m, d.count), 0);

        let html = `<div class="dt-group">
            <div class="dt-group-header">
                <span class="dt-group-icon">⊞</span>
                <span class="dt-group-name">Spacing Scale</span>
                <span class="dt-group-count">${sorted.length} values</span>
                <span class="dt-group-arrow">▾</span>
            </div>
            <div class="dt-group-body">`;

        html += `<div class="dt-spacing-grid">`;
        sorted.slice(0, 20).forEach(([size, data]) => {
            const px = parseFloat(size);
            const bar = Math.min(100, (data.count / maxCount) * 100);
            const propList = Array.from(data.props).join(', ');
            html += `<div class="dt-spacing-row" title="Used as: ${propList}">
                <span class="dt-spacing-viz"><span style="width:${Math.min(px, 80)}px"></span></span>
                <span class="dt-spacing-val">${size}</span>
                <div class="dt-bar-track dt-bar-sm"><div class="dt-bar-fill dt-bar-green" style="width:${bar}%"></div></div>
                <span class="dt-spacing-count">${data.count}</span>
            </div>`;
        });
        html += `</div>`;

        html += `</div></div>`;
        return html;
    },

    _renderRadiiSection(radii) {
        const sorted = Object.entries(radii)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

        if (sorted.length === 0) return '';

        const maxCount = sorted.reduce((m, [, d]) => Math.max(m, d.count), 0);

        let html = `<div class="dt-group collapsed">
            <div class="dt-group-header">
                <span class="dt-group-icon">◰</span>
                <span class="dt-group-name">Border Radius</span>
                <span class="dt-group-count">${sorted.length}</span>
                <span class="dt-group-arrow">▾</span>
            </div>
            <div class="dt-group-body">`;

        html += `<div class="dt-radii-row">`;
        sorted.forEach(([size, data]) => {
            const px = parseFloat(size);
            const display = px >= 9999 ? '∞' : Math.round(px) + 'px';
            html += `<div class="dt-radius-chip" title="${data.count}×">
                <span class="dt-radius-preview" style="border-radius:${Math.min(px, 20)}px"></span>
                <span>${display}</span>
                <small>${data.count}</small>
            </div>`;
        });
        html += `</div>`;

        html += `</div></div>`;
        return html;
    },


    // ═════════════════════════════════════════════════════
    //  TOKEN EDITING ENGINE
    // ═════════════════════════════════════════════════════

    /**
     * Apply a token edit across all screen iframes.
     * @param {'color'|'fontSize'|'spacing'|'radius'} type - Token type
     * @param {string} prop - CSS property being changed (e.g. 'background-color', 'font-size')
     * @param {string} oldValue - Original CSS value
     * @param {string} newValue - New CSS value
     */
    applyEdit(type, prop, oldValue, newValue) {
        if (oldValue === newValue) return;

        const affected = [];
        const iframes = document.querySelectorAll('.ss iframe');

        for (const iframe of iframes) {
            let doc;
            try { doc = iframe.contentDocument; } catch (e) { continue; }
            if (!doc || !doc.body) continue;

            const screenId = iframe.closest('.ss')?.dataset.scr || 'unknown';
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);
            let el;
            while (el = walker.nextNode()) {
                const cs = iframe.contentWindow.getComputedStyle(el);
                const currentVal = cs.getPropertyValue(prop);
                if (!currentVal) continue;

                let matches = false;
                if (type === 'color') {
                    const norm = this._normalizeColor(currentVal);
                    matches = norm === oldValue;
                } else {
                    const rounded = Math.round(parseFloat(currentVal)) + 'px';
                    matches = rounded === oldValue || currentVal === oldValue;
                }

                if (matches) {
                    // Store original inline style for undo
                    const prevInline = el.style.getPropertyValue(prop);
                    el.style.setProperty(prop, newValue, 'important');
                    affected.push({ el, iframe, screenId, prop, prevInline });
                }
            }
        }

        if (affected.length === 0) {
            toast('No matching elements found');
            return;
        }

        // Trim any redo history beyond current position
        this._editHistory = this._editHistory.slice(0, this._editIndex + 1);

        this._editHistory.push({ type, prop, oldValue, newValue, affected });
        this._editIndex = this._editHistory.length - 1;
        this._editCount++;
        this._updateEditBadge();

        toast(`Updated ${affected.length} elements`);
    },

    /** Undo the last edit */
    undoEdit() {
        if (this._editIndex < 0) { toast('Nothing to undo'); return; }
        const entry = this._editHistory[this._editIndex];

        for (const { el, prop, prevInline } of entry.affected) {
            if (prevInline) {
                el.style.setProperty(prop, prevInline);
            } else {
                el.style.removeProperty(prop);
            }
        }

        this._editIndex--;
        this._editCount--;
        this._updateEditBadge();
        toast('Edit undone');
    },

    /** Redo a previously undone edit */
    redoEdit() {
        if (this._editIndex >= this._editHistory.length - 1) { toast('Nothing to redo'); return; }
        this._editIndex++;
        const entry = this._editHistory[this._editIndex];

        for (const { el, prop } of entry.affected) {
            el.style.setProperty(prop, entry.newValue, 'important');
        }

        this._editCount++;
        this._updateEditBadge();
        toast('Edit redone');
    },

    /** Reset all edits */
    resetAllEdits() {
        // Walk backwards undoing everything
        while (this._editIndex >= 0) {
            this.undoEdit();
        }
        this._editHistory = [];
        this._editIndex = -1;
        this._editCount = 0;
        this._updateEditBadge();
        toast('All edits reset');
    },

    /** Update the edit count badge in the header */
    _updateEditBadge() {
        const badge = document.getElementById('dt-edit-badge');
        if (!badge) return;
        if (this._editCount > 0) {
            badge.textContent = this._editCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
        // Enable/disable undo/redo buttons
        const undoBtn = document.getElementById('dt-undo');
        const redoBtn = document.getElementById('dt-redo');
        if (undoBtn) undoBtn.style.opacity = this._editIndex >= 0 ? '1' : '0.3';
        if (redoBtn) redoBtn.style.opacity = this._editIndex < this._editHistory.length - 1 ? '1' : '0.3';
    },

    /** Show inline color editor when swatch is double-clicked */
    _openColorEditor(swatchEl, colorRgb) {
        const hex = this._rgbToHex(colorRgb);
        const input = document.createElement('input');
        input.type = 'color';
        input.value = hex;
        input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
        swatchEl.appendChild(input);
        input.click();

        input.addEventListener('input', () => {
            const newHex = input.value;
            swatchEl.style.background = newHex;
            swatchEl.querySelector('.dt-swatch-hex').textContent = newHex;
        });

        input.addEventListener('change', () => {
            const newHex = input.value;
            const newRgb = this._hexToRgb(newHex);
            // Apply to all matching color properties
            for (const prop of this.COLOR_PROPS) {
                this.applyEdit('color', prop, colorRgb, newHex);
            }
            input.remove();
            // Re-scan after a brief delay to reflect changes
            setTimeout(() => this.scan(), 300);
        });

        // Clean up if cancelled
        input.addEventListener('blur', () => setTimeout(() => input.remove(), 200));
    },

    /** Show inline value editor for sizes */
    _openValueEditor(el, type, prop, currentValue) {
        if (el.querySelector('.dt-inline-edit')) return;

        const input = document.createElement('input');
        input.className = 'dt-inline-edit';
        input.type = 'text';
        input.value = currentValue;
        input.style.cssText = 'width:50px;padding:2px 4px;font-size:11px;background:var(--s3);border:1px solid var(--accent);border-radius:4px;color:var(--text);text-align:center;outline:none;';

        const valSpan = el.querySelector('.dt-size-val, .dt-spacing-val, span');
        if (!valSpan) return;
        const originalText = valSpan.textContent;
        valSpan.style.display = 'none';
        valSpan.parentNode.insertBefore(input, valSpan);
        input.focus();
        input.select();

        const commit = () => {
            let newVal = input.value.trim();
            if (!newVal.endsWith('px')) newVal += 'px';
            input.remove();
            valSpan.style.display = '';

            if (newVal !== currentValue) {
                valSpan.textContent = newVal;
                const propName = type === 'fontSize' ? 'font-size' : type === 'radius' ? 'border-radius' : prop;
                if (type === 'spacing') {
                    // Apply to all spacing props that had this value
                    for (const sp of this.SPACING_PROPS) {
                        this.applyEdit(type, sp, currentValue, newVal);
                    }
                } else if (type === 'radius') {
                    for (const rp of this.RADIUS_PROPS) {
                        this.applyEdit(type, rp, currentValue, newVal);
                    }
                } else {
                    this.applyEdit(type, propName, currentValue, newVal);
                }
            }
        };

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { input.remove(); valSpan.style.display = ''; }
        });
        input.addEventListener('blur', commit);
    },


    // ═════════════════════════════════════════════════════
    //  EXPORT
    // ═════════════════════════════════════════════════════

    exportJSON() {
        if (!this._lastScan) { toast('Run a scan first'); return; }
        const r = this._lastScan;

        const exportData = {
            meta: {
                app: window.curApp?.name || 'Unknown',
                screensScanned: r.screensScanned,
                totalElements: r.totalElements,
                scannedAt: new Date().toISOString()
            },
            colors: Object.entries(r.colors)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([color, d]) => ({
                    value: color,
                    hex: this._rgbToHex(color),
                    count: d.count,
                    screens: d.screens.size
                })),
            fonts: Object.entries(r.fonts)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([font, d]) => ({ name: font, count: d.count, screens: d.screens.size })),
            fontSizes: Object.entries(r.fontSizes)
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .map(([size, d]) => ({ value: size, count: d.count })),
            spacing: Object.entries(r.spacing)
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .map(([size, d]) => ({ value: size, count: d.count, usedAs: [...d.props] })),
            radii: Object.entries(r.radii)
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .map(([size, d]) => ({ value: size, count: d.count }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `design-tokens-${window.curApp?.id || 'app'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Design tokens exported as JSON');
    },


    // ═════════════════════════════════════════════════════
    //  EVENT SETUP
    // ═════════════════════════════════════════════════════

    _setupEvents() {
        document.getElementById('dt-close')?.addEventListener('click', () => this.close());
        document.getElementById('dt-rescan')?.addEventListener('click', () => this.scan());
        document.getElementById('dt-export')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('dt-undo')?.addEventListener('click', () => this.undoEdit());
        document.getElementById('dt-redo')?.addEventListener('click', () => this.redoEdit());
        document.getElementById('dt-reset-edits')?.addEventListener('click', () => this.resetAllEdits());
    }

};
