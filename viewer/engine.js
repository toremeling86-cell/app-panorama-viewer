// ── APP DATA ──
const APP_TYPES = ['Mobile App']; // Extensible: 'Web App', 'Landing Page', etc.
var APPS = [
    { id: '01-ZenVault', name: 'ZenVault', icon: 'account_balance', cat: 'Finance', color: '#00D4AA', type: 'Mobile App', screens: ['01-dashboard', '02-portfolio', '03-budget', '04-goals', '05-analytics', '06-onboarding', '07-cosmos', '08-crypto', '09-notifications', '10-investment-detail', '11-split-bill', '12-crypto', '13-tax-report', '14-subscriptions'] },
    { id: '02-AuraFit', name: 'AuraFit', icon: 'fitness_center', cat: 'Fitness', color: '#00F0FF', type: 'Mobile App', screens: ['01-dashboard', '02-workout', '03-progress', '04-exercises', '05-profile', '06-biometrics', '07-body-comp', '08-nutrition', '09-achievements', '10-challenges', '11-body-map', '12-social', '13-heart-rate'] },
    { id: '03-SkyLens', name: 'SkyLens', icon: 'partly_cloudy_day', cat: 'Weather', color: '#60A5FA', type: 'Mobile App', screens: ['01-sky-now', '02-forecast', '03-air-quality', '04-radar', '05-locations', '06-storm-tracker', '07-widgets', '08-alerts', '09-night-sky', '10-radar', '11-air-quality', '12-pollen'] },
    { id: '04-NightOwl', name: 'NightOwl', icon: 'dark_mode', cat: 'Sleep', color: '#A78BFA', type: 'Mobile App', screens: ['01-sleep-dashboard', '02-trends', '03-sounds', '04-alarm', '04-sounds', '05-insights', '05-profile', '06-dream-journal', '07-sleep-score', '08-smart-alarm', '09-dream-journal', '10-sleep-compare', '11-white-noise', '12-sleep-stories', '13-sleep-hygiene'] },
    { id: '05-Culinary', name: 'Culinary', icon: 'restaurant', cat: 'Food', color: '#E8A838', type: 'Mobile App', screens: ['01-discover', '02-recipe-detail', '03-ai-chef', '04-ai-chef', '04-my-book', '05-grocery', '06-meal-planner', '07-cooking-mode', '08-social', '09-scanner', '10-meal-prep', '11-collections', '12-nutrition', '13-ai-chef'] },
    { id: '06-MindFlow', name: 'MindFlow', icon: 'self_improvement', cat: 'Wellness', color: '#FF8C42', type: 'Mobile App', screens: ['01-home', '02-session', '03-progress', '04-breathing', '05-journal', '06-stats', '07-soundscapes', '08-focus-timer', '09-journal', '10-breathing', '11-gratitude'] },
    { id: '07-WaveRider', name: 'WaveRider', icon: 'music_note', cat: 'Music', color: '#FF2D78', type: 'Mobile App', screens: ['01-now-playing', '02-discover', '03-library', '04-equalizer', '05-playlist', '06-artist', '07-lyrics', '08-queue', '09-radio', '10-concerts', '11-lyrics'] },
    { id: '08-PawPal', name: 'PawPal', icon: 'pets', cat: 'Pets', color: '#8B5E3C', type: 'Mobile App', screens: ['01-dashboard', '02-ai-vet', '03-walk-tracker', '04-vaccinations', '05-pet-profile', '06-walk-history', '07-vet-finder', '08-nutrition', '09-training', '10-social', '11-grooming'] },
    { id: '09-Bloom', name: 'Bloom', icon: 'yard', cat: 'Plants', color: '#2D8B56', type: 'Mobile App', screens: ['01-garden', '02-plant-detail', '03-calendar', '04-settings', '05-onboarding', '06-plant-id', '07-growth', '08-reminders', '09-community', '10-water-calc', '11-encyclopedia', '12-soil-guide', '13-community'] },
    { id: '10-Atlas', name: 'Atlas', icon: 'map', cat: 'Travel', color: '#D4A574', type: 'Mobile App', screens: ['01-timeline', '02-destination', '03-packing', '04-empty-state', '05-photo-journal', '06-booking', '07-itinerary', '08-currency', '09-phrase-book', '10-safety', '11-photos', '12-currency'] },
    { id: '11-Kinfolk', name: 'Kinfolk', icon: 'family_restroom', cat: 'Family', color: '#F97316', type: 'Mobile App', screens: ['01-dashboard', '02-chat', '03-chores', '04-memories', '05-calendar', '06-chores', '07-shared-lists', '08-budget', '09-memories', '10-recipes', '11-chores'] },
    { id: '12-Folio', name: 'Folio', icon: 'design_services', cat: 'Portfolio', color: '#E8553D', type: 'Mobile App', screens: ['01-portfolio', '02-case-study', '03-contact', '04-showcase', '05-settings', '06-analytics', '07-testimonials', '08-case-study', '09-contact', '10-skills'] },
    { id: '13-Vitals', name: 'Vitals', icon: 'favorite', cat: 'Health', color: '#0D9488', type: 'Mobile App', screens: ['01-schedule', '02-emergency', '03-interactions', '04-dashboard', '05-onboarding', '06-medications', '07-emergency-card', '08-reports', '09-telehealth', '10-wearable', '11-lab-trends'] },
    { id: '15-PinSnap', name: 'PinSnap', icon: 'sports_score', cat: 'Sports', color: '#F97316', type: 'Mobile App', screens: ['01-scan-tab', '02-history-tab', '03-stats-tab', '04-cups-tab', '05-settings', '06-game-detail', '07-manual-entry'] }
];

// ── STATE ──
var curApp = null, selScreen = null; let isInteract = false, snapOn = true, presIdx = 0;
let camX = 0, camY = 0, zoom = 0.35, maxZ = 100;
let multiSel = new Set();
let positions = JSON.parse(localStorage.getItem('av-pos') || '{}');
let annotations = JSON.parse(localStorage.getItem('av-ann') || '{}');
let connections = JSON.parse(localStorage.getItem('av-conn') || '{}');
const PW = 375, PH = 770, GAP = 12, SNAP_DIST = 8, GRID_SIZE = 20;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Global click position tracking for positionAway()
let _lastClickX = 0, _lastClickY = 0;
document.addEventListener('mousedown', e => { _lastClickX = e.clientX; _lastClickY = e.clientY; }, true);

// ── FLOATING WINDOWS ──
const FloatingWindows = {
    _maxZ: 500,
    _openCount: 0,
    bringToFront(el) { this._maxZ++; el.style.zIndex = this._maxZ; },
    setupDrag(panelEl, handleEl) {
        if (!handleEl || !panelEl) return;
        let dragging = false, startX, startY, startLeft, startTop;
        handleEl.style.cursor = 'grab';
        handleEl.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panelEl.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            handleEl.style.cursor = 'grabbing';
            FloatingWindows.bringToFront(panelEl);
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panelEl.style.left = (startLeft + dx) + 'px';
            panelEl.style.top = (startTop + dy) + 'px';
            panelEl.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (dragging) handleEl.style.cursor = 'grab';
            dragging = false;
        });
    },
    setDefaultPosition(panelEl, { right = 20, top = 60, width = 370 } = {}) {
        panelEl.style.right = right + 'px';
        panelEl.style.top = top + 'px';
        panelEl.style.width = width + 'px';
        panelEl.style.left = 'auto';
    },
    getStaggeredPosition() {
        const offset = (this._openCount % 5) * 30;
        this._openCount++;
        return { right: 20 + offset, top: 60 + offset };
    },
    /** Position a window on the opposite side from where the user clicked */
    positionAway(clickX, clickY) {
        const midX = window.innerWidth / 2;
        const top = Math.max(60, Math.min(clickY - 100, window.innerHeight - 500));
        if (clickX < midX) {
            return { left: undefined, right: 20, top };
        } else {
            return { left: 20, right: undefined, top };
        }
    }
};
function save() { localStorage.setItem('av-ann', JSON.stringify(annotations)); localStorage.setItem('av-pos', JSON.stringify(positions)); localStorage.setItem('av-conn', JSON.stringify(connections)); }
function getA(k) { return annotations[k] || { notes: '', tags: [], starred: false, grade: '', status: '', images: [] }; }
function aK(a, s) { return `${a}/${s}`; }
function pK(a) { return `pos-${a}`; }
function lbl(f) { return f.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }

// ── APP OVERLAY ──
let _aoFilter = 'All';
let _aoSearch = '';

function openAppOverlay() {
    renderAppOverlay();
    $('#app-overlay').classList.add('open');
    setTimeout(() => $('#ao-search')?.focus(), 100);
}

function closeAppOverlay() {
    $('#app-overlay').classList.remove('open');
    _aoSearch = '';
    const si = $('#ao-search'); if (si) si.value = '';
}

function renderAppOverlay() {
    // Tabs
    const types = ['All', ...APP_TYPES];
    $('#ao-tabs').innerHTML = types.map(t =>
        `<button class="ao-tab${_aoFilter === t ? ' active' : ''}" data-type="${t}">${t}</button>`
    ).join('');
    $('#ao-tabs').querySelectorAll('.ao-tab').forEach(btn => {
        btn.addEventListener('click', () => { _aoFilter = btn.dataset.type; renderAppOverlay(); });
    });

    // Filter apps
    let filtered = APPS;
    if (_aoFilter !== 'All') filtered = filtered.filter(a => a.type === _aoFilter);
    if (_aoSearch) filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(_aoSearch) || a.cat.toLowerCase().includes(_aoSearch)
    );

    // Grid
    $('#ao-grid').innerHTML = filtered.map(a =>
        `<div class="ao-app${curApp?.id === a.id ? ' active' : ''}" data-id="${a.id}">` +
        `<div class="ao-app-icon" style="background:${a.color}18"><span class="material-symbols-outlined" style="color:${a.color}">${a.icon}</span></div>` +
        `<div><div class="ao-app-name">${a.name}</div><div class="ao-app-meta">${a.cat} · ${a.screens.length} screens</div></div>` +
        `</div>`
    ).join('');
    $('#ao-grid').querySelectorAll('.ao-app').forEach(el => {
        el.addEventListener('click', () => {
            loadApp(APPS.find(a => a.id === el.dataset.id));
            closeAppOverlay();
        });
    });

    // Stats
    let total = 0, ann = 0, stars = 0;
    APPS.forEach(app => {
        total += app.screens.length;
        app.screens.forEach(s => { const a = getA(aK(app.id, s)); if (a.notes || a.starred || a.grade || a.tags?.length || a.status) ann++; if (a.starred) stars++; });
    });
    $('#ao-total').textContent = total;
    $('#ao-annotated').textContent = ann;
    $('#ao-starred').textContent = stars;
}

// Overlay event wiring
$('#btn-hamburger')?.addEventListener('click', openAppOverlay);
$('#ao-backdrop')?.addEventListener('click', closeAppOverlay);
$('#ao-close')?.addEventListener('click', closeAppOverlay);
$('#ao-search')?.addEventListener('input', e => { _aoSearch = e.target.value.toLowerCase(); renderAppOverlay(); });

// Legacy compat — renderSidebar is called from renderCanvas/loadApp
function renderSidebar() { /* no-op — overlay replaces sidebar */ }

// ── LAYOUTS ──
function layoutTight(scrs) { const p = {}; scrs.forEach((s, i) => { p[s] = { x: i * (PW + GAP), y: 0 } }); return p; }
function layoutGrid(scrs) { const c = Math.ceil(Math.sqrt(scrs.length)); const p = {}; scrs.forEach((s, i) => { p[s] = { x: (i % c) * (PW + GAP), y: Math.floor(i / c) * (PH + 60 + GAP) } }); return p; }
function layoutFlow(scrs) { const p = {}; scrs.forEach((s, i) => { p[s] = { x: i * (PW + GAP * 2), y: (i % 2) * 120 } }); return p; }
function applyLayout(t) { if (!curApp) return; let p; if (t === 'tight') p = layoutTight(curApp.screens); else if (t === 'grid') p = layoutGrid(curApp.screens); else p = layoutFlow(curApp.screens); positions[pK(curApp.id)] = p; save(); renderCanvas(); setTimeout(fitAll, 100); }

// ── CANVAS ──
function renderCanvas() {
    if (!curApp) return;
    const cv = $('#canvas');
    let appP = positions[pK(curApp.id)];
    if (!appP) { applyLayout('tight'); return; }
    const q = $('#search-input').value.toLowerCase();
    cv.innerHTML = curApp.screens.map((scr, i) => {
        const p = appP[scr] || { x: i * (PW + GAP), y: 0 };
        const k = aK(curApp.id, scr), ann = getA(k);
        const dots = [];
        if (ann.starred) dots.push('<div class="adot star"></div>');
        if (ann.notes) dots.push('<div class="adot note"></div>');
        if (ann.tags?.length) dots.push('<div class="adot tag"></div>');
        if (ann.images?.length) dots.push('<div class="adot img"></div>');
        const statusHTML = ann.status ? `<div class="status-badge ${ann.status}">${ann.status.replace('-', ' ')}</div>` : '';
        const filtered = q && !lbl(scr).toLowerCase().includes(q) ? ' filtered-out' : '';
        const isSel = selScreen === scr ? ' selected' : '';
        const isMulti = multiSel.has(scr) ? ' multi-selected' : '';
        const screenUrl = (typeof ScreenCreator !== 'undefined' && ScreenCreator.getScreenUrl(curApp.id, scr)) || `${curApp.id}/screens/${scr}.html`;
        const isCustom = typeof ScreenCreator !== 'undefined' && ScreenCreator.isCustomScreen(curApp.id, scr);
        const customBadge = isCustom ? '<div class="custom-badge">CUSTOM</div>' : '';
        return `<div class="ss${isSel}${isMulti}${filtered}" data-scr="${scr}" data-idx="${i}" style="left:${p.x}px;top:${p.y}px;z-index:${i + 1}"><div class="df"><div class="sb-bg-layer"></div><div class="notch"></div>${customBadge}${statusHTML}${dots.length ? `<div class="adots">${dots.join('')}</div>` : ''}<iframe src="${screenUrl}" loading="lazy" sandbox="allow-scripts allow-same-origin" style="pointer-events:${isInteract ? 'auto' : 'none'}"></iframe></div><div class="sl"><div class="sn">${i + 1}/${curApp.screens.length}${ann.grade ? ' · ' + ann.grade : ''}${ann.starred ? ' <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">star</span>' : ''}</div><div class="sm">${lbl(scr)}</div></div></div>`;
    }).join('');
    drawConnections();
    updateCam(); setupDrag(); renderSidebar(); updateMinimap();
    // Re-inject inspector into new iframes after canvas rebuild
    if (typeof ElementInspector !== 'undefined' && ElementInspector.active) {
        setTimeout(() => ElementInspector.refreshIframes(), 300);
    }
    // Re-apply screen backgrounds to newly created iframes
    if (typeof ScreenBackgrounds !== 'undefined') {
        ScreenBackgrounds.refreshAfterRender();
    }
}

// ── CONNECTION TYPES ──
const CONN_TYPES = {
    tap:   { label: 'Tap',   color: '#818cf8', dash: '',       icon: 'touch_app' },
    swipe: { label: 'Swipe', color: '#38bdf8', dash: '8,4',    icon: 'swipe_right' },
    auto:  { label: 'Auto',  color: '#34d399', dash: '4,4',    icon: 'timer' },
    back:  { label: 'Back',  color: '#f87171', dash: '6,3,2,3',icon: 'arrow_back' },
    link:  { label: 'Link',  color: '#fbbf24', dash: '',       icon: 'link' }
};
let _connPopupEl = null;

// ── CONNECTIONS (SVG arrows with types & labels) ──
function drawConnections() {
    const cv = $('#canvas');
    let svgEl = cv.querySelector('.conn-svg');
    if (svgEl) svgEl.remove();
    const conns = connections[curApp.id] || [];
    if (!conns.length) return;
    const appP = positions[pK(curApp.id)]; if (!appP) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('conn-svg'); svg.style.width = '10000px'; svg.style.height = '10000px';

    // Defs for arrowhead markers per type
    const defs = document.createElementNS(ns, 'defs');
    Object.entries(CONN_TYPES).forEach(([type, cfg]) => {
        const marker = document.createElementNS(ns, 'marker');
        marker.setAttribute('id', `arrow-${type}`);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '10'); marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '8');
        marker.setAttribute('orient', 'auto-start-reverse');
        const poly = document.createElementNS(ns, 'path');
        poly.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        poly.setAttribute('fill', cfg.color);
        marker.appendChild(poly);
        defs.appendChild(marker);
    });
    svg.appendChild(defs);

    conns.forEach((c, idx) => {
        const pA = appP[c.from], pB = appP[c.to]; if (!pA || !pB) return;
        const connType = c.type || 'tap';
        const cfg = CONN_TYPES[connType] || CONN_TYPES.tap;

        const x1 = pA.x + PW / 2, y1 = pA.y + PH + 30;
        const x2 = pB.x + PW / 2, y2 = pB.y - 10;

        // Draw bezier curve
        const path = document.createElementNS(ns, 'path');
        const cy1 = y1 + 60, cy2 = y2 - 60;
        path.setAttribute('d', `M${x1},${y1} C${x1},${cy1} ${x2},${cy2} ${x2},${y2}`);
        path.setAttribute('stroke', cfg.color);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', '2');
        if (cfg.dash) path.setAttribute('stroke-dasharray', cfg.dash);
        path.setAttribute('marker-end', `url(#arrow-${connType})`);
        path.classList.add('conn-line');
        path.dataset.connIdx = idx;
        svg.appendChild(path);

        // Label at midpoint
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
        const labelText = c.label || cfg.label;

        // Label background
        const labelBg = document.createElementNS(ns, 'rect');
        labelBg.setAttribute('x', mx - 28); labelBg.setAttribute('y', my - 10);
        labelBg.setAttribute('width', '56'); labelBg.setAttribute('height', '20');
        labelBg.setAttribute('rx', '4');
        labelBg.setAttribute('fill', '#09090b'); labelBg.setAttribute('stroke', cfg.color);
        labelBg.setAttribute('stroke-width', '1'); labelBg.setAttribute('opacity', '0.9');
        labelBg.classList.add('conn-label-bg');
        labelBg.dataset.connIdx = idx;
        svg.appendChild(labelBg);

        // Label text
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', mx); text.setAttribute('y', my + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', cfg.color);
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.setAttribute('font-weight', '600');
        text.textContent = labelText;
        text.classList.add('conn-label');
        text.dataset.connIdx = idx;
        svg.appendChild(text);
    });

    // Click handler for editing connections
    svg.addEventListener('click', (e) => {
        const idx = e.target.dataset.connIdx;
        if (idx !== undefined) {
            e.stopPropagation();
            _showConnPopup(parseInt(idx), e.clientX, e.clientY);
        }
    });

    cv.insertBefore(svg, cv.firstChild);
}

// ── CONNECTION PROPERTIES POPUP ──
function _showConnPopup(connIdx, cx, cy) {
    if (_connPopupEl) _connPopupEl.remove();
    const conns = connections[curApp.id];
    if (!conns || !conns[connIdx]) return;
    const c = conns[connIdx];
    const currentType = c.type || 'tap';

    const popup = document.createElement('div');
    popup.className = 'conn-popup';
    popup.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;z-index:9999;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.4);`;

    let html = `<div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        Connection
        <button class="conn-popup-del" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;display:flex;align-items:center;" title="Delete"><span class="material-symbols-outlined" style="font-size:14px">close</span></button>
    </div>`;

    // Type selector
    html += `<div style="font-size:10px;color:var(--dim);margin-bottom:4px;">Type</div>`;
    html += `<div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap;">`;
    Object.entries(CONN_TYPES).forEach(([type, cfg]) => {
        const active = type === currentType ? 'background:' + cfg.color + '22;border-color:' + cfg.color : '';
        html += `<button class="conn-type-btn" data-type="${type}" style="flex:1;min-width:45px;padding:4px 6px;font-size:10px;border-radius:4px;border:1px solid var(--border);background:var(--s2);color:${cfg.color};cursor:pointer;font-weight:600;${active}"><span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle">${cfg.icon}</span> ${cfg.label}</button>`;
    });
    html += `</div>`;

    // Label input
    html += `<div style="font-size:10px;color:var(--dim);margin-bottom:4px;">Label</div>`;
    html += `<input class="conn-label-input" type="text" value="${c.label || ''}" placeholder="${CONN_TYPES[currentType]?.label || 'Tap'}" style="width:100%;padding:5px 8px;font-size:11px;background:var(--s2);border:1px solid var(--border);border-radius:4px;color:var(--text);outline:none;margin-bottom:4px;">`;

    // From → To info
    html += `<div style="font-size:10px;color:var(--muted);margin-top:4px;">${lbl(c.from)} → ${lbl(c.to)}</div>`;

    popup.innerHTML = html;
    document.body.appendChild(popup);
    _connPopupEl = popup;

    // Keep popup in viewport
    const rect = popup.getBoundingClientRect();
    if (rect.right > window.innerWidth) popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
    if (rect.bottom > window.innerHeight) popup.style.top = (window.innerHeight - rect.height - 10) + 'px';

    // Type buttons
    popup.querySelectorAll('.conn-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            c.type = btn.dataset.type;
            save(); drawConnections();
            _showConnPopup(connIdx, cx, cy); // refresh popup
        });
    });

    // Label input
    const labelInput = popup.querySelector('.conn-label-input');
    labelInput.addEventListener('change', () => {
        c.label = labelInput.value.trim() || undefined;
        save(); drawConnections();
    });
    labelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { labelInput.blur(); }
        if (e.key === 'Escape') { _connPopupEl?.remove(); _connPopupEl = null; }
    });

    // Delete button
    popup.querySelector('.conn-popup-del').addEventListener('click', () => {
        conns.splice(connIdx, 1);
        save(); drawConnections();
        popup.remove(); _connPopupEl = null;
        toast('Connection deleted');
    });

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function _closer(ev) {
            if (!popup.contains(ev.target)) {
                popup.remove(); _connPopupEl = null;
                document.removeEventListener('click', _closer);
            }
        });
    }, 50);
}

// ── CAMERA ──
function updateCam() { $('#canvas').style.transform = `translate(${camX}px,${camY}px) scale(${zoom})`; }
function fitAll() {
    if (!curApp) return; const appP = positions[pK(curApp.id)]; if (!appP) return;
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    curApp.screens.forEach(s => { const p = appP[s]; if (!p) return; a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x + PW); d = Math.max(d, p.y + PH + 50); });
    const ar = $('#canvas-area'), aw = ar.clientWidth, ah = ar.clientHeight;
    const cw = c - a + 60, ch = d - b + 60;
    zoom = Math.min(aw / cw, ah / ch, 1); zoom = Math.max(0.08, Math.min(zoom, 1));
    camX = (aw - cw * zoom) / 2 - a * zoom; camY = (ah - ch * zoom) / 2 - b * zoom;
    updateCam(); $('#zoom-slider').value = Math.round(zoom * 100); $('#zoom-val').textContent = Math.round(zoom * 100) + '%'; updateMinimap();
}

// ── SNAP LINES ──
function clearSnaps() { $$('.snap-line,.snap-dist').forEach(e => e.remove()); }
function showSnaps(dragScr, nx, ny) {
    clearSnaps(); if (!snapOn || !curApp) return { x: nx, y: ny };
    const appP = positions[pK(curApp.id)]; if (!appP) return { x: nx, y: ny };
    let sx = nx, sy = ny; const cv = $('#canvas');
    const edges = { l: nx, r: nx + PW, cx: nx + PW / 2, t: ny, b: ny + PH, cy: ny + PH / 2 };
    curApp.screens.forEach(s => {
        if (s === dragScr) return; const p = appP[s]; if (!p) return;
        const oe = { l: p.x, r: p.x + PW, cx: p.x + PW / 2, t: p.y, b: p.y + PH, cy: p.y + PH / 2 };
        // Vertical alignment (x snaps)
        [{ a: edges.l, b: oe.l }, { a: edges.r, b: oe.r }, { a: edges.l, b: oe.r }, { a: edges.r, b: oe.l }, { a: edges.cx, b: oe.cx }].forEach(({ a, b }) => {
            if (Math.abs(a - b) < SNAP_DIST) { sx = nx + (b - a); const ln = document.createElement('div'); ln.className = 'snap-line snap-line-v'; ln.style.left = (b) + 'px'; cv.appendChild(ln); }
        });
        // Horizontal alignment (y snaps)
        [{ a: edges.t, b: oe.t }, { a: edges.b, b: oe.b }, { a: edges.t, b: oe.b }, { a: edges.b, b: oe.t }, { a: edges.cy, b: oe.cy }].forEach(({ a, b }) => {
            if (Math.abs(a - b) < SNAP_DIST) { sy = ny + (b - a); const ln = document.createElement('div'); ln.className = 'snap-line snap-line-h'; ln.style.top = (b) + 'px'; cv.appendChild(ln); }
        });
        // Gap snapping
        if (Math.abs(edges.t - oe.b - GAP) < SNAP_DIST) { sy = oe.b + GAP; }
        if (Math.abs(oe.t - edges.b - GAP) < SNAP_DIST) { sy = oe.t - PH - GAP; }
        if (Math.abs(edges.l - oe.r - GAP) < SNAP_DIST) { sx = oe.r + GAP; }
        if (Math.abs(oe.l - edges.r - GAP) < SNAP_DIST) { sx = oe.l - PW - GAP; }
    });
    // Grid snap
    if (snapOn) { sx = Math.round(sx / GRID_SIZE) * GRID_SIZE; sy = Math.round(sy / GRID_SIZE) * GRID_SIZE; }
    return { x: sx, y: sy };
}

// ── DRAG ──
function setupDrag() {
    $$('.ss').forEach(slot => {
        let isDrag = false, moved = false, smx, smy, spx, spy, wasShift = false;
        // Store initial positions for multi-drag
        let multiStartPos = {};
        slot.addEventListener('mousedown', e => {
            if (isInteract || (typeof ElementInspector !== 'undefined' && ElementInspector.active) || e.button !== 0) return; e.stopPropagation();
            isDrag = true; moved = false; wasShift = e.shiftKey;
            const p = positions[pK(curApp.id)]?.[slot.dataset.scr] || { x: 0, y: 0 };
            spx = p.x; spy = p.y; smx = e.clientX; smy = e.clientY;
            slot.classList.add('dragging'); slot.style.zIndex = ++maxZ;
            // Snapshot multi-select positions
            if (multiSel.has(slot.dataset.scr) && multiSel.size > 1) {
                multiStartPos = {};
                multiSel.forEach(s => { const op = positions[pK(curApp.id)]?.[s]; if (op) multiStartPos[s] = { x: op.x, y: op.y }; });
            }
        });
        const onMove = e => {
            if (!isDrag) return;
            const dx = (e.clientX - smx) / zoom, dy = (e.clientY - smy) / zoom;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            let nx = spx + dx, ny = spy + dy;
            const snapped = showSnaps(slot.dataset.scr, nx, ny);
            nx = snapped.x; ny = snapped.y;
            slot.style.left = nx + 'px'; slot.style.top = ny + 'px';
            if (!positions[pK(curApp.id)]) positions[pK(curApp.id)] = {};
            positions[pK(curApp.id)][slot.dataset.scr] = { x: nx, y: ny };
            // Multi-select drag — move all selected screens by same delta
            if (multiSel.has(slot.dataset.scr) && multiSel.size > 1) {
                const ddx = nx - spx, ddy = ny - spy;
                multiSel.forEach(s => {
                    if (s === slot.dataset.scr) return;
                    const el = document.querySelector(`.ss[data-scr="${s}"]`); if (!el) return;
                    const orig = multiStartPos[s]; if (!orig) return;
                    const newX = orig.x + ddx, newY = orig.y + ddy;
                    el.style.left = newX + 'px'; el.style.top = newY + 'px';
                    positions[pK(curApp.id)][s] = { x: newX, y: newY };
                });
            }
            drawConnections();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', () => {
            if (!isDrag) return; isDrag = false; slot.classList.remove('dragging'); clearSnaps(); save(); updateMinimap();
            if (!moved) {
                const scr = slot.dataset.scr;
                if (wasShift) {
                    if (multiSel.has(scr)) multiSel.delete(scr); else multiSel.add(scr);
                    $$('.ss').forEach(s => s.classList.toggle('multi-selected', multiSel.has(s.dataset.scr)));
                } else {
                    multiSel.clear(); $$('.ss').forEach(s => s.classList.remove('multi-selected'));
                    if (selScreen === scr) { closePanel(); selScreen = null; window.selScreen = null; $$('.ss').forEach(s => s.classList.remove('selected')); }
                    else { selScreen = scr; window.selScreen = scr; $$('.ss').forEach(s => s.classList.remove('selected')); slot.classList.add('selected'); openPanel(scr); }
                }
            }
        });
        slot.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); showCtx(e.clientX, e.clientY, slot.dataset.scr); });
    });
}

// ── RUBBER BAND ──
let rbActive = false, rbSX, rbSY;
$('#canvas-area').addEventListener('mousedown', e => {
    if (e.target.closest('.ss')) return;
    if (e.shiftKey) {
        rbActive = true; rbSX = e.clientX; rbSY = e.clientY;
        const rb = $('#rubber-band'); rb.style.display = 'block'; rb.style.left = rbSX + 'px'; rb.style.top = rbSY + 'px'; rb.style.width = '0'; rb.style.height = '0';
        return;
    }
    // Pan
    isPanning = true; panSX = e.clientX; panSY = e.clientY; panCX = camX; panCY = camY;
    $('#canvas-area').classList.add('panning');
});
document.addEventListener('mousemove', e => {
    if (rbActive) {
        const rb = $('#rubber-band');
        const x = Math.min(e.clientX, rbSX), y = Math.min(e.clientY, rbSY);
        const w = Math.abs(e.clientX - rbSX), h = Math.abs(e.clientY - rbSY);
        rb.style.left = x + 'px'; rb.style.top = y + 'px'; rb.style.width = w + 'px'; rb.style.height = h + 'px';
        return;
    }
    if (!isPanning) return;
    camX = panCX + (e.clientX - panSX); camY = panCY + (e.clientY - panSY); updateCam();
});
document.addEventListener('mouseup', e => {
    if (rbActive) {
        rbActive = false; $('#rubber-band').style.display = 'none';
        const rb = $('#rubber-band').getBoundingClientRect();
        const rX = parseFloat($('#rubber-band').style.left), rY = parseFloat($('#rubber-band').style.top);
        const rW = parseFloat($('#rubber-band').style.width), rH = parseFloat($('#rubber-band').style.height);
        multiSel.clear();
        $$('.ss').forEach(s => {
            const r = s.getBoundingClientRect();
            if (r.left < rX + rW && r.right > rX && r.top < rY + rH && r.bottom > rY) { multiSel.add(s.dataset.scr); s.classList.add('multi-selected'); }
            else s.classList.remove('multi-selected');
        });
        if (multiSel.size) toast(`Selected ${multiSel.size} screens`);
        return;
    }
    if (isPanning) { isPanning = false; $('#canvas-area').classList.remove('panning'); updateMinimap(); }
});
let isPanning = false, panSX, panSY, panCX, panCY;

// ── ZOOM WHEEL ──
$('#canvas-area').addEventListener('wheel', e => {
    e.preventDefault(); const r = $('#canvas-area').getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top; const pz = zoom;
    zoom = Math.max(0.06, Math.min(1.2, zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    camX = mx - (mx - camX) * (zoom / pz); camY = my - (my - camY) * (zoom / pz);
    updateCam(); $('#zoom-slider').value = Math.round(zoom * 100); $('#zoom-val').textContent = Math.round(zoom * 100) + '%'; updateMinimap();
}, { passive: false });

// ── ANNOTATION PANEL ──
let _annDragSetup = false;
function openPanel(scr) {
    const p = $('#ann-panel');
    if (!_annDragSetup) { FloatingWindows.setupDrag(p, $('#ph')); _annDragSetup = true; }
    const pos = FloatingWindows.getStaggeredPosition();
    p.style.right = pos.right + 'px'; p.style.top = pos.top + 'px'; p.style.left = 'auto';
    p.classList.add('open');
    FloatingWindows.bringToFront(p);
    const k = aK(curApp.id, scr), ann = getA(k);
    $('#pt').textContent = lbl(scr); $('#ps').textContent = `${curApp.name} · Screen ${curApp.screens.indexOf(scr) + 1}`;
    $('#pn').value = ann.notes || ''; $('#psaved').classList.remove('show');
    const star = $('#btn-star'); star.classList.toggle('on', ann.starred); star.innerHTML = ann.starred ? '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">star</span> Starred' : '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">star_border</span> Star';
    $$('.pa-g').forEach(b => b.classList.toggle('on', b.dataset.g === ann.grade));
    $$('.status-btn').forEach(b => b.classList.toggle('on', b.dataset.s === ann.status));
    renderTags(ann.tags || []); renderImages(ann.images || []);
    const isCustomScr = typeof ScreenCreator !== 'undefined' && ScreenCreator.isCustomScreen(curApp.id, scr);
    const pathInfo = isCustomScr ? 'IndexedDB (custom)' : `${curApp.id}/screens/${scr}.html`;
    $('#pinfo').innerHTML = `<b>File:</b> ${scr}.html<br><b>App:</b> ${curApp.name}<br><b>Path:</b> ${pathInfo}<br><b>Status:</b> ${ann.status || 'None'}<br><b>Grade:</b> ${ann.grade || 'None'}`;
}
function closePanel() { $('#ann-panel').classList.remove('open'); }

function renderTags(tags) {
    $('#ptags').innerHTML = tags.map(t => `<span class="ptg" data-t="${t}">${t} <span class="material-symbols-outlined" style="font-size:12px;opacity:.4;vertical-align:middle">close</span></span>`).join('');
    $$('.ptg').forEach(c => c.addEventListener('click', () => { const k = aK(curApp.id, selScreen), a = getA(k); a.tags = (a.tags || []).filter(t => t !== c.dataset.t); annotations[k] = a; save(); renderTags(a.tags); renderCanvas(); }));
}

function renderImages(imgs) {
    $('#img-grid').innerHTML = imgs.map((im, i) => `<div class="img-item"><img src="${im.data}"><button class="img-del" data-i="${i}"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></div>`).join('');
    $$('.img-del').forEach(b => b.addEventListener('click', () => { const k = aK(curApp.id, selScreen), a = getA(k); a.images.splice(parseInt(b.dataset.i), 1); annotations[k] = a; save(); renderImages(a.images); renderCanvas(); }));
}

// Panel events
let nT;
$('#pn').addEventListener('input', () => { clearTimeout(nT); nT = setTimeout(() => { if (!selScreen || !curApp) return; const k = aK(curApp.id, selScreen), a = getA(k); a.notes = $('#pn').value; annotations[k] = a; save(); $('#psaved').classList.add('show'); setTimeout(() => $('#psaved').classList.remove('show'), 1500); renderCanvas(); }, 400); });
$('#btn-star').addEventListener('click', () => { if (!selScreen || !curApp) return; const k = aK(curApp.id, selScreen), a = getA(k); a.starred = !a.starred; annotations[k] = a; save(); $('#btn-star').classList.toggle('on', a.starred); $('#btn-star').innerHTML = a.starred ? '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">star</span> Starred' : '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">star_border</span> Star'; renderCanvas(); });
$$('.pa-g').forEach(b => b.addEventListener('click', () => { if (!selScreen || !curApp) return; const k = aK(curApp.id, selScreen), a = getA(k); a.grade = a.grade === b.dataset.g ? '' : b.dataset.g; annotations[k] = a; save(); $$('.pa-g').forEach(x => x.classList.toggle('on', x.dataset.g === a.grade)); renderCanvas(); }));
$$('.status-btn').forEach(b => b.addEventListener('click', () => { if (!selScreen || !curApp) return; const k = aK(curApp.id, selScreen), a = getA(k); a.status = a.status === b.dataset.s ? '' : b.dataset.s; annotations[k] = a; save(); $$('.status-btn').forEach(x => x.classList.toggle('on', x.dataset.s === a.status)); renderCanvas(); }));
$('#ptag').addEventListener('keydown', e => { if (e.key !== 'Enter') return; const v = e.target.value.trim().toLowerCase(); if (!v || !selScreen || !curApp) return; const k = aK(curApp.id, selScreen), a = getA(k); if (!a.tags) a.tags = []; if (!a.tags.includes(v)) { a.tags.push(v); annotations[k] = a; save(); renderTags(a.tags); renderCanvas(); } e.target.value = ''; });
$('#btn-pc').addEventListener('click', () => { closePanel(); selScreen = null; window.selScreen = null; $$('.ss').forEach(s => s.classList.remove('selected')); });

// Image drop zone
const imgDrop = $('#img-drop'), imgFile = $('#img-file');
imgDrop.addEventListener('click', () => imgFile.click());
imgDrop.addEventListener('dragover', e => { e.preventDefault(); imgDrop.classList.add('over'); });
imgDrop.addEventListener('dragleave', () => imgDrop.classList.remove('over'));
imgDrop.addEventListener('drop', e => { e.preventDefault(); imgDrop.classList.remove('over'); handleFiles(e.dataTransfer.files); });
imgFile.addEventListener('change', () => handleFiles(imgFile.files));
function handleFiles(files) {
    if (!selScreen || !curApp || !files.length) return;
    const k = aK(curApp.id, selScreen), a = getA(k); if (!a.images) a.images = [];
    Array.from(files).forEach(f => {
        if (!f.type.startsWith('image/')) return;
        const r = new FileReader(); r.onload = ev => { a.images.push({ data: ev.target.result, name: f.name }); annotations[k] = a; save(); renderImages(a.images); renderCanvas(); }; r.readAsDataURL(f);
    });
}

// ── CONTEXT MENU ──
function showCtx(x, y, scr) {
    const m = $('#ctx'); m.style.left = x + 'px'; m.style.top = y + 'px'; m.classList.add('show'); m._scr = scr; m._clickX = x; m._clickY = y;
    // Show/hide custom screen items
    const isCustom = typeof ScreenCreator !== 'undefined' && ScreenCreator.isCustomScreen(curApp.id, scr);
    m.querySelectorAll('.ci-custom').forEach(el => el.style.display = isCustom ? '' : 'none');
    // Close background submenu
    const bgSub = $('#ctx-bg-sub');
    if (bgSub) bgSub.classList.remove('open');
    // Keep menu in viewport
    requestAnimationFrame(() => {
        const rect = m.getBoundingClientRect();
        if (rect.right > window.innerWidth) m.style.left = (window.innerWidth - rect.width - 8) + 'px';
        if (rect.bottom > window.innerHeight) m.style.top = (window.innerHeight - rect.height - 8) + 'px';
    });
}

/** Populate and toggle the background quick-pick submenu */
function _toggleBgSubmenu() {
    const bgSub = $('#ctx-bg-sub');
    if (!bgSub) return;
    if (bgSub.classList.contains('open')) { bgSub.classList.remove('open'); return; }

    // Get first 8 gradient presets for quick-pick
    const presets = (typeof ScreenBackgrounds !== 'undefined' && ScreenBackgrounds.PRESETS)
        ? ScreenBackgrounds.PRESETS.slice(0, 8)
        : [];

    let html = '<div class="ctx-bg-grid">';
    presets.forEach(p => {
        html += `<div class="ctx-bg-thumb" data-preset="${p.id}" title="${p.name}" style="background:${p.css}"></div>`;
    });
    html += '</div>';
    html += '<div class="ctx-bg-actions">';
    html += '<div class="ctx-bg-action" data-bga="image"><span class="material-symbols-outlined">image</span> Image Backgrounds</div>';
    html += '<div class="ctx-bg-action" data-bga="custom"><span class="material-symbols-outlined">gradient</span> Custom Gradient</div>';
    html += '<div class="ctx-bg-action" data-bga="apply-all"><span class="material-symbols-outlined">select_all</span> Apply to All Screens</div>';
    html += '<div class="ctx-bg-action" data-bga="clear"><span class="material-symbols-outlined">block</span> Clear Background</div>';
    html += '</div>';

    bgSub.innerHTML = html;
    bgSub.classList.add('open');

    // Wire quick-pick thumbnails
    bgSub.querySelectorAll('.ctx-bg-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            const presetId = thumb.dataset.preset;
            const scr = $('#ctx')._scr;
            if (typeof ScreenBackgrounds !== 'undefined' && scr) {
                ScreenBackgrounds.applyPreset(presetId, scr);
                toast('Background applied');
            }
            $('#ctx').classList.remove('show');
        });
    });

    // Wire action items
    bgSub.querySelectorAll('.ctx-bg-action').forEach(action => {
        action.addEventListener('click', (e) => {
            e.stopPropagation();
            const act = action.dataset.bga;
            const scr = $('#ctx')._scr;
            if (act === 'image' && typeof ScreenBackgrounds !== 'undefined') {
                ScreenBackgrounds.enterFocusedMode(scr);
                // Switch to image backgrounds tab after opening
                setTimeout(() => {
                    if (ScreenBackgrounds._activeSubTool !== 'gallery') ScreenBackgrounds._activeSubTool = 'gallery';
                    ScreenBackgrounds._activeCatFilter = 'image';
                    ScreenBackgrounds._refreshPanel();
                }, 300);
            }
            if (act === 'custom' && typeof ScreenBackgrounds !== 'undefined') {
                ScreenBackgrounds.enterFocusedMode(scr);
                setTimeout(() => {
                    ScreenBackgrounds._activeSubTool = 'editor';
                    ScreenBackgrounds._refreshPanel();
                }, 300);
            }
            if (act === 'apply-all' && typeof ScreenBackgrounds !== 'undefined') {
                const bgDef = ScreenBackgrounds._backgrounds[scr];
                if (bgDef) {
                    if (bgDef.presetId) {
                        ScreenBackgrounds.applyPreset(bgDef.presetId); // null screenId = global
                    } else {
                        ScreenBackgrounds.applyCustom(bgDef.css); // null screenId = global
                    }
                    toast('Background applied to all screens');
                } else {
                    toast('No background on this screen to apply globally');
                }
            }
            if (act === 'clear' && typeof ScreenBackgrounds !== 'undefined') {
                ScreenBackgrounds.clearBackground(scr);
                toast('Background cleared');
            }
            $('#ctx').classList.remove('show');
        });
    });
}
document.addEventListener('click', (e) => {
    if (e.target.closest('#ctx-bg-sub') || e.target.closest('.ci-has-sub')) return;
    $('#ctx').classList.remove('show');
});
$$('.ci').forEach(item => item.addEventListener('click', (e) => {
    const scr = $('#ctx')._scr; if (!scr || !curApp) return; const act = item.dataset.a;
    if (act === 'annotate') { selScreen = scr; window.selScreen = scr; $$('.ss').forEach(s => s.classList.toggle('selected', s.dataset.scr === scr)); openPanel(scr); if (typeof AnnotationCanvas !== 'undefined') AnnotationCanvas.enter(scr); }
    if (act === 'inspect') { if (typeof ElementInspector !== 'undefined') { if (!ElementInspector.active) ElementInspector.activate(); } }
    if (act === 'star') { const k = aK(curApp.id, scr), a = getA(k); a.starred = !a.starred; annotations[k] = a; save(); renderCanvas(); toast(a.starred ? 'Starred' : 'Unstarred'); }
    if (act === 'open') { const openUrl = (typeof ScreenCreator !== 'undefined' && ScreenCreator.getScreenUrl(curApp.id, scr)) || `${curApp.id}/screens/${scr}.html`; window.open(openUrl, '_blank'); }
    if (act === 'front') { const s = document.querySelector(`.ss[data-scr="${scr}"]`); if (s) s.style.zIndex = ++maxZ; }
    if (act === 'back') { const s = document.querySelector(`.ss[data-scr="${scr}"]`); if (s) s.style.zIndex = 1; }
    if (act === 'connect') { toast('Click another screen to connect'); document.addEventListener('click', function handler(ev) { const tgt = ev.target.closest('.ss'); if (tgt && tgt.dataset.scr !== scr) { if (!connections[curApp.id]) connections[curApp.id] = []; connections[curApp.id].push({ from: scr, to: tgt.dataset.scr, type: 'tap' }); save(); drawConnections(); toast('Connected! Click the label to edit.'); } document.removeEventListener('click', handler); }, { once: true }); }
    if (act === 'reset') { const i = curApp.screens.indexOf(scr); if (!positions[pK(curApp.id)]) positions[pK(curApp.id)] = {}; positions[pK(curApp.id)][scr] = { x: i * (PW + GAP), y: 0 }; save(); renderCanvas(); }
    if (act === 'present') { startPresentation(curApp.screens.indexOf(scr)); }
    if (act === 'focused') { if (typeof ScreenBackgrounds !== 'undefined') ScreenBackgrounds.enterFocusedMode(scr); }
    if (act === 'design-studio') {
        if (typeof ScreenBackgrounds !== 'undefined') {
            const cx = $('#ctx')._clickX || 0;
            const cy = $('#ctx')._clickY || 200;
            ScreenBackgrounds.open(scr);
            // Position panel away from click
            const pos = FloatingWindows.positionAway(cx, cy);
            const panel = ScreenBackgrounds._panelEl;
            if (panel) {
                panel.style.left = pos.left != null ? pos.left + 'px' : 'auto';
                panel.style.right = pos.right != null ? pos.right + 'px' : 'auto';
                panel.style.top = pos.top + 'px';
            }
        }
    }
    if (act === 'change-bg') { e.stopPropagation(); _toggleBgSubmenu(); return; /* Don't close menu */ }
    if (act === 'edit-html') { if (typeof ScreenCreator !== 'undefined') ScreenCreator.editScreenInPanel(curApp.id, scr); }
    if (act === 'download-screen') { if (typeof ScreenCreator !== 'undefined') ScreenCreator.downloadScreen(curApp.id, scr); }
    if (act === 'delete-screen') { if (typeof ScreenCreator !== 'undefined') { ScreenCreator.deleteScreen(curApp.id, scr).then(() => { renderCanvas(); toast('Deleted: ' + scr); }); } }
}));

// ── PRESENTATION MODE ──
function startPresentation(idx) {
    if (!curApp) return; presIdx = idx || 0;
    const ov = $('#pres-overlay'); ov.classList.add('on');
    updatePres();
}
function updatePres() {
    const scr = curApp.screens[presIdx];
    $('#pres-title').textContent = `${curApp.name} — ${lbl(scr)}`;
    $('#pres-counter').textContent = `${presIdx + 1} / ${curApp.screens.length}`;
    const presScreenUrl = (typeof ScreenCreator !== 'undefined' && ScreenCreator.getScreenUrl(curApp.id, scr)) || `${curApp.id}/screens/${scr}.html`;
    $('#pres-frame').innerHTML = `<iframe src="${presScreenUrl}" style="width:430px;height:884px;border-radius:40px;border:3px solid #2a2a35;background:#fff;"></iframe>`;
    // Apply Design Studio backgrounds to presentation iframe
    const presIframe = $('#pres-frame').querySelector('iframe');
    if (presIframe && typeof ScreenBackgrounds !== 'undefined') {
        presIframe.addEventListener('load', () => {
            ScreenBackgrounds.applyToPresentation(scr);
        }, { once: true });
    }

    $('#pres-nav').innerHTML = curApp.screens.map((_, i) => `<div class="pres-dot${i === presIdx ? ' on' : ''}" data-i="${i}"></div>`).join('');
    $$('.pres-dot').forEach(d => d.addEventListener('click', () => { presIdx = parseInt(d.dataset.i); updatePres(); }));
}

$('#pres-prev').addEventListener('click', () => { if (presIdx > 0) { presIdx--; updatePres(); } });
$('#pres-next').addEventListener('click', () => { if (presIdx < curApp.screens.length - 1) { presIdx++; updatePres(); } });
$('#pres-close').addEventListener('click', () => $('#pres-overlay').classList.remove('on'));

// ── TOOLBAR ──
$('#btn-lt').addEventListener('click', () => applyLayout('tight'));
$('#btn-lg').addEventListener('click', () => applyLayout('grid'));
$('#btn-lf').addEventListener('click', () => applyLayout('flow'));
$('#zoom-slider').addEventListener('input', e => { zoom = parseInt(e.target.value) / 100; $('#zoom-val').textContent = e.target.value + '%'; updateCam(); updateMinimap(); });
$('#btn-interact').addEventListener('click', () => { isInteract = !isInteract; $('#btn-interact').classList.toggle('on', isInteract); $$('.df iframe').forEach(f => f.style.pointerEvents = isInteract ? 'auto' : 'none'); toast(isInteract ? 'Interact ON' : 'Interact OFF'); });
$('#btn-snap').addEventListener('click', () => { snapOn = !snapOn; $('#btn-snap').classList.toggle('on', snapOn); toast(snapOn ? 'Snap ON' : 'Snap OFF'); });
$('#btn-fit').addEventListener('click', fitAll);
$('#btn-reset').addEventListener('click', () => { if (!curApp) return; delete positions[pK(curApp.id)]; save(); applyLayout('tight'); toast('Reset'); });
$('#btn-pres').addEventListener('click', () => startPresentation(0));
$('#btn-export').addEventListener('click', () => {
    if (!curApp) return; const out = {}; curApp.screens.forEach(s => { const a = getA(aK(curApp.id, s)); if (a.notes || a.starred || a.grade || a.tags?.length || a.status || a.images?.length) out[s] = a; });
    const b = new Blob([JSON.stringify({ app: curApp.name, pos: positions[pK(curApp.id)], connections: connections[curApp.id] || [], annotations: out }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${curApp.id}-review.json`; a.click(); toast('Exported!');
});
$('#search-input').addEventListener('input', () => renderCanvas());

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') { if (e.key !== 'Escape') return; }
    if (e.key === 'Escape') { if (typeof ScreenCreator !== 'undefined' && ScreenCreator._isOpen) { ScreenCreator.close(); return; } if ($('#app-overlay').classList.contains('open')) { closeAppOverlay(); return; } if (typeof ScreenBackgrounds !== 'undefined' && ScreenBackgrounds._focusedMode) { ScreenBackgrounds.exitFocusedMode(); return; } if ($('#pres-overlay').classList.contains('on')) { $('#pres-overlay').classList.remove('on'); return; } if (typeof ResponsivePreview !== 'undefined' && ResponsivePreview._isOpen) { ResponsivePreview.close(); return; } if (typeof DesignCompare !== 'undefined' && DesignCompare._isOpen) { DesignCompare.close(); return; } if (typeof ElementInspector !== 'undefined' && ElementInspector.active) { ElementInspector.deactivate(); return; } if (typeof DesignTokens !== 'undefined' && DesignTokens._isOpen) { DesignTokens.close(); return; } if (typeof AccessibilityScanner !== 'undefined' && AccessibilityScanner._isOpen) { AccessibilityScanner.close(); return; } if (typeof CodeExport !== 'undefined' && CodeExport._isOpen) { CodeExport.close(); return; } if (typeof StylePresets !== 'undefined' && StylePresets._isOpen) { StylePresets.close(); return; } if (typeof ScreenBackgrounds !== 'undefined' && ScreenBackgrounds._isOpen) { ScreenBackgrounds.close(); return; } closePanel(); selScreen = null; window.selScreen = null; multiSel.clear(); $$('.ss').forEach(s => { s.classList.remove('selected'); s.classList.remove('multi-selected'); }); }
    if (e.key === 'm' || e.key === 'M') { if ($('#app-overlay').classList.contains('open')) closeAppOverlay(); else openAppOverlay(); }
    if (e.key === 'i' || e.key === 'I') { if (typeof ElementInspector !== 'undefined') ElementInspector.toggle(); }
    if (e.key === 't' || e.key === 'T') { if (typeof DesignTokens !== 'undefined') DesignTokens.toggle(); }
    if (e.key === 'a' || e.key === 'A') { if (typeof AccessibilityScanner !== 'undefined') AccessibilityScanner.toggle(); }
    if (e.key === 'r' || e.key === 'R') { if (typeof ResponsivePreview !== 'undefined') ResponsivePreview.toggle(); }
    if (e.key === 'n' || e.key === 'N') { if (typeof ScreenCreator !== 'undefined') ScreenCreator.toggle(); }
    if (e.key === 'f') fitAll();
    if (e.key === '1') applyLayout('tight'); if (e.key === '2') applyLayout('grid'); if (e.key === '3') applyLayout('flow');
    if (e.key === 'd') { if (typeof ScreenBackgrounds !== 'undefined') { ScreenBackgrounds.enterFocusedMode(selScreen || null); } }
    if (e.key === 'p') startPresentation(0);
    if (e.key === 's') { { snapOn = !snapOn; $('#btn-snap').classList.toggle('on', snapOn); toast(snapOn ? 'Snap ON' : 'Snap OFF'); } }
    if (e.key === '+' || e.key === '=') { zoom = Math.min(1.2, zoom * 1.1); updateCam(); $('#zoom-slider').value = Math.round(zoom * 100); $('#zoom-val').textContent = Math.round(zoom * 100) + '%'; updateMinimap(); }
    if (e.key === '-') { zoom = Math.max(0.06, zoom * 0.9); updateCam(); $('#zoom-slider').value = Math.round(zoom * 100); $('#zoom-val').textContent = Math.round(zoom * 100) + '%'; updateMinimap(); }
    // Focused mode nav
    if (typeof ScreenBackgrounds !== 'undefined' && ScreenBackgrounds._focusedMode) {
        if (e.key === 'ArrowRight') { const max = (curApp?.screens?.length || 1) - 1; if (ScreenBackgrounds._focusedScreenIdx < max) { ScreenBackgrounds._focusedScreenIdx++; ScreenBackgrounds._updateFocusedScreen(); } }
        if (e.key === 'ArrowLeft') { if (ScreenBackgrounds._focusedScreenIdx > 0) { ScreenBackgrounds._focusedScreenIdx--; ScreenBackgrounds._updateFocusedScreen(); } }
    }
    // Presentation nav
    if ($('#pres-overlay').classList.contains('on')) {
        if (e.key === 'ArrowRight' && presIdx < curApp.screens.length - 1) { presIdx++; updatePres(); }
        if (e.key === 'ArrowLeft' && presIdx > 0) { presIdx--; updatePres(); }
    }
    // Delete connections
    if (e.key === 'Delete' || e.key === 'Backspace') { if (connections[curApp.id]) { connections[curApp.id] = []; save(); drawConnections(); toast('Connections cleared'); } }
});

// ── MINIMAP ──
function updateMinimap() {
    if (!curApp) return; const mc = $('#mm-canvas'), ctx = mc.getContext('2d'); mc.width = 180; mc.height = 110; ctx.clearRect(0, 0, 180, 110);
    const appP = positions[pK(curApp.id)]; if (!appP) return;
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    curApp.screens.forEach(s => { const p = appP[s]; if (!p) return; a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x + PW); d = Math.max(d, p.y + PH); });
    const pad = 50; a -= pad; b -= pad; c += pad; d += pad; const cw = c - a, ch = d - b, sc = Math.min(180 / cw, 110 / ch);
    curApp.screens.forEach(s => { const p = appP[s]; if (!p) return; const k = aK(curApp.id, s), ann = getA(k); ctx.fillStyle = ann.starred ? '#fbbf24' : s === selScreen ? '#818cf8' : multiSel.has(s) ? '#38bdf8' : '#3f3f46'; ctx.fillRect((p.x - a) * sc, (p.y - b) * sc, PW * sc, PH * sc); });
    const ar = $('#canvas-area'), vpL = (-camX) / zoom, vpT = (-camY) / zoom, vpW = ar.clientWidth / zoom, vpH = ar.clientHeight / zoom;
    const vp = $('#mm-vp'); vp.style.left = ((vpL - a) * sc) + 'px'; vp.style.top = ((vpT - b) * sc) + 'px'; vp.style.width = (vpW * sc) + 'px'; vp.style.height = (vpH * sc) + 'px';
}

// ── LOAD APP ──
function loadApp(app) {
    curApp = app; window.curApp = app; selScreen = null; window.selScreen = null; multiSel.clear(); closePanel();
    $('#app-title').innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle">${app.icon}</span> ${app.name}`;
    $('#screen-count').textContent = `${app.screens.length} screens`;
    renderSidebar(); renderCanvas(); setTimeout(fitAll, 200);
}

// ── INIT ──
renderSidebar();
// Initialize Screen Creator first (loads custom apps/screens from IndexedDB before first render)
if (typeof ScreenCreator !== 'undefined') {
    ScreenCreator.init().then(() => { loadApp(APPS[0]); });
} else { loadApp(APPS[0]); }
if (typeof AppPlanner !== 'undefined') AppPlanner.init();
if (typeof ElementInspector !== 'undefined') ElementInspector.init();
if (typeof VisualEditor !== 'undefined') VisualEditor.init();
if (typeof DesignTokens !== 'undefined') DesignTokens.init();
if (typeof StylePresets !== 'undefined') StylePresets.init();
if (typeof ScreenBackgrounds !== 'undefined') ScreenBackgrounds.init();
if (typeof DesignCompare !== 'undefined') DesignCompare.init();
if (typeof AnnotationCanvas !== 'undefined') AnnotationCanvas.init();
if (typeof AccessibilityScanner !== 'undefined') AccessibilityScanner.init();
if (typeof ResponsivePreview !== 'undefined') ResponsivePreview.init();
if (typeof CodeExport !== 'undefined') CodeExport.init();
$('#btn-inspect')?.addEventListener('click', () => { if (typeof ElementInspector !== 'undefined') ElementInspector.toggle(); });
$('#btn-tokens')?.addEventListener('click', () => { if (typeof DesignTokens !== 'undefined') DesignTokens.toggle(); });
$('#btn-presets')?.addEventListener('click', () => { if (typeof StylePresets !== 'undefined') StylePresets.toggle(); });
$('#btn-bg')?.addEventListener('click', () => { if (typeof ScreenBackgrounds !== 'undefined') ScreenBackgrounds.enterFocusedMode(selScreen || null); });
$('#btn-compare')?.addEventListener('click', () => { if (typeof DesignCompare !== 'undefined') DesignCompare.toggle(); });
$('#btn-a11y')?.addEventListener('click', () => { if (typeof AccessibilityScanner !== 'undefined') AccessibilityScanner.toggle(); });
$('#btn-responsive')?.addEventListener('click', () => { if (typeof ResponsivePreview !== 'undefined') ResponsivePreview.toggle(); });
$('#btn-code-export')?.addEventListener('click', () => { if (typeof CodeExport !== 'undefined') CodeExport.toggle(); });
