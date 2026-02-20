// ═══════════════════════════════════════════════════════════════
// ACCESSIBILITY SCANNER — WCAG Compliance & Color Vision Analysis
// Scans all visible screen iframes to audit accessibility:
//   - Contrast ratio checking (WCAG AA/AAA)
//   - Touch target size validation (48x48px minimum)
//   - ARIA and semantic HTML validation
//   - Color blindness simulation via SVG filters
// Displays results in a slide-out panel with issue highlighting.
// ═══════════════════════════════════════════════════════════════

const AccessibilityScanner = {

    // ── State ──────────────────────────────────────────────
    _panelEl: null,
    _isOpen: false,
    _scanning: false,
    _results: null,
    _highlights: [],
    _simFilter: null,       // current color blindness simulation type

    // ── Color blindness SVG filter matrices ────────────────
    // Each is a 20-value feColorMatrix (4x5 row-major, last column = offset)
    FILTERS: {
        protanopia: [
            0.567, 0.433, 0,     0, 0,
            0.558, 0.442, 0,     0, 0,
            0,     0.242, 0.758, 0, 0,
            0,     0,     0,     1, 0
        ],
        deuteranopia: [
            0.625, 0.375, 0,   0, 0,
            0.7,   0.3,   0,   0, 0,
            0,     0.3,   0.7, 0, 0,
            0,     0,     0,   1, 0
        ],
        tritanopia: [
            0.95, 0.05,  0,     0, 0,
            0,    0.433,  0.567, 0, 0,
            0,    0.475,  0.525, 0, 0,
            0,    0,      0,     1, 0
        ],
        achromatopsia: [
            0.299, 0.587, 0.114, 0, 0,
            0.299, 0.587, 0.114, 0, 0,
            0.299, 0.587, 0.114, 0, 0,
            0,     0,     0,     1, 0
        ]
    },

    INTERACTIVE_TAGS: new Set([
        'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA',
        'DETAILS', 'SUMMARY'
    ]),

    INTERACTIVE_ROLES: new Set([
        'button', 'link', 'menuitem', 'tab', 'checkbox',
        'radio', 'switch', 'slider', 'textbox', 'combobox'
    ]),

    LANDMARK_ROLES: new Set([
        'banner', 'navigation', 'main', 'complementary',
        'contentinfo', 'search', 'form', 'region'
    ]),

    LANDMARK_TAGS: new Set([
        'HEADER', 'NAV', 'MAIN', 'ASIDE', 'FOOTER'
    ]),


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('a11y-panel');
        this._setupSVGFilters();
        this._setupEvents();
        if (this._panelEl) {
            FloatingWindows.setupDrag(this._panelEl, this._panelEl.querySelector('.a11y-header'));
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
        document.getElementById('btn-a11y')?.classList.add('on');
        if (!this._results) this.scan();
    },

    close() {
        this._isOpen = false;
        this._panelEl?.classList.remove('open');
        document.getElementById('btn-a11y')?.classList.remove('on');
        this._clearHighlights();
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },


    // ═════════════════════════════════════════════════════
    //  SCANNING ENGINE
    // ═════════════════════════════════════════════════════

    async scan() {
        if (this._scanning) return;
        this._scanning = true;
        this._clearHighlights();
        this._showLoading();

        const issues = [];
        const summary = { errors: 0, warnings: 0, passes: 0, screens: 0 };
        const iframes = document.querySelectorAll('.ss iframe');

        for (const iframe of iframes) {
            let doc;
            try { doc = iframe.contentDocument; } catch (e) { continue; }
            if (!doc || !doc.body) continue;

            const screenId = iframe.closest('.ss')?.dataset.scr || 'unknown';
            summary.screens++;

            const win = iframe.contentWindow;

            // ── Check lang attribute ──
            const htmlEl = doc.documentElement;
            if (!htmlEl.getAttribute('lang')) {
                issues.push({
                    type: 'aria',
                    severity: 'warning',
                    tag: 'html',
                    text: '',
                    message: 'Missing lang attribute on <html>',
                    current: 'none',
                    required: 'lang="en" or appropriate language code',
                    screenId,
                    iframe,
                    el: htmlEl
                });
            }

            // ── Check for landmark roles ──
            const hasLandmarks = doc.querySelector('main, [role="main"], nav, [role="navigation"], header, [role="banner"]');
            if (!hasLandmarks) {
                issues.push({
                    type: 'aria',
                    severity: 'warning',
                    tag: 'body',
                    text: '',
                    message: 'No landmark roles found (main, nav, header)',
                    current: 'none',
                    required: 'At least one landmark element',
                    screenId,
                    iframe,
                    el: doc.body
                });
            }

            // ── Walk all elements ──
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
                acceptNode: (node) => {
                    const tag = node.tagName;
                    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'SVG', 'BR', 'HR'].includes(tag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            let el;
            while (el = walker.nextNode()) {
                let cs;
                try { cs = win.getComputedStyle(el); } catch (e) { continue; }

                // Skip hidden elements
                if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;

                // Contrast checks — only on elements with actual text
                const contrastIssues = this._checkContrast(el, cs, screenId, iframe);
                if (contrastIssues.length) issues.push(...contrastIssues);

                // Touch target checks — only on interactive elements
                const touchIssues = this._checkTouchTarget(el, cs, screenId, iframe);
                if (touchIssues.length) issues.push(...touchIssues);

                // ARIA checks
                const ariaIssues = this._checkARIA(el, screenId, iframe);
                if (ariaIssues.length) issues.push(...ariaIssues);
            }

            // Yield to keep UI responsive between screens
            await new Promise(r => setTimeout(r, 0));
        }

        // Tally summary
        issues.forEach(issue => {
            if (issue.severity === 'error') summary.errors++;
            else if (issue.severity === 'warning') summary.warnings++;
        });

        this._results = { issues, summary };
        this._scanning = false;
        this._renderPanel(this._results);
    },


    // ═════════════════════════════════════════════════════
    //  CONTRAST CHECKING
    // ═════════════════════════════════════════════════════

    /**
     * Compute relative luminance from linear sRGB values.
     * Formula: L = 0.2126*R + 0.7152*G + 0.0722*B
     */
    _getRelativeLuminance(r, g, b) {
        const [rL, gL, bL] = [r, g, b].map(c => {
            const val = c / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    },

    /**
     * Compute contrast ratio between two luminance values.
     * Returns ratio >= 1, with lighter luminance on top.
     */
    _getContrastRatio(lum1, lum2) {
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    },

    /**
     * Parse a CSS color string into {r, g, b, a} or null.
     * Handles rgb(), rgba(), hex, and common named colors.
     */
    _parseColor(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'currentcolor') {
            return null;
        }
        colorStr = colorStr.trim().toLowerCase();

        // rgb(r, g, b) or rgba(r, g, b, a)
        const rgbaMatch = colorStr.match(
            /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/
        );
        if (rgbaMatch) {
            return {
                r: Math.round(parseFloat(rgbaMatch[1])),
                g: Math.round(parseFloat(rgbaMatch[2])),
                b: Math.round(parseFloat(rgbaMatch[3])),
                a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
            };
        }

        // Hex: #RGB, #RRGGBB, #RRGGBBAA
        if (colorStr.startsWith('#')) {
            let hex = colorStr.slice(1);
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length === 8) {
                const a = parseInt(hex.slice(6, 8), 16) / 255;
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a
                };
            }
            if (hex.length >= 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: 1
                };
            }
        }

        return null;
    },

    /**
     * Walk up the DOM to find the effective background color behind an element.
     * Composites semi-transparent backgrounds onto whatever is below them.
     */
    _getEffectiveBackground(el, doc) {
        let current = el;
        const layers = [];

        while (current && current !== doc.documentElement) {
            let cs;
            try { cs = doc.defaultView.getComputedStyle(current); } catch (e) { break; }
            const bg = cs.backgroundColor;
            const parsed = this._parseColor(bg);
            if (parsed) {
                layers.push(parsed);
                // If this layer is fully opaque, stop walking
                if (parsed.a >= 1) break;
            }
            current = current.parentElement;
        }

        // Default to white if nothing opaque found
        if (layers.length === 0) return { r: 255, g: 255, b: 255 };

        // Composite from back to front (last layer is deepest)
        let result = { r: 255, g: 255, b: 255 }; // base assumption
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const a = layer.a;
            result = {
                r: Math.round(layer.r * a + result.r * (1 - a)),
                g: Math.round(layer.g * a + result.g * (1 - a)),
                b: Math.round(layer.b * a + result.b * (1 - a))
            };
        }
        return result;
    },

    /**
     * Check contrast ratio for an element that contains visible text.
     * Returns array of issue objects (may be empty).
     */
    _checkContrast(el, cs, screenId, iframe) {
        const issues = [];

        // Only check elements that have direct text content
        let hasText = false;
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                hasText = true;
                break;
            }
        }
        if (!hasText) return issues;

        const fgColor = this._parseColor(cs.color);
        if (!fgColor) return issues;

        const bgColor = this._getEffectiveBackground(el, el.ownerDocument);

        // Composite foreground onto background if fg has transparency
        let effectiveFg = fgColor;
        if (fgColor.a < 1) {
            effectiveFg = {
                r: Math.round(fgColor.r * fgColor.a + bgColor.r * (1 - fgColor.a)),
                g: Math.round(fgColor.g * fgColor.a + bgColor.g * (1 - fgColor.a)),
                b: Math.round(fgColor.b * fgColor.a + bgColor.b * (1 - fgColor.a))
            };
        }

        const fgLum = this._getRelativeLuminance(effectiveFg.r, effectiveFg.g, effectiveFg.b);
        const bgLum = this._getRelativeLuminance(bgColor.r, bgColor.g, bgColor.b);
        const ratio = this._getContrastRatio(fgLum, bgLum);

        // Determine if text is "large" per WCAG
        const fontSize = parseFloat(cs.fontSize);
        const fontWeight = parseInt(cs.fontWeight) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

        const aaThreshold = isLargeText ? 3 : 4.5;
        const aaaThreshold = isLargeText ? 4.5 : 7;

        const textExcerpt = el.textContent.trim().slice(0, 40);

        if (ratio < aaThreshold) {
            issues.push({
                type: 'contrast',
                severity: 'error',
                tag: el.tagName.toLowerCase(),
                text: textExcerpt,
                message: `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG AA`,
                current: `${ratio.toFixed(2)}:1`,
                required: `${aaThreshold}:1 (AA${isLargeText ? ' large text' : ''})`,
                screenId,
                iframe,
                el,
                fgColor: `rgb(${effectiveFg.r},${effectiveFg.g},${effectiveFg.b})`,
                bgColor: `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`
            });
        } else if (ratio < aaaThreshold) {
            issues.push({
                type: 'contrast',
                severity: 'warning',
                tag: el.tagName.toLowerCase(),
                text: textExcerpt,
                message: `Contrast ratio ${ratio.toFixed(2)}:1 passes AA but fails AAA`,
                current: `${ratio.toFixed(2)}:1`,
                required: `${aaaThreshold}:1 (AAA${isLargeText ? ' large text' : ''})`,
                screenId,
                iframe,
                el,
                fgColor: `rgb(${effectiveFg.r},${effectiveFg.g},${effectiveFg.b})`,
                bgColor: `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`
            });
        }

        return issues;
    },


    // ═════════════════════════════════════════════════════
    //  TOUCH TARGET VALIDATION
    // ═════════════════════════════════════════════════════

    /**
     * Check whether an interactive element meets the 48x48px minimum
     * touch target guideline.
     */
    _checkTouchTarget(el, cs, screenId, iframe) {
        const issues = [];
        const tag = el.tagName;
        const role = el.getAttribute('role');

        const isInteractive = this.INTERACTIVE_TAGS.has(tag) ||
            (role && this.INTERACTIVE_ROLES.has(role)) ||
            el.hasAttribute('onclick') ||
            el.hasAttribute('tabindex');

        if (!isInteractive) return issues;

        const rect = el.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width < 48 || height < 48) {
            const textExcerpt = el.textContent.trim().slice(0, 30);
            issues.push({
                type: 'touch',
                severity: 'warning',
                tag: tag.toLowerCase(),
                text: textExcerpt,
                message: `Touch target ${width}x${height}px is below 48x48px minimum`,
                current: `${width}x${height}px`,
                required: '48x48px',
                screenId,
                iframe,
                el
            });
        }

        return issues;
    },


    // ═════════════════════════════════════════════════════
    //  ARIA VALIDATION
    // ═════════════════════════════════════════════════════

    /**
     * Check ARIA and semantic HTML issues for a single element.
     */
    _checkARIA(el, screenId, iframe) {
        const issues = [];
        const tag = el.tagName;

        // ── Images without alt text ──
        if (tag === 'IMG') {
            const alt = el.getAttribute('alt');
            // alt="" is acceptable (decorative image), but missing alt is not
            if (alt === null) {
                issues.push({
                    type: 'aria',
                    severity: 'error',
                    tag: 'img',
                    text: (el.getAttribute('src') || '').split('/').pop().slice(0, 30),
                    message: 'Image missing alt attribute',
                    current: 'none',
                    required: 'alt="..." or alt="" for decorative images',
                    screenId,
                    iframe,
                    el
                });
            }
        }

        // ── Form inputs without labels ──
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
            const type = el.getAttribute('type');
            // Skip hidden inputs
            if (type === 'hidden') return issues;

            const hasLabel = el.getAttribute('aria-label') ||
                el.getAttribute('aria-labelledby') ||
                el.getAttribute('placeholder') ||
                el.getAttribute('title') ||
                el.id && el.ownerDocument.querySelector(`label[for="${el.id}"]`);

            if (!hasLabel) {
                issues.push({
                    type: 'aria',
                    severity: 'error',
                    tag: tag.toLowerCase(),
                    text: type ? `type="${type}"` : '',
                    message: 'Form input missing accessible label',
                    current: 'none',
                    required: 'aria-label, label[for], or placeholder',
                    screenId,
                    iframe,
                    el
                });
            }
        }

        // ── Buttons without accessible text ──
        if (tag === 'BUTTON' || (el.getAttribute('role') === 'button')) {
            const text = el.textContent.trim();
            const ariaLabel = el.getAttribute('aria-label');
            const ariaLabelledBy = el.getAttribute('aria-labelledby');
            const title = el.getAttribute('title');

            if (!text && !ariaLabel && !ariaLabelledBy && !title) {
                // Check for img or svg child with alt
                const hasImgAlt = el.querySelector('img[alt]');
                const hasSvgTitle = el.querySelector('svg title');
                if (!hasImgAlt && !hasSvgTitle) {
                    issues.push({
                        type: 'aria',
                        severity: 'error',
                        tag: tag.toLowerCase(),
                        text: '',
                        message: 'Button has no accessible text',
                        current: 'empty',
                        required: 'Text content, aria-label, or aria-labelledby',
                        screenId,
                        iframe,
                        el
                    });
                }
            }
        }

        // ── Links without accessible text ──
        if (tag === 'A') {
            const text = el.textContent.trim();
            const ariaLabel = el.getAttribute('aria-label');
            if (!text && !ariaLabel) {
                const hasImgAlt = el.querySelector('img[alt]');
                if (!hasImgAlt) {
                    issues.push({
                        type: 'aria',
                        severity: 'error',
                        tag: 'a',
                        text: el.getAttribute('href')?.slice(0, 30) || '',
                        message: 'Link has no accessible text',
                        current: 'empty',
                        required: 'Text content or aria-label',
                        screenId,
                        iframe,
                        el
                    });
                }
            }
        }

        return issues;
    },


    // ═════════════════════════════════════════════════════
    //  COLOR BLINDNESS SIMULATION
    // ═════════════════════════════════════════════════════

    /** Create the SVG element with filter definitions, appended once to the main document */
    _setupSVGFilters() {
        if (document.getElementById('a11y-svg-filters')) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'a11y-svg-filters');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.style.pointerEvents = 'none';

        let defs = '<defs>';
        for (const [name, matrix] of Object.entries(this.FILTERS)) {
            defs += `<filter id="a11y-filter-${name}">`;
            defs += `<feColorMatrix type="matrix" values="${matrix.join(' ')}" />`;
            defs += `</filter>`;
        }
        defs += '</defs>';
        svg.innerHTML = defs;
        document.body.appendChild(svg);
    },

    /**
     * Apply a color blindness simulation filter to all screen iframes.
     * @param {string} type — One of: protanopia, deuteranopia, tritanopia, achromatopsia
     */
    applySimulation(type) {
        if (!this.FILTERS[type]) return;
        this._simFilter = type;

        const iframes = document.querySelectorAll('.ss iframe');
        iframes.forEach(iframe => {
            iframe.style.filter = `url(#a11y-filter-${type})`;
        });

        // Update UI buttons
        this._panelEl?.querySelectorAll('.a11y-sim-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sim === type);
        });

        toast(`Simulating: ${this._simLabel(type)}`);
    },

    /** Remove any active color blindness simulation */
    clearSimulation() {
        this._simFilter = null;
        document.querySelectorAll('.ss iframe').forEach(iframe => {
            iframe.style.filter = '';
        });
        this._panelEl?.querySelectorAll('.a11y-sim-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        toast('Simulation cleared');
    },

    /** Human-readable label for a simulation type */
    _simLabel(type) {
        const labels = {
            protanopia: 'Protanopia (red-blind)',
            deuteranopia: 'Deuteranopia (green-blind)',
            tritanopia: 'Tritanopia (blue-blind)',
            achromatopsia: 'Achromatopsia (total)'
        };
        return labels[type] || type;
    },


    // ═════════════════════════════════════════════════════
    //  PANEL RENDERING
    // ═════════════════════════════════════════════════════

    _showLoading() {
        const body = document.getElementById('a11y-body');
        if (body) {
            body.innerHTML = `
                <div class="a11y-loading">
                    <div class="a11y-spinner"></div>
                    <div>Scanning for accessibility issues...</div>
                </div>`;
        }
    },

    _renderPanel(results) {
        const body = document.getElementById('a11y-body');
        if (!body) return;

        const { issues, summary } = results;
        let html = '';

        // ── Summary Stats ──
        html += `<div class="a11y-stats">
            <span class="a11y-stat a11y-stat-screens">${summary.screens} screens</span>
            <span class="a11y-stat a11y-stat-errors">${summary.errors} errors</span>
            <span class="a11y-stat a11y-stat-warnings">${summary.warnings} warnings</span>
            <span class="a11y-stat">${issues.length} total</span>
        </div>`;

        // ── Color Blindness Simulation ──
        html += `<div class="a11y-group">
            <div class="a11y-group-header">
                <span class="a11y-group-icon">&#128065;</span>
                <span class="a11y-group-name">Color Vision Simulation</span>
                <span class="a11y-group-arrow">&#9662;</span>
            </div>
            <div class="a11y-group-body">
                <div class="a11y-sim-grid">
                    <button class="a11y-sim-btn${this._simFilter === 'protanopia' ? ' active' : ''}" data-sim="protanopia">
                        <span class="a11y-sim-preview" style="background:linear-gradient(135deg,#b88c00,#886600,#445599)"></span>
                        Protanopia
                    </button>
                    <button class="a11y-sim-btn${this._simFilter === 'deuteranopia' ? ' active' : ''}" data-sim="deuteranopia">
                        <span class="a11y-sim-preview" style="background:linear-gradient(135deg,#c49900,#997700,#3355aa)"></span>
                        Deuteranopia
                    </button>
                    <button class="a11y-sim-btn${this._simFilter === 'tritanopia' ? ' active' : ''}" data-sim="tritanopia">
                        <span class="a11y-sim-preview" style="background:linear-gradient(135deg,#ee6677,#bb4455,#448888)"></span>
                        Tritanopia
                    </button>
                    <button class="a11y-sim-btn${this._simFilter === 'achromatopsia' ? ' active' : ''}" data-sim="achromatopsia">
                        <span class="a11y-sim-preview" style="background:linear-gradient(135deg,#aaa,#777,#444)"></span>
                        Achromatopsia
                    </button>
                </div>
                <button class="a11y-clear-sim-btn" id="a11y-clear-sim">Clear Simulation</button>
            </div>
        </div>`;

        // ── Issues by type ──
        const grouped = { contrast: [], touch: [], aria: [] };
        issues.forEach(issue => {
            if (grouped[issue.type]) grouped[issue.type].push(issue);
        });

        const groupMeta = {
            contrast: { icon: '&#9681;', name: 'Contrast Ratio', empty: 'All text passes contrast checks' },
            touch:    { icon: '&#9758;', name: 'Touch Targets', empty: 'All touch targets meet 48x48px minimum' },
            aria:     { icon: '&#9888;', name: 'ARIA & Semantics', empty: 'No ARIA issues found' }
        };

        for (const [type, group] of Object.entries(grouped)) {
            const meta = groupMeta[type];
            const errorCount = group.filter(i => i.severity === 'error').length;
            const warnCount = group.filter(i => i.severity === 'warning').length;

            html += `<div class="a11y-group${group.length === 0 ? ' a11y-group-pass' : ''}">
                <div class="a11y-group-header">
                    <span class="a11y-group-icon">${meta.icon}</span>
                    <span class="a11y-group-name">${meta.name}</span>
                    <span class="a11y-group-count">`;

            if (group.length === 0) {
                html += `<span class="a11y-pass-badge">PASS</span>`;
            } else {
                if (errorCount) html += `<span class="a11y-err-count">${errorCount}</span>`;
                if (warnCount) html += `<span class="a11y-warn-count">${warnCount}</span>`;
            }

            html += `</span>
                    <span class="a11y-group-arrow">&#9662;</span>
                </div>
                <div class="a11y-group-body">`;

            if (group.length === 0) {
                html += `<div class="a11y-empty">${meta.empty}</div>`;
            } else {
                group.forEach((issue, idx) => {
                    const sevClass = issue.severity === 'error' ? 'a11y-sev-error' : 'a11y-sev-warning';
                    const sevLabel = issue.severity === 'error' ? 'ERR' : 'WARN';
                    const globalIdx = issues.indexOf(issue);

                    html += `<div class="a11y-issue ${sevClass}" data-issue-idx="${globalIdx}">
                        <div class="a11y-issue-top">
                            <span class="a11y-sev-badge">${sevLabel}</span>
                            <span class="a11y-issue-tag">&lt;${issue.tag}&gt;</span>
                            <span class="a11y-issue-screen">${issue.screenId}</span>
                        </div>
                        <div class="a11y-issue-msg">${this._escHtml(issue.message)}</div>`;

                    if (issue.text) {
                        html += `<div class="a11y-issue-text">"${this._escHtml(issue.text)}"</div>`;
                    }

                    html += `<div class="a11y-issue-vals">
                            <span>Current: <strong>${this._escHtml(issue.current)}</strong></span>
                            <span>Required: <strong>${this._escHtml(issue.required)}</strong></span>
                        </div>`;

                    // Color swatches for contrast issues
                    if (issue.type === 'contrast' && issue.fgColor && issue.bgColor) {
                        html += `<div class="a11y-contrast-swatches">
                            <span class="a11y-swatch" style="background:${issue.fgColor}" title="Foreground"></span>
                            <span class="a11y-swatch-label">on</span>
                            <span class="a11y-swatch" style="background:${issue.bgColor}" title="Background"></span>
                        </div>`;
                    }

                    html += `</div>`;
                });
            }

            html += `</div></div>`;
        }

        body.innerHTML = html;

        // ── Bind events ──

        // Collapsible sections
        body.querySelectorAll('.a11y-group-header').forEach(h => {
            h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
        });

        // Click issue to highlight
        body.querySelectorAll('.a11y-issue').forEach(issueEl => {
            issueEl.addEventListener('click', () => {
                const idx = parseInt(issueEl.dataset.issueIdx);
                if (!isNaN(idx) && issues[idx]) {
                    this._highlightElement(issues[idx]);
                }
            });
        });

        // Simulation buttons
        body.querySelectorAll('.a11y-sim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.sim;
                if (this._simFilter === type) {
                    this.clearSimulation();
                } else {
                    this.applySimulation(type);
                }
            });
        });

        document.getElementById('a11y-clear-sim')?.addEventListener('click', () => this.clearSimulation());
    },


    // ═════════════════════════════════════════════════════
    //  ELEMENT HIGHLIGHTING
    // ═════════════════════════════════════════════════════

    /**
     * Scroll to and visually highlight the element referenced by an issue.
     * Adds a pulsing outline overlay inside the iframe.
     */
    _highlightElement(issue) {
        this._clearHighlights();

        if (!issue.el || !issue.iframe) return;

        let doc;
        try { doc = issue.iframe.contentDocument; } catch (e) { return; }
        if (!doc) return;

        // Create highlight overlay in the iframe
        const overlay = doc.createElement('div');
        overlay.className = 'a11y-highlight-overlay';
        overlay.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 999999;
            border: 3px solid #f87171;
            border-radius: 3px;
            background: rgba(248, 113, 113, 0.12);
            box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.3), 0 0 16px rgba(248, 113, 113, 0.2);
            animation: a11yPulse 1.5s ease-in-out infinite;
        `;

        // Inject keyframes if not already present
        if (!doc.getElementById('a11y-highlight-style')) {
            const style = doc.createElement('style');
            style.id = 'a11y-highlight-style';
            style.textContent = `
                @keyframes a11yPulse {
                    0%, 100% { box-shadow: 0 0 0 2px rgba(248,113,113,0.3), 0 0 16px rgba(248,113,113,0.2); }
                    50% { box-shadow: 0 0 0 4px rgba(248,113,113,0.5), 0 0 24px rgba(248,113,113,0.35); }
                }
            `;
            doc.head.appendChild(style);
        }

        // Position the overlay on the element
        const rect = issue.el.getBoundingClientRect();
        const scrollX = doc.defaultView.scrollX || doc.documentElement.scrollLeft;
        const scrollY = doc.defaultView.scrollY || doc.documentElement.scrollTop;

        overlay.style.left = (rect.left + scrollX - 3) + 'px';
        overlay.style.top = (rect.top + scrollY - 3) + 'px';
        overlay.style.width = (rect.width + 6) + 'px';
        overlay.style.height = (rect.height + 6) + 'px';

        doc.body.appendChild(overlay);
        this._highlights.push({ overlay, doc });

        // Scroll element into view within the iframe
        try {
            issue.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) { /* some elements may not support scrollIntoView */ }

        // Auto-clear after 4 seconds
        setTimeout(() => this._clearHighlights(), 4000);
    },

    /** Remove all active highlight overlays from iframes */
    _clearHighlights() {
        this._highlights.forEach(({ overlay, doc }) => {
            try { overlay.remove(); } catch (e) {}
        });
        this._highlights = [];
    },


    // ═════════════════════════════════════════════════════
    //  EXPORT
    // ═════════════════════════════════════════════════════

    _exportJSON() {
        if (!this._results) { toast('Run a scan first'); return; }

        const { issues, summary } = this._results;

        const exportData = {
            meta: {
                app: window.curApp?.name || 'Unknown',
                scannedAt: new Date().toISOString(),
                screens: summary.screens,
                totalIssues: issues.length,
                errors: summary.errors,
                warnings: summary.warnings
            },
            issues: issues.map(issue => ({
                type: issue.type,
                severity: issue.severity,
                tag: issue.tag,
                text: issue.text,
                message: issue.message,
                current: issue.current,
                required: issue.required,
                screen: issue.screenId,
                ...(issue.fgColor ? { foreground: issue.fgColor } : {}),
                ...(issue.bgColor ? { background: issue.bgColor } : {})
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `a11y-report-${window.curApp?.id || 'app'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Accessibility report exported as JSON');
    },


    // ═════════════════════════════════════════════════════
    //  EVENT SETUP
    // ═════════════════════════════════════════════════════

    _setupEvents() {
        document.getElementById('a11y-close')?.addEventListener('click', () => this.close());
        document.getElementById('a11y-rescan')?.addEventListener('click', () => {
            this._results = null;
            this.scan();
        });
        document.getElementById('a11y-export')?.addEventListener('click', () => this._exportJSON());
    },


    // ═════════════════════════════════════════════════════
    //  UTILITIES
    // ═════════════════════════════════════════════════════

    _escHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

};
