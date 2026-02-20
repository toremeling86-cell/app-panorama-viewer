// ═══════════════════════════════════════════════════════════════
// ELEMENT INSPECTOR — DOM-Level Annotation & Style System
// Inspect any HTML element in live screen iframes:
//   • Hover highlight with element tooltip
//   • Click to select → full properties panel
//   • Box model visualization (margin/border/padding/content)
//   • Computed CSS grouped by category
//   • Tailwind class list
//   • Per-element notes stored in localStorage
//   • Copy CSS / Copy Tailwind classes
//   • Style picking for future transfer
// ═══════════════════════════════════════════════════════════════

const ElementInspector = {

    // ── State ──────────────────────────────────────────────
    active: false,
    selectedEl: null,
    selectedIframe: null,
    selectedScreenId: null,
    _hoveredEl: null,
    _hoveredIframe: null,
    _iframeMap: new Map(),      // iframe → injection data
    _notes: {},                 // { "appId:screenId:selector": "note text" }
    _styleClipboard: null,      // captured style for transfer
    _panelPos: { x: 0, y: 0 }, // panel drag position

    // ── Style Property Groups ─────────────────────────────
    // Curated set of CSS properties organized by design category.
    // Only non-default values are displayed.
    STYLE_GROUPS: [
        {
            id: 'layout', name: 'Layout', icon: '⊞',
            props: [
                'display', 'position', 'top', 'right', 'bottom', 'left',
                'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
                'align-self', 'flex-grow', 'flex-shrink', 'gap',
                'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
                'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
                'overflow', 'overflow-x', 'overflow-y', 'z-index'
            ]
        },
        {
            id: 'appearance', name: 'Appearance', icon: '◐',
            props: [
                'background-color', 'background-image', 'background-size', 'background-position',
                'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
                'border-top-style', 'border-top-color',
                'border-radius',
                'border-top-left-radius', 'border-top-right-radius',
                'border-bottom-left-radius', 'border-bottom-right-radius',
                'box-shadow', 'opacity', 'backdrop-filter', 'outline',
                'visibility'
            ]
        },
        {
            id: 'typography', name: 'Typography', icon: 'Aa',
            props: [
                'font-family', 'font-size', 'font-weight', 'font-style',
                'color', 'line-height', 'letter-spacing', 'text-align',
                'text-decoration-line', 'text-decoration-color',
                'text-transform', 'text-shadow', 'white-space',
                'word-break', 'text-overflow'
            ]
        },
        {
            id: 'effects', name: 'Effects', icon: '✦',
            props: [
                'transform', 'transition-property', 'transition-duration',
                'animation-name', 'animation-duration',
                'filter', 'mix-blend-mode', 'cursor', 'pointer-events', 'user-select'
            ]
        }
    ],

    // CSS property values that indicate "not set" — we skip these in display
    DEFAULT_VALUES: new Set([
        'none', 'auto', 'normal', 'static', 'visible', '0px', '0s', '0',
        'row', 'stretch', 'start', 'baseline', 'initial', 'inherit',
        'running', 'ease', 'all', 'separate', 'flat', 'butt', 'miter',
        'repeat', 'scroll', 'border-box'
    ]),

    // Compound defaults — property + value combos to skip
    SKIP_EXACT: {
        'flex-grow': '0', 'flex-shrink': '1', 'flex-wrap': 'nowrap',
        'opacity': '1', 'visibility': 'visible', 'cursor': 'auto',
        'pointer-events': 'auto', 'user-select': 'auto',
        'text-align': 'start', 'font-style': 'normal',
        'text-decoration-line': 'none', 'text-transform': 'none',
        'white-space': 'normal', 'word-break': 'normal',
        'text-overflow': 'clip', 'mix-blend-mode': 'normal',
        'background-size': 'auto', 'background-position': '0% 0%',
        'overflow': 'visible', 'overflow-x': 'visible', 'overflow-y': 'visible',
        'z-index': 'auto', 'position': 'static',
        'grid-column': 'auto / auto', 'grid-row': 'auto / auto'
    },


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('ei-panel');
        this._modeBar = document.getElementById('ei-mode-bar');
        this._setupPanelDrag();
        this._setupPanelEvents();
        this._loadNotes();
    },

    activate() {
        if (this.active) return;
        this.active = true;
        document.body.classList.add('ei-active');
        document.getElementById('btn-inspect')?.classList.add('on');
        if (this._modeBar) this._modeBar.classList.add('show');

        // Enable pointer events on all iframes
        document.querySelectorAll('.df iframe').forEach(f => {
            f.dataset.eiPrevPointerEvents = f.style.pointerEvents;
            f.style.pointerEvents = 'auto';
        });

        this.refreshIframes();
        toast('Inspector activated — click elements to inspect');
    },

    deactivate() {
        if (!this.active) return;
        this.active = false;
        document.body.classList.remove('ei-active');
        document.getElementById('btn-inspect')?.classList.remove('on');
        if (this._modeBar) this._modeBar.classList.remove('show');

        // Restore pointer events
        document.querySelectorAll('.df iframe').forEach(f => {
            f.style.pointerEvents = f.dataset.eiPrevPointerEvents || 'none';
            delete f.dataset.eiPrevPointerEvents;
        });

        this.clearSelection();
        this.hidePanel();
        this._cleanupAllIframes();
        toast('Inspector deactivated');
    },

    toggle() {
        this.active ? this.deactivate() : this.activate();
    },


    // ═════════════════════════════════════════════════════
    //  IFRAME MANAGEMENT
    // ═════════════════════════════════════════════════════

    /** Scan all visible iframes and inject inspector overlays into any that aren't already injected */
    refreshIframes() {
        if (!this.active) return;
        document.querySelectorAll('.ss').forEach(slot => {
            const iframe = slot.querySelector('iframe');
            const screenId = slot.dataset.scr;
            if (!iframe || !screenId) return;
            if (this._iframeMap.has(iframe)) return; // already injected

            // If iframe is loaded, inject now; otherwise wait for load
            if (iframe.contentDocument && iframe.contentDocument.body) {
                this._injectIntoIframe(iframe, screenId);
            } else {
                const onLoad = () => {
                    iframe.removeEventListener('load', onLoad);
                    if (this.active) this._injectIntoIframe(iframe, screenId);
                };
                iframe.addEventListener('load', onLoad);
            }
        });
    },

    /** Inject hover/selection overlays and event listeners into an iframe */
    _injectIntoIframe(iframe, screenId) {
        let doc;
        try { doc = iframe.contentDocument; } catch (e) { return; }
        if (!doc || !doc.body) return;

        // ── Inject CSS for overlays ──
        const style = doc.createElement('style');
        style.id = 'ei-injected-styles';
        style.textContent = `
      #ei-hover-overlay {
        position: fixed; pointer-events: none; z-index: 999998;
        border: 2px solid rgba(129,140,248,0.85);
        background: rgba(129,140,248,0.06);
        border-radius: 2px;
        transition: left 60ms ease, top 60ms ease, width 60ms ease, height 60ms ease;
        display: none;
      }
      #ei-hover-overlay::after {
        content: '';
        position: absolute; inset: -6px;
        border: 1px dashed rgba(129,140,248,0.25);
        border-radius: 4px;
        pointer-events: none;
      }
      #ei-select-overlay {
        position: fixed; pointer-events: none; z-index: 999997;
        border: 2.5px solid #818cf8;
        background: rgba(129,140,248,0.04);
        box-shadow: 0 0 0 1px rgba(129,140,248,0.2), 0 0 12px rgba(129,140,248,0.15);
        border-radius: 2px;
        display: none;
      }
      #ei-tooltip {
        position: fixed; pointer-events: none; z-index: 999999;
        background: rgba(9,9,11,0.92);
        color: #e4e4e7;
        font: 500 11px/1.4 -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        padding: 3px 8px;
        border-radius: 5px;
        border: 1px solid rgba(129,140,248,0.35);
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        display: none;
        white-space: nowrap;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #ei-tooltip .ei-tt-tag { color: #c084fc; font-weight: 600; }
      #ei-tooltip .ei-tt-dim { color: #818cf8; margin-left: 6px; font-size: 10px; }
      #ei-tooltip .ei-tt-class { color: #71717a; font-size: 10px; display: block; margin-top: 1px; }
      body.ei-inspecting * { cursor: crosshair !important; }
    `;
        doc.head.appendChild(style);
        doc.body.classList.add('ei-inspecting');

        // ── Create overlay elements ──
        const hoverOverlay = doc.createElement('div');
        hoverOverlay.id = 'ei-hover-overlay';
        doc.body.appendChild(hoverOverlay);

        const selectOverlay = doc.createElement('div');
        selectOverlay.id = 'ei-select-overlay';
        doc.body.appendChild(selectOverlay);

        const tooltip = doc.createElement('div');
        tooltip.id = 'ei-tooltip';
        doc.body.appendChild(tooltip);

        // ── Event handlers ──
        const self = this;
        const data = { doc, iframe, screenId, hoverOverlay, selectOverlay, tooltip, style };

        data.onMouseMove = (e) => {
            if (!self.active) return;
            const target = self._resolveTarget(e.target, doc);
            if (!target || target === self._hoveredEl) {
                // Update tooltip position even if same element
                if (target && tooltip.style.display !== 'none') {
                    self._positionTooltip(tooltip, e.clientX, e.clientY, doc);
                }
                return;
            }
            self._hoveredEl = target;
            self._hoveredIframe = iframe;
            self._showHoverHighlight(target, data);
        };

        data.onMouseLeave = () => {
            self._hoveredEl = null;
            self._hoveredIframe = null;
            hoverOverlay.style.display = 'none';
            tooltip.style.display = 'none';
        };

        data.onClick = (e) => {
            if (!self.active) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const target = self._resolveTarget(e.target, doc);
            if (!target) return;
            self.selectElement(target, iframe, screenId, data);
        };

        data.onScroll = () => {
            // Re-position overlays on scroll
            if (self._hoveredEl && self._hoveredIframe === iframe) {
                const rect = self._hoveredEl.getBoundingClientRect();
                self._positionOverlay(hoverOverlay, rect);
            }
            if (self.selectedEl && self.selectedIframe === iframe) {
                const rect = self.selectedEl.getBoundingClientRect();
                self._positionOverlay(selectOverlay, rect);
            }
        };

        // Attach listeners (capture phase to intercept before page handlers)
        doc.addEventListener('mousemove', data.onMouseMove, true);
        doc.addEventListener('mouseleave', data.onMouseLeave, true);
        doc.addEventListener('click', data.onClick, true);
        doc.addEventListener('scroll', data.onScroll, true);
        // Also capture scrolling on nested containers
        doc.querySelectorAll('[class*="overflow"]').forEach(el => {
            el.addEventListener('scroll', data.onScroll, { passive: true });
        });

        this._iframeMap.set(iframe, data);
    },

    /** Remove all injections from a single iframe */
    _cleanupIframe(iframe) {
        const data = this._iframeMap.get(iframe);
        if (!data) return;
        try {
            data.doc.removeEventListener('mousemove', data.onMouseMove, true);
            data.doc.removeEventListener('mouseleave', data.onMouseLeave, true);
            data.doc.removeEventListener('click', data.onClick, true);
            data.doc.removeEventListener('scroll', data.onScroll, true);
            data.doc.body.classList.remove('ei-inspecting');
            data.hoverOverlay.remove();
            data.selectOverlay.remove();
            data.tooltip.remove();
            data.style.remove();
        } catch (e) { /* iframe may have been removed from DOM */ }
        this._iframeMap.delete(iframe);
    },

    _cleanupAllIframes() {
        for (const iframe of this._iframeMap.keys()) {
            this._cleanupIframe(iframe);
        }
    },


    // ═════════════════════════════════════════════════════
    //  ELEMENT TARGETING
    // ═════════════════════════════════════════════════════

    /** Resolve event target to the most useful inspectable element */
    _resolveTarget(el, doc) {
        if (!el || !el.tagName) return null;
        // Skip our own injected overlay elements
        if (el.id && el.id.startsWith('ei-')) return null;
        // Skip uninspectable elements
        const skip = ['HTML', 'HEAD', 'SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'BR'];
        if (skip.includes(el.tagName)) return null;
        // If body, accept it
        if (el.tagName === 'BODY') return el;
        // Skip elements that are too small to be meaningful
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 && rect.height < 2) return null;
        return el;
    },

    /** Check if an element is a text node wrapper (span/strong/em with only text) */
    _isTextElement(el) {
        return ['SPAN', 'STRONG', 'EM', 'B', 'I', 'A', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SMALL', 'LABEL'].includes(el.tagName);
    },


    // ═════════════════════════════════════════════════════
    //  HIGHLIGHTING
    // ═════════════════════════════════════════════════════

    _positionOverlay(overlay, rect) {
        overlay.style.display = 'block';
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
    },

    _positionTooltip(tooltip, clientX, clientY, doc) {
        const vpW = doc.documentElement.clientWidth;
        const vpH = doc.documentElement.clientHeight;
        let x = clientX + 12;
        let y = clientY + 18;
        // Keep on screen
        const tw = Math.min(tooltip.offsetWidth + 4, 300);
        const th = tooltip.offsetHeight + 4;
        if (x + tw > vpW) x = clientX - tw - 4;
        if (y + th > vpH) y = clientY - th - 4;
        tooltip.style.left = Math.max(2, x) + 'px';
        tooltip.style.top = Math.max(2, y) + 'px';
    },

    _showHoverHighlight(el, data) {
        const rect = el.getBoundingClientRect();
        this._positionOverlay(data.hoverOverlay, rect);

        // Build tooltip content
        const tag = el.tagName.toLowerCase();
        const classStr = el.className && typeof el.className === 'string'
            ? el.className.split(/\s+/).filter(c => c).slice(0, 4).join(' ')
            : '';
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        data.tooltip.innerHTML =
            `<span class="ei-tt-tag">&lt;${tag}&gt;</span>` +
            `<span class="ei-tt-dim">${w} × ${h}</span>` +
            (classStr ? `<span class="ei-tt-class">.${classStr.split(' ').join(' .')}</span>` : '');
        data.tooltip.style.display = 'block';
    },


    // ═════════════════════════════════════════════════════
    //  SELECTION
    // ═════════════════════════════════════════════════════

    selectElement(el, iframe, screenId, data) {
        // If re-selecting same element, deselect
        if (this.selectedEl === el && this.selectedIframe === iframe) {
            this.clearSelection();
            this.hidePanel();
            return;
        }

        // Clear previous selection overlay in other iframes
        if (this.selectedIframe && this.selectedIframe !== iframe) {
            const prevData = this._iframeMap.get(this.selectedIframe);
            if (prevData) prevData.selectOverlay.style.display = 'none';
        }

        this.selectedEl = el;
        this.selectedIframe = iframe;
        this.selectedScreenId = screenId;

        // Show selection overlay
        if (!data) data = this._iframeMap.get(iframe);
        if (data) {
            const rect = el.getBoundingClientRect();
            this._positionOverlay(data.selectOverlay, rect);
        }

        // Show properties panel
        this.showPanel(el, iframe, screenId);
    },

    clearSelection() {
        if (this.selectedIframe) {
            const data = this._iframeMap.get(this.selectedIframe);
            if (data) data.selectOverlay.style.display = 'none';
        }
        this.selectedEl = null;
        this.selectedIframe = null;
        this.selectedScreenId = null;
    },


    // ═════════════════════════════════════════════════════
    //  PROPERTIES PANEL
    // ═════════════════════════════════════════════════════

    showPanel(el, iframe, screenId) {
        if (!this._panelEl) return;

        const body = document.getElementById('ei-body');
        if (!body) return;

        body.innerHTML = this._buildPanelContent(el, iframe, screenId);
        this._panelEl.classList.add('open');

        // Position panel near the element
        const elRect = el.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        const scaleX = iframeRect.width / (iframe.clientWidth || 375);
        const scaleY = iframeRect.height / (iframe.clientHeight || 770);
        const targetRect = {
            left: iframeRect.left + elRect.left * scaleX,
            top: iframeRect.top + elRect.top * scaleY,
            right: iframeRect.left + elRect.right * scaleX,
            bottom: iframeRect.top + elRect.bottom * scaleY,
            width: elRect.width * scaleX,
            height: elRect.height * scaleY
        };
        this._positionPanel(targetRect);

        // Setup collapsible sections
        body.querySelectorAll('.ei-group-header').forEach(h => {
            h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
        });

        // Setup notes auto-save
        const notesArea = body.querySelector('#ei-notes');
        if (notesArea) {
            const noteKey = this._noteKey(screenId, el);
            notesArea.value = this._notes[noteKey] || '';
            let saveTimer;
            notesArea.addEventListener('input', () => {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    this._notes[noteKey] = notesArea.value;
                    this._saveNotes();
                    const saved = body.querySelector('.ei-notes-saved');
                    if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 1500); }
                }, 400);
            });
        }
    },

    hidePanel() {
        if (this._panelEl) this._panelEl.classList.remove('open');
    },

    _positionPanel(targetRect) {
        const panel = this._panelEl;
        const pw = 320, ph = Math.min(panel.scrollHeight, window.innerHeight * 0.7);

        let x, y;
        // Try: right of element
        if (targetRect.right + pw + 20 < window.innerWidth) {
            x = targetRect.right + 14;
            y = Math.max(60, targetRect.top);
        }
        // Try: left of element
        else if (targetRect.left - pw - 20 > 0) {
            x = targetRect.left - pw - 14;
            y = Math.max(60, targetRect.top);
        }
        // Fallback: right side of viewport
        else {
            x = window.innerWidth - pw - 16;
            y = 70;
        }
        // Clamp Y so panel doesn't go off bottom
        y = Math.min(y, window.innerHeight - ph - 20);
        y = Math.max(60, y);

        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        this._panelPos = { x, y };
    },


    // ═════════════════════════════════════════════════════
    //  PANEL CONTENT BUILDER
    // ═════════════════════════════════════════════════════

    _buildPanelContent(el, iframe, screenId) {
        const computed = iframe.contentWindow.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const rect = el.getBoundingClientRect();
        const classes = el.className && typeof el.className === 'string'
            ? el.className.split(/\s+/).filter(c => c)
            : [];
        const breadcrumb = this._buildBreadcrumb(el);
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        let html = '';

        // ── Element Info ─────────────────────────
        html += `<div class="ei-section ei-element-info">`;
        html += `<div class="ei-tag-line">`;
        html += `<span class="ei-tag">&lt;${tag}&gt;</span>`;
        if (el.id) html += `<span class="ei-id">#${el.id}</span>`;
        html += `<span class="ei-dims">${w} × ${h}</span>`;
        html += `</div>`;

        // Breadcrumb path
        html += `<div class="ei-breadcrumb">`;
        breadcrumb.forEach((part, i) => {
            if (i > 0) html += `<span class="ei-bc-sep">›</span>`;
            const isCurrent = i === breadcrumb.length - 1;
            html += `<span class="${isCurrent ? 'ei-bc-current' : ''}">${this._escHtml(part)}</span>`;
        });
        html += `</div>`;

        // Tailwind classes
        if (classes.length > 0) {
            html += `<div class="ei-classes">`;
            classes.forEach(c => {
                html += `<span class="ei-classname">${this._escHtml(c)}</span>`;
            });
            html += `</div>`;
        }

        // Text content preview (if the element has direct text)
        const textContent = this._getDirectText(el);
        if (textContent) {
            html += `<div class="ei-text-preview">"${this._escHtml(textContent.slice(0, 80))}${textContent.length > 80 ? '…' : ''}"</div>`;
        }

        html += `</div>`;

        // ── Box Model ────────────────────────────
        html += this._buildBoxModel(computed);

        // ── Style Groups ─────────────────────────
        this.STYLE_GROUPS.forEach(group => {
            const groupHtml = this._buildStyleGroup(group, computed);
            if (groupHtml) html += groupHtml;
        });

        // ── Notes ────────────────────────────────
        html += `<div class="ei-section">`;
        html += `<div class="ei-section-label"><span>📝</span> Notes</div>`;
        html += `<textarea id="ei-notes" class="ei-notes" placeholder="Add annotation note for this element…" rows="3"></textarea>`;
        html += `<div class="ei-notes-saved">✓ Saved</div>`;
        html += `</div>`;

        return html;
    },

    /** Build a single collapsible style group, returns '' if no interesting properties */
    _buildStyleGroup(group, computed) {
        const rows = [];

        for (const prop of group.props) {
            const value = computed.getPropertyValue(prop);
            if (!value || value === '') continue;
            if (this._isDefaultValue(prop, value)) continue;

            const displayValue = this._formatValue(prop, value);
            const isColor = this._looksLikeColor(value);
            const colorSwatch = isColor
                ? `<span class="ei-swatch" style="background:${value}"></span>`
                : '';

            rows.push(
                `<div class="ei-prop">` +
                `<span class="ei-prop-name">${prop}</span>` +
                `<span class="ei-prop-value">${colorSwatch}${this._escHtml(displayValue)}</span>` +
                `</div>`
            );
        }

        if (rows.length === 0) return '';

        return `<div class="ei-group">` +
            `<div class="ei-group-header">` +
            `<span class="ei-group-icon">${group.icon}</span>` +
            `<span class="ei-group-name">${group.name}</span>` +
            `<span class="ei-group-count">${rows.length}</span>` +
            `<span class="ei-group-arrow">▾</span>` +
            `</div>` +
            `<div class="ei-group-body">${rows.join('')}</div>` +
            `</div>`;
    },


    // ═════════════════════════════════════════════════════
    //  BOX MODEL VISUALIZATION
    // ═════════════════════════════════════════════════════

    _buildBoxModel(computed) {
        const g = (p) => {
            const v = computed.getPropertyValue(p);
            return v ? parseFloat(v) || 0 : 0;
        };
        const mt = g('margin-top'), mr = g('margin-right'), mb = g('margin-bottom'), ml = g('margin-left');
        const bt = g('border-top-width'), br_ = g('border-right-width'), bb = g('border-bottom-width'), bl = g('border-left-width');
        const pt = g('padding-top'), pr = g('padding-right'), pb = g('padding-bottom'), pl = g('padding-left');
        const w = g('width'), h = g('height');

        return `<div class="ei-section">
      <div class="ei-section-label"><span>◻</span> Box Model</div>
      <div class="ei-boxmodel">
        <div class="ei-bm-layer ei-bm-margin">
          <span class="ei-bm-label">margin</span>
          <span class="ei-bm-t">${mt}</span>
          <span class="ei-bm-r">${mr}</span>
          <span class="ei-bm-b">${mb}</span>
          <span class="ei-bm-l">${ml}</span>
          <div class="ei-bm-layer ei-bm-border">
            <span class="ei-bm-label">border</span>
            <span class="ei-bm-t">${bt}</span>
            <span class="ei-bm-r">${br_}</span>
            <span class="ei-bm-b">${bb}</span>
            <span class="ei-bm-l">${bl}</span>
            <div class="ei-bm-layer ei-bm-padding">
              <span class="ei-bm-label">padding</span>
              <span class="ei-bm-t">${pt}</span>
              <span class="ei-bm-r">${pr}</span>
              <span class="ei-bm-b">${pb}</span>
              <span class="ei-bm-l">${pl}</span>
              <div class="ei-bm-content">
                ${Math.round(w)} × ${Math.round(h)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    },


    // ═════════════════════════════════════════════════════
    //  STYLE READING UTILITIES
    // ═════════════════════════════════════════════════════

    /** Check if a property value is a default we should skip */
    _isDefaultValue(prop, value) {
        if (!value || value === '') return true;
        // Check exact skips map
        if (this.SKIP_EXACT[prop] === value) return true;
        // Check general defaults
        if (this.DEFAULT_VALUES.has(value)) return true;
        // Common patterns
        if (value === '0px 0px' || value === '0px 0px 0px 0px') return true;
        if (value.startsWith('0px none') || value.startsWith('none 0s')) return true;
        // Border defaults — "0px none rgb(..."
        if (prop.startsWith('border-') && prop.endsWith('-width') && value === '0px') return true;
        if (prop.startsWith('border-') && prop.endsWith('-style') && value === 'none') return true;
        // Background defaults
        if (prop === 'background-color' && (value === 'rgba(0, 0, 0, 0)' || value === 'transparent')) return true;
        if (prop === 'background-image' && value === 'none') return true;
        return false;
    },

    /** Format a CSS value for display (shorten long values) */
    _formatValue(prop, value) {
        if (!value) return '';
        // Shorten font-family: keep only first font
        if (prop === 'font-family') {
            const first = value.split(',')[0].trim().replace(/"/g, '');
            const rest = value.split(',').length - 1;
            return rest > 0 ? `${first} + ${rest} more` : first;
        }
        // Shorten very long values
        if (value.length > 60) return value.slice(0, 57) + '…';
        return value;
    },

    /** Quick check if a CSS value looks like a color */
    _looksLikeColor(value) {
        if (!value || typeof value !== 'string') return false;
        return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(value.trim());
    },


    // ═════════════════════════════════════════════════════
    //  ELEMENT PATH & SELECTORS
    // ═════════════════════════════════════════════════════

    /** Build breadcrumb trail for display (max 6 levels deep) */
    _buildBreadcrumb(el) {
        const parts = [];
        let current = el;
        let depth = 0;
        while (current && current.tagName !== 'HTML' && depth < 6) {
            let part = current.tagName.toLowerCase();
            if (current.id) {
                part += '#' + current.id;
            } else if (current.classList && current.classList.length > 0) {
                // Use max 2 most descriptive classes
                const meaningful = Array.from(current.classList)
                    .filter(c => !c.match(/^[!]/) && c.length < 20)
                    .slice(0, 2);
                if (meaningful.length) part += '.' + meaningful.join('.');
            }
            parts.unshift(part);
            current = current.parentElement;
            depth++;
        }
        if (current && current.tagName !== 'HTML') parts.unshift('…');
        return parts;
    },

    /** Build a unique CSS selector for an element (for notes persistence) */
    _buildSelectorPath(el) {
        if (!el || el.tagName === 'BODY') return 'body';
        const parts = [];
        let current = el;
        while (current && current.tagName !== 'HTML' && current.tagName !== 'BODY') {
            let part = current.tagName.toLowerCase();
            if (current.id) {
                part += '#' + CSS.escape(current.id);
                parts.unshift(part);
                break; // ID is unique
            }
            // Add nth-of-type for disambiguation
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
                if (siblings.length > 1) {
                    const idx = siblings.indexOf(current) + 1;
                    part += `:nth-of-type(${idx})`;
                }
            }
            parts.unshift(part);
            current = current.parentElement;
        }
        return parts.join('>');
    },


    // ═════════════════════════════════════════════════════
    //  NOTES PERSISTENCE
    // ═════════════════════════════════════════════════════

    _noteKey(screenId, el) {
        const appId = window.curApp?.id || 'unknown';
        const selector = this._buildSelectorPath(el);
        return `${appId}:${screenId}:${selector}`;
    },

    _loadNotes() {
        try { this._notes = JSON.parse(localStorage.getItem('ei-notes') || '{}'); }
        catch { this._notes = {}; }
    },

    _saveNotes() {
        localStorage.setItem('ei-notes', JSON.stringify(this._notes));
    },


    // ═════════════════════════════════════════════════════
    //  ACTIONS
    // ═════════════════════════════════════════════════════

    /** Copy computed CSS of selected element to clipboard */
    copyCSS() {
        if (!this.selectedEl || !this.selectedIframe) {
            toast('No element selected'); return;
        }
        const computed = this.selectedIframe.contentWindow.getComputedStyle(this.selectedEl);
        const lines = [];
        const important = [
            'display', 'position', 'width', 'height',
            'padding', 'margin', 'gap',
            'background', 'background-color', 'background-image',
            'color', 'font-family', 'font-size', 'font-weight', 'line-height',
            'border', 'border-radius', 'box-shadow',
            'opacity', 'backdrop-filter',
            'flex-direction', 'justify-content', 'align-items',
            'text-align', 'text-transform', 'letter-spacing',
            'transition', 'transform', 'overflow'
        ];
        important.forEach(prop => {
            const val = computed.getPropertyValue(prop);
            if (val && !this._isDefaultValue(prop, val)) {
                lines.push(`  ${prop}: ${val};`);
            }
        });
        const css = `/* ${this.selectedEl.tagName.toLowerCase()} */\n{\n${lines.join('\n')}\n}`;
        navigator.clipboard.writeText(css).then(() => toast('CSS copied to clipboard')).catch(() => toast('Failed to copy'));
    },

    /** Copy Tailwind classes of selected element */
    copyTailwind() {
        if (!this.selectedEl) { toast('No element selected'); return; }
        const classes = this.selectedEl.className;
        if (!classes || typeof classes !== 'string') { toast('No classes on element'); return; }
        navigator.clipboard.writeText(classes).then(() => toast('Tailwind classes copied')).catch(() => toast('Failed to copy'));
    },

    /** Capture selected element's style for transfer (stores on clipboard) */
    pickStyle() {
        if (!this.selectedEl || !this.selectedIframe) {
            toast('No element selected'); return;
        }
        const computed = this.selectedIframe.contentWindow.getComputedStyle(this.selectedEl);
        const style = {};
        const props = [
            'background', 'background-color', 'background-image', 'background-size',
            'color', 'font-family', 'font-size', 'font-weight', 'font-style',
            'line-height', 'letter-spacing', 'text-align', 'text-transform',
            'border', 'border-radius', 'box-shadow', 'text-shadow',
            'padding', 'opacity', 'backdrop-filter'
        ];
        props.forEach(p => {
            const v = computed.getPropertyValue(p);
            if (v && !this._isDefaultValue(p, v)) style[p] = v;
        });
        this._styleClipboard = {
            style,
            source: {
                tag: this.selectedEl.tagName.toLowerCase(),
                classes: this.selectedEl.className,
                screenId: this.selectedScreenId,
                app: window.curApp?.id
            }
        };
        document.getElementById('ei-style-chip')?.classList.add('show');
        const chipLabel = document.getElementById('ei-chip-label');
        if (chipLabel) chipLabel.textContent = `${this._styleClipboard.source.tag} style picked`;
        toast('Style captured — click another element then "Apply" to transfer');
    },

    /** Apply the picked style to the currently selected element */
    applyPickedStyle() {
        if (!this._styleClipboard) { toast('No style picked yet — use "Pick" first'); return; }
        if (!this.selectedEl) { toast('No element selected to apply style to'); return; }
        // Store original style for undo
        const original = this.selectedEl.getAttribute('style') || '';
        this.selectedEl.dataset.eiOriginalStyle = original;
        // Apply captured styles
        for (const [prop, val] of Object.entries(this._styleClipboard.style)) {
            this.selectedEl.style.setProperty(prop, val);
        }
        toast('Style applied! Click element again to see changes');
        // Refresh panel to show new styles
        this.showPanel(this.selectedEl, this.selectedIframe, this.selectedScreenId);
    },

    /** Undo the last style application on selected element */
    undoStyleApply() {
        if (!this.selectedEl) { toast('No element selected'); return; }
        const original = this.selectedEl.dataset.eiOriginalStyle;
        if (original !== undefined) {
            this.selectedEl.setAttribute('style', original);
            delete this.selectedEl.dataset.eiOriginalStyle;
            toast('Style reverted');
            this.showPanel(this.selectedEl, this.selectedIframe, this.selectedScreenId);
        } else {
            toast('Nothing to undo');
        }
    },


    // ═════════════════════════════════════════════════════
    //  PANEL DRAG
    // ═════════════════════════════════════════════════════

    _setupPanelDrag() {
        const handle = document.getElementById('ei-drag-handle');
        if (!handle || !this._panelEl) return;
        let dragging = false, startX, startY, startLeft, startTop;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ei-close')) return; // Don't drag when clicking close
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = this._panelEl.offsetLeft;
            startTop = this._panelEl.offsetTop;
            if (typeof FloatingWindows !== 'undefined') FloatingWindows.bringToFront(this._panelEl);
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            this._panelEl.style.left = (startLeft + dx) + 'px';
            this._panelEl.style.top = (startTop + dy) + 'px';
        });
        document.addEventListener('mouseup', () => { dragging = false; });
    },

    _setupPanelEvents() {
        document.getElementById('ei-close')?.addEventListener('click', () => {
            this.clearSelection();
            this.hidePanel();
        });
        document.getElementById('ei-copy-css')?.addEventListener('click', () => this.copyCSS());
        document.getElementById('ei-copy-tw')?.addEventListener('click', () => this.copyTailwind());
        document.getElementById('ei-pick-style')?.addEventListener('click', () => this.pickStyle());
        document.getElementById('ei-apply-style')?.addEventListener('click', () => this.applyPickedStyle());
        document.getElementById('ei-undo-style')?.addEventListener('click', () => this.undoStyleApply());
        document.getElementById('ei-mode-exit')?.addEventListener('click', () => this.deactivate());
    },


    // ═════════════════════════════════════════════════════
    //  UTILITIES
    // ═════════════════════════════════════════════════════

    _escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    /** Get direct text content of an element (not children's text) */
    _getDirectText(el) {
        let text = '';
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim();
            }
        }
        return text;
    }
};
