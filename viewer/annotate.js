// ═══════════════════════════════════════════════════════
// ANNOTATION CANVAS — SVG Drawing Engine
// Ported from gallery.html for tool consistency
// Tools: select, rect, highlight, ellipse, callout,
//        arrow, line, freehand, text
// ═══════════════════════════════════════════════════════

const AnnotationCanvas = {
    active: false,
    shapes: [],
    selectedId: null,
    tool: 'select',
    color: '#ef4444',
    strokeWidth: 3,
    STROKE_WIDTHS: [2, 3, 5],
    undoStack: [],
    redoStack: [],
    maxUndo: 20,
    isDrawing: false,
    drawStart: null,
    drawCurrent: null,
    freehandPoints: [],
    isDragging: false,
    _dragStarted: false,
    isResizing: false,
    resizeHandle: null,
    dragOffset: null,
    zoom: 1,
    labelInput: null,
    _rafId: null,
    _pendingMouseEvent: null,
    _shapesListOpen: false,
    _currentScreen: null,

    COLORS: {
        '#ef4444': { name: 'red', meaning: 'change needed' },
        '#22c55e': { name: 'green', meaning: 'keep as-is' },
        '#3b82f6': { name: 'blue', meaning: 'reference' },
        '#f59e0b': { name: 'amber', meaning: 'attention' },
        '#8b5cf6': { name: 'purple', meaning: 'custom' }
    },

    init() {
        this.wrapper = document.getElementById('ann-canvas-wrapper');
        this.svg = document.getElementById('ann-svg');
        this.imgEl = document.getElementById('ann-bg-img');
        this.inner = document.getElementById('ann-inner');
        if (!this.wrapper || !this.svg) return;
        this.initMarkers();
        this.bindEvents();
    },

    initMarkers() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.setAttribute('id', 'ann-marker-defs');
        Object.keys(this.COLORS).forEach(c => {
            const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            m.setAttribute('id', 'arrow-' + c.slice(1));
            m.setAttribute('viewBox', '0 0 10 10');
            m.setAttribute('refX', '9'); m.setAttribute('refY', '5');
            m.setAttribute('markerWidth', '8'); m.setAttribute('markerHeight', '8');
            m.setAttribute('orient', 'auto-start-reverse');
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
            p.setAttribute('fill', c);
            m.appendChild(p); defs.appendChild(m);
        });
        this.svg.appendChild(defs);
    },

    // ── Enter annotation mode for a screen ──
    enter(screenId) {
        if (!window.curApp) return;
        this.active = true;
        this._currentScreen = screenId;
        // Load saved shapes for this screen
        const k = `ann-shapes-${window.curApp.id}-${screenId}`;
        try { this.shapes = JSON.parse(localStorage.getItem(k) || '[]'); } catch { this.shapes = []; }
        this.selectedId = null;
        this.undoStack = [];
        this.redoStack = [];
        this.zoom = 1;
        this.tool = 'select';

        // Capture screenshot from iframe
        const slot = document.querySelector(`.ss[data-scr="${screenId}"]`);
        const iframe = slot?.querySelector('iframe');
        if (!iframe) { toast('Cannot annotate: no iframe found'); this.active = false; return; }

        // Use iframe src as background (we'll display it via iframe inside the annotation overlay)
        const src = iframe.src;
        this.imgEl.src = src;
        this.imgEl.style.display = 'none'; // Hide the img, we use the iframe clone

        // Create an iframe clone for the annotation background
        let bgIframe = this.inner.querySelector('.ann-bg-iframe');
        if (bgIframe) bgIframe.remove();
        bgIframe = document.createElement('iframe');
        bgIframe.className = 'ann-bg-iframe';
        bgIframe.src = src;
        bgIframe.style.cssText = 'width:375px;height:812px;border:none;border-radius:0;pointer-events:none;display:block;';
        bgIframe.sandbox = 'allow-scripts';
        this.inner.insertBefore(bgIframe, this.svg);

        // Set SVG viewport to match phone screen
        this.svg.setAttribute('viewBox', '0 0 375 812');
        this.svg.style.width = '375px';
        this.svg.style.height = '812px';

        this.wrapper.classList.add('active');
        this.inner.style.transform = '';
        this.updateZoomInfo();
        this.renderAll();
        this.updateToolbar();
        this.updatePropertiesBar();
    },

    exit() {
        if (!this.active) return;
        this.active = false;
        this.hideLabelInput();
        this.saveShapes();
        this.wrapper.classList.remove('active');
        document.getElementById('ann-properties-bar')?.classList.remove('visible');
        document.getElementById('ann-shapes-panel')?.classList.remove('open');
        this._shapesListOpen = false;
        // Remove bg iframe
        const bgIframe = this.inner?.querySelector('.ann-bg-iframe');
        if (bgIframe) bgIframe.remove();
    },

    saveShapes() {
        if (!window.curApp || !this._currentScreen) return;
        const k = `ann-shapes-${window.curApp.id}-${this._currentScreen}`;
        localStorage.setItem(k, JSON.stringify(this.shapes));
    },

    pushUndo() {
        this.undoStack.push(JSON.stringify(this.shapes));
        if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
        this.redoStack = [];
    },

    undo() {
        if (this.undoStack.length === 0) { toast('Nothing to undo'); return; }
        this.redoStack.push(JSON.stringify(this.shapes));
        this.shapes = JSON.parse(this.undoStack.pop());
        this.selectedId = null;
        this.renderAll();
        this.updatePropertiesBar();
        this.saveShapes();
    },

    redo() {
        if (this.redoStack.length === 0) { toast('Nothing to redo'); return; }
        this.undoStack.push(JSON.stringify(this.shapes));
        this.shapes = JSON.parse(this.redoStack.pop());
        this.selectedId = null;
        this.renderAll();
        this.updatePropertiesBar();
        this.saveShapes();
    },

    // ── SVG rendering ──
    renderAll(skipListUpdate = false) {
        const defsEl = this.svg.querySelector('#ann-marker-defs');
        while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
        if (defsEl) this.svg.appendChild(defsEl);

        this.shapes.forEach(s => this.renderShape(s));
        if (this.selectedId) {
            const sel = this.shapes.find(s => s.id === this.selectedId);
            if (sel) this.renderSelectionHandles(sel);
        }
        if (!skipListUpdate) this.updateAnnotationList();
    },

    renderShape(shape) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-id', shape.id);
        g.classList.add('ann-svg-shape');
        if (shape.id === this.selectedId) g.classList.add('selected');

        let el;
        switch (shape.type) {
            case 'rect':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                el.setAttribute('x', shape.x); el.setAttribute('y', shape.y);
                el.setAttribute('width', shape.width); el.setAttribute('height', shape.height);
                el.setAttribute('fill', 'none'); el.setAttribute('stroke', shape.color);
                el.setAttribute('stroke-width', shape.strokeWidth); el.setAttribute('rx', '4');
                break;
            case 'highlight':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                el.setAttribute('x', shape.x); el.setAttribute('y', shape.y);
                el.setAttribute('width', shape.width); el.setAttribute('height', shape.height);
                el.setAttribute('fill', shape.color);
                el.setAttribute('fill-opacity', shape.fillOpacity ?? 0.3);
                el.setAttribute('stroke', 'none'); el.setAttribute('rx', '4');
                break;
            case 'ellipse':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                el.setAttribute('cx', shape.x + shape.width / 2);
                el.setAttribute('cy', shape.y + shape.height / 2);
                el.setAttribute('rx', Math.abs(shape.width / 2));
                el.setAttribute('ry', Math.abs(shape.height / 2));
                el.setAttribute('fill', 'none'); el.setAttribute('stroke', shape.color);
                el.setAttribute('stroke-width', shape.strokeWidth);
                break;
            case 'callout': {
                const cx = shape.x + shape.width / 2, cy = shape.y + shape.height / 2;
                const r = Math.max(12, Math.min(shape.width, shape.height) / 2);
                el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
                el.setAttribute('fill', shape.color); el.setAttribute('stroke', '#fff');
                el.setAttribute('stroke-width', 2);
                el.classList.add('ann-callout-circle');
                g.appendChild(el);
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', cx); txt.setAttribute('y', cy);
                txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('dominant-baseline', 'central');
                txt.setAttribute('fill', '#fff'); txt.setAttribute('font-size', Math.max(10, r));
                txt.setAttribute('font-weight', '700');
                txt.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
                txt.classList.add('ann-callout-text');
                txt.textContent = shape.calloutNumber || '?';
                g.appendChild(txt);
                el = null;
                break;
            }
            case 'arrow':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                el.setAttribute('x1', shape.x); el.setAttribute('y1', shape.y);
                el.setAttribute('x2', shape.x2); el.setAttribute('y2', shape.y2);
                el.setAttribute('stroke', shape.color);
                el.setAttribute('stroke-width', shape.strokeWidth);
                el.setAttribute('marker-end', `url(#arrow-${shape.color.slice(1)})`);
                break;
            case 'line':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                el.setAttribute('x1', shape.x); el.setAttribute('y1', shape.y);
                el.setAttribute('x2', shape.x2); el.setAttribute('y2', shape.y2);
                el.setAttribute('stroke', shape.color);
                el.setAttribute('stroke-width', shape.strokeWidth);
                break;
            case 'freehand':
                el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                if (shape.points && shape.points.length > 1) {
                    let d = `M ${shape.points[0][0]} ${shape.points[0][1]}`;
                    for (let i = 1; i < shape.points.length; i++) {
                        d += ` L ${shape.points[i][0]} ${shape.points[i][1]}`;
                    }
                    el.setAttribute('d', d);
                }
                el.setAttribute('fill', 'none'); el.setAttribute('stroke', shape.color);
                el.setAttribute('stroke-width', shape.strokeWidth);
                el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round');
                break;
            case 'text': {
                const fs = shape.fontSize || 16;
                const textW = (shape.text || '').length * fs * 0.6;
                const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bg.setAttribute('x', shape.x - 4); bg.setAttribute('y', shape.y - fs);
                bg.setAttribute('width', textW + 8); bg.setAttribute('height', fs * 1.3 + 4);
                bg.setAttribute('fill', 'rgba(0,0,0,0.7)'); bg.setAttribute('rx', '3');
                g.appendChild(bg);
                el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                el.setAttribute('x', shape.x); el.setAttribute('y', shape.y);
                el.setAttribute('fill', shape.color); el.setAttribute('font-size', fs);
                el.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
                el.setAttribute('font-weight', '600');
                el.textContent = shape.text || '';
                break;
            }
        }

        if (el) g.appendChild(el);

        // Label
        if (shape.label && shape.type !== 'text' && shape.type !== 'callout') {
            const lx = (shape.type === 'arrow' || shape.type === 'line') ? (shape.x + shape.x2) / 2 : shape.x;
            const ly = (shape.type === 'arrow' || shape.type === 'line') ? (shape.y + shape.y2) / 2 - 10 : shape.y - 10;
            const fs = 14;
            const lbg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            lbg.setAttribute('x', lx - 3); lbg.setAttribute('y', ly - fs);
            lbg.setAttribute('width', shape.label.length * fs * 0.55 + 6);
            lbg.setAttribute('height', fs + 6);
            lbg.setAttribute('fill', 'rgba(0,0,0,0.75)'); lbg.setAttribute('rx', '3');
            g.appendChild(lbg);
            const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lbl.setAttribute('x', lx); lbl.setAttribute('y', ly);
            lbl.setAttribute('fill', '#fff'); lbl.setAttribute('font-size', fs);
            lbl.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
            lbl.textContent = shape.label;
            g.appendChild(lbl);
        }

        this.svg.appendChild(g);
    },

    renderSelectionHandles(shape) {
        if (shape.type === 'freehand') return;
        const bounds = this.getShapeBounds(shape);
        if (!bounds) return;

        const hs = Math.max(6, 8 / this.zoom);
        let handles;
        if (shape.type === 'arrow' || shape.type === 'line') {
            handles = [
                { id: 'start', x: shape.x, y: shape.y },
                { id: 'end', x: shape.x2, y: shape.y2 }
            ];
        } else {
            handles = [
                { id: 'nw', x: bounds.x, y: bounds.y },
                { id: 'ne', x: bounds.x + bounds.w, y: bounds.y },
                { id: 'sw', x: bounds.x, y: bounds.y + bounds.h },
                { id: 'se', x: bounds.x + bounds.w, y: bounds.y + bounds.h }
            ];
        }

        handles.forEach(h => {
            const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            r.setAttribute('x', h.x - hs / 2); r.setAttribute('y', h.y - hs / 2);
            r.setAttribute('width', hs); r.setAttribute('height', hs);
            r.setAttribute('fill', '#fff'); r.setAttribute('stroke', '#818cf8');
            r.setAttribute('stroke-width', 1.5); r.classList.add('ann-resize-handle');
            r.dataset.handle = h.id;
            this.svg.appendChild(r);
        });
    },

    getShapeBounds(shape) {
        switch (shape.type) {
            case 'rect': case 'ellipse': case 'highlight': case 'callout':
                return { x: shape.x, y: shape.y, w: shape.width, h: shape.height };
            case 'arrow': case 'line':
                return {
                    x: Math.min(shape.x, shape.x2), y: Math.min(shape.y, shape.y2),
                    w: Math.abs(shape.x2 - shape.x), h: Math.abs(shape.y2 - shape.y)
                };
            case 'text':
                return {
                    x: shape.x, y: shape.y - (shape.fontSize || 16),
                    w: (shape.text || '').length * 10, h: (shape.fontSize || 16) * 1.3
                };
            case 'freehand': {
                if (!shape.points || !shape.points.length) return null;
                let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
                shape.points.forEach(([px, py]) => {
                    mnX = Math.min(mnX, px); mnY = Math.min(mnY, py);
                    mxX = Math.max(mxX, px); mxY = Math.max(mxY, py);
                });
                return { x: mnX, y: mnY, w: mxX - mnX, h: mxY - mnY };
            }
            default: return null;
        }
    },

    // ── Coordinates ──
    screenToSVG(clientX, clientY) {
        const rect = this.svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        const vb = this.svg.viewBox.baseVal;
        return {
            x: (clientX - rect.left) * (vb.width / rect.width),
            y: (clientY - rect.top) * (vb.height / rect.height)
        };
    },

    // ── Events ──
    bindEvents() {
        this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.svg.addEventListener('dblclick', (e) => this.onDblClick(e));

        // Touch
        const touchToMouse = (type) => (e) => {
            if (!this.active) return;
            if (e.touches.length > 1) {
                if (type === 'touchmove' && this._lastTouchDist != null) {
                    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                    const scale = d / this._lastTouchDist;
                    this.zoom = Math.max(0.25, Math.min(5, this.zoom * scale));
                    this.inner.style.transform = `scale(${this.zoom})`;
                    this.updateZoomInfo();
                    this._lastTouchDist = d;
                }
                if (type === 'touchstart') {
                    this._lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                }
                e.preventDefault(); return;
            }
            this._lastTouchDist = null;
            const touch = e.touches[0] || e.changedTouches[0];
            const mouseEvent = new MouseEvent({
                touchstart: 'mousedown', touchmove: 'mousemove', touchend: 'mouseup'
            }[type], { clientX: touch.clientX, clientY: touch.clientY, bubbles: true, cancelable: true });
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target) target.dispatchEvent(mouseEvent);
            e.preventDefault();
        };
        this.svg.addEventListener('touchstart', touchToMouse('touchstart'), { passive: false });
        this.svg.addEventListener('touchmove', touchToMouse('touchmove'), { passive: false });
        this.svg.addEventListener('touchend', touchToMouse('touchend'), { passive: false });

        // Zoom wheel
        this.wrapper.querySelector('.ann-canvas-area').addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.25, Math.min(5, this.zoom * delta));
            this.inner.style.transform = `scale(${this.zoom})`;
            this.updateZoomInfo();
        }, { passive: false });

        // Toolbar buttons
        document.getElementById('ann-toolbar').addEventListener('click', (e) => {
            const toolBtn = e.target.closest('.ann-tool-btn');
            if (toolBtn && toolBtn.dataset.tool) { this.setTool(toolBtn.dataset.tool); return; }
            const colorBtn = e.target.closest('.ann-color-btn');
            if (colorBtn) { this.setColor(colorBtn.dataset.color); return; }
            const strokeBtn = e.target.closest('.ann-stroke-btn');
            if (strokeBtn) { this.setStrokeWidth(parseInt(strokeBtn.dataset.sw)); return; }
        });

        document.getElementById('ann-btn-undo')?.addEventListener('click', () => this.undo());
        document.getElementById('ann-btn-redo')?.addEventListener('click', () => this.redo());
        document.getElementById('ann-btn-delete')?.addEventListener('click', () => this.deleteSelected());
        document.getElementById('ann-btn-exit')?.addEventListener('click', () => this.exit());
        document.getElementById('ann-btn-export-png')?.addEventListener('click', () => this.exportFlattenedPNG());
        document.getElementById('ann-btn-export-json')?.addEventListener('click', () => this.exportStructuredJSON());
        document.getElementById('ann-btn-list-toggle')?.addEventListener('click', () => this.toggleShapesList());

        // Properties bar
        document.getElementById('ann-intent-select')?.addEventListener('change', (e) => {
            const shape = this.selectedId ? this.shapes.find(s => s.id === this.selectedId) : null;
            if (shape) { shape.intent = e.target.value || null; this.saveShapes(); }
        });
        document.getElementById('ann-severity-select')?.addEventListener('change', (e) => {
            const shape = this.selectedId ? this.shapes.find(s => s.id === this.selectedId) : null;
            if (shape) { shape.severity = e.target.value || null; this.saveShapes(); }
        });

        // Keyboard shortcuts for annotation mode
        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            const tag = document.activeElement?.tagName;
            if (['INPUT', 'TEXTAREA'].includes(tag)) return;

            if (e.key === 'Escape') { this.exit(); e.stopPropagation(); return; }
            if (e.key === 'Delete' || e.key === 'Backspace') { this.deleteSelected(); e.stopPropagation(); return; }
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); return; }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this.redo(); return; }
            if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); this.duplicateSelected(); return; }
            if (e.key === 'v' || e.key === 'V') { this.setTool('select'); return; }
            if (e.key === 'r' || e.key === 'R') { this.setTool('rect'); return; }
            if (e.key === 'h' || e.key === 'H') { this.setTool('highlight'); return; }
            if (e.key === 'e' || e.key === 'E') { this.setTool('ellipse'); return; }
            if (e.key === 'c' || e.key === 'C') { this.setTool('callout'); return; }
            if (e.key === 'a' || e.key === 'A') { this.setTool('arrow'); return; }
            if (e.key === 'l' || e.key === 'L') { this.setTool('line'); return; }
            if (e.key === 'd' || e.key === 'D') { this.setTool('freehand'); return; }
            if (e.key === 't' || e.key === 'T') { this.setTool('text'); return; }
            if (e.key === '1') { this.setColor('#ef4444'); return; }
            if (e.key === '2') { this.setColor('#22c55e'); return; }
            if (e.key === '3') { this.setColor('#3b82f6'); return; }
            if (e.key === '4') { this.setColor('#f59e0b'); return; }
            if (e.key === '5') { this.setColor('#8b5cf6'); return; }
            if (e.key === '[') { this.cycleStrokeWidth(-1); return; }
            if (e.key === ']') { this.cycleStrokeWidth(1); return; }
            if (e.key === '+' || e.key === '=') {
                this.zoom = Math.min(5, this.zoom * 1.2);
                this.inner.style.transform = `scale(${this.zoom})`;
                this.updateZoomInfo(); return;
            }
            if (e.key === '-') {
                this.zoom = Math.max(0.25, this.zoom / 1.2);
                this.inner.style.transform = `scale(${this.zoom})`;
                this.updateZoomInfo(); return;
            }
            if (e.key === '0') {
                this.zoom = 1;
                this.inner.style.transform = '';
                this.updateZoomInfo(); return;
            }
        });
    },

    updateZoomInfo() {
        const el = document.getElementById('ann-zoom-info');
        if (el) el.textContent = Math.round(this.zoom * 100) + '%';
    },

    onMouseDown(e) {
        if (!this.active) return;
        const pt = this.screenToSVG(e.clientX, e.clientY);

        const handleEl = e.target.closest('.ann-resize-handle');
        if (handleEl && this.selectedId) {
            this.pushUndo();
            this.isResizing = true;
            this.resizeHandle = handleEl.dataset.handle;
            this.drawStart = pt;
            e.preventDefault(); return;
        }

        if (this.tool === 'select') {
            const shapeEl = e.target.closest('.ann-svg-shape');
            if (shapeEl) {
                this.selectedId = shapeEl.dataset.id;
                this._dragStarted = false;
                this.isDragging = true;
                this.dragOffset = pt;
                this.renderAll();
                this.updatePropertiesBar();
            } else {
                this.selectedId = null;
                this.renderAll();
                this.updatePropertiesBar();
            }
        } else if (['rect', 'ellipse', 'arrow', 'highlight', 'callout', 'line'].includes(this.tool)) {
            this.isDrawing = true;
            this.drawStart = pt;
            this.drawCurrent = pt;
            this.pushUndo();
        } else if (this.tool === 'freehand') {
            this.isDrawing = true;
            this.freehandPoints = [[pt.x, pt.y]];
            this.pushUndo();
        } else if (this.tool === 'text') {
            this.pushUndo();
            this.placeText(pt);
        }
        e.preventDefault();
    },

    onMouseMove(e) {
        if (!this.active) return;
        this._pendingMouseEvent = e;
        if (!this._rafId) {
            this._rafId = requestAnimationFrame(() => {
                this._rafId = null;
                const ev = this._pendingMouseEvent;
                if (!ev) return;
                const pt = this.screenToSVG(ev.clientX, ev.clientY);

                if (this.isResizing && this.selectedId) { this.handleResize(pt); return; }
                if (this.isDragging && this.selectedId) { this.handleDrag(pt); return; }

                if (this.isDrawing) {
                    this.drawCurrent = pt;
                    if (this.tool === 'freehand') this.freehandPoints.push([pt.x, pt.y]);
                    this.renderDrawPreview();
                }
            });
        }
    },

    onMouseUp(e) {
        if (!this.active) return;
        if (this.isResizing) {
            this.isResizing = false; this.resizeHandle = null;
            this.renderAll();
            this.saveShapes(); return;
        }
        if (this.isDragging) {
            this.isDragging = false; this.dragOffset = null;
            this._dragStarted = false;
            this.renderAll();
            this.saveShapes(); return;
        }
        if (this.isDrawing) {
            this.isDrawing = false;
            this.finalizeShape();
        }
    },

    onDblClick(e) {
        const shapeEl = e.target.closest('.ann-svg-shape');
        if (!shapeEl) return;
        const shape = this.shapes.find(s => s.id === shapeEl.dataset.id);
        if (!shape) return;
        this.selectedId = shape.id;
        this.showLabelInput(shape, shape.type === 'text');
    },

    // ── Draw preview ──
    renderDrawPreview() {
        const existing = this.svg.querySelector('.ann-draw-preview');
        if (existing) existing.remove();
        if (!this.drawStart && this.tool !== 'freehand') return;

        let el;
        if (this.tool === 'rect') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            el.setAttribute('x', Math.min(this.drawStart.x, this.drawCurrent.x));
            el.setAttribute('y', Math.min(this.drawStart.y, this.drawCurrent.y));
            el.setAttribute('width', Math.abs(this.drawCurrent.x - this.drawStart.x));
            el.setAttribute('height', Math.abs(this.drawCurrent.y - this.drawStart.y));
            el.setAttribute('fill', 'none'); el.setAttribute('stroke', this.color);
            el.setAttribute('stroke-width', this.strokeWidth);
            el.setAttribute('stroke-dasharray', '8 4'); el.setAttribute('rx', '4');
        } else if (this.tool === 'highlight') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            el.setAttribute('x', Math.min(this.drawStart.x, this.drawCurrent.x));
            el.setAttribute('y', Math.min(this.drawStart.y, this.drawCurrent.y));
            el.setAttribute('width', Math.abs(this.drawCurrent.x - this.drawStart.x));
            el.setAttribute('height', Math.abs(this.drawCurrent.y - this.drawStart.y));
            el.setAttribute('fill', this.color); el.setAttribute('fill-opacity', '0.2');
            el.setAttribute('stroke', this.color); el.setAttribute('stroke-width', '1');
            el.setAttribute('stroke-dasharray', '8 4'); el.setAttribute('rx', '4');
        } else if (this.tool === 'ellipse') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            el.setAttribute('cx', (this.drawStart.x + this.drawCurrent.x) / 2);
            el.setAttribute('cy', (this.drawStart.y + this.drawCurrent.y) / 2);
            el.setAttribute('rx', Math.abs(this.drawCurrent.x - this.drawStart.x) / 2);
            el.setAttribute('ry', Math.abs(this.drawCurrent.y - this.drawStart.y) / 2);
            el.setAttribute('fill', 'none'); el.setAttribute('stroke', this.color);
            el.setAttribute('stroke-width', this.strokeWidth); el.setAttribute('stroke-dasharray', '8 4');
        } else if (this.tool === 'callout') {
            const cx = (this.drawStart.x + this.drawCurrent.x) / 2;
            const cy = (this.drawStart.y + this.drawCurrent.y) / 2;
            const r = Math.max(12, Math.min(Math.abs(this.drawCurrent.x - this.drawStart.x), Math.abs(this.drawCurrent.y - this.drawStart.y)) / 2);
            el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
            el.setAttribute('fill', this.color); el.setAttribute('fill-opacity', '0.5');
            el.setAttribute('stroke', '#fff'); el.setAttribute('stroke-width', '2');
            el.setAttribute('stroke-dasharray', '4 2');
        } else if (this.tool === 'arrow') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            el.setAttribute('x1', this.drawStart.x); el.setAttribute('y1', this.drawStart.y);
            el.setAttribute('x2', this.drawCurrent.x); el.setAttribute('y2', this.drawCurrent.y);
            el.setAttribute('stroke', this.color); el.setAttribute('stroke-width', this.strokeWidth);
            el.setAttribute('stroke-dasharray', '8 4');
            el.setAttribute('marker-end', `url(#arrow-${this.color.slice(1)})`);
        } else if (this.tool === 'line') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            el.setAttribute('x1', this.drawStart.x); el.setAttribute('y1', this.drawStart.y);
            el.setAttribute('x2', this.drawCurrent.x); el.setAttribute('y2', this.drawCurrent.y);
            el.setAttribute('stroke', this.color); el.setAttribute('stroke-width', this.strokeWidth);
            el.setAttribute('stroke-dasharray', '8 4');
        } else if (this.tool === 'freehand' && this.freehandPoints.length > 1) {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = `M ${this.freehandPoints[0][0]} ${this.freehandPoints[0][1]}`;
            for (let i = 1; i < this.freehandPoints.length; i++) {
                d += ` L ${this.freehandPoints[i][0]} ${this.freehandPoints[i][1]}`;
            }
            el.setAttribute('d', d); el.setAttribute('fill', 'none');
            el.setAttribute('stroke', this.color); el.setAttribute('stroke-width', this.strokeWidth);
            el.setAttribute('stroke-linecap', 'round'); el.setAttribute('opacity', '0.7');
        }

        if (el) { el.classList.add('ann-draw-preview'); this.svg.appendChild(el); }
    },

    finalizeShape() {
        const existing = this.svg.querySelector('.ann-draw-preview');
        if (existing) existing.remove();

        const id = 'ann-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        let shape;

        if (this.tool === 'rect') {
            const x = Math.min(this.drawStart.x, this.drawCurrent.x);
            const y = Math.min(this.drawStart.y, this.drawCurrent.y);
            const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
            const h = Math.abs(this.drawCurrent.y - this.drawStart.y);
            if (w < 5 || h < 5) return;
            shape = { id, type: 'rect', x, y, width: w, height: h, color: this.color, strokeWidth: this.strokeWidth, label: '' };
        } else if (this.tool === 'highlight') {
            const x = Math.min(this.drawStart.x, this.drawCurrent.x);
            const y = Math.min(this.drawStart.y, this.drawCurrent.y);
            const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
            const h = Math.abs(this.drawCurrent.y - this.drawStart.y);
            if (w < 5 || h < 5) return;
            shape = { id, type: 'highlight', x, y, width: w, height: h, color: this.color, fillOpacity: 0.3, strokeWidth: 0, label: '' };
        } else if (this.tool === 'ellipse') {
            const x = Math.min(this.drawStart.x, this.drawCurrent.x);
            const y = Math.min(this.drawStart.y, this.drawCurrent.y);
            const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
            const h = Math.abs(this.drawCurrent.y - this.drawStart.y);
            if (w < 5 || h < 5) return;
            shape = { id, type: 'ellipse', x, y, width: w, height: h, color: this.color, strokeWidth: this.strokeWidth, label: '' };
        } else if (this.tool === 'callout') {
            const x = Math.min(this.drawStart.x, this.drawCurrent.x);
            const y = Math.min(this.drawStart.y, this.drawCurrent.y);
            const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
            const h = Math.abs(this.drawCurrent.y - this.drawStart.y);
            if (w < 10 || h < 10) return;
            shape = { id, type: 'callout', x, y, width: w, height: h, color: this.color, strokeWidth: 2, calloutNumber: this.getNextCalloutNumber(), label: '' };
        } else if (this.tool === 'arrow') {
            const dx = this.drawCurrent.x - this.drawStart.x;
            const dy = this.drawCurrent.y - this.drawStart.y;
            if (Math.sqrt(dx * dx + dy * dy) < 10) return;
            shape = { id, type: 'arrow', x: this.drawStart.x, y: this.drawStart.y, x2: this.drawCurrent.x, y2: this.drawCurrent.y, color: this.color, strokeWidth: this.strokeWidth, label: '' };
        } else if (this.tool === 'line') {
            const dx = this.drawCurrent.x - this.drawStart.x;
            const dy = this.drawCurrent.y - this.drawStart.y;
            if (Math.sqrt(dx * dx + dy * dy) < 10) return;
            shape = { id, type: 'line', x: this.drawStart.x, y: this.drawStart.y, x2: this.drawCurrent.x, y2: this.drawCurrent.y, color: this.color, strokeWidth: this.strokeWidth, label: '' };
        } else if (this.tool === 'freehand') {
            if (this.freehandPoints.length < 3) return;
            shape = { id, type: 'freehand', points: this.simplifyPath(this.freehandPoints, 2), color: this.color, strokeWidth: this.strokeWidth, label: '' };
        }

        if (shape) {
            this.shapes.push(shape);
            this.selectedId = shape.id;
            this.renderAll();
            this.updatePropertiesBar();
            this.saveShapes();
            if (shape.type !== 'callout') this.showLabelInput(shape);
        }
    },

    getNextCalloutNumber() {
        const nums = this.shapes.filter(s => s.type === 'callout').map(s => s.calloutNumber || 0);
        return nums.length === 0 ? 1 : Math.max(...nums) + 1;
    },

    renumberCallouts() {
        let n = 1;
        this.shapes.filter(s => s.type === 'callout').forEach(s => { s.calloutNumber = n++; });
    },

    placeText(pt) {
        const id = 'ann-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const shape = { id, type: 'text', x: pt.x, y: pt.y, text: '', color: this.color, fontSize: 16 };
        this.shapes.push(shape);
        this.selectedId = id;
        this.renderAll();
        this.showLabelInput(shape, true);
    },

    // ── Label input ──
    showLabelInput(shape, isTextType = false) {
        this.hideLabelInput();
        const bounds = this.getShapeBounds(shape);
        if (!bounds) return;

        const svgRect = this.svg.getBoundingClientRect();
        const vb = this.svg.viewBox.baseVal;
        const scaleX = svgRect.width / vb.width;
        const scaleY = svgRect.height / vb.height;
        const screenX = svgRect.left + bounds.x * scaleX;
        const screenY = svgRect.top + (bounds.y + bounds.h) * scaleY + 4;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ann-label-input';
        input.placeholder = isTextType ? 'Type text...' : 'Add label (Enter to save)';
        input.value = isTextType ? (shape.text || '') : (shape.label || '');
        input.style.left = Math.max(4, screenX) + 'px';
        input.style.top = Math.min(window.innerHeight - 40, screenY) + 'px';

        let committed = false;
        const commit = () => {
            if (committed) return;
            committed = true;
            if (isTextType) {
                if (!input.value) {
                    this.shapes = this.shapes.filter(s => s.id !== shape.id);
                    this.selectedId = null;
                } else { shape.text = input.value; }
            } else { shape.label = input.value; }
            this.hideLabelInput();
            this.renderAll();
            this.saveShapes();
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') {
                if (isTextType && !input.value) {
                    this.shapes = this.shapes.filter(s => s.id !== shape.id);
                    this.selectedId = null;
                }
                this.hideLabelInput();
                this.renderAll();
            }
            e.stopPropagation();
        });
        input.addEventListener('blur', commit);

        document.body.appendChild(input);
        this.labelInput = input;
        setTimeout(() => input.focus(), 10);
    },

    hideLabelInput() {
        if (this.labelInput) {
            const el = this.labelInput;
            this.labelInput = null;
            try { el.remove(); } catch { }
        }
    },

    // ── Drag & resize ──
    handleDrag(pt) {
        const shape = this.shapes.find(s => s.id === this.selectedId);
        if (!shape) return;
        if (!this._dragStarted) {
            this._dragStarted = true;
            this.pushUndo();
        }
        const dx = pt.x - this.dragOffset.x, dy = pt.y - this.dragOffset.y;
        this.dragOffset = pt;

        if (shape.type === 'arrow' || shape.type === 'line') {
            shape.x += dx; shape.y += dy; shape.x2 += dx; shape.y2 += dy;
        } else if (shape.type === 'freehand') {
            shape.points = shape.points.map(([px, py]) => [px + dx, py + dy]);
        } else {
            shape.x += dx; shape.y += dy;
        }
        this.renderAll(true);
    },

    handleResize(pt) {
        const shape = this.shapes.find(s => s.id === this.selectedId);
        if (!shape) return;

        if (shape.type === 'arrow' || shape.type === 'line') {
            if (this.resizeHandle === 'start') { shape.x = pt.x; shape.y = pt.y; }
            else { shape.x2 = pt.x; shape.y2 = pt.y; }
        } else if (['rect', 'ellipse', 'highlight', 'callout'].includes(shape.type)) {
            const sx = shape.x, sy = shape.y, ex = shape.x + shape.width, ey = shape.y + shape.height;
            let x1 = sx, y1 = sy, x2 = ex, y2 = ey;
            const h = this.resizeHandle;
            if (h === 'nw') { x1 = pt.x; y1 = pt.y; }
            else if (h === 'ne') { x2 = pt.x; y1 = pt.y; }
            else if (h === 'sw') { x1 = pt.x; y2 = pt.y; }
            else if (h === 'se') { x2 = pt.x; y2 = pt.y; }
            shape.x = Math.min(x1, x2); shape.y = Math.min(y1, y2);
            shape.width = Math.abs(x2 - x1); shape.height = Math.abs(y2 - y1);
        }
        this.renderAll(true);
    },

    // ── Path simplification (Ramer-Douglas-Peucker) ──
    simplifyPath(pts, eps) {
        if (pts.length <= 2) return pts;
        let maxD = 0, maxI = 0;
        const s = pts[0], e = pts[pts.length - 1];
        for (let i = 1; i < pts.length - 1; i++) {
            const d = this.ptLineDist(pts[i], s, e);
            if (d > maxD) { maxD = d; maxI = i; }
        }
        if (maxD > eps) {
            const l = this.simplifyPath(pts.slice(0, maxI + 1), eps);
            const r = this.simplifyPath(pts.slice(maxI), eps);
            return l.slice(0, -1).concat(r);
        }
        return [s, e];
    },

    ptLineDist(pt, ls, le) {
        const dx = le[0] - ls[0], dy = le[1] - ls[1];
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.hypot(pt[0] - ls[0], pt[1] - ls[1]);
        const t = Math.max(0, Math.min(1, ((pt[0] - ls[0]) * dx + (pt[1] - ls[1]) * dy) / len2));
        return Math.hypot(pt[0] - (ls[0] + t * dx), pt[1] - (ls[1] + t * dy));
    },

    // ── Tool/color/stroke ──
    setTool(tool) {
        this.tool = tool;
        this.updateToolbar();
        const cursors = { select: 'default', rect: 'crosshair', highlight: 'crosshair', ellipse: 'crosshair', callout: 'crosshair', arrow: 'crosshair', line: 'crosshair', freehand: 'crosshair', text: 'text' };
        this.svg.style.cursor = cursors[tool] || 'default';
    },

    setColor(color) {
        this.color = color;
        this.updateToolbar();
    },

    setStrokeWidth(sw) {
        this.strokeWidth = sw;
        this.updateToolbar();
    },

    cycleStrokeWidth(dir) {
        const idx = this.STROKE_WIDTHS.indexOf(this.strokeWidth);
        const next = idx + dir;
        if (next >= 0 && next < this.STROKE_WIDTHS.length) {
            this.setStrokeWidth(this.STROKE_WIDTHS[next]);
        }
    },

    deleteSelected() {
        if (!this.selectedId) { toast('Nothing selected'); return; }
        this.pushUndo();
        const wasCallout = this.shapes.find(s => s.id === this.selectedId)?.type === 'callout';
        this.shapes = this.shapes.filter(s => s.id !== this.selectedId);
        if (wasCallout) this.renumberCallouts();
        this.selectedId = null;
        this.renderAll();
        this.updatePropertiesBar();
        this.saveShapes();
        toast('Shape deleted');
    },

    duplicateSelected() {
        if (!this.selectedId) { toast('Nothing selected'); return; }
        const orig = this.shapes.find(s => s.id === this.selectedId);
        if (!orig) return;
        this.pushUndo();
        const clone = JSON.parse(JSON.stringify(orig));
        clone.id = 'ann-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        if (clone.type === 'arrow' || clone.type === 'line') {
            clone.x += 20; clone.y += 20; clone.x2 += 20; clone.y2 += 20;
        } else if (clone.type === 'freehand') {
            clone.points = clone.points.map(([px, py]) => [px + 20, py + 20]);
        } else {
            clone.x += 20; clone.y += 20;
        }
        if (clone.type === 'callout') clone.calloutNumber = this.getNextCalloutNumber();
        this.shapes.push(clone);
        this.selectedId = clone.id;
        this.renderAll();
        this.updatePropertiesBar();
        this.saveShapes();
        toast('Shape duplicated');
    },

    updateToolbar() {
        document.querySelectorAll('#ann-toolbar .ann-tool-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tool === this.tool));
        document.querySelectorAll('#ann-toolbar .ann-color-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.color === this.color));
        document.querySelectorAll('#ann-toolbar .ann-stroke-btn').forEach(b =>
            b.classList.toggle('active', parseInt(b.dataset.sw) === this.strokeWidth));
    },

    updatePropertiesBar() {
        const bar = document.getElementById('ann-properties-bar');
        if (!bar) return;
        const shape = this.selectedId ? this.shapes.find(s => s.id === this.selectedId) : null;
        if (!shape) { bar.classList.remove('visible'); return; }
        bar.classList.add('visible');
        document.getElementById('ann-intent-select').value = shape.intent || '';
        document.getElementById('ann-severity-select').value = shape.severity || '';
    },

    toggleShapesList() {
        this._shapesListOpen = !this._shapesListOpen;
        const panel = document.getElementById('ann-shapes-panel');
        panel?.classList.toggle('open', this._shapesListOpen);
    },

    updateAnnotationList() {
        const list = document.getElementById('ann-canvas-list');
        if (!list) return;
        list.innerHTML = '';
        this.shapes.forEach((shape, i) => {
            const item = document.createElement('div');
            item.className = 'ann-list-item' + (shape.id === this.selectedId ? ' selected' : '');
            let label;
            if (shape.type === 'callout') label = `#${shape.calloutNumber} ${shape.label || ''}`.trim();
            else label = shape.label || shape.text || `${shape.type} #${i + 1}`;
            const intentBadge = shape.intent ? ` [${shape.intent}]` : '';
            item.innerHTML = `<span class="ann-list-dot" style="background:${shape.color}"></span>` +
                `<span class="ann-list-label">${label}${intentBadge}</span>` +
                `<span class="ann-list-type">${shape.type}</span>`;
            item.addEventListener('click', () => { this.selectedId = shape.id; this.renderAll(); this.updatePropertiesBar(); });
            list.appendChild(item);
        });
    },

    // ── Export: JSON ──
    exportStructuredJSON() {
        const json = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            screen: this._currentScreen,
            app: window.curApp?.name || '',
            annotations: this.shapes.map(s => {
                const ci = this.COLORS[s.color] || { name: 'custom', meaning: 'custom' };
                const base = { id: s.id, type: s.type, color: ci.name, colorHex: s.color, meaning: ci.meaning };
                if (s.intent) base.intent = s.intent;
                if (s.severity) base.severity = s.severity;
                if (s.label) base.label = s.label;
                if (s.text) base.text = s.text;
                if (s.type === 'callout') base.number = s.calloutNumber;
                if (['rect', 'ellipse', 'highlight', 'callout'].includes(s.type))
                    base.region = { x: Math.round(s.x), y: Math.round(s.y), w: Math.round(s.width), h: Math.round(s.height) };
                if (s.type === 'arrow' || s.type === 'line') {
                    base.from = { x: Math.round(s.x), y: Math.round(s.y) };
                    base.to = { x: Math.round(s.x2), y: Math.round(s.y2) };
                }
                return base;
            })
        };
        const b = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b);
        a.download = `${window.curApp?.id || 'screen'}-${this._currentScreen}-annotations.json`; a.click();
        toast('Exported annotations JSON');
    },

    // ── Export: PNG ──
    async exportFlattenedPNG() {
        toast('Capturing screenshot…');
        // For now, export just the SVG overlay as PNG
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const canvas = document.createElement('canvas');
        canvas.width = 375; canvas.height = 812;
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 375, 812);
        // Draw SVG
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 375, 812);
            URL.revokeObjectURL(url);
            canvas.toBlob(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = `${this._currentScreen}-annotated.png`;
                a.click();
                toast('PNG exported');
            });
        };
        img.src = url;
    }
};
