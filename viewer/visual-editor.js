// ═══════════════════════════════════════════════════════════════
// VISUAL EDITOR — Direct inline editing of element styles
// Bridges Inspector (select + view) ↔ Screen Creator (save)
//   • Click property values in Inspector → inline edit
//   • Color values → native color picker
//   • Numeric values → input with ±1/±10 arrow key stepping
//   • Arrow key nudge for selected elements (move/resize)
//   • Gradient quick-editor (parse + rebuild)
//   • DOM → HTML serialization + IndexedDB persistence
//   • Undo stack (last 20 states per screen)
//   • Floating contextual toolbar
// ═══════════════════════════════════════════════════════════════

const VisualEditor = {

    // ── State ──────────────────────────────────────────────
    enabled: false,
    _undoStacks: new Map(),   // "appId/screenId" → [{html, timestamp}]
    _maxUndo: 20,
    _nudgeTransform: { x: 0, y: 0 },
    _activeInput: null,       // currently open inline editor
    _colorPickerEl: null,
    _toolbarEl: null,
    _gradientEditorEl: null,
    _dirty: false,            // unsaved changes flag
    _autoSave: true,
    _saveDebounce: null,

    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._colorPickerEl = document.getElementById('ve-color-picker');
        this._toolbarEl = document.getElementById('ve-toolbar');
        this._gradientEditorEl = document.getElementById('ve-gradient-editor');
        this.enabled = true;
        this._setupKeyboardNudge();
        this._setupToolbarEvents();
        this._setupColorPickerEvents();
        this._setupGradientEditorEvents();
    },

    // ═════════════════════════════════════════════════════
    //  INLINE PROPERTY EDITING (hooks into Inspector panel)
    // ═════════════════════════════════════════════════════

    /**
     * Called by Inspector after rendering panel content.
     * Makes property values clickable for inline editing.
     */
    hookIntoPanel(panelBody) {
        if (!panelBody || !this.enabled) return;
        panelBody.querySelectorAll('.ve-editable').forEach(span => {
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                this._openInlineEditor(span);
            });
        });
    },

    /** Open an inline editor for a CSS property value */
    _openInlineEditor(span) {
        // Close any existing editor
        this._closeInlineEditor();

        const prop = span.dataset.cssProp;
        const rawValue = span.dataset.cssRaw;
        if (!prop || !rawValue) return;

        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        if (!el || !iframe) return;

        // Determine editor type
        if (this._isColorValue(rawValue)) {
            this._openColorPicker(span, prop, rawValue, el, iframe);
        } else if (this._isGradientValue(rawValue)) {
            this._openGradientEditor(span, prop, rawValue, el, iframe);
        } else if (this._isNumericValue(rawValue)) {
            this._openNumericEditor(span, prop, rawValue, el, iframe);
        } else {
            this._openTextEditor(span, prop, rawValue, el, iframe);
        }
    },

    _closeInlineEditor() {
        if (this._activeInput) {
            const old = this._activeInput;
            this._activeInput = null;
            if (old.cleanup) old.cleanup();
        }
        this._hideColorPicker();
        this._hideGradientEditor();
    },

    // ── Numeric Editor ────────────────────────────────
    _openNumericEditor(span, prop, rawValue, el, iframe) {
        const valText = span.querySelector('.ve-val-text');
        if (!valText) return;

        const parsed = this._parseNumericValue(rawValue);
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 've-inline-input';
        input.value = parsed.number;
        input.dataset.unit = parsed.unit;
        input.step = prop === 'opacity' ? '0.05' : '1';

        const unitLabel = document.createElement('span');
        unitLabel.className = 've-inline-unit';
        unitLabel.textContent = parsed.unit;

        // Replace text with input
        const originalHTML = valText.innerHTML;
        valText.innerHTML = '';
        valText.appendChild(input);
        valText.appendChild(unitLabel);
        input.focus();
        input.select();

        const applyValue = () => {
            const newVal = prop === 'opacity'
                ? parseFloat(input.value)
                : input.value + parsed.unit;
            this._pushUndo(el, iframe);
            el.style.setProperty(prop, String(newVal));
            this._markDirty(iframe);
            this._refreshInspector();
        };

        const cleanup = () => {
            valText.innerHTML = originalHTML;
        };

        input.addEventListener('change', applyValue);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { applyValue(); this._closeInlineEditor(); }
            if (e.key === 'Escape') { this._closeInlineEditor(); }
            // Prevent nudge keys from propagating
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.stopPropagation();
            }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => this._closeInlineEditor(), 150);
        });

        this._activeInput = { input, cleanup };
    },

    // ── Color Picker (HSL Canvas) ────────────────────────────────
    _cpHue: 260,
    _cpSat: 70,
    _cpBright: 70,
    _cpAlpha: 100,

    _openColorPicker(span, prop, rawValue, el, iframe) {
        const picker = this._colorPickerEl;
        if (!picker) return;

        const hex = this._toHex(rawValue);
        const alpha = this._parseAlpha(rawValue);

        // Parse hex to HSB
        const hsl = this._hexToHSB(hex);
        this._cpHue = hsl.h;
        this._cpSat = hsl.s;
        this._cpBright = hsl.b;
        this._cpAlpha = Math.round(alpha * 100);

        // Update hidden native input
        const colorInput = picker.querySelector('#ve-cp-input');
        if (colorInput) colorInput.value = hex;

        // Update hex display
        const hexDisplay = picker.querySelector('#ve-cp-hex');
        if (hexDisplay) hexDisplay.value = hex;

        // Update preview swatch
        const preview = picker.querySelector('#ve-cp-preview');
        if (preview) preview.style.background = hex;

        // Position near the span
        const spanRect = span.getBoundingClientRect();
        picker.style.left = Math.min(spanRect.left, window.innerWidth - 330) + 'px';
        picker.style.top = Math.min(spanRect.bottom + 6, window.innerHeight - 440) + 'px';
        picker.classList.add('open');

        // Store context
        picker.dataset.prop = prop;
        picker._targetEl = el;
        picker._iframe = iframe;
        picker._originalValue = rawValue;

        // Render canvas and cursors
        this._cpRenderCanvas();
        this._cpUpdateCursors();
        this._cpUpdateOpacityGrad();

        this._activeInput = {
            cleanup: () => this._hideColorPicker()
        };
    },

    _hideColorPicker() {
        if (this._colorPickerEl) {
            this._colorPickerEl.classList.remove('open');
        }
    },

    /** Render the saturation/brightness canvas for current hue */
    _cpRenderCanvas() {
        const canvas = document.getElementById('ve-cp-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        // Draw hue background
        ctx.fillStyle = `hsl(${this._cpHue}, 100%, 50%)`;
        ctx.fillRect(0, 0, w, h);

        // White gradient (left to right = saturation)
        const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
        whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
        whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = whiteGrad;
        ctx.fillRect(0, 0, w, h);

        // Black gradient (top to bottom = brightness)
        const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
        blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
        blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = blackGrad;
        ctx.fillRect(0, 0, w, h);
    },

    /** Update all cursor positions from current HSB state */
    _cpUpdateCursors() {
        const canvas = document.getElementById('ve-cp-canvas');
        const cursor = document.getElementById('ve-cp-cursor');
        const hueCursor = document.getElementById('ve-cp-hue-cursor');
        const opacityCursor = document.getElementById('ve-cp-opacity-cursor');
        const hueWrap = document.getElementById('ve-cp-hue-wrap');
        const opacityWrap = document.getElementById('ve-cp-opacity-wrap');

        if (canvas && cursor) {
            const cx = (this._cpSat / 100) * canvas.width;
            const cy = (1 - this._cpBright / 100) * canvas.height;
            cursor.style.left = cx + 'px';
            cursor.style.top = cy + 'px';
        }
        if (hueCursor && hueWrap) {
            const hx = (this._cpHue / 360) * hueWrap.offsetWidth;
            hueCursor.style.left = hx + 'px';
        }
        if (opacityCursor && opacityWrap) {
            const ox = (this._cpAlpha / 100) * opacityWrap.offsetWidth;
            opacityCursor.style.left = ox + 'px';
        }
    },

    /** Update opacity gradient bar background */
    _cpUpdateOpacityGrad() {
        const grad = document.getElementById('ve-cp-opacity-grad');
        if (!grad) return;
        const hex = this._hsbToHex(this._cpHue, this._cpSat, this._cpBright);
        grad.style.background = `linear-gradient(to right, transparent, ${hex})`;
    },

    /** Get current color from HSB+alpha state as hex or rgba */
    _cpGetColor() {
        const hex = this._hsbToHex(this._cpHue, this._cpSat, this._cpBright);
        if (this._cpAlpha < 100) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${this._cpAlpha / 100})`;
        }
        return hex;
    },

    /** Sync all UI from current HSB state */
    _cpSyncUI() {
        const hex = this._hsbToHex(this._cpHue, this._cpSat, this._cpBright);
        const picker = this._colorPickerEl;
        if (!picker) return;

        const hexInput = picker.querySelector('#ve-cp-hex');
        if (hexInput) hexInput.value = hex;

        const preview = picker.querySelector('#ve-cp-preview');
        if (preview) preview.style.background = this._cpGetColor();

        const colorInput = picker.querySelector('#ve-cp-input');
        if (colorInput) colorInput.value = hex;

        this._cpUpdateCursors();
        this._cpUpdateOpacityGrad();
    },

    _applyColorFromPicker() {
        const picker = this._colorPickerEl;
        if (!picker || !picker._targetEl) return;

        const prop = picker.dataset.prop;
        const el = picker._targetEl;
        const iframe = picker._iframe;
        const colorValue = this._cpGetColor();

        this._pushUndo(el, iframe);
        el.style.setProperty(prop, colorValue);
        this._markDirty(iframe);
        this._refreshInspector();
    },

    // HSB ↔ Hex conversions
    _hexToHSB(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d > 0) {
            if (max === r) h = ((g - b) / d + 6) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
        }
        const s = max === 0 ? 0 : (d / max) * 100;
        const v = max * 100;
        return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
    },

    _hsbToHex(h, s, b) {
        s /= 100; b /= 100;
        const c = b * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = b - c;
        let r = 0, g = 0, bl = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; bl = x; }
        else if (h < 240) { g = x; bl = c; }
        else if (h < 300) { r = x; bl = c; }
        else { r = c; bl = x; }
        const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return '#' + toHex(r) + toHex(g) + toHex(bl);
    },

    // ── Gradient Editor ────────────────────────────────
    _openGradientEditor(span, prop, rawValue, el, iframe) {
        const editor = this._gradientEditorEl;
        if (!editor) return;

        const parsed = this._parseGradient(rawValue);
        editor._context = { prop, el, iframe, original: rawValue };
        editor._gradient = parsed;

        this._renderGradientEditor();

        // Position
        const spanRect = span.getBoundingClientRect();
        editor.style.left = Math.min(spanRect.left, window.innerWidth - 300) + 'px';
        editor.style.top = Math.min(spanRect.bottom + 6, window.innerHeight - 280) + 'px';
        editor.classList.add('open');

        this._activeInput = {
            cleanup: () => this._hideGradientEditor()
        };
    },

    _hideGradientEditor() {
        if (this._gradientEditorEl) {
            this._gradientEditorEl.classList.remove('open');
        }
    },

    _renderGradientEditor() {
        const editor = this._gradientEditorEl;
        if (!editor || !editor._gradient) return;

        const g = editor._gradient;
        const body = editor.querySelector('#ve-ge-body');
        if (!body) return;

        let html = '';
        // Type + angle
        html += `<div class="ve-ge-row">`;
        html += `<select id="ve-ge-type" class="ve-ge-select"><option value="linear" ${g.type === 'linear' ? 'selected' : ''}>Linear</option><option value="radial" ${g.type === 'radial' ? 'selected' : ''}>Radial</option><option value="conic" ${g.type === 'conic' ? 'selected' : ''}>Conic</option></select>`;
        if (g.type === 'linear' || g.type === 'conic') {
            html += `<input type="number" id="ve-ge-angle" class="ve-ge-input" value="${g.angle}" min="0" max="360" step="5" />`;
            html += `<span class="ve-ge-unit">deg</span>`;
        }
        html += `</div>`;

        // Color stops
        html += `<div class="ve-ge-stops">`;
        g.stops.forEach((stop, i) => {
            html += `<div class="ve-ge-stop" data-idx="${i}">`;
            html += `<input type="color" class="ve-ge-stop-color" data-idx="${i}" value="${this._toHex(stop.color)}" />`;
            html += `<input type="range" class="ve-ge-stop-pos" data-idx="${i}" min="0" max="100" value="${stop.position}" />`;
            html += `<span class="ve-ge-stop-pct">${stop.position}%</span>`;
            if (g.stops.length > 2) {
                html += `<button class="ve-ge-stop-del" data-idx="${i}">&times;</button>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
        html += `<button class="ve-ge-add-stop" id="ve-ge-add-stop">+ Add Stop</button>`;

        // Preview
        html += `<div class="ve-ge-preview" style="background:${this._buildGradientCSS(g)}"></div>`;

        body.innerHTML = html;

        // Wire events
        this._wireGradientControls(editor);
    },

    _wireGradientControls(editor) {
        const g = editor._gradient;
        const ctx = editor._context;

        const typeSelect = editor.querySelector('#ve-ge-type');
        const angleInput = editor.querySelector('#ve-ge-angle');

        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                g.type = typeSelect.value;
                this._renderGradientEditor();
                this._applyGradient(ctx, g);
            });
        }
        if (angleInput) {
            angleInput.addEventListener('input', () => {
                g.angle = parseInt(angleInput.value) || 0;
                this._applyGradient(ctx, g);
                const preview = editor.querySelector('.ve-ge-preview');
                if (preview) preview.style.background = this._buildGradientCSS(g);
            });
        }

        editor.querySelectorAll('.ve-ge-stop-color').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.idx);
                g.stops[idx].color = input.value;
                this._applyGradient(ctx, g);
                const preview = editor.querySelector('.ve-ge-preview');
                if (preview) preview.style.background = this._buildGradientCSS(g);
            });
        });

        editor.querySelectorAll('.ve-ge-stop-pos').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.idx);
                g.stops[idx].position = parseInt(input.value);
                const pct = input.parentElement.querySelector('.ve-ge-stop-pct');
                if (pct) pct.textContent = input.value + '%';
                this._applyGradient(ctx, g);
                const preview = editor.querySelector('.ve-ge-preview');
                if (preview) preview.style.background = this._buildGradientCSS(g);
            });
        });

        editor.querySelectorAll('.ve-ge-stop-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                g.stops.splice(idx, 1);
                this._renderGradientEditor();
                this._applyGradient(ctx, g);
            });
        });

        const addBtn = editor.querySelector('#ve-ge-add-stop');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const lastStop = g.stops[g.stops.length - 1];
                g.stops.push({ color: lastStop.color, position: Math.min(lastStop.position + 20, 100) });
                this._renderGradientEditor();
                this._applyGradient(ctx, g);
            });
        }
    },

    _applyGradient(ctx, gradient) {
        if (!ctx || !ctx.el) return;
        this._pushUndo(ctx.el, ctx.iframe);
        const css = this._buildGradientCSS(gradient);
        ctx.el.style.setProperty(ctx.prop, css);
        this._markDirty(ctx.iframe);
    },

    // ── Text Editor (generic fallback) ────────────────
    _openTextEditor(span, prop, rawValue, el, iframe) {
        const valText = span.querySelector('.ve-val-text');
        if (!valText) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 've-inline-input ve-inline-text';
        input.value = rawValue;

        const originalHTML = valText.innerHTML;
        valText.innerHTML = '';
        valText.appendChild(input);
        input.focus();
        input.select();

        const applyValue = () => {
            this._pushUndo(el, iframe);
            el.style.setProperty(prop, input.value);
            this._markDirty(iframe);
            this._refreshInspector();
        };

        const cleanup = () => {
            valText.innerHTML = originalHTML;
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { applyValue(); this._closeInlineEditor(); }
            if (e.key === 'Escape') { this._closeInlineEditor(); }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => this._closeInlineEditor(), 150);
        });

        this._activeInput = { input, cleanup };
    },


    // ═════════════════════════════════════════════════════
    //  ARROW KEY NUDGE
    // ═════════════════════════════════════════════════════

    _setupKeyboardNudge() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled || !ElementInspector.active || !ElementInspector.selectedEl) return;
            // Don't nudge when an input is focused
            if (this._activeInput || document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.tagName === 'SELECT') return;

            const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrows.includes(e.key)) return;

            e.preventDefault();
            e.stopPropagation();

            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;

            const step = e.shiftKey ? 10 : 1;
            const isResize = e.altKey;

            if (isResize) {
                this._resizeElement(el, iframe, e.key, step);
            } else {
                this._nudgeElement(el, iframe, e.key, step);
            }
        });
    },

    _nudgeElement(el, iframe, key, step) {
        // Get current transform translate values
        const current = this._parseTranslate(el);

        switch (key) {
            case 'ArrowLeft': current.x -= step; break;
            case 'ArrowRight': current.x += step; break;
            case 'ArrowUp': current.y -= step; break;
            case 'ArrowDown': current.y += step; break;
        }

        this._pushUndo(el, iframe);
        el.style.transform = `translate(${current.x}px, ${current.y}px)`;
        this._nudgeTransform = current;
        this._markDirty(iframe);
        this._showNudgeIndicator(el, iframe, current);
        this._updateSelectionOverlay(el, iframe);
    },

    _resizeElement(el, iframe, key, step) {
        const computed = iframe.contentWindow.getComputedStyle(el);
        let w = parseFloat(computed.width) || 0;
        let h = parseFloat(computed.height) || 0;

        switch (key) {
            case 'ArrowLeft': w = Math.max(10, w - step); break;
            case 'ArrowRight': w += step; break;
            case 'ArrowUp': h = Math.max(10, h - step); break;
            case 'ArrowDown': h += step; break;
        }

        this._pushUndo(el, iframe);
        el.style.width = w + 'px';
        el.style.height = h + 'px';
        this._markDirty(iframe);
        this._updateSelectionOverlay(el, iframe);
        this._refreshInspector();
    },

    _parseTranslate(el) {
        const transform = el.style.transform || '';
        const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
    },

    _showNudgeIndicator(el, iframe, pos) {
        const data = ElementInspector._iframeMap.get(iframe);
        if (!data) return;
        let indicator = data.doc.getElementById('ve-nudge-indicator');
        if (!indicator) {
            indicator = data.doc.createElement('div');
            indicator.id = 've-nudge-indicator';
            indicator.style.cssText = 'position:fixed;z-index:999999;background:rgba(129,140,248,0.9);color:#fff;font:600 10px/1 Inter,sans-serif;padding:3px 7px;border-radius:4px;pointer-events:none;white-space:nowrap;transition:opacity 0.3s;';
            data.doc.body.appendChild(indicator);
        }
        const rect = el.getBoundingClientRect();
        indicator.textContent = `${pos.x}, ${pos.y}`;
        indicator.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        indicator.style.top = (rect.top - 22) + 'px';
        indicator.style.opacity = '1';

        clearTimeout(indicator._fadeTimer);
        indicator._fadeTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 1200);
    },

    _updateSelectionOverlay(el, iframe) {
        const data = ElementInspector._iframeMap.get(iframe);
        if (data && data.selectOverlay) {
            const rect = el.getBoundingClientRect();
            ElementInspector._positionOverlay(data.selectOverlay, rect);
        }
    },


    // ═════════════════════════════════════════════════════
    //  ELEMENT TYPE DETECTION
    // ═════════════════════════════════════════════════════

    /** Detect the semantic type of a selected element for contextual toolbar */
    detectElementType(el) {
        if (!el) return 'generic';
        const tag = el.tagName.toLowerCase();
        const classes = el.className?.toString() || '';

        if (tag === 'button' || tag === 'a' || classes.match(/btn|button/i))
            return 'button';
        if (classes.match(/card|panel|glass/i) || el.closest?.('[class*="card"]'))
            return 'card';
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag))
            return 'heading';
        if (tag === 'p' || tag === 'span' || tag === 'label' || tag === 'small')
            return 'text';
        if (tag === 'img' || tag === 'svg' || classes.match(/icon/i))
            return 'media';
        if (tag === 'input' || tag === 'textarea' || tag === 'select')
            return 'input';
        if (tag === 'nav' || classes.match(/nav|bar|tab/i))
            return 'navigation';
        return 'generic';
    },

    /** Map of which toolbar buttons are relevant per element type */
    _toolbarButtons: {
        button:     ['fill', 'color', 'radius', 'padding', 'imgbg', 'undo', 'save'],
        card:       ['fill', 'color', 'radius', 'shadow', 'opacity', 'imgbg', 'undo', 'save'],
        heading:    ['color', 'bold', 'italic', 'fontsize', 'undo', 'save'],
        text:       ['color', 'bold', 'italic', 'fontsize', 'undo', 'save'],
        media:      ['radius', 'opacity', 'undo', 'save'],
        input:      ['fill', 'color', 'radius', 'padding', 'undo', 'save'],
        navigation: ['fill', 'color', 'imgbg', 'undo', 'save'],
        generic:    ['fill', 'color', 'bold', 'italic', 'radius', 'padding', 'shadow', 'opacity', 'fontsize', 'imgbg', 'undo', 'save'],
    },

    // ═════════════════════════════════════════════════════
    //  FLOATING TOOLBAR
    // ═════════════════════════════════════════════════════

    showToolbar(el, iframe) {
        if (!this._toolbarEl || !el || !iframe) return;

        const iframeRect = iframe.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scaleX = iframeRect.width / (iframe.clientWidth || 375);
        const scaleY = iframeRect.height / (iframe.clientHeight || 770);

        const x = iframeRect.left + elRect.left * scaleX + (elRect.width * scaleX) / 2;
        const y = iframeRect.top + elRect.top * scaleY - 42;

        this._toolbarEl.style.left = Math.max(8, Math.min(x - 130, window.innerWidth - 400)) + 'px';
        this._toolbarEl.style.top = Math.max(52, y) + 'px';
        this._toolbarEl.classList.add('open');

        // Detect element type and show/hide relevant buttons
        const elType = this.detectElementType(el);
        const allowed = this._toolbarButtons[elType] || this._toolbarButtons.generic;

        this._toolbarEl.querySelectorAll('.ve-tb-btn').forEach(btn => {
            const role = btn.dataset.role;
            if (role) {
                btn.style.display = allowed.includes(role) ? '' : 'none';
            }
        });
        // Show/hide separators based on visible neighbors
        this._toolbarEl.querySelectorAll('.ve-tb-sep').forEach(sep => {
            const prev = sep.previousElementSibling;
            const next = sep.nextElementSibling;
            const prevVisible = prev && prev.style.display !== 'none';
            const nextVisible = next && next.style.display !== 'none';
            sep.style.display = (prevVisible && nextVisible) ? '' : 'none';
        });

        // Update bold/italic state
        const computed = iframe.contentWindow.getComputedStyle(el);
        const isBold = parseInt(computed.fontWeight) >= 600;
        const isItalic = computed.fontStyle === 'italic';
        this._toolbarEl.querySelector('#ve-tb-bold')?.classList.toggle('active', isBold);
        this._toolbarEl.querySelector('#ve-tb-italic')?.classList.toggle('active', isItalic);

        // Show element type badge
        const badge = this._toolbarEl.querySelector('#ve-tb-type-badge');
        if (badge) badge.textContent = elType;
    },

    hideToolbar() {
        if (this._toolbarEl) this._toolbarEl.classList.remove('open');
    },

    _setupToolbarEvents() {
        if (!this._toolbarEl) return;

        // Bold toggle
        this._toolbarEl.querySelector('#ve-tb-bold')?.addEventListener('click', () => {
            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;
            const computed = iframe.contentWindow.getComputedStyle(el);
            const isBold = parseInt(computed.fontWeight) >= 600;
            this._pushUndo(el, iframe);
            el.style.fontWeight = isBold ? '400' : '700';
            this._markDirty(iframe);
            this._refreshInspector();
            this.showToolbar(el, iframe);
        });

        // Italic toggle
        this._toolbarEl.querySelector('#ve-tb-italic')?.addEventListener('click', () => {
            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;
            const computed = iframe.contentWindow.getComputedStyle(el);
            const isItalic = computed.fontStyle === 'italic';
            this._pushUndo(el, iframe);
            el.style.fontStyle = isItalic ? 'normal' : 'italic';
            this._markDirty(iframe);
            this._refreshInspector();
            this.showToolbar(el, iframe);
        });

        // Fill color (background)
        this._toolbarEl.querySelector('#ve-tb-fill')?.addEventListener('click', () => {
            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;
            const computed = iframe.contentWindow.getComputedStyle(el);
            const bgVal = computed.getPropertyValue('background-color');
            // Open color picker for background-color
            const fakeSpan = { getBoundingClientRect: () => this._toolbarEl.getBoundingClientRect(), dataset: {}, querySelector: () => null };
            this._openColorPicker(fakeSpan, 'background-color', bgVal || 'rgba(0,0,0,0)', el, iframe);
        });

        // Text color
        this._toolbarEl.querySelector('#ve-tb-color')?.addEventListener('click', () => {
            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;
            const computed = iframe.contentWindow.getComputedStyle(el);
            const colorVal = computed.getPropertyValue('color');
            const fakeSpan = { getBoundingClientRect: () => this._toolbarEl.getBoundingClientRect(), dataset: {}, querySelector: () => null };
            this._openColorPicker(fakeSpan, 'color', colorVal || '#ffffff', el, iframe);
        });

        // Undo
        this._toolbarEl.querySelector('#ve-tb-undo')?.addEventListener('click', () => {
            this.undo();
        });

        // Save
        this._toolbarEl.querySelector('#ve-tb-save')?.addEventListener('click', () => {
            this.saveCurrentScreen();
        });

        // Border radius
        this._toolbarEl.querySelector('#ve-tb-radius')?.addEventListener('click', () => {
            this._inlinePropertyEdit('border-radius');
        });

        // Padding
        this._toolbarEl.querySelector('#ve-tb-padding')?.addEventListener('click', () => {
            this._inlinePropertyEdit('padding');
        });

        // Box shadow toggle
        this._toolbarEl.querySelector('#ve-tb-shadow')?.addEventListener('click', () => {
            const el = ElementInspector.selectedEl;
            const iframe = ElementInspector.selectedIframe;
            if (!el || !iframe) return;
            const computed = iframe.contentWindow.getComputedStyle(el);
            const current = computed.boxShadow;
            this._pushUndo(el, iframe);
            if (current && current !== 'none') {
                el.style.boxShadow = 'none';
            } else {
                el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
            }
            this._markDirty(iframe);
            this._refreshInspector();
        });

        // Opacity
        this._toolbarEl.querySelector('#ve-tb-opacity')?.addEventListener('click', () => {
            this._inlinePropertyEdit('opacity');
        });

        // Font size
        this._toolbarEl.querySelector('#ve-tb-fontsize')?.addEventListener('click', () => {
            this._inlinePropertyEdit('font-size');
        });

        // Image background
        this._toolbarEl.querySelector('#ve-tb-imgbg')?.addEventListener('click', () => {
            this._openImageBgPicker();
        });
    },

    /** Property ranges and presets for inline editor */
    _propConfig: {
        'opacity':       { min: 0, max: 1, step: 0.05, unit: '', presets: [0.1, 0.25, 0.5, 0.75, 1] },
        'border-radius': { min: 0, max: 50, step: 1, unit: 'px', presets: [0, 4, 8, 12, 16, 24, 9999] },
        'padding':       { min: 0, max: 60, step: 1, unit: 'px', presets: [0, 4, 8, 12, 16, 24, 32] },
        'font-size':     { min: 8, max: 72, step: 1, unit: 'px', presets: [10, 12, 14, 16, 20, 24, 32, 48] },
    },

    /** Quick inline property edit: slider + number input + presets */
    _inlinePropertyEdit(prop) {
        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        if (!el || !iframe) return;

        // Remove any existing popup
        document.querySelectorAll('.ve-inline-popup').forEach(p => p.remove());

        const computed = iframe.contentWindow.getComputedStyle(el);
        const current = computed.getPropertyValue(prop);
        const parsed = this._parseNumericValue(current);
        const config = this._propConfig[prop] || { min: 0, max: 100, step: 1, unit: parsed.unit || 'px', presets: [] };

        const popup = document.createElement('div');
        popup.className = 've-inline-popup';

        const tbRect = this._toolbarEl.getBoundingClientRect();
        popup.style.left = Math.max(8, Math.min(tbRect.left, window.innerWidth - 260)) + 'px';
        popup.style.top = (tbRect.bottom + 4) + 'px';

        // Label
        const label = document.createElement('div');
        label.className = 've-inline-popup-label';
        label.textContent = prop;

        // Slider + Input row
        const row = document.createElement('div');
        row.className = 've-inline-popup-row';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 've-inline-popup-slider';
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = parsed.number;

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 've-inline-popup-input';
        input.min = config.min;
        input.max = config.max;
        input.step = config.step;
        input.value = parsed.number;

        const unit = document.createElement('span');
        unit.className = 've-inline-popup-unit';
        unit.textContent = config.unit;

        row.appendChild(slider);
        row.appendChild(input);
        row.appendChild(unit);

        popup.appendChild(label);
        popup.appendChild(row);

        // Presets
        if (config.presets.length > 0) {
            const presetsRow = document.createElement('div');
            presetsRow.className = 've-inline-popup-presets';
            config.presets.forEach(val => {
                const btn = document.createElement('button');
                btn.className = 've-inline-popup-preset';
                btn.textContent = prop === 'border-radius' && val >= 9999 ? 'Full' : (prop === 'opacity' ? Math.round(val * 100) + '%' : val);
                if (parseFloat(parsed.number) === val) btn.classList.add('active');
                btn.addEventListener('click', () => {
                    slider.value = val;
                    input.value = val;
                    applyVal(val);
                    presetsRow.querySelectorAll('.ve-inline-popup-preset').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                presetsRow.appendChild(btn);
            });
            popup.appendChild(presetsRow);
        }

        document.body.appendChild(popup);
        input.focus();
        input.select();

        const applyVal = (numVal) => {
            this._pushUndo(el, iframe);
            const cssVal = prop === 'opacity' ? parseFloat(numVal) : numVal + config.unit;
            el.style.setProperty(prop, String(cssVal));
            this._markDirty(iframe);
        };

        // Sync slider ↔ input
        slider.addEventListener('input', () => {
            input.value = slider.value;
            applyVal(slider.value);
        });
        input.addEventListener('input', () => {
            slider.value = input.value;
            applyVal(input.value);
        });

        // Close on Enter/Escape
        const close = () => { popup.remove(); this._refreshInspector(); };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') close();
            if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.stopPropagation();
        });
        input.addEventListener('blur', () => setTimeout(close, 200));
    },

    _setupColorPickerEvents() {
        const picker = this._colorPickerEl;
        if (!picker) return;
        const self = this;

        // ── Canvas drag (saturation / brightness) ──
        const canvasWrap = picker.querySelector('#ve-cp-canvas-wrap');
        if (canvasWrap) {
            const canvas = picker.querySelector('#ve-cp-canvas');
            let dragging = false;
            const update = (e) => {
                const r = canvas.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
                const y = Math.max(0, Math.min(e.clientY - r.top, r.height));
                self._cpSat = Math.round((x / r.width) * 100);
                self._cpBright = Math.round((1 - y / r.height) * 100);
                self._cpSyncUI();
                self._applyColorFromPicker();
            };
            canvasWrap.addEventListener('mousedown', (e) => { dragging = true; update(e); });
            document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
            document.addEventListener('mouseup', () => { dragging = false; });
        }

        // ── Hue bar drag ──
        const hueWrap = picker.querySelector('#ve-cp-hue-wrap');
        if (hueWrap) {
            let dragging = false;
            const update = (e) => {
                const r = hueWrap.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
                self._cpHue = Math.round((x / r.width) * 360);
                self._cpRenderCanvas();
                self._cpSyncUI();
                self._applyColorFromPicker();
            };
            hueWrap.addEventListener('mousedown', (e) => { dragging = true; update(e); });
            document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
            document.addEventListener('mouseup', () => { dragging = false; });
        }

        // ── Opacity bar drag ──
        const opacityWrap = picker.querySelector('#ve-cp-opacity-wrap');
        if (opacityWrap) {
            let dragging = false;
            const update = (e) => {
                const r = opacityWrap.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
                self._cpAlpha = Math.round((x / r.width) * 100);
                self._cpSyncUI();
                self._applyColorFromPicker();
            };
            opacityWrap.addEventListener('mousedown', (e) => { dragging = true; update(e); });
            document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
            document.addEventListener('mouseup', () => { dragging = false; });
        }

        // ── Hex input ──
        const hexInput = picker.querySelector('#ve-cp-hex');
        if (hexInput) {
            hexInput.addEventListener('change', () => {
                let val = hexInput.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9a-f]{6}$/i.test(val)) {
                    const hsb = self._hexToHSB(val);
                    self._cpHue = hsb.h;
                    self._cpSat = hsb.s;
                    self._cpBright = hsb.b;
                    self._cpRenderCanvas();
                    self._cpSyncUI();
                    self._applyColorFromPicker();
                }
            });
        }

        // ── Eyedropper ──
        const eyedropperBtn = picker.querySelector('#ve-cp-eyedropper');
        if (eyedropperBtn) {
            eyedropperBtn.addEventListener('click', () => {
                self._openEyedropper((hex) => {
                    const hsb = self._hexToHSB(hex);
                    self._cpHue = hsb.h;
                    self._cpSat = hsb.s;
                    self._cpBright = hsb.b;
                    self._cpRenderCanvas();
                    self._cpSyncUI();
                    self._applyColorFromPicker();
                });
            });
        }

        // ── Quick palette colors ──
        picker.querySelectorAll('.ve-cp-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                const hsb = self._hexToHSB(color);
                self._cpHue = hsb.h;
                self._cpSat = hsb.s;
                self._cpBright = hsb.b;
                self._cpRenderCanvas();
                self._cpSyncUI();
                self._applyColorFromPicker();
            });
        });

        // ── Gradient link ──
        const gradientLink = picker.querySelector('#ve-cp-gradient-link');
        if (gradientLink) {
            gradientLink.addEventListener('click', () => {
                const prop = picker.dataset.prop;
                const el = picker._targetEl;
                const iframe = picker._iframe;
                if (el && iframe && prop) {
                    self._hideColorPicker();
                    const fakeSpan = { getBoundingClientRect: () => picker.getBoundingClientRect(), dataset: {}, querySelector: () => null };
                    const currentGrad = `linear-gradient(135deg, ${self._cpGetColor()} 0%, #3b82f6 100%)`;
                    self._openGradientEditor(fakeSpan, prop, currentGrad, el, iframe);
                }
            });
        }

        // ── Apply button ──
        const applyBtn = picker.querySelector('#ve-cp-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                self._applyColorFromPicker();
                self._hideColorPicker();
                self._refreshInspector();
            });
        }

        // ── Reset button ──
        const resetBtn = picker.querySelector('#ve-cp-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const original = picker._originalValue;
                const prop = picker.dataset.prop;
                const el = picker._targetEl;
                const iframe = picker._iframe;
                if (el && prop) {
                    el.style.setProperty(prop, original);
                    self._markDirty(iframe);
                    self._refreshInspector();
                }
                self._hideColorPicker();
            });
        }
    },

    _setupGradientEditorEvents() {
        const editor = this._gradientEditorEl;
        if (!editor) return;

        const applyBtn = editor.querySelector('#ve-ge-apply');
        const resetBtn = editor.querySelector('#ve-ge-reset');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this._hideGradientEditor();
                this._refreshInspector();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const ctx = editor._context;
                if (ctx && ctx.el) {
                    ctx.el.style.setProperty(ctx.prop, ctx.original);
                    this._markDirty(ctx.iframe);
                    this._refreshInspector();
                }
                this._hideGradientEditor();
            });
        }
    },


    // ═════════════════════════════════════════════════════
    //  DOM SERIALIZATION + PERSISTENCE
    // ═════════════════════════════════════════════════════

    /** Serialize iframe DOM to clean HTML (remove injected elements) */
    serializeIframe(iframe) {
        let doc;
        try { doc = iframe.contentDocument; } catch (e) { return null; }
        if (!doc) return null;

        const clone = doc.documentElement.cloneNode(true);

        // Remove injected elements (Inspector, ScreenBackgrounds, DesignStudio, VisualEditor)
        clone.querySelectorAll(
            '[id^="ei-"], [id^="sb-"], [id^="ds-"], [id^="ve-"], ' +
            '[id="bg-inject-style"], .ei-inspecting'
        ).forEach(el => el.remove());

        // Remove inspector class from body
        const body = clone.querySelector('body');
        if (body) body.classList.remove('ei-inspecting');

        return '<!DOCTYPE html>\n' + clone.outerHTML;
    },

    /** Save current screen's DOM back to IndexedDB */
    async saveCurrentScreen() {
        const iframe = ElementInspector.selectedIframe;
        const screenId = ElementInspector.selectedScreenId;
        if (!iframe || !screenId) {
            if (typeof toast === 'function') toast('No screen selected to save');
            return;
        }

        // Find the app for this screen
        const appId = this._getAppIdForScreen(screenId, iframe);
        if (!appId) {
            if (typeof toast === 'function') toast('Can only save custom (IndexedDB) screens');
            return;
        }

        // Check if this is a custom screen
        if (typeof ScreenCreator !== 'undefined' && !ScreenCreator.isCustomScreen(appId, screenId)) {
            if (typeof toast === 'function') toast('Cannot save: this is a file-based screen (read-only)');
            return;
        }

        const html = this.serializeIframe(iframe);
        if (!html) {
            if (typeof toast === 'function') toast('Failed to serialize screen');
            return;
        }

        await ScreenCreator.saveScreen(appId, screenId, html);
        this._dirty = false;

        if (typeof toast === 'function') toast('Screen saved');
    },

    _getAppIdForScreen(screenId, iframe) {
        // Look through canvas slots to find the app for this screen
        const slot = iframe.closest('.ss');
        if (slot) {
            const appCard = slot.closest('[data-app-id]') || null;
            if (appCard) return appCard.dataset.appId;
        }
        // Fallback: check current app
        if (typeof curApp !== 'undefined' && curApp) return curApp.id;
        return null;
    },

    _markDirty(iframe) {
        this._dirty = true;
        // Auto-save with debounce
        if (this._autoSave) {
            clearTimeout(this._saveDebounce);
            this._saveDebounce = setTimeout(() => {
                if (this._dirty) this.saveCurrentScreen();
            }, 3000);
        }
    },


    // ═════════════════════════════════════════════════════
    //  UNDO STACK
    // ═════════════════════════════════════════════════════

    _pushUndo(el, iframe) {
        const screenId = ElementInspector.selectedScreenId;
        if (!screenId) return;
        const key = screenId;
        if (!this._undoStacks.has(key)) this._undoStacks.set(key, []);
        const stack = this._undoStacks.get(key);

        // Save current state of the element
        stack.push({
            selector: ElementInspector._buildSelectorPath(el),
            styleAttr: el.getAttribute('style') || '',
            timestamp: Date.now()
        });

        // Limit stack size
        if (stack.length > this._maxUndo) stack.shift();
    },

    undo() {
        const screenId = ElementInspector.selectedScreenId;
        const iframe = ElementInspector.selectedIframe;
        if (!screenId || !iframe) return;

        const stack = this._undoStacks.get(screenId);
        if (!stack || stack.length === 0) {
            if (typeof toast === 'function') toast('Nothing to undo');
            return;
        }

        const state = stack.pop();
        try {
            const doc = iframe.contentDocument;
            const el = doc.querySelector(state.selector);
            if (el) {
                if (state.styleAttr) {
                    el.setAttribute('style', state.styleAttr);
                } else {
                    el.removeAttribute('style');
                }
                this._markDirty(iframe);
                this._refreshInspector();
                if (typeof toast === 'function') toast('Undone');
            }
        } catch (e) {
            console.warn('Undo failed:', e);
        }
    },


    // ═════════════════════════════════════════════════════
    //  HELPER: Refresh Inspector panel after edit
    // ═════════════════════════════════════════════════════

    _refreshInspector() {
        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        const screenId = ElementInspector.selectedScreenId;
        if (el && iframe && screenId) {
            ElementInspector.showPanel(el, iframe, screenId);
        }
    },


    // ═════════════════════════════════════════════════════
    //  VALUE PARSING UTILITIES
    // ═════════════════════════════════════════════════════

    _isColorValue(val) {
        if (!val || typeof val !== 'string') return false;
        return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(val.trim());
    },

    _isGradientValue(val) {
        if (!val || typeof val !== 'string') return false;
        return /^(linear|radial|conic)-gradient\(/i.test(val.trim());
    },

    _isNumericValue(val) {
        if (!val || typeof val !== 'string') return false;
        return /^-?[\d.]+\s*(px|em|rem|%|vh|vw|pt|cm|mm|in|ch|ex|vmin|vmax|deg|s|ms)?$/.test(val.trim());
    },

    _parseNumericValue(val) {
        const match = val.trim().match(/^(-?[\d.]+)\s*(px|em|rem|%|vh|vw|pt|cm|mm|in|ch|ex|vmin|vmax|deg|s|ms)?$/);
        if (match) {
            return { number: parseFloat(match[1]), unit: match[2] || '' };
        }
        return { number: parseFloat(val), unit: '' };
    },

    _toHex(val) {
        if (!val || typeof val !== 'string') return '#000000';
        val = val.trim();
        // Already hex
        if (/^#[0-9a-f]{6}$/i.test(val)) return val;
        if (/^#[0-9a-f]{3}$/i.test(val)) {
            return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
        }
        // rgb/rgba
        const match = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return '#' + r + g + b;
        }
        return '#000000';
    },

    _parseAlpha(val) {
        if (!val || typeof val !== 'string') return 1;
        const match = val.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
        return match ? parseFloat(match[1]) : 1;
    },

    _parseGradient(val) {
        const result = { type: 'linear', angle: 135, stops: [] };
        if (!val || typeof val !== 'string') return result;

        if (val.startsWith('radial')) result.type = 'radial';

        // Parse angle
        const angleMatch = val.match(/(\d+)deg/);
        if (angleMatch) result.angle = parseInt(angleMatch[1]);

        // Parse color stops
        const stopPattern = /(#[0-9a-f]{3,8}|rgba?\([^)]+\))\s*(\d+)?%?/gi;
        let match;
        let pos = 0;
        while ((match = stopPattern.exec(val)) !== null) {
            result.stops.push({
                color: match[1],
                position: match[2] ? parseInt(match[2]) : pos
            });
            pos += Math.round(100 / 3);
        }

        // Ensure at least 2 stops
        if (result.stops.length < 2) {
            result.stops = [
                { color: '#7c3aed', position: 0 },
                { color: '#3b82f6', position: 100 }
            ];
        }

        return result;
    },

    _buildGradientCSS(g) {
        const stops = g.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        if (g.type === 'radial') {
            return `radial-gradient(circle, ${stops})`;
        }
        if (g.type === 'conic') {
            return `conic-gradient(from ${g.angle}deg, ${stops})`;
        }
        return `linear-gradient(${g.angle}deg, ${stops})`;
    },


    // ═════════════════════════════════════════════════════
    //  ADVANCED COLOR PICKER (Solid + Gradient + Image tabs)
    // ═════════════════════════════════════════════════════

    _openAdvancedColorPicker(span, prop, currentValue, el, iframe) {
        const picker = this._colorPickerEl;
        if (!picker) { this._openColorPicker(span, prop, currentValue, el, iframe); return; }

        // Detect if current value is gradient
        if (this._isGradientValue(currentValue)) {
            this._openGradientEditor(span, prop, currentValue, el, iframe);
        } else {
            this._openColorPicker(span, prop, currentValue, el, iframe);
        }
    },

    /** Use ScreenBackgrounds' gradient builder inline for an element property */
    _useGradientBuilder(el, iframe, prop, onGradientChange) {
        if (typeof ScreenBackgrounds === 'undefined') return;
        // Build gradient CSS from ScreenBackgrounds state
        const type = ScreenBackgrounds._gradientType || 'linear';
        const angle = ScreenBackgrounds._gradientAngle || 135;
        const stops = ScreenBackgrounds._gradientStops || [];
        const gradient = { type, angle, stops: stops.map(s => ({ color: s.color, position: s.position })) };
        const css = this._buildGradientCSS(gradient);
        if (onGradientChange) onGradientChange(css);
    },

    /** Open eyedropper (EyeDropper API, supported in Chrome) */
    _openEyedropper(callback) {
        if (!window.EyeDropper) {
            if (typeof toast === 'function') toast('EyeDropper not supported in this browser');
            return;
        }
        const dropper = new EyeDropper();
        dropper.open().then(result => {
            if (callback) callback(result.sRGBHex);
        }).catch(() => {});
    },


    // ═════════════════════════════════════════════════════
    //  IMAGE BACKGROUND PICKER (for individual elements)
    // ═════════════════════════════════════════════════════

    _openImageBgPicker() {
        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        if (!el || !iframe) { if (typeof toast === 'function') toast('Select an element first'); return; }

        const picker = document.getElementById('ve-imgbg-picker');
        if (!picker) return;

        // Position near toolbar
        if (this._toolbarEl) {
            const tbRect = this._toolbarEl.getBoundingClientRect();
            picker.style.left = Math.max(8, Math.min(tbRect.left, window.innerWidth - 330)) + 'px';
            picker.style.top = Math.max(52, tbRect.bottom + 4) + 'px';
        }

        // Populate grid with IMAGE_BACKGROUNDS data
        const grid = document.getElementById('ve-imgbg-grid');
        if (!grid) return;

        const images = typeof IMAGE_BACKGROUNDS !== 'undefined' ? IMAGE_BACKGROUNDS : [];
        this._renderImageBgGrid(grid, images, '');
        picker.classList.add('open');

        // Wire search
        const search = document.getElementById('ve-imgbg-search');
        if (search) {
            search.value = '';
            search.oninput = () => {
                this._renderImageBgGrid(grid, images, search.value.toLowerCase());
            };
        }

        // Wire clear button
        const clearBtn = document.getElementById('ve-imgbg-clear');
        if (clearBtn) {
            clearBtn.onclick = () => {
                this._pushUndo(el, iframe);
                el.style.backgroundImage = '';
                el.style.backgroundSize = '';
                el.style.backgroundPosition = '';
                this._markDirty(iframe);
                this._refreshInspector();
                picker.classList.remove('open');
                if (typeof toast === 'function') toast('Image background cleared');
            };
        }
    },

    _renderImageBgGrid(grid, images, filter) {
        const el = ElementInspector.selectedEl;
        const iframe = ElementInspector.selectedIframe;
        const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');

        let filtered = images;
        if (filter) {
            filtered = images.filter(img =>
                (img.name || '').toLowerCase().includes(filter) ||
                (img.category || '').toLowerCase().includes(filter) ||
                (img.tags || []).some(t => t.toLowerCase().includes(filter))
            );
        }

        grid.innerHTML = filtered.slice(0, 40).map(img => {
            const thumbPath = img.thumbnail || img.path || '';
            const fullPath = img.path || '';
            return `<div class="ve-imgbg-thumb" data-path="${fullPath}" title="${img.name || ''}" style="background-image:url('${thumbPath}')"></div>`;
        }).join('');

        // Wire clicks
        grid.querySelectorAll('.ve-imgbg-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                if (!el || !iframe) return;
                const path = thumb.dataset.path;
                const absolutePath = path.startsWith('http') || path.startsWith('data:') ? path : new URL(path, baseUrl).href;
                this._pushUndo(el, iframe);
                el.style.backgroundImage = `url('${absolutePath}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                this._markDirty(iframe);
                this._refreshInspector();
                document.getElementById('ve-imgbg-picker')?.classList.remove('open');
                if (typeof toast === 'function') toast('Image background applied');
            });
        });
    }
};
