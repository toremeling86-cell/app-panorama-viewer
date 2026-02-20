// ═══════════════════════════════════════════════════════════════
// RESPONSIVE PREVIEW — Multi-Breakpoint Viewport Matrix
// Show a single screen at multiple viewport widths simultaneously:
//   * 4 breakpoints: Mobile (430), Tablet (768), Laptop (1280), Desktop (1920)
//   * 3 layout modes: side-by-side, stacked, focus
//   * Synchronized proportional scrolling across all viewports
//   * Toggle individual breakpoints, custom width input
//   * Pixel ruler overlay, zoom-to-fit / actual-size toggle
//   * Overflow & truncation issue detection
// ═══════════════════════════════════════════════════════════════

const ResponsivePreview = {

    // ── State ──────────────────────────────────────────────
    _overlayEl: null,
    _isOpen: false,
    _breakpoints: [
        { name: 'Mobile',  width: 430,  icon: 'phone_iphone',   enabled: true },
        { name: 'Tablet',  width: 768,  icon: 'tablet',         enabled: true },
        { name: 'Laptop',  width: 1280, icon: 'laptop',         enabled: true },
        { name: 'Desktop', width: 1920, icon: 'desktop_windows', enabled: true }
    ],
    _layout: 'side-by-side',   // 'side-by-side' | 'stacked' | 'focus'
    _syncScroll: true,
    _showRuler: false,
    _zoomToFit: true,
    _focusIdx: 0,              // index of the focused breakpoint in focus mode
    _iframes: [],              // references to loaded iframes
    _scrolling: false,         // scroll-sync guard
    _customWidth: null,        // custom breakpoint width (if set)


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        // Nothing to bind at init — overlay is built on demand
    },

    open() {
        if (!window.curApp || !window.selScreen) {
            toast('Select a screen first');
            return;
        }
        this._isOpen = true;
        this._iframes = [];
        this._buildOverlay();
        document.body.appendChild(this._overlayEl);
        // Force reflow then show
        this._overlayEl.offsetHeight;
        this._overlayEl.classList.add('on');
        document.getElementById('btn-responsive')?.classList.add('on');
        this._loadScreen();
    },

    close() {
        if (!this._isOpen) return;
        this._isOpen = false;
        this._iframes = [];
        document.getElementById('btn-responsive')?.classList.remove('on');
        if (this._overlayEl) {
            this._overlayEl.classList.remove('on');
            // Remove after transition
            setTimeout(() => {
                this._overlayEl?.remove();
                this._overlayEl = null;
            }, 200);
        }
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },


    // ═════════════════════════════════════════════════════
    //  OVERLAY CONSTRUCTION
    // ═════════════════════════════════════════════════════

    _buildOverlay() {
        // Remove any previous overlay
        if (this._overlayEl) this._overlayEl.remove();

        const el = document.createElement('div');
        el.id = 'rp-overlay';
        el.innerHTML = this._renderShell();
        this._overlayEl = el;

        // ── Wire top-bar events ──
        el.querySelector('#rp-close').addEventListener('click', () => this.close());

        // Layout mode buttons
        el.querySelectorAll('.rp-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._layout = btn.dataset.layout;
                this._updateLayout();
                el.querySelectorAll('.rp-layout-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.layout === this._layout));
            });
        });

        // Breakpoint toggles
        el.querySelectorAll('.rp-bp-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                this._breakpoints[idx].enabled = !this._breakpoints[idx].enabled;
                btn.classList.toggle('active', this._breakpoints[idx].enabled);
                this._loadScreen();
            });
        });

        // Sync scroll toggle
        el.querySelector('#rp-sync').addEventListener('click', () => {
            this._syncScroll = !this._syncScroll;
            el.querySelector('#rp-sync').classList.toggle('active', this._syncScroll);
        });

        // Ruler toggle
        el.querySelector('#rp-ruler').addEventListener('click', () => {
            this._showRuler = !this._showRuler;
            el.querySelector('#rp-ruler').classList.toggle('active', this._showRuler);
            el.querySelectorAll('.rp-ruler').forEach(r =>
                r.style.display = this._showRuler ? 'block' : 'none');
        });

        // Zoom toggle
        el.querySelector('#rp-zoom-toggle').addEventListener('click', () => {
            this._zoomToFit = !this._zoomToFit;
            el.querySelector('#rp-zoom-toggle').textContent = this._zoomToFit ? 'Fit' : '1:1';
            this._updateLayout();
        });

        // Custom width input
        const customInput = el.querySelector('#rp-custom-width');
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = parseInt(customInput.value);
                if (val >= 200 && val <= 3840) {
                    this._customWidth = val;
                    this._loadScreen();
                    toast(`Custom viewport: ${val}px`);
                } else {
                    toast('Width must be 200-3840px');
                }
            }
        });

        // Escape to close
        this._onKeyDown = (e) => {
            if (e.key === 'Escape' && this._isOpen) {
                this.close();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', this._onKeyDown);

        // Inject styles
        this._injectStyles();
    },

    /** Render the static shell HTML */
    _renderShell() {
        const screenName = window.selScreen
            ? window.selScreen.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : 'Screen';
        const appName = window.curApp?.name || '';

        let html = `<div class="rp-container">`;

        // ── Top bar ──
        html += `<div class="rp-topbar">
            <div class="rp-topbar-left">
                <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent)">devices</span>
                <span class="rp-topbar-title">${appName} &mdash; ${screenName}</span>
            </div>
            <div class="rp-topbar-center">
                <div class="rp-btn-group">`;

        // Breakpoint toggles
        this._breakpoints.forEach((bp, i) => {
            html += `<button class="rp-bp-toggle active" data-idx="${i}" title="${bp.name} (${bp.width}px)">
                <span class="material-symbols-outlined" style="font-size:14px">${bp.icon}</span>
                <span class="rp-bp-label">${bp.width}</span>
            </button>`;
        });

        html += `</div>
                <div class="rp-sep"></div>
                <div class="rp-btn-group">
                    <button class="rp-layout-btn active" data-layout="side-by-side" title="Side by side">
                        <span class="material-symbols-outlined" style="font-size:14px">view_column</span>
                    </button>
                    <button class="rp-layout-btn" data-layout="stacked" title="Stacked">
                        <span class="material-symbols-outlined" style="font-size:14px">view_agenda</span>
                    </button>
                    <button class="rp-layout-btn" data-layout="focus" title="Focus">
                        <span class="material-symbols-outlined" style="font-size:14px">center_focus_strong</span>
                    </button>
                </div>
                <div class="rp-sep"></div>
                <button class="rp-tool-btn active" id="rp-sync" title="Sync scroll">
                    <span class="material-symbols-outlined" style="font-size:14px">sync</span>
                </button>
                <button class="rp-tool-btn" id="rp-ruler" title="Pixel ruler">
                    <span class="material-symbols-outlined" style="font-size:14px">straighten</span>
                </button>
                <button class="rp-tool-btn" id="rp-zoom-toggle" title="Toggle zoom">Fit</button>
                <div class="rp-sep"></div>
                <input type="number" id="rp-custom-width" class="rp-custom-input"
                       placeholder="Custom px" min="200" max="3840" />
            </div>
            <button class="rp-close-btn" id="rp-close" title="Close (Esc)">
                <span class="material-symbols-outlined" style="font-size:16px">close</span>
            </button>
        </div>`;

        // ── Viewport area ──
        html += `<div class="rp-viewport" id="rp-viewport"></div>`;

        html += `</div>`;
        return html;
    },


    // ═════════════════════════════════════════════════════
    //  SCREEN LOADING
    // ═════════════════════════════════════════════════════

    _loadScreen() {
        const viewport = this._overlayEl?.querySelector('#rp-viewport');
        if (!viewport || !window.curApp || !window.selScreen) return;

        // Gather active breakpoints
        const active = this._breakpoints.filter(bp => bp.enabled);
        if (this._customWidth) {
            active.push({
                name: 'Custom',
                width: this._customWidth,
                icon: 'tune',
                enabled: true
            });
        }

        if (active.length === 0) {
            viewport.innerHTML = `<div class="rp-empty">
                <span class="material-symbols-outlined" style="font-size:48px;color:var(--dim)">devices</span>
                <p>Enable at least one breakpoint</p>
            </div>`;
            return;
        }

        const src = `${window.curApp.id}/screens/${window.selScreen}.html`;
        this._iframes = [];

        let html = `<div class="rp-frames rp-layout-${this._layout}">`;

        active.forEach((bp, i) => {
            const scale = this._calculateScale(bp.width);
            const isMain = this._layout === 'focus' && i === this._focusIdx;
            const frameClass = this._layout === 'focus'
                ? (isMain ? 'rp-frame rp-frame-main' : 'rp-frame rp-frame-thumb')
                : 'rp-frame';

            html += `<div class="${frameClass}" data-bp-idx="${i}" data-bp-width="${bp.width}">
                <div class="rp-frame-header">
                    <span class="material-symbols-outlined" style="font-size:13px;color:var(--dim)">${bp.icon}</span>
                    <span class="rp-frame-name">${bp.name}</span>
                    <span class="rp-frame-size">${bp.width}px</span>
                </div>
                <div class="rp-frame-body" style="width:${bp.width}px;transform:scale(${scale});transform-origin:top left;">
                    <iframe src="${src}"
                            sandbox="allow-same-origin allow-scripts"
                            style="width:${bp.width}px;height:900px;border:none;"
                            data-bp-name="${bp.name}"
                            data-bp-width="${bp.width}">
                    </iframe>
                    <div class="rp-ruler" style="display:${this._showRuler ? 'block' : 'none'};width:${bp.width}px;">
                        ${this._buildRuler(bp.width)}
                    </div>
                </div>
                <div class="rp-frame-issues" id="rp-issues-${i}"></div>
            </div>`;
        });

        html += `</div>`;
        viewport.innerHTML = html;

        // ── Gather iframe references and bind events ──
        const iframeEls = viewport.querySelectorAll('iframe');
        iframeEls.forEach((iframe, idx) => {
            this._iframes.push(iframe);

            iframe.addEventListener('load', () => {
                this._setupScrollSync(iframe, idx);
                this._detectIssues(iframe, idx);
            });
        });

        // Focus mode: clicking a thumbnail promotes it
        if (this._layout === 'focus') {
            viewport.querySelectorAll('.rp-frame-thumb').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    this._focusIdx = parseInt(thumb.dataset.bpIdx);
                    this._loadScreen();
                });
            });
        }
    },


    // ═════════════════════════════════════════════════════
    //  LAYOUT UPDATE
    // ═════════════════════════════════════════════════════

    _updateLayout() {
        // Re-render with current layout mode
        this._loadScreen();
    },


    // ═════════════════════════════════════════════════════
    //  SYNCHRONIZED SCROLLING
    // ═════════════════════════════════════════════════════

    _setupScrollSync(iframe, sourceIdx) {
        let win;
        try { win = iframe.contentWindow; } catch (e) { return; }
        if (!win) return;

        win.addEventListener('scroll', () => {
            if (!this._syncScroll || this._scrolling) return;
            this._scrolling = true;
            this._syncScrollPositions(sourceIdx);
            // Release guard on next frame
            requestAnimationFrame(() => { this._scrolling = false; });
        }, { passive: true });
    },

    /** Proportionally sync scroll from source iframe to all others */
    _syncScrollPositions(sourceIdx) {
        const src = this._iframes[sourceIdx];
        if (!src) return;

        let srcWin;
        try { srcWin = src.contentWindow; } catch (e) { return; }
        if (!srcWin || !srcWin.document.documentElement) return;

        const srcDoc = srcWin.document.documentElement;
        const srcBody = srcWin.document.body;
        const srcMaxX = Math.max(0, srcDoc.scrollWidth - srcDoc.clientWidth, srcBody.scrollWidth - srcDoc.clientWidth);
        const srcMaxY = Math.max(0, srcDoc.scrollHeight - srcDoc.clientHeight, srcBody.scrollHeight - srcDoc.clientHeight);
        const ratioX = srcMaxX > 0 ? srcWin.scrollX / srcMaxX : 0;
        const ratioY = srcMaxY > 0 ? srcWin.scrollY / srcMaxY : 0;

        this._iframes.forEach((iframe, idx) => {
            if (idx === sourceIdx) return;
            let win;
            try { win = iframe.contentWindow; } catch (e) { return; }
            if (!win || !win.document.documentElement) return;

            const doc = win.document.documentElement;
            const body = win.document.body;
            const maxX = Math.max(0, doc.scrollWidth - doc.clientWidth, body.scrollWidth - doc.clientWidth);
            const maxY = Math.max(0, doc.scrollHeight - doc.clientHeight, body.scrollHeight - doc.clientHeight);
            win.scrollTo(ratioX * maxX, ratioY * maxY);
        });
    },


    // ═════════════════════════════════════════════════════
    //  SCALE CALCULATION
    // ═════════════════════════════════════════════════════

    _calculateScale(viewportWidth) {
        if (!this._zoomToFit) return 1;

        const overlay = this._overlayEl;
        if (!overlay) return 1;

        // Available space depends on layout mode
        const containerWidth = overlay.clientWidth || window.innerWidth;
        const topBarHeight = 50;
        const containerHeight = (overlay.clientHeight || window.innerHeight) - topBarHeight;

        const enabledCount = this._breakpoints.filter(bp => bp.enabled).length
            + (this._customWidth ? 1 : 0);

        if (this._layout === 'side-by-side') {
            // Divide horizontal space among all viewports, with gaps
            const gapTotal = (enabledCount - 1) * 16 + 32; // 16px gap + 16px padding each side
            const available = (containerWidth - gapTotal) / enabledCount;
            const scale = Math.min(available / viewportWidth, containerHeight / 940);
            return Math.min(Math.max(scale, 0.1), 1);
        }

        if (this._layout === 'stacked') {
            // Full width for each viewport
            const available = containerWidth - 48; // padding
            const scale = available / viewportWidth;
            return Math.min(Math.max(scale, 0.1), 1);
        }

        if (this._layout === 'focus') {
            // Main viewport gets 70% width, thumbnails get the rest
            const available = (containerWidth - 48) * 0.7;
            const scale = available / viewportWidth;
            return Math.min(Math.max(scale, 0.1), 1);
        }

        return 1;
    },


    // ═════════════════════════════════════════════════════
    //  PIXEL RULER
    // ═════════════════════════════════════════════════════

    _buildRuler(width) {
        let html = '';
        // Major ticks every 100px, minor every 50px
        for (let x = 0; x <= width; x += 50) {
            const isMajor = x % 100 === 0;
            html += `<span class="rp-ruler-tick ${isMajor ? 'rp-tick-major' : 'rp-tick-minor'}"
                          style="left:${x}px">
                ${isMajor ? `<span class="rp-tick-label">${x}</span>` : ''}
            </span>`;
        }
        return html;
    },


    // ═════════════════════════════════════════════════════
    //  RESPONSIVE ISSUE DETECTION
    // ═════════════════════════════════════════════════════

    _detectIssues(iframe, idx) {
        const issuesEl = this._overlayEl?.querySelector(`#rp-issues-${idx}`);
        if (!issuesEl) return;

        let doc;
        try { doc = iframe.contentDocument; } catch (e) { return; }
        if (!doc || !doc.body) return;

        const issues = [];

        // Check for horizontal overflow
        if (doc.body.scrollWidth > iframe.clientWidth + 2) {
            issues.push({
                type: 'overflow',
                text: `Horizontal overflow: ${doc.body.scrollWidth}px > ${iframe.clientWidth}px`
            });
        }

        // Check for truncated text
        const allEls = doc.querySelectorAll('*');
        let truncated = 0;
        for (const el of allEls) {
            try {
                const cs = iframe.contentWindow.getComputedStyle(el);
                if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
                    truncated++;
                }
            } catch (e) { /* skip */ }
        }
        if (truncated > 0) {
            issues.push({
                type: 'truncation',
                text: `${truncated} element${truncated > 1 ? 's' : ''} with text truncation`
            });
        }

        // Check for elements overflowing viewport
        let offscreen = 0;
        const vpWidth = parseInt(iframe.dataset.bpWidth) || iframe.clientWidth;
        for (const el of allEls) {
            try {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.right > vpWidth + 5) {
                    offscreen++;
                }
            } catch (e) { /* skip */ }
        }
        if (offscreen > 0) {
            issues.push({
                type: 'offscreen',
                text: `${offscreen} element${offscreen > 1 ? 's' : ''} extend beyond viewport`
            });
        }

        if (issues.length > 0) {
            issuesEl.innerHTML = issues.map(issue =>
                `<div class="rp-issue rp-issue-${issue.type}">
                    <span class="material-symbols-outlined" style="font-size:12px">
                        ${issue.type === 'overflow' ? 'width' : issue.type === 'truncation' ? 'content_cut' : 'open_in_full'}
                    </span>
                    ${issue.text}
                </div>`
            ).join('');
        } else {
            issuesEl.innerHTML = `<div class="rp-issue rp-issue-ok">
                <span class="material-symbols-outlined" style="font-size:12px">check_circle</span>
                No issues detected
            </div>`;
        }
    },


    // ═════════════════════════════════════════════════════
    //  STYLE INJECTION
    // ═════════════════════════════════════════════════════

    _injectStyles() {
        if (document.getElementById('rp-injected-styles')) return;

        const style = document.createElement('style');
        style.id = 'rp-injected-styles';
        style.textContent = `
/* ── Responsive Preview Overlay ── */
#rp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 14, 0.96);
    backdrop-filter: blur(16px);
    z-index: 950;
    display: none;
    opacity: 0;
    transition: opacity 0.2s ease;
}
#rp-overlay.on {
    display: flex;
    opacity: 1;
}

.rp-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ── Top Bar ── */
.rp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
    gap: 8px;
    height: 48px;
}
.rp-topbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.rp-topbar-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
}
.rp-topbar-center {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
}

/* ── Button groups ── */
.rp-btn-group {
    display: flex;
    gap: 2px;
    background: var(--s2);
    border-radius: 7px;
    padding: 2px;
}
.rp-sep {
    width: 1px;
    height: 24px;
    background: var(--border);
    margin: 0 4px;
    flex-shrink: 0;
}

/* ── Breakpoint toggles ── */
.rp-bp-toggle {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;
    color: var(--dim);
    cursor: pointer;
    font-size: 10px;
    font-family: inherit;
    transition: all 0.15s;
    white-space: nowrap;
}
.rp-bp-toggle:hover {
    background: rgba(255, 255, 255, 0.05);
}
.rp-bp-toggle.active {
    background: rgba(129, 140, 248, 0.12);
    border-color: rgba(129, 140, 248, 0.25);
    color: var(--accent);
}
.rp-bp-label {
    font-size: 10px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

/* ── Layout mode buttons ── */
.rp-layout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;
    color: var(--dim);
    cursor: pointer;
    transition: all 0.15s;
}
.rp-layout-btn:hover {
    background: rgba(255, 255, 255, 0.05);
}
.rp-layout-btn.active {
    background: rgba(129, 140, 248, 0.18);
    border-color: rgba(129, 140, 248, 0.3);
    color: #c4b5fd;
}

/* ── Tool buttons ── */
.rp-tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 5px;
    color: var(--dim);
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    font-weight: 500;
    transition: all 0.15s;
}
.rp-tool-btn:hover {
    background: rgba(129, 140, 248, 0.1);
}
.rp-tool-btn.active {
    background: rgba(129, 140, 248, 0.18);
    border-color: rgba(129, 140, 248, 0.3);
    color: #c4b5fd;
}

/* ── Custom width input ── */
.rp-custom-input {
    width: 80px;
    padding: 4px 8px;
    background: var(--s2);
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text);
    font-size: 11px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    -moz-appearance: textfield;
}
.rp-custom-input::placeholder { color: var(--muted); }
.rp-custom-input:focus { border-color: var(--accent); }
.rp-custom-input::-webkit-outer-spin-button,
.rp-custom-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* ── Close button ── */
.rp-close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: #a1a1aa;
    cursor: pointer;
    padding: 5px 8px;
    display: flex;
    align-items: center;
    transition: all 0.15s;
    flex-shrink: 0;
}
.rp-close-btn:hover {
    background: rgba(248, 113, 113, 0.15);
    border-color: rgba(248, 113, 113, 0.3);
    color: #fca5a5;
}

/* ── Viewport Area ── */
.rp-viewport {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

.rp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--dim);
    font-size: 13px;
}

/* ── Frames container ── */
.rp-frames {
    display: flex;
    gap: 16px;
    min-height: 100%;
}

/* Side-by-side: horizontal row */
.rp-layout-side-by-side {
    flex-direction: row;
    align-items: flex-start;
}

/* Stacked: vertical stack */
.rp-layout-stacked {
    flex-direction: column;
    align-items: center;
}

/* Focus: main + thumbnails sidebar */
.rp-layout-focus {
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap;
}

/* ── Individual frame ── */
.rp-frame {
    display: flex;
    flex-direction: column;
    background: var(--s2);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    transition: box-shadow 0.2s;
}
.rp-frame:hover {
    box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.2),
                0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Focus mode: main frame */
.rp-frame-main {
    flex: 3;
    min-width: 0;
}

/* Focus mode: thumbnail frames */
.rp-frame-thumb {
    flex: 1;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s, box-shadow 0.2s;
    max-width: 300px;
}
.rp-frame-thumb:hover {
    opacity: 1;
    box-shadow: 0 0 0 2px var(--accent);
}

/* ── Frame header ── */
.rp-frame-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}
.rp-frame-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
}
.rp-frame-size {
    font-size: 10px;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
    margin-left: auto;
    background: var(--bg);
    padding: 1px 6px;
    border-radius: 4px;
}

/* ── Frame body (scaled iframe container) ── */
.rp-frame-body {
    position: relative;
    overflow: hidden;
}
.rp-frame-body iframe {
    display: block;
    background: #fff;
}

/* ── Pixel ruler ── */
.rp-ruler {
    position: absolute;
    top: 0;
    left: 0;
    height: 18px;
    background: rgba(9, 9, 11, 0.8);
    pointer-events: none;
    overflow: hidden;
    z-index: 10;
}
.rp-ruler-tick {
    position: absolute;
    top: 0;
    width: 1px;
    background: rgba(129, 140, 248, 0.3);
}
.rp-tick-major {
    height: 18px;
    background: rgba(129, 140, 248, 0.5);
}
.rp-tick-minor {
    height: 10px;
    background: rgba(129, 140, 248, 0.2);
}
.rp-tick-label {
    position: absolute;
    top: 2px;
    left: 3px;
    font-size: 8px;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* ── Issue indicators ── */
.rp-frame-issues {
    padding: 4px 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 26px;
}
.rp-issue {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
}
.rp-issue-overflow {
    background: rgba(248, 113, 113, 0.12);
    color: #fca5a5;
    border: 1px solid rgba(248, 113, 113, 0.2);
}
.rp-issue-truncation {
    background: rgba(251, 191, 36, 0.12);
    color: #fcd34d;
    border: 1px solid rgba(251, 191, 36, 0.2);
}
.rp-issue-offscreen {
    background: rgba(251, 146, 60, 0.12);
    color: #fdba74;
    border: 1px solid rgba(251, 146, 60, 0.2);
}
.rp-issue-ok {
    background: rgba(52, 211, 153, 0.08);
    color: #6ee7b7;
    border: 1px solid rgba(52, 211, 153, 0.15);
}
`;
        document.head.appendChild(style);
    }

};
