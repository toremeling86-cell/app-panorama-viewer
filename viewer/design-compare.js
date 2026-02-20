// ═══════════════════════════════════════════════════════════════
// DESIGN COMPARISON — Side-by-Side & Overlay Screen Comparison
// Compare screens to spot design inconsistencies:
//   • Side-by-side mode with synced scroll
//   • Overlay mode with opacity slider
//   • Pixel diff visualization
//   • Quick swap between screens
//   • Compare across apps
// ═══════════════════════════════════════════════════════════════

const DesignCompare = {

    // ── State ──
    _overlayEl: null,
    _isOpen: false,
    _screenA: null,     // { id, appId }
    _screenB: null,
    _mode: 'side',      // 'side' | 'overlay' | 'diff'
    _opacity: 0.5,

    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._overlayEl = document.getElementById('dc-overlay');
        this._setupEvents();
    },

    open(screenIdA, screenIdB) {
        if (!this._overlayEl) return;
        this._screenA = screenIdA ? { id: screenIdA } : null;
        this._screenB = screenIdB ? { id: screenIdB } : null;
        this._isOpen = true;
        this._overlayEl.classList.add('on');
        document.getElementById('btn-compare')?.classList.add('on');
        this._render();
    },

    close() {
        this._isOpen = false;
        this._overlayEl?.classList.remove('on');
        document.getElementById('btn-compare')?.classList.remove('on');
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },


    // ═════════════════════════════════════════════════════
    //  RENDERING
    // ═════════════════════════════════════════════════════

    _render() {
        const el = this._overlayEl;
        if (!el) return;

        const screenList = this._getAvailableScreens();

        let html = `<div class="dc-container">`;

        // Top bar
        html += `<div class="dc-topbar">
            <div class="dc-topbar-left">
                <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent)">compare</span>
                <span class="dc-topbar-title">Design Comparison</span>
            </div>
            <div class="dc-topbar-center">
                <button class="dc-mode-btn ${this._mode === 'side' ? 'active' : ''}" data-mode="side">
                    <span class="material-symbols-outlined" style="font-size:14px">view_column</span> Side by Side
                </button>
                <button class="dc-mode-btn ${this._mode === 'overlay' ? 'active' : ''}" data-mode="overlay">
                    <span class="material-symbols-outlined" style="font-size:14px">layers</span> Overlay
                </button>
                <button class="dc-mode-btn ${this._mode === 'diff' ? 'active' : ''}" data-mode="diff">
                    <span class="material-symbols-outlined" style="font-size:14px">difference</span> Diff
                </button>
            </div>
            <button class="dc-close-btn" id="dc-close">
                <span class="material-symbols-outlined" style="font-size:16px">close</span>
            </button>
        </div>`;

        // Screen selectors
        html += `<div class="dc-selectors">
            <div class="dc-selector">
                <label class="dc-sel-label">Screen A</label>
                <select class="dc-select" id="dc-sel-a">
                    <option value="">— Select —</option>
                    ${screenList.map(s => `<option value="${s.id}" ${this._screenA?.id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            <button class="dc-swap-btn" id="dc-swap" title="Swap screens">
                <span class="material-symbols-outlined" style="font-size:14px">swap_horiz</span>
            </button>
            <div class="dc-selector">
                <label class="dc-sel-label">Screen B</label>
                <select class="dc-select" id="dc-sel-b">
                    <option value="">— Select —</option>
                    ${screenList.map(s => `<option value="${s.id}" ${this._screenB?.id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
        </div>`;

        // Opacity slider (overlay/diff mode)
        if (this._mode === 'overlay') {
            html += `<div class="dc-slider-row">
                <label class="dc-slider-label">Opacity</label>
                <input type="range" id="dc-opacity" class="dc-slider" min="0" max="100" value="${Math.round(this._opacity * 100)}" />
                <span class="dc-slider-val">${Math.round(this._opacity * 100)}%</span>
            </div>`;
        }

        // Viewport
        html += `<div class="dc-viewport" id="dc-viewport">`;

        if (this._screenA?.id && this._screenB?.id) {
            const srcA = this._getScreenSrc(this._screenA.id);
            const srcB = this._getScreenSrc(this._screenB.id);

            if (this._mode === 'side') {
                html += `<div class="dc-split">
                    <div class="dc-pane dc-pane-a">
                        <div class="dc-pane-label">A: ${this._screenA.id}</div>
                        <iframe src="${srcA}" class="dc-iframe"></iframe>
                    </div>
                    <div class="dc-divider"></div>
                    <div class="dc-pane dc-pane-b">
                        <div class="dc-pane-label">B: ${this._screenB.id}</div>
                        <iframe src="${srcB}" class="dc-iframe"></iframe>
                    </div>
                </div>`;
            } else if (this._mode === 'overlay') {
                html += `<div class="dc-overlay-view">
                    <iframe src="${srcA}" class="dc-iframe dc-iframe-base"></iframe>
                    <iframe src="${srcB}" class="dc-iframe dc-iframe-top" style="opacity:${this._opacity}"></iframe>
                </div>`;
            } else if (this._mode === 'diff') {
                html += `<div class="dc-diff-view">
                    <iframe src="${srcA}" class="dc-iframe dc-iframe-base"></iframe>
                    <iframe src="${srcB}" class="dc-iframe dc-iframe-top" style="mix-blend-mode:difference;opacity:1"></iframe>
                    <div class="dc-diff-legend">
                        <span class="dc-diff-black">■ Identical</span>
                        <span class="dc-diff-colored">■ Different</span>
                    </div>
                </div>`;
            }
        } else {
            html += `<div class="dc-placeholder">
                <span class="material-symbols-outlined" style="font-size:48px;color:#3f3f46">compare</span>
                <p>Select two screens above to compare</p>
            </div>`;
        }

        html += `</div></div>`;

        el.innerHTML = html;

        // Wire events
        document.getElementById('dc-close')?.addEventListener('click', () => this.close());

        el.querySelectorAll('.dc-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._mode = btn.dataset.mode;
                this._render();
            });
        });

        document.getElementById('dc-swap')?.addEventListener('click', () => {
            [this._screenA, this._screenB] = [this._screenB, this._screenA];
            this._render();
        });

        document.getElementById('dc-sel-a')?.addEventListener('change', (e) => {
            this._screenA = e.target.value ? { id: e.target.value } : null;
            this._render();
        });

        document.getElementById('dc-sel-b')?.addEventListener('change', (e) => {
            this._screenB = e.target.value ? { id: e.target.value } : null;
            this._render();
        });

        document.getElementById('dc-opacity')?.addEventListener('input', (e) => {
            this._opacity = parseInt(e.target.value) / 100;
            const topIframe = el.querySelector('.dc-iframe-top');
            if (topIframe) topIframe.style.opacity = this._opacity;
            const valSpan = el.querySelector('.dc-slider-val');
            if (valSpan) valSpan.textContent = `${e.target.value}%`;
        });

        // Sync scroll in side-by-side mode
        if (this._mode === 'side') {
            const panes = el.querySelectorAll('.dc-iframe');
            if (panes.length === 2) {
                const syncScroll = (src, tgt) => {
                    try {
                        src.contentWindow.addEventListener('scroll', () => {
                            try {
                                tgt.contentWindow.scrollTo(
                                    src.contentWindow.scrollX,
                                    src.contentWindow.scrollY
                                );
                            } catch (e) { }
                        });
                    } catch (e) { }
                };
                panes[0].addEventListener('load', () => syncScroll(panes[0], panes[1]));
                panes[1].addEventListener('load', () => syncScroll(panes[1], panes[0]));
            }
        }
    },


    // ═════════════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════════════

    _getAvailableScreens() {
        const screens = [];
        if (typeof window.curApp !== 'undefined' && window.curApp?.screens) {
            window.curApp.screens.forEach(scr => {
                screens.push({
                    id: scr,
                    name: scr.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    app: window.curApp.id
                });
            });
        }
        return screens;
    },

    _getScreenSrc(screenId) {
        if (!window.curApp) return '';
        return `${window.curApp.id}/screens/${screenId}.html`;
    },

    _setupEvents() {
        // Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._isOpen) {
                this.close();
                e.stopPropagation();
            }
        });
    }

};
