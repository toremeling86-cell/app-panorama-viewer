// ═══════════════════════════════════════════════════════════════
// DESIGN STUDIO V5 — Unified Background & UI Element Studio
// Two-mode design system with adaptive sub-tools:
//   BACKGROUND MODE:
//     • Gallery: 50+ templates, atmosphere moods (swatch), custom, images
//     • Editor: Visual gradient builder + card isolation + text brightness
//     • Filters: CSS filters on container (brightness, contrast, blur)
//     • FX: Animated backgrounds + regional effects
//   UI ELEMENTS MODE:
//     • Gallery: 96 curated color palettes by industry
//     • Editor: Palette role editor with color pickers
//     • Filters: CSS filters on targeted elements
//     • FX: Element transitions and effects
//   Background Series — save/load per-screen background collections
//   Custom library with save/load/export + edit support
//   Per-screen or global application + full persistence
//   Focused Design Mode — fullscreen interactive design with panel
// ═══════════════════════════════════════════════════════════════

const ScreenBackgrounds = {

    // ── Core State ──
    _panelEl: null,
    _isOpen: false,
    _backgrounds: {},     // { screenId: backgroundDef }
    _globalBg: null,
    _filters: {},         // { screenId: filterDef } — UI element filters (applied to iframe)
    _globalFilters: null, // global UI filter values
    _bgFilters: {},       // { screenId: filterDef } — Background filters (applied to .sb-bg-layer)
    _globalBgFilters: null, // global background filter values
    _activeTheme: null,   // { paletteId, colors[], targets[] } — injected CSS theme
    _regions: {},         // { screenId: [{ x, y, w, h, gradient, opacity }] }
    _cardOpacity: 0,      // 0 = glass (default), 100 = fully solid
    _textBrightness: 100, // 50-150%, controls text brightness in iframes
    _focusedMode: false,  // focused design mode active
    _focusedScreenIdx: 0, // index in curApp.screens for focused mode
    _focusedScope: 'screen', // 'screen' | 'all' — scope for Screen Editor operations
    _lastAppliedPresetId: null, // track last applied preset for save attribution

    // ── Design Studio State ──
    _studioMode: 'background', // 'background' | 'elements'
    _activeSubTool: 'gallery',  // 'gallery' | 'editor' | 'adjust' | 'fx'
    _activeTab: 'design',       // 'design' | 'effects' | 'inspect' (Screen Editor tabs)
    _activeCatFilter: 'all',

    /** Re-render the correct panel based on context */
    _refreshPanel() {
        if (this._focusedMode) this._renderFocusedPanel();
        else this._render();
    },

    // ── Element Targeting (UI Elements mode) ──
    _elementTargets: ['all'],   // ['all'] | ['buttons', 'cards', 'text', ...]
    ELEMENT_TARGETS: [
        { id: 'all', label: 'All', icon: '', selectors: '*' },
        { id: 'buttons', label: 'Buttons', icon: '', selectors: 'button, [type="submit"], .btn, [class*="button"], [class*="btn"]' },
        { id: 'cards', label: 'Cards', icon: '', selectors: '.card, [class*="card"], [class*="panel"], .glass, .glass-v, .glass-bright, [class*="medical-card"]' },
        { id: 'text', label: 'Text', icon: '', selectors: 'h1, h2, h3, h4, h5, h6, p, span, label, .text, [class*="title"], [class*="label"]' },
        { id: 'nav', label: 'Nav', icon: '', selectors: 'nav, header, [class*="nav"], [class*="tab"], [class*="header"], [class*="bar"]' },
        { id: 'icons', label: 'Icons', icon: '', selectors: '.material-symbols-outlined, svg, [class*="icon"], i[class]' },
        { id: 'inputs', label: 'Inputs', icon: '', selectors: 'input, textarea, select, [class*="input"], [class*="field"]' }
    ],

    // ── Custom Library ──
    _customLibrary: { backgrounds: [], palettes: [], series: [] },

    // ── Gradient Builder State ──
    _gradientStops: [
        { color: '#1a0533', position: 0 },
        { color: '#7c3aed', position: 50 },
        { color: '#4c1d95', position: 100 }
    ],
    _gradientAngle: 135,
    _gradientType: 'linear', // 'linear' | 'radial' | 'conic'
    _gradientRadialX: 50,
    _gradientRadialY: 50,
    _selectedStop: 0,

    // ── Palette Editor State ──
    _editingPalette: null,   // { colors: [...6 hex], name: '' }

    // ── Animation State ──
    _activeAnimation: null,
    ANIMATIONS: [
        {
            id: 'drift', name: 'Drift', desc: 'Gradient slowly shifts position',
            keyframes: `@keyframes sb-drift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }`,
            style: 'background-size:400% 400%;animation:sb-drift 15s ease infinite;'
        },
        {
            id: 'pulse', name: 'Pulse', desc: 'Background gently breathes',
            keyframes: `@keyframes sb-pulse { 0%{opacity:0.7} 50%{opacity:1} 100%{opacity:0.7} }`,
            style: 'animation:sb-pulse 4s ease-in-out infinite;'
        },
        {
            id: 'shimmer', name: 'Shimmer', desc: 'Reflective glint sweeps across',
            keyframes: `@keyframes sb-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`,
            style: 'background-size:200% 100%;animation:sb-shimmer 8s linear infinite;'
        },
        {
            id: 'aurora', name: 'Aurora', desc: 'Northern lights color shift',
            keyframes: `@keyframes sb-aurora { 0%{filter:hue-rotate(0deg)} 50%{filter:hue-rotate(60deg)} 100%{filter:hue-rotate(0deg)} }`,
            style: 'animation:sb-aurora 12s ease-in-out infinite;'
        },
        {
            id: 'wave', name: 'Wave', desc: 'Undulating color flow',
            keyframes: `@keyframes sb-wave { 0%{background-position:0% 0%} 25%{background-position:100% 0%} 50%{background-position:100% 100%} 75%{background-position:0% 100%} 100%{background-position:0% 0%} }`,
            style: 'background-size:300% 300%;animation:sb-wave 20s ease infinite;'
        }
    ],

    // ── Default filter values ──
    DEFAULT_FILTERS: {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        'hue-rotate': 0,
        blur: 0,
        opacity: 100,
        grayscale: 0,
        sepia: 0,
        invert: 0
    },

    FILTER_META: [
        { key: 'brightness', label: 'Brightness', icon: '', min: 0, max: 200, unit: '%', step: 1 },
        { key: 'contrast', label: 'Contrast', icon: '', min: 0, max: 200, unit: '%', step: 1 },
        { key: 'saturate', label: 'Saturation', icon: '', min: 0, max: 200, unit: '%', step: 1 },
        { key: 'hue-rotate', label: 'Hue Rotate', icon: '', min: 0, max: 360, unit: 'deg', step: 1 },
        { key: 'blur', label: 'Blur', icon: '', min: 0, max: 10, unit: 'px', step: 0.1 },
        { key: 'opacity', label: 'Opacity', icon: '', min: 0, max: 100, unit: '%', step: 1 },
        { key: 'grayscale', label: 'Grayscale', icon: '', min: 0, max: 100, unit: '%', step: 1 },
        { key: 'sepia', label: 'Sepia', icon: '', min: 0, max: 100, unit: '%', step: 1 },
        { key: 'invert', label: 'Invert', icon: '', min: 0, max: 100, unit: '%', step: 1 }
    ],

    // ── Preset Library ──
    PRESETS: [
        {
            id: 'aurora-night', name: 'Aurora Night', category: 'gradient',
            css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        },
        {
            id: 'ocean-blue', name: 'Ocean Blue', category: 'gradient',
            css: 'linear-gradient(135deg, #0c1445 0%, #1a3a6b 40%, #0f5e9c 100%)'
        },
        {
            id: 'sunset-glow', name: 'Sunset Glow', category: 'gradient',
            css: 'linear-gradient(135deg, #1a0a2e 0%, #5b2c6f 40%, #c0392b 80%, #e67e22 100%)'
        },
        {
            id: 'mint-fresh', name: 'Mint Fresh', category: 'gradient',
            css: 'linear-gradient(135deg, #0a1628 0%, #0d3b3e 50%, #115e59 100%)'
        },
        {
            id: 'purple-haze', name: 'Purple Haze', category: 'gradient',
            css: 'linear-gradient(135deg, #1a0533 0%, #4c1d95 50%, #7c3aed 100%)'
        },
        {
            id: 'rose-gold', name: 'Rose Gold', category: 'gradient',
            css: 'linear-gradient(135deg, #1a0a0a 0%, #6b2142 40%, #c77dba 100%)'
        },
        {
            id: 'cyber-neon', name: 'Cyber Neon', category: 'gradient',
            css: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 30%, #00d4ff 60%, #0a0a1a 100%)'
        },
        {
            id: 'forest-deep', name: 'Forest Deep', category: 'gradient',
            css: 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #2d5a27 100%)'
        },
        {
            id: 'mesh-violet', name: 'Mesh Violet', category: 'mesh',
            css: 'radial-gradient(at 20% 20%, #4c1d95 0%, transparent 50%), radial-gradient(at 80% 80%, #7c3aed 0%, transparent 50%), radial-gradient(at 50% 50%, #1e1b4b 0%, transparent 80%), #0f0a1f'
        },
        {
            id: 'mesh-ocean', name: 'Mesh Ocean', category: 'mesh',
            css: 'radial-gradient(at 30% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(at 70% 80%, #0ea5e9 0%, transparent 50%), radial-gradient(at 50% 50%, #0c2a4a 0%, transparent 80%), #060e1a'
        },
        {
            id: 'mesh-emerald', name: 'Mesh Emerald', category: 'mesh',
            css: 'radial-gradient(at 20% 80%, #065f46 0%, transparent 50%), radial-gradient(at 80% 20%, #10b981 0%, transparent 50%), radial-gradient(at 50% 50%, #052e16 0%, transparent 80%), #040d0a'
        },
        {
            id: 'mesh-fire', name: 'Mesh Fire', category: 'mesh',
            css: 'radial-gradient(at 30% 70%, #b91c1c 0%, transparent 50%), radial-gradient(at 70% 30%, #f97316 0%, transparent 50%), radial-gradient(at 50% 50%, #451a03 0%, transparent 80%), #0a0402'
        },
        {
            id: 'glass-frost', name: 'Glass Frost', category: 'glass',
            css: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
        },
        {
            id: 'glass-dark', name: 'Glass Dark', category: 'glass',
            css: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)'
        },
        { id: 'solid-midnight', name: 'Midnight', category: 'solid', css: '#0a0a1a' },
        { id: 'solid-charcoal', name: 'Charcoal', category: 'solid', css: '#1a1a2e' },
        { id: 'solid-navy', name: 'Navy', category: 'solid', css: '#0c1445' },
        { id: 'solid-wine', name: 'Wine', category: 'solid', css: '#2a0a1a' },
        { id: 'solid-white', name: 'White', category: 'solid', css: '#ffffff' },
        { id: 'solid-cream', name: 'Cream', category: 'solid', css: '#faf5e4' },
        // ── NEW Phase 1 Presets ──
        { id: 'golden-dusk', name: 'Golden Dusk', category: 'warm', css: 'linear-gradient(135deg, #1a0e05 0%, #6b3a0a 40%, #d4a017 80%, #f5c542 100%)' },
        { id: 'ember-glow', name: 'Ember Glow', category: 'warm', css: 'linear-gradient(135deg, #1a0505 0%, #8b1a1a 50%, #e74c3c 100%)' },
        { id: 'peach-sorbet', name: 'Peach Sorbet', category: 'warm', css: 'linear-gradient(135deg, #2d1b13 0%, #c46b3a 40%, #f5a67d 80%, #fcd5c0 100%)' },
        { id: 'volcanic', name: 'Volcanic', category: 'warm', css: 'linear-gradient(180deg, #0a0a0a 0%, #3d0c02 40%, #b71c1c 70%, #ff6f00 100%)' },
        { id: 'copper-bloom', name: 'Copper Bloom', category: 'warm', css: 'radial-gradient(at 40% 60%, #b87333 0%, transparent 60%), radial-gradient(at 70% 30%, #cd7f32 0%, transparent 50%), #1a0e05' },
        { id: 'arctic-blue', name: 'Arctic Blue', category: 'cool', css: 'linear-gradient(135deg, #05101a 0%, #0e2f4a 40%, #1a6b91 80%, #a8dadc 100%)' },
        { id: 'glacier', name: 'Glacier', category: 'cool', css: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 40%, #4fc3f7 80%, #e0f7fa 100%)' },
        { id: 'deep-sapphire', name: 'Deep Sapphire', category: 'cool', css: 'radial-gradient(at 50% 50%, #0d47a1 0%, transparent 60%), radial-gradient(at 80% 20%, #1565c0 0%, transparent 50%), #050a14' },
        { id: 'frozen-tundra', name: 'Frozen Tundra', category: 'cool', css: 'linear-gradient(135deg, #0a0a14 0%, #1a2a3e 30%, #4a8ba8 70%, #b0d4e8 100%)' },
        { id: 'neon-pink', name: 'Neon Pink', category: 'neon', css: 'linear-gradient(135deg, #0a0a0f 0%, #2d0a2e 30%, #ff0080 60%, #0a0a0f 100%)' },
        { id: 'neon-green', name: 'Neon Green', category: 'neon', css: 'linear-gradient(135deg, #0a0f0a 0%, #0a2e0a 30%, #00ff41 60%, #0a0f0a 100%)' },
        { id: 'neon-blue', name: 'Neon Blue', category: 'neon', css: 'linear-gradient(135deg, #0a0a14 0%, #0a0a3e 30%, #00d4ff 60%, #0a0a14 100%)' },
        { id: 'retrowave', name: 'Retrowave', category: 'neon', css: 'linear-gradient(180deg, #0a0a1a 0%, #3d0f5b 30%, #ff006e 60%, #ffbe0b 100%)' },
        { id: 'matrix', name: 'Matrix', category: 'neon', css: 'linear-gradient(180deg, #000000 0%, #003300 50%, #00ff41 100%)' },
        { id: 'terracotta', name: 'Terracotta', category: 'earth', css: 'linear-gradient(135deg, #1a0e08 0%, #8b4513 50%, #cd853f 100%)' },
        { id: 'moss-stone', name: 'Moss Stone', category: 'earth', css: 'linear-gradient(135deg, #0a0f0a 0%, #2e3d1a 40%, #6b8e23 80%, #9eb85e 100%)' },
        { id: 'desert-sand', name: 'Desert Sand', category: 'earth', css: 'linear-gradient(135deg, #1a140a 0%, #8b7355 50%, #d4b896 100%)' },
        { id: 'clay-canyon', name: 'Clay Canyon', category: 'earth', css: 'radial-gradient(at 30% 70%, #a0522d 0%, transparent 50%), radial-gradient(at 70% 30%, #cd853f 0%, transparent 50%), #1a0e08' },
        { id: 'aurora-green', name: 'Aurora Green', category: 'aurora', css: 'linear-gradient(180deg, #0a0014 0%, #0a1a2e 30%, #00c853 60%, #b9f6ca 85%, #0a0014 100%)' },
        { id: 'aurora-pink', name: 'Aurora Pink', category: 'aurora', css: 'linear-gradient(180deg, #0a0014 0%, #1a0a2e 30%, #ff4081 60%, #ff80ab 85%, #0a0014 100%)' },
        { id: 'aurora-blue', name: 'Aurora Blue', category: 'aurora', css: 'linear-gradient(180deg, #0a0014 0%, #0a0a3e 30%, #448aff 60%, #82b1ff 85%, #0a0014 100%)' },
        { id: 'mesh-gold', name: 'Mesh Gold', category: 'mesh', css: 'radial-gradient(at 25% 25%, #b8860b 0%, transparent 50%), radial-gradient(at 75% 75%, #daa520 0%, transparent 50%), radial-gradient(at 50% 50%, #2d1b05 0%, transparent 80%), #0a0702' },
        { id: 'mesh-rose', name: 'Mesh Rose', category: 'mesh', css: 'radial-gradient(at 30% 80%, #e91e63 0%, transparent 50%), radial-gradient(at 70% 20%, #f48fb1 0%, transparent 50%), radial-gradient(at 50% 50%, #2d0a14 0%, transparent 80%), #0a0205' },
        { id: 'mesh-arctic', name: 'Mesh Arctic', category: 'mesh', css: 'radial-gradient(at 20% 30%, #0288d1 0%, transparent 50%), radial-gradient(at 80% 70%, #4fc3f7 0%, transparent 50%), radial-gradient(at 50% 50%, #01579b 0%, transparent 80%), #020a14' },
        { id: 'mesh-sunset', name: 'Mesh Sunset', category: 'mesh', css: 'radial-gradient(at 20% 80%, #e65100 0%, transparent 50%), radial-gradient(at 80% 20%, #ff6d00 0%, transparent 40%), radial-gradient(at 50% 50%, #4a148c 0%, transparent 60%), #0a0205' },
        { id: 'solid-obsidian', name: 'Obsidian', category: 'solid', css: '#000000' },
        { id: 'solid-slate', name: 'Slate', category: 'solid', css: '#1e293b' },
        { id: 'solid-emerald', name: 'Emerald', category: 'solid', css: '#064e3b' },
        { id: 'solid-amber', name: 'Amber', category: 'solid', css: '#451a03' }
    ],

    CATEGORIES: [
        { id: 'all', name: 'All', icon: '' },
        { id: 'gradient', name: 'Gradients', icon: '' },
        { id: 'mesh', name: 'Mesh', icon: '' },
        { id: 'warm', name: 'Warm', icon: '' },
        { id: 'cool', name: 'Cool', icon: '' },
        { id: 'neon', name: 'Neon', icon: '' },
        { id: 'earth', name: 'Earth', icon: '' },
        { id: 'aurora', name: 'Aurora', icon: '' },
        { id: 'glass', name: 'Glass', icon: '' },
        { id: 'solid', name: 'Solid', icon: '' },
        { id: 'atmos', name: 'Moods', icon: '' },
        { id: 'custom', name: 'Custom', icon: '' },
        { id: 'images', name: 'Images', icon: '' }
    ],

    // ── Curated Color Palettes (sourced from Antigravity Kit colors.csv) ──
    // Converted to dark-mode using Material Design guidelines:
    // Deep/Surface = tinted dark from Primary hue, accents desaturated for dark bg
    PALETTES: [
        { id: 'kit-saas-general', name: 'Trust Blue', cat: 'SaaS', colors: ['#050b1a', '#0e182f', '#2764e7', '#4786eb', '#e77727', '#e2e4e9'] },
        { id: 'kit-micro-saas', name: 'Indigo Primary', cat: 'SaaS', colors: ['#05051a', '#0e0e2f', '#686aee', '#4354ea', '#14b37e', '#e2e2e9'] },
        { id: 'kit-ecommerce', name: 'Success Green', cat: 'Commerce', colors: ['#051a13', '#0e2f25', '#0f8a63', '#14b37e', '#e77727', '#e2e9e7'] },
        { id: 'kit-ecommerce-luxury', name: 'Premium Dark', cat: 'Commerce', colors: ['#110f0e', '#221e1c', '#1c1917', '#44403c', '#b88414', '#e8e5e3'] },
        { id: 'kit-service-landing', name: 'Sky Blue Trust', cat: 'General', colors: ['#05131a', '#0e252f', '#189edc', '#47baeb', '#e77727', '#e2e7e9'] },
        { id: 'kit-b2b-service', name: 'Professional Navy', cat: 'General', colors: ['#080c16', '#10192d', '#0f1729', '#344256', '#106593', '#e2e4e9'] },
        { id: 'kit-financial-dash', name: 'Dark Finance', cat: 'Fintech', colors: ['#080c16', '#10192d', '#0f1729', '#1d283a', '#21c45d', '#e2e4e9'] },
        { id: 'kit-analytics-dash', name: 'Blue Data', cat: 'General', colors: ['#050a1a', '#0e162f', '#1e3fae', '#4786eb', '#e69b19', '#e2e3e9'] },
        { id: 'kit-healthcare', name: 'Calm Cyan', cat: 'Health', colors: ['#05161a', '#0e292f', '#1288a5', '#27cde7', '#0f8a63', '#e2e8e9'] },
        { id: 'kit-education', name: 'Playful Indigo', cat: 'Education', colors: ['#06051a', '#0f0e2f', '#5048e5', '#4354ea', '#e77727', '#e2e2e9'] },
        { id: 'kit-creative-agency', name: 'Bold Pink', cat: 'Creative', colors: ['#1a050f', '#2f0e1f', '#eb4799', '#f075b5', '#16abc5', '#e9e2e6'] },
        { id: 'kit-portfolio', name: 'Monochrome', cat: 'Creative', colors: ['#0e0e10', '#1d1d20', '#18181b', '#3f3f46', '#2764e7', '#e4e4e7'] },
        { id: 'kit-gaming', name: 'Neon Purple', cat: 'Gaming', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#eb4763', '#e4e2e9'] },
        { id: 'kit-government', name: 'High Contrast Navy', cat: 'Public Good', colors: ['#080c16', '#10192d', '#0f1729', '#344256', '#106593', '#e2e4e9'] },
        { id: 'kit-fintech-crypto', name: 'Gold Trust', cat: 'Fintech', colors: ['#1a1205', '#2f230e', '#e69b19', '#e9b635', '#8d63ee', '#e9e7e2'] },
        { id: 'kit-social-media', name: 'Vibrant Rose', cat: 'Social', colors: ['#1a0509', '#2f0e15', '#e21d48', '#e93550', '#2764e7', '#e9e2e3'] },
        { id: 'kit-productivity', name: 'Teal Focus', cat: 'Work & HR', colors: ['#051a18', '#0e2f2d', '#109388', '#14b8a5', '#e77727', '#e2e9e9'] },
        { id: 'kit-design-system', name: 'Indigo Brand', cat: 'Creative', colors: ['#06051a', '#0f0e2f', '#5048e5', '#686aee', '#e77727', '#e2e2e9'] },
        { id: 'kit-ai-chatbot', name: 'AI Purple', cat: 'Tech & Science', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#16abc5', '#e4e2e9'] },
        { id: 'kit-nft-web3', name: 'Purple Tech', cat: 'General', colors: ['#0b051a', '#180e2f', '#8d63ee', '#744ceb', '#e9b635', '#e4e2e9'] },
        { id: 'kit-creator-economy', name: 'Creator Pink', cat: 'Creator Economy', colors: ['#1a050f', '#2f0e1f', '#eb4799', '#f075b5', '#e77727', '#e9e2e6'] },
        { id: 'kit-sustainability', name: 'Nature Green', cat: 'Tech & Science', colors: ['#051a13', '#0e2f25', '#0f8a63', '#14b37e', '#1288a5', '#e2e9e7'] },
        { id: 'kit-remote-work', name: 'Calm Indigo', cat: 'Work & HR', colors: ['#05051a', '#0e0e2f', '#686aee', '#4354ea', '#14b37e', '#e2e2e9'] },
        { id: 'kit-mental-health', name: 'Calming Lavender', cat: 'Health', colors: ['#0b051a', '#180e2f', '#8d63ee', '#8e75f0', '#14b37e', '#e4e2e9'] },
        { id: 'kit-pet-tech', name: 'Playful Orange', cat: 'Nature & Eco', colors: ['#1a0e05', '#2f1c0e', '#e77727', '#eb944c', '#2764e7', '#e9e5e2'] },
        { id: 'kit-smart-home', name: 'Dark Tech', cat: 'Property & Home', colors: ['#0a0e14', '#151c29', '#1d283a', '#344256', '#21c45d', '#e2e5e9'] },
        { id: 'kit-ev-charging', name: 'Electric Cyan', cat: 'Transport', colors: ['#05161a', '#0e292f', '#1288a5', '#27cde7', '#21c45d', '#e2e8e9'] },
        { id: 'kit-subscription-box', name: 'Excitement Purple', cat: 'Creator Economy', colors: ['#17051a', '#2b0e2f', '#d64ceb', '#d33eea', '#e77727', '#e8e2e9'] },
        { id: 'kit-podcast', name: 'Dark Audio', cat: 'Media', colors: ['#090816', '#12102d', '#1e1b4b', '#312e7f', '#e77727', '#e2e2e9'] },
        { id: 'kit-dating', name: 'Romantic Rose', cat: 'Social', colors: ['#1a0509', '#2f0e15', '#e21d48', '#e93550', '#e77727', '#e9e2e3'] },
        { id: 'kit-credentials', name: 'Trust Blue', cat: 'Education', colors: ['#05131a', '#0e242f', '#106593', '#189edc', '#b88414', '#e2e7e9'] },
        { id: 'kit-knowledge-base', name: 'Neutral Grey', cat: 'Education', colors: ['#0c0f12', '#191e24', '#48566a', '#65758b', '#2764e7', '#e2e5e9'] },
        { id: 'kit-hyperlocal', name: 'Location Green', cat: 'General', colors: ['#051a13', '#0e2f25', '#0f8a63', '#14b37e', '#e77727', '#e2e9e7'] },
        { id: 'kit-beauty-spa', name: 'Soft Pink', cat: 'Health', colors: ['#1a050f', '#2f0e1f', '#eb4799', '#ee68b2', '#8d63ee', '#e9e2e6'] },
        { id: 'kit-luxury-premium', name: 'Premium Black', cat: 'Luxury', colors: ['#110f0e', '#221e1c', '#1c1917', '#44403c', '#b88414', '#e8e5e3'] },
        { id: 'kit-restaurant', name: 'Appetizing Red', cat: 'Food & Drink', colors: ['#1a0505', '#2f0e0e', '#dc2828', '#e93535', '#b88414', '#e9e2e2'] },
        { id: 'kit-fitness-gym', name: 'Energy Orange', cat: 'Health', colors: ['#1a0e05', '#2f1c0e', '#e77727', '#eb944c', '#21c45d', '#e9e5e2'] },
        { id: 'kit-real-estate', name: 'Trust Teal', cat: 'Property & Home', colors: ['#051a18', '#0e2f2d', '#0f756d', '#14b8a5', '#106593', '#e2e9e9'] },
        { id: 'kit-travel-tourism', name: 'Sky Blue', cat: 'Travel', colors: ['#05131a', '#0e252f', '#189edc', '#47baeb', '#e77727', '#e2e7e9'] },
        { id: 'kit-hotel', name: 'Luxury Navy', cat: 'Travel', colors: ['#060b19', '#0e172f', '#1e3b8a', '#4786eb', '#b88414', '#e2e4e9'] },
        { id: 'kit-wedding', name: 'Romantic Pink', cat: 'Luxury', colors: ['#1a050e', '#2f0e1d', '#db2979', '#f075b5', '#b88414', '#e9e2e5'] },
        { id: 'kit-legal', name: 'Authority Navy', cat: 'Professional', colors: ['#060b19', '#0e172f', '#1e3b8a', '#1e3fae', '#aa5413', '#e2e4e9'] },
        { id: 'kit-insurance', name: 'Security Blue', cat: 'Fintech', colors: ['#05131a', '#0e242f', '#106593', '#189edc', '#21c45d', '#e2e7e9'] },
        { id: 'kit-banking', name: 'Trust Navy', cat: 'Fintech', colors: ['#080c16', '#10192d', '#0f1729', '#1e3b8a', '#b88414', '#e2e4e9'] },
        { id: 'kit-elearning', name: 'Progress Teal', cat: 'Education', colors: ['#051a18', '#0e2f2d', '#109388', '#2bd4bd', '#e77727', '#e2e9e9'] },
        { id: 'kit-nonprofit', name: 'Compassion Blue', cat: 'Public Good', colors: ['#05161a', '#0e292f', '#1288a5', '#27cde7', '#e77727', '#e2e8e9'] },
        { id: 'kit-music-stream', name: 'Dark Audio', cat: 'Media', colors: ['#090816', '#12102d', '#1e1b4b', '#463acb', '#21c45d', '#e2e2e9'] },
        { id: 'kit-video-stream', name: 'Cinema Dark', cat: 'Media', colors: ['#090915', '#12122b', '#0f0f24', '#1e1b4b', '#e21d48', '#e2e2e9'] },
        { id: 'kit-job-board', name: 'Professional Blue', cat: 'Work & HR', colors: ['#05131a', '#0e242f', '#106593', '#189edc', '#21c45d', '#e2e7e9'] },
        { id: 'kit-marketplace', name: 'Trust Purple', cat: 'Commerce', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#21c45d', '#e4e2e9'] },
        { id: 'kit-logistics', name: 'Tracking Blue', cat: 'Transport', colors: ['#050b1a', '#0e182f', '#2764e7', '#4786eb', '#e77727', '#e2e4e9'] },
        { id: 'kit-agriculture', name: 'Earth Green', cat: 'Nature & Eco', colors: ['#051a0c', '#0e2f1a', '#157f3c', '#21c45d', '#b88414', '#e2e9e4'] },
        { id: 'kit-construction', name: 'Industrial Grey', cat: 'Property & Home', colors: ['#0d0f12', '#1a1e23', '#65758b', '#94a3b8', '#e77727', '#e2e5e9'] },
        { id: 'kit-automotive', name: 'Premium Dark', cat: 'Transport', colors: ['#0a0e14', '#151c29', '#1d283a', '#344256', '#dc2828', '#e2e5e9'] },
        { id: 'kit-photography', name: 'Pure Black', cat: 'Creative', colors: ['#0e0e10', '#1d1d20', '#18181b', '#27272a', '#c2d4e5', '#e4e4e7'] },
        { id: 'kit-coworking', name: 'Energetic Amber', cat: 'Property & Home', colors: ['#1a1205', '#2f230e', '#e69b19', '#e9b635', '#2764e7', '#e9e7e2'] },
        { id: 'kit-cleaning', name: 'Fresh Cyan', cat: 'Property & Home', colors: ['#05161a', '#0e292f', '#1288a5', '#27cde7', '#21c45d', '#e2e8e9'] },
        { id: 'kit-home-services', name: 'Professional Blue', cat: 'Property & Home', colors: ['#050a1a', '#0e162f', '#1e3fae', '#4786eb', '#e77727', '#e2e3e9'] },
        { id: 'kit-childcare', name: 'Soft Pink', cat: 'Family', colors: ['#1a0510', '#2f0e1f', '#f075b5', '#f28cc6', '#21c45d', '#e9e2e6'] },
        { id: 'kit-senior-care', name: 'Calm Blue', cat: 'Health', colors: ['#05131a', '#0e242f', '#106593', '#47baeb', '#21c45d', '#e2e7e9'] },
        { id: 'kit-medical', name: 'Medical Teal', cat: 'Health', colors: ['#05161a', '#0e292f', '#1288a5', '#27cde7', '#21c45d', '#e2e8e9'] },
        { id: 'kit-pharmacy', name: 'Pharmacy Green', cat: 'Health', colors: ['#051a0c', '#0e2f1a', '#157f3c', '#21c45d', '#106593', '#e2e9e4'] },
        { id: 'kit-dental', name: 'Fresh Blue', cat: 'Health', colors: ['#05131a', '#0e252f', '#189edc', '#47baeb', '#e9b635', '#e2e7e9'] },
        { id: 'kit-veterinary', name: 'Caring Teal', cat: 'Health', colors: ['#051a18', '#0e2f2d', '#109388', '#14b8a5', '#e77727', '#e2e9e9'] },
        { id: 'kit-florist', name: 'Natural Green', cat: 'Nature & Eco', colors: ['#051a0c', '#0e2f1a', '#157f3c', '#21c45d', '#eb4799', '#e2e9e4'] },
        { id: 'kit-bakery-cafe', name: 'Warm Brown', cat: 'Food & Drink', colors: ['#1a0d05', '#2f1b0e', '#8e4010', '#aa5413', '#c2d4e5', '#e9e5e2'] },
        { id: 'kit-coffee-shop', name: 'Coffee Brown', cat: 'Food & Drink', colors: ['#1a0c05', '#2f1a0e', '#76350f', '#8e4010', '#e9b635', '#e9e4e2'] },
        { id: 'kit-brewery', name: 'Deep Burgundy', cat: 'Food & Drink', colors: ['#1a0a05', '#2f160e', '#7d2d12', '#ba1c1c', '#b88414', '#e9e4e2'] },
        { id: 'kit-airline', name: 'Sky Blue', cat: 'Travel', colors: ['#060b19', '#0e172f', '#1e3b8a', '#4786eb', '#e77727', '#e2e4e9'] },
        { id: 'kit-news-media', name: 'Breaking Red', cat: 'Publishing', colors: ['#1a0505', '#2f0e0e', '#dc2828', '#eb4747', '#1e3fae', '#e9e2e2'] },
        { id: 'kit-magazine', name: 'Editorial Black', cat: 'Creative', colors: ['#0e0e10', '#1d1d20', '#18181b', '#3f3f46', '#eb4799', '#e4e4e7'] },
        { id: 'kit-freelancer', name: 'Creative Indigo', cat: 'Creator Economy', colors: ['#05051a', '#0e0e2f', '#686aee', '#4354ea', '#21c45d', '#e2e2e9'] },
        { id: 'kit-consulting', name: 'Authority Navy', cat: 'Professional', colors: ['#080c16', '#10192d', '#0f1729', '#344256', '#b88414', '#e2e4e9'] },
        { id: 'kit-marketing', name: 'Bold Pink', cat: 'Creative', colors: ['#1a050f', '#2f0e1f', '#eb4799', '#f075b5', '#16abc5', '#e9e2e6'] },
        { id: 'kit-event-mgmt', name: 'Excitement Purple', cat: 'Work & HR', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#e77727', '#e4e2e9'] },
        { id: 'kit-conference', name: 'Professional Blue', cat: 'Work & HR', colors: ['#050a1a', '#0e162f', '#1e3fae', '#4786eb', '#21c45d', '#e2e3e9'] },
        { id: 'kit-community', name: 'Community Purple', cat: 'Social', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#21c45d', '#e4e2e9'] },
        { id: 'kit-newsletter', name: 'Trust Blue', cat: 'Publishing', colors: ['#05131a', '#0e242f', '#106593', '#189edc', '#e77727', '#e2e7e9'] },
        { id: 'kit-digital-prod', name: 'Digital Indigo', cat: 'Creator Economy', colors: ['#05051a', '#0e0e2f', '#686aee', '#4354ea', '#21c45d', '#e2e2e9'] },
        { id: 'kit-church', name: 'Spiritual Purple', cat: 'Public Good', colors: ['#0c051a', '#1a0e2f', '#7d3eea', '#744ceb', '#b88414', '#e4e2e9'] },
        { id: 'kit-sports', name: 'Team Red', cat: 'Sports', colors: ['#1a0505', '#2f0e0e', '#dc2828', '#eb4747', '#e9b635', '#e9e2e2'] },
        { id: 'kit-museum', name: 'Gallery Black', cat: 'Creative', colors: ['#0e0e10', '#1d1d20', '#18181b', '#27272a', '#c2d4e5', '#e4e4e7'] },
        { id: 'kit-theater', name: 'Dramatic Dark', cat: 'Creative', colors: ['#090816', '#12102d', '#1e1b4b', '#312e7f', '#b88414', '#e2e2e9'] },
        { id: 'kit-language-learn', name: 'Learning Indigo', cat: 'Education', colors: ['#06051a', '#0f0e2f', '#5048e5', '#4354ea', '#21c45d', '#e2e2e9'] },
        { id: 'kit-coding-boot', name: 'Terminal Dark', cat: 'Education', colors: ['#080c16', '#10192d', '#0f1729', '#1d283a', '#21c45d', '#e2e4e9'] },
        { id: 'kit-cybersecurity', name: 'Matrix Green', cat: 'Tech & Science', colors: ['#051a0a', '#0e2f16', '#19e64d', '#0d0d0d', '#eb4747', '#e2e9e4'] },
        { id: 'kit-dev-tools', name: 'Code Dark', cat: 'Tech & Science', colors: ['#0a0e14', '#151c29', '#1d283a', '#344256', '#21c45d', '#e2e5e9'] },
        { id: 'kit-biotech', name: 'DNA Blue', cat: 'Tech & Science', colors: ['#05131a', '#0e252f', '#189edc', '#147eb3', '#14b37e', '#e2e7e9'] },
        { id: 'kit-space-tech', name: 'Star White', cat: 'Tech & Science', colors: ['#090f15', '#121f2b', '#c2d4e5', '#94a3b8', '#4786eb', '#e2e6e9'] },
        { id: 'kit-architecture', name: 'Minimal Black', cat: 'Property & Home', colors: ['#0f0f0f', '#1f1f1f', '#171717', '#404040', '#d4af35', '#e6e6e6'] },
        { id: 'kit-quantum', name: 'Quantum Cyan', cat: 'Tech & Science', colors: ['#051a1a', '#0e2f2f', '#19e6e6', '#8671ef', '#e619e6', '#e2e9e9'] },
        { id: 'kit-biohacking', name: 'Bio Red/Blue', cat: 'Health', colors: ['#1a0505', '#2f0e0e', '#ed5e5e', '#5e97ed', '#17cf76', '#e9e2e2'] },
        { id: 'kit-autonomous', name: 'Terminal Green', cat: 'Tech & Science', colors: ['#051a0a', '#0e2f16', '#19e64d', '#0e811c', '#eb4747', '#e2e9e4'] },
        { id: 'kit-gen-ai-art', name: 'Canvas Neutral', cat: 'Creative', colors: ['#0e0e10', '#1d1d20', '#18181b', '#3f3f46', '#eb4799', '#e4e4e7'] },
        { id: 'kit-spatial-os', name: 'Glass White', cat: 'Spatial', colors: ['#0f0f0f', '#1f1f1f', '#d9d9d9', '#bfbfbf', '#197ce6', '#e6e6e6'] },
        { id: 'kit-climate-tech', name: 'Nature Green', cat: 'Nature & Eco', colors: ['#051a13', '#0e2f25', '#0f8a63', '#14b37e', '#e9b635', '#e2e9e7'] },
    ],

    // ── Atmosphere Modes (combined background + filter + region) ──
    ATMOSPHERES: [
        { id: 'cinematic', name: 'Cinematic', bgCss: 'linear-gradient(180deg, #000000 0%, #0a0a1a 100%)', filters: { brightness: 95, contrast: 115, saturate: 90 }, regionPresets: ['top-darken', 'bottom-darken'] },
        { id: 'luxury', name: 'Luxury', bgCss: 'radial-gradient(at 50% 50%, #2d1b05 0%, transparent 70%), #0a0702', filters: { contrast: 110, saturate: 105 }, regionPresets: ['vignette'] },
        { id: 'natural', name: 'Natural', bgCss: 'linear-gradient(135deg, #0a1a14 0%, #1a3a2a 50%, #2d5a3a 100%)', filters: { saturate: 120, 'hue-rotate': 10 }, regionPresets: [] },
        { id: 'vibrant', name: 'Vibrant', bgCss: 'radial-gradient(at 30% 70%, #b91c1c 0%, transparent 50%), radial-gradient(at 70% 30%, #f97316 0%, transparent 50%), #0a0402', filters: { saturate: 130, brightness: 110 }, regionPresets: ['center-glow'] },
        { id: 'minimal', name: 'Minimal', bgCss: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', filters: { brightness: 110, saturate: 70 }, regionPresets: [] },
        { id: 'nightcity', name: 'Night City', bgCss: 'linear-gradient(180deg, #0a0a14 0%, #1a0a3e 50%, #0a0a14 100%)', filters: { contrast: 120, saturate: 115 }, regionPresets: ['bottom-darken'] },
        { id: 'goldenhour', name: 'Golden Hour', bgCss: 'linear-gradient(180deg, #1a0e05 0%, #6b3a0a 40%, #d4a017 80%, #f5c542 100%)', filters: { sepia: 15, saturate: 110 }, regionPresets: ['top-warm'] },
        { id: 'amoled', name: 'AMOLED', bgCss: '#000000', filters: { contrast: 125 }, regionPresets: [] },
        { id: 'glassmorphic', name: 'Glass', bgCss: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', filters: { blur: 0.5, brightness: 105 }, regionPresets: [] },
        { id: 'studio', name: 'Studio', bgCss: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)', filters: {}, regionPresets: [] }
    ],


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('bg-panel');
        this._load();
        this._loadLibrary();
        this._setupEvents();
        if (this._panelEl) {
            FloatingWindows.setupDrag(this._panelEl, this._panelEl.querySelector('.bg-header'));
        }
        // Apply persisted backgrounds after iframes load
        setTimeout(() => this._applyAllSaved(), 1200);
    },

    open(screenId) {
        if (!this._panelEl) return;
        this._isOpen = true;
        this._currentScreenId = screenId || null;
        const pos = FloatingWindows.getStaggeredPosition();
        this._panelEl.style.right = pos.right + 'px';
        this._panelEl.style.top = pos.top + 'px';
        this._panelEl.style.left = 'auto';
        this._panelEl.classList.add('open');
        FloatingWindows.bringToFront(this._panelEl);
        document.getElementById('btn-bg')?.classList.add('on');
        this._render();
    },

    close() {
        this._isOpen = false;
        this._panelEl?.classList.remove('open');
        document.getElementById('btn-bg')?.classList.remove('on');
    },

    toggle(screenId) {
        this._isOpen ? this.close() : this.open(screenId);
    },


    // ═════════════════════════════════════════════════════
    //  APPLYING BACKGROUNDS — INSIDE IFRAME
    // ═════════════════════════════════════════════════════

    /** Apply a preset background inside the iframe body */
    applyPreset(presetId, screenId) {
        const preset = this.PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        if (screenId) {
            this._backgrounds[screenId] = { presetId, ...preset };
            this._applyToScreen(screenId, preset);
        } else {
            this._globalBg = { presetId, ...preset };
            this._eachScreen(sid => this._applyToScreen(sid, preset));
        }
        this._save();
        this._refreshPanel();
        if (this._focusedMode) this._syncFilmstripBackgrounds();
    },

    /** Apply a custom CSS background */
    applyCustom(cssValue, screenId) {
        const bgDef = { presetId: null, name: 'Custom', css: cssValue };
        if (screenId) {
            this._backgrounds[screenId] = bgDef;
            this._applyToScreen(screenId, bgDef);
        } else {
            this._globalBg = bgDef;
            this._eachScreen(sid => {
                if (!this._backgrounds[sid]) this._applyToScreen(sid, bgDef);
            });
        }
        this._save();
        this._refreshPanel();
        if (this._focusedMode) this._syncFilmstripBackgrounds();
    },

    /** Clear background for a screen or globally */
    clearBackground(screenId) {
        if (screenId) {
            delete this._backgrounds[screenId];
            this._clearFromScreen(screenId);
        } else {
            this._globalBg = null;
            this._backgrounds = {};
            this._eachScreen(sid => this._clearFromScreen(sid));
        }
        this._save();
        this._refreshPanel();
        if (this._focusedMode) this._syncFilmstripBackgrounds();
    },

    /**
     * Apply background: set gradient directly on .df container, then make
     * iframe page backgrounds transparent so gradient shows through.
     * UI elements (text, cards, buttons) remain fully visible.
     */
    _applyToScreen(screenId, bgDef) {
        // Focused mode: apply directly to focused iframe (canvas slots still exist behind overlay)
        if (this._focusedMode && this._currentScreenId === screenId) {
            const iframe = document.querySelector('#focused-frame iframe');
            if (iframe) {
                this._injectBackgroundIntoIframe(iframe, screenId, bgDef.css);
            }
            return;
        }

        const slot = document.querySelector(`.ss[data-scr="${screenId}"]`);
        if (!slot) { console.warn('[DS] _applyToScreen: no slot for', screenId); return; }
        const df = slot.querySelector('.df');
        if (!df) { console.warn('[DS] _applyToScreen: no .df for', screenId); return; }

        // Remove legacy overlay if present (from old approach)
        const oldOverlay = df.querySelector('.sb-overlay');
        if (oldOverlay) oldOverlay.remove();

        // 1) Set gradient on .sb-bg-layer (fallback preview + filter target)
        let bgLayer = df.querySelector('.sb-bg-layer');
        if (!bgLayer) {
            bgLayer = document.createElement('div');
            bgLayer.className = 'sb-bg-layer';
            df.insertBefore(bgLayer, df.firstChild);
        }
        bgLayer.style.background = bgDef.css;
        bgLayer.style.opacity = '1';

        // Also set on .df as visual fallback before iframe loads
        df.dataset.sbOrigBg = df.dataset.sbOrigBg || df.style.background || '';
        df.style.background = bgDef.css;
        df.style.transition = 'background 0.4s ease';

        // 2) Inject gradient DIRECTLY into iframe content
        //    This replaces body/wrapper backgrounds with our gradient
        //    while preserving UI element backgrounds (cards, buttons, etc.)
        const iframe = df.querySelector('iframe');
        if (!iframe) { console.warn('[DS] _applyToScreen: no iframe for', screenId); return; }

        this._injectBackgroundIntoIframe(iframe, screenId, bgDef.css);
    },

    /** Inject the gradient directly into iframe content as body + wrapper background.
     *  Instead of making content transparent and hoping parent gradient shows through,
     *  we replace the body/wrapper backgrounds with our gradient directly.
     *  UI element backgrounds (cards, buttons, glass, etc.) are preserved. */
    _injectBackgroundIntoIframe(iframe, screenId, gradientCSS) {

        const doInject = (force) => {
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.head || !doc.body) return false;

                // Skip if already injected with same gradient + card opacity (even on forced retry)
                const existing = doc.getElementById('sb-bg-inject');
                const cardOpKey = String(this._cardOpacity || 0);
                if (existing && existing.dataset.gradient === gradientCSS && existing.dataset.cardOpacity === cardOpKey) return true;
                if (existing) existing.remove();
                // Remove standalone card isolation style (live slider injects separate style)
                const cardIso = doc.getElementById('sb-card-isolation');
                if (cardIso) cardIso.remove();

                const s = doc.createElement('style');
                s.id = 'sb-bg-inject';
                s.dataset.gradient = gradientCSS;
                s.dataset.cardOpacity = cardOpKey;
                s.textContent = `
                    /* ═══ Screen Backgrounds — Direct Gradient Injection ═══ */

                    /* Set gradient on body */
                    html {
                        background: ${gradientCSS} !important;
                    }
                    body {
                        background: transparent !important;
                        background-color: transparent !important;
                    }

                    /* Replace full-page wrapper div background with gradient */
                    body > div:first-child {
                        background: ${gradientCSS} !important;
                        background-color: transparent !important;
                    }

                    /* Remove competing background classes */
                    [class*="glow"], [class*="aurora"], [class*="bio-glow"],
                    [class*="bg-void"], [class*="bg-night"], [class*="bg-parchment"],
                    [class*="night-glow"], [class*="sky-gradient"],
                    [class*="bg-cream"], [class*="bg-warm"], [class*="bg-bg-"],
                    [class*="sonic-"], [class*="zen-"], [class*="contour"],
                    [class*="topo-"], [class*="map-bg"] {
                        background: ${gradientCSS} !important;
                        background-color: transparent !important;
                    }
                    ${this._buildCardIsolationCSS()}
                `;
                doc.head.appendChild(s);
                console.log('[DS] bg injected into', screenId, '| gradient:', gradientCSS?.substring(0, 60));
                return true;
            } catch (e) {
                console.warn('[DS] bg inject FAILED for', screenId, ':', e.message);
                return false;
            }
        };

        // Try immediately
        if (doInject()) {
            // Re-inject once to beat Tailwind CDN dynamic styles (force replaces if style was overridden)
            setTimeout(() => doInject(true), 800);
            return;
        }

        // Poll until iframe is ready (handles lazy loading)
        let attempts = 0;
        const maxAttempts = 25;
        const poll = setInterval(() => {
            attempts++;
            if (doInject() || attempts >= maxAttempts) {
                clearInterval(poll);
                if (attempts < maxAttempts) {
                    setTimeout(() => doInject(true), 800);
                }
            }
        }, 150);
    },

    /** Apply saved background + filters to the presentation-mode iframe.
     *  Presentation mode creates its own iframe in #pres-frame without
     *  .ss/.df wrappers, so _applyToScreen cannot find it. */
    applyToPresentation(screenId) {
        const container = document.getElementById('pres-frame');
        if (!container) return;
        const iframe = container.querySelector('iframe');
        if (!iframe) return;

        // Determine which background to use: per-screen → global → none
        const bgDef = this._backgrounds[screenId] || this._globalBg;
        if (bgDef) {
            container.style.background = bgDef.css;
            container.style.borderRadius = '40px';
            container.style.overflow = 'hidden';

            // Inject gradient directly into iframe content
            this._injectBackgroundIntoIframe(iframe, screenId, bgDef.css);
        }

        // Apply UI element filters to iframe (separate from background)
        const filters = this._filters[screenId] || this._globalFilters;
        if (filters) {
            const parts = [];
            for (const [k, v] of Object.entries(filters)) {
                if (k === 'opacity') continue;
                if (v === this.DEFAULT_FILTERS[k]) continue;
                const unit = k === 'hue-rotate' ? 'deg' : k === 'blur' ? 'px' : '%';
                parts.push(`${k}(${v}${unit})`);
            }
            iframe.style.filter = parts.length ? parts.join(' ') : '';
            iframe.style.opacity = (filters.opacity != null && filters.opacity !== 100) ? (filters.opacity / 100) : '';
        }
    },

    /** Remove background and restore iframe backgrounds */

    _clearFromScreen(screenId) {
        // Focused mode: clear the focused iframe directly (canvas slots still exist behind overlay)
        if (this._focusedMode && this._currentScreenId === screenId) {
            const iframe = document.querySelector('#focused-frame iframe');
            if (iframe) {
                iframe.style.background = '';
                iframe.style.filter = '';
                iframe.style.opacity = '';
                try {
                    const injected = iframe.contentDocument?.getElementById('sb-bg-inject');
                    if (injected) injected.remove();
                    const transparent = iframe.contentDocument?.getElementById('sb-transparent');
                    if (transparent) transparent.remove();
                } catch (e) { }
            }
            const container = document.getElementById('focused-frame');
            if (container) {
                container.style.filter = '';
                container.style.opacity = '';
            }
            return;
        }

        const slot = document.querySelector(`.ss[data-scr="${screenId}"]`);
        if (!slot) return;
        const df = slot.querySelector('.df');
        if (!df) return;
        // Remove legacy overlay if present
        const overlay = df.querySelector('.sb-overlay');
        if (overlay) overlay.remove();
        // Clear bg-layer gradient (keep the element for future use)
        const bgLayer = df.querySelector('.sb-bg-layer');
        if (bgLayer) {
            bgLayer.style.background = '';
            bgLayer.style.opacity = '0';
        }
        // Restore .df background
        df.style.background = df.dataset.sbOrigBg || '';
        df.style.transition = '';
        df.style.filter = '';
        delete df.dataset.sbOrigBg;
        // Restore iframe
        const iframe = df.querySelector('iframe');
        if (iframe) {
            iframe.style.background = '';
            iframe.style.filter = '';
            iframe.style.opacity = '';
            try {
                const s = iframe.contentDocument?.getElementById('sb-transparent');
                if (s) s.remove();
            } catch (e) { }
        }
    },


    // ═════════════════════════════════════════════════════
    //  CSS FILTER ADJUSTMENTS
    // ═════════════════════════════════════════════════════

    /** Get current UI element filters for a screen */
    _getFilters(screenId) {
        if (screenId && this._filters[screenId]) return { ...this._filters[screenId] };
        if (this._globalFilters) return { ...this._globalFilters };
        return { ...this.DEFAULT_FILTERS };
    },

    /** Get current background filters for a screen */
    _getBgFilters(screenId) {
        if (screenId && this._bgFilters[screenId]) return { ...this._bgFilters[screenId] };
        if (this._globalBgFilters) return { ...this._globalBgFilters };
        return { ...this.DEFAULT_FILTERS };
    },

    /** Set a single filter value — mode-aware (background or UI elements) */
    setFilter(key, value, screenId) {
        if (this._studioMode === 'background') {
            // Background filters → applied to .sb-bg-layer
            if (screenId) {
                if (!this._bgFilters[screenId]) this._bgFilters[screenId] = { ...this.DEFAULT_FILTERS };
                this._bgFilters[screenId][key] = value;
                this._applyBgFiltersToScreen(screenId);
            } else {
                if (!this._globalBgFilters) this._globalBgFilters = { ...this.DEFAULT_FILTERS };
                this._globalBgFilters[key] = value;
                this._eachScreen(sid => {
                    if (!this._bgFilters[sid]) this._applyBgFiltersToScreen(sid);
                });
            }
        } else {
            // UI element filters → applied to iframe
            if (screenId) {
                if (!this._filters[screenId]) this._filters[screenId] = { ...this.DEFAULT_FILTERS };
                this._filters[screenId][key] = value;
                this._applyUiFiltersToScreen(screenId);
            } else {
                if (!this._globalFilters) this._globalFilters = { ...this.DEFAULT_FILTERS };
                this._globalFilters[key] = value;
                this._eachScreen(sid => {
                    if (!this._filters[sid]) this._applyUiFiltersToScreen(sid);
                });
            }
        }
        this._save();
    },

    /** Reset all filters to default — mode-aware */
    resetFilters(screenId) {
        if (this._studioMode === 'background') {
            if (screenId) {
                delete this._bgFilters[screenId];
                this._applyBgFiltersToScreen(screenId);
            } else {
                this._globalBgFilters = null;
                this._bgFilters = {};
                this._eachScreen(sid => this._applyBgFiltersToScreen(sid));
            }
        } else {
            if (screenId) {
                delete this._filters[screenId];
                this._applyUiFiltersToScreen(screenId);
            } else {
                this._globalFilters = null;
                this._filters = {};
                this._eachScreen(sid => this._applyUiFiltersToScreen(sid));
            }
        }
        this._save();
        this._refreshPanel();
    },

    /** Apply CSS filters to the background.
     *  Non-opacity filters (brightness, contrast, etc.) → applied as CSS filter on .df
     *  Opacity → applied via .sb-bg-layer as a dimming overlay */
    _applyBgFiltersToScreen(screenId) {
        // Focused mode: apply filters directly to the focused frame container
        if (this._focusedMode && this._currentScreenId === screenId) {
            const iframe = document.querySelector('#focused-frame iframe');
            if (iframe) {
                const f = this._getBgFilters(screenId);
                const filterParts = [];
                for (const meta of this.FILTER_META) {
                    if (meta.key === 'opacity') continue;
                    const val = f[meta.key];
                    const def = this.DEFAULT_FILTERS[meta.key];
                    if (val !== def) {
                        filterParts.push(`${meta.key}(${val}${meta.unit})`);
                    }
                }
                const container = document.getElementById('focused-frame');
                if (container) {
                    container.style.filter = filterParts.length ? filterParts.join(' ') : '';
                    container.style.opacity = (f.opacity != null && f.opacity < 100)
                        ? (f.opacity / 100).toString() : '';
                }
            }
            return;
        }

        const slot = document.querySelector(`.ss[data-scr="${screenId}"]`);
        if (!slot) return;
        const df = slot.querySelector('.df');
        if (!df) return;

        const f = this._getBgFilters(screenId);
        const bgLayer = df.querySelector('.sb-bg-layer');
        if (!bgLayer) return;

        // Build CSS filter string for non-opacity filters (brightness, contrast, etc.)
        const filterParts = [];
        for (const meta of this.FILTER_META) {
            if (meta.key === 'opacity') continue;
            const val = f[meta.key];
            const def = this.DEFAULT_FILTERS[meta.key];
            if (val !== def) {
                filterParts.push(`${meta.key}(${val}${meta.unit})`);
            }
        }
        // Apply filters directly on .sb-bg-layer (doesn't affect iframe)
        bgLayer.style.filter = filterParts.length ? filterParts.join(' ') : '';

        // Opacity → apply directly on .sb-bg-layer
        // Only change opacity if a background is actually set
        const hasBg = bgLayer.style.background && bgLayer.style.background !== 'transparent';
        if (hasBg) {
            bgLayer.style.opacity = (f.opacity != null && f.opacity < 100)
                ? (f.opacity / 100).toString()
                : '1';
        }
    },

    /** Apply CSS filters to the iframe (UI elements only) */
    _applyUiFiltersToScreen(screenId) {
        const iframe = this._getIframe(screenId);
        if (!iframe) return;

        const f = this._getFilters(screenId);
        const parts = [];
        for (const meta of this.FILTER_META) {
            if (meta.key === 'opacity') continue; // handle via style.opacity
            const val = f[meta.key];
            const def = this.DEFAULT_FILTERS[meta.key];
            if (val !== def) {
                parts.push(`${meta.key}(${val}${meta.unit})`);
            }
        }
        iframe.style.filter = parts.length ? parts.join(' ') : '';
        iframe.style.opacity = (f.opacity != null && f.opacity !== 100) ? (f.opacity / 100) : '';
    },

    /** Legacy compat: apply filters to screen — delegates to both layers */
    _applyFiltersToScreen(screenId) {
        this._applyBgFiltersToScreen(screenId);
        this._applyUiFiltersToScreen(screenId);
    },


    // ═════════════════════════════════════════════════════
    //  REGION-BASED EFFECTS
    // ═════════════════════════════════════════════════════

    /** Add a gradient region inside an iframe */
    addRegion(screenId, region) {
        if (!this._regions[screenId]) this._regions[screenId] = [];
        const id = 'sb-region-' + Date.now();
        const regionDef = {
            id,
            x: region.x || 10,       // % from left
            y: region.y || 10,       // % from top
            w: region.w || 80,       // % width
            h: region.h || 30,       // % height
            gradient: region.gradient || 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            opacity: region.opacity ?? 0.8,
            borderRadius: region.borderRadius || 0
        };
        this._regions[screenId].push(regionDef);
        this._applyRegionToScreen(screenId, regionDef);
        this._save();
        this._refreshPanel();
        return id;
    },

    /** Remove a region */
    removeRegion(screenId, regionId) {
        if (!this._regions[screenId]) return;
        this._regions[screenId] = this._regions[screenId].filter(r => r.id !== regionId);
        try {
            const iframe = this._getIframe(screenId);
            iframe?.contentDocument?.getElementById(regionId)?.remove();
        } catch (e) { }
        this._save();
        this._refreshPanel();
    },

    /** Clear all regions */
    clearRegions(screenId) {
        if (this._regions[screenId]) {
            this._regions[screenId].forEach(r => {
                try {
                    const iframe = this._getIframe(screenId);
                    iframe?.contentDocument?.getElementById(r.id)?.remove();
                } catch (e) { }
            });
        }
        this._regions[screenId] = [];
        this._save();
        this._refreshPanel();
    },

    /** Inject a region overlay into iframe */
    _applyRegionToScreen(screenId, regionDef) {
        const iframe = this._getIframe(screenId);
        if (!iframe) return;

        const apply = () => {
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.body) return;

                let el = doc.getElementById(regionDef.id);
                if (!el) {
                    el = doc.createElement('div');
                    el.id = regionDef.id;
                    el.className = 'sb-region-overlay';
                    doc.body.appendChild(el);
                }

                el.style.cssText = `
                    position: fixed;
                    left: ${regionDef.x}%;
                    top: ${regionDef.y}%;
                    width: ${regionDef.w}%;
                    height: ${regionDef.h}%;
                    background: ${regionDef.gradient};
                    opacity: ${regionDef.opacity};
                    border-radius: ${regionDef.borderRadius}px;
                    pointer-events: none;
                    z-index: 9990;
                    transition: all 0.3s ease;
                `;
            } catch (e) { }
        };

        if (iframe.contentDocument?.body) apply();
        iframe.addEventListener('load', apply, { once: true });
    },

    // ── Region preset templates ──
    REGION_PRESETS: [
        {
            name: 'Top Darken', icon: '', x: 0, y: 0, w: 100, h: 35,
            gradient: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)', opacity: 0.9
        },
        {
            name: 'Bottom Darken', icon: '', x: 0, y: 65, w: 100, h: 35,
            gradient: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)', opacity: 0.9
        },
        {
            name: 'Vignette', icon: '', x: 0, y: 0, w: 100, h: 100,
            gradient: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)', opacity: 1
        },
        {
            name: 'Center Glow', icon: '', x: 15, y: 25, w: 70, h: 50,
            gradient: 'radial-gradient(ellipse at center, rgba(129,140,248,0.3) 0%, transparent 70%)', opacity: 0.8
        },
        {
            name: 'Left Accent', icon: '', x: 0, y: 0, w: 8, h: 100,
            gradient: 'linear-gradient(90deg, rgba(129,140,248,0.5) 0%, transparent 100%)', opacity: 0.8
        },
        {
            name: 'Color Wash', icon: '', x: 0, y: 0, w: 100, h: 100,
            gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(59,130,246,0.2) 100%)', opacity: 0.7
        },
        {
            name: 'Top Warm', icon: '', x: 0, y: 0, w: 100, h: 40,
            gradient: 'linear-gradient(180deg, rgba(234,88,12,0.25) 0%, transparent 100%)', opacity: 0.8
        },
        {
            name: 'Bottom Frost', icon: '', x: 0, y: 70, w: 100, h: 30,
            gradient: 'linear-gradient(0deg, rgba(255,255,255,0.15) 0%, transparent 100%)', opacity: 0.9
        }
    ],


    // ═════════════════════════════════════════════════════
    //  RENDERING — DESIGN STUDIO (2-mode + 4-subtool)
    // ═════════════════════════════════════════════════════

    _render() {
        console.log('[DesignStudio] _render() called');
        const body = document.getElementById('bg-body');
        if (!body) { console.warn('[DesignStudio] bg-body NOT FOUND'); return; }

        const screenId = this._currentScreenId;
        const mode = this._studioMode;
        let html = '';

        // ── Screen scope selector ──
        const screens = window.curApp?.screens || [];
        html += `<div class="bg-mode-bar">
            <button class="bg-mode-btn ${!screenId ? 'active' : ''}" data-mode="global">All Screens</button>
            <select class="bg-screen-picker" id="bg-screen-picker">
                <option value="">Per Screen…</option>
                ${screens.map(s => `<option value="${s}" ${screenId === s ? 'selected' : ''}>${s.replace(/^\d+-/, '').replace(/-/g, ' ')}</option>`).join('')}
            </select>
        </div>`;
        if (screenId) {
            const label = screenId.replace(/^\d+-/, '').replace(/-/g, ' ');
            html += `<div class="bg-screen-indicator"><strong>${label}</strong> <button class="bg-screen-clear" id="bg-screen-clear"><span class="material-symbols-outlined" style="font-size:12px">arrow_back</span> Back to All</button></div>`;
        }

        // ── Mode Switch: Background / UI Elements ──
        html += `<div class="ds-mode-switch">
            <button class="ds-mode-btn ${mode === 'background' ? 'active' : ''}" data-studio-mode="background">
                <span class="ds-mode-icon"><span class="material-symbols-outlined" style="font-size:14px">wallpaper</span></span> Background
            </button>
            <button class="ds-mode-btn ${mode === 'elements' ? 'active' : ''}" data-studio-mode="elements">
                <span class="ds-mode-icon"><span class="material-symbols-outlined" style="font-size:14px">palette</span></span> UI Elements
            </button>
        </div>`;

        // ── Element targeting (UI Elements mode only) ──
        if (mode === 'elements') {
            html += `<div class="ds-target-bar">
                <span class="ds-target-label">Target:</span>`;
            this.ELEMENT_TARGETS.forEach(t => {
                const isActive = this._elementTargets.includes(t.id);
                html += `<button class="ds-target-chip ${isActive ? 'active' : ''}" data-target="${t.id}">${t.label}</button>`;
            });
            html += `</div>`;
        }

        // ── Sub-tool tabs (adapt labels per mode) ──
        const subLabels = {
            gallery: mode === 'background' ? '<span class="material-symbols-outlined" style="font-size:13px">palette</span> Gallery' : '<span class="material-symbols-outlined" style="font-size:13px">palette</span> Palettes',
            editor: mode === 'background' ? '<span class="material-symbols-outlined" style="font-size:13px">edit</span> Editor' : '<span class="material-symbols-outlined" style="font-size:13px">brush</span> Editor',
            adjust: '<span class="material-symbols-outlined" style="font-size:13px">tune</span> Filters',
            fx: '<span class="material-symbols-outlined" style="font-size:13px">auto_awesome</span> FX'
        };
        html += `<div class="bg-tab-bar">`;
        for (const [key, label] of Object.entries(subLabels)) {
            html += `<button class="bg-tab ${this._activeSubTool === key ? 'active' : ''}" data-subtool="${key}">${label}</button>`;
        }
        html += `</div>`;

        // ── Sub-tool content ──
        if (this._activeSubTool === 'gallery') {
            html += mode === 'background' ? this._renderBgGallery(screenId) : this._renderUiGallery(screenId);
        } else if (this._activeSubTool === 'editor') {
            html += mode === 'background' ? this._renderBgEditor(screenId) : this._renderUiEditor(screenId);
        } else if (this._activeSubTool === 'adjust') {
            html += this._renderAdjustTool(screenId);
        } else if (this._activeSubTool === 'fx') {
            html += mode === 'background' ? this._renderBgFx(screenId) : this._renderUiFx(screenId);
        }

        body.innerHTML = html;
        try {
            this._wireEvents(body, screenId);
        } catch (err) {
            console.error('[DesignStudio] _wireEvents crashed:', err);
        }
    },


    // ═══════════════════════════════════════
    //  BACKGROUND MODE — Gallery
    // ═══════════════════════════════════════

    _renderBgGallery(screenId) {
        const catFilter = this._activeCatFilter || 'all';
        const currentBg = screenId ? this._backgrounds[screenId] : this._globalBg;
        let html = '';

        // Current background indicator
        if (currentBg) {
            html += `<div class="bg-current">
                <div class="bg-current-preview" style="background:${currentBg.css}"></div>
                <span class="bg-current-name">${currentBg.name || 'Custom'}</span>
                <button class="bg-clear-btn" id="bg-clear"><span class="material-symbols-outlined" style="font-size:12px">close</span> Clear</button>
            </div>`;
        }

        // Category chips
        html += `<div class="bg-cat-strip">`;
        this.CATEGORIES.forEach(c => {
            html += `<span class="bg-cat-chip ${catFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</span>`;
        });
        html += `</div>`;

        // ── Background Series (only if per-screen bgs exist or saved series) ──
        const hasPerScreen = Object.keys(this._backgrounds).length > 0;
        const appSeries = this._customLibrary.series.filter(s => s.appId === (window.curApp?.id || ''));
        if ((catFilter === 'all' || catFilter === 'custom') && (hasPerScreen || appSeries.length > 0)) {
            html += this._renderSeriesSection(screenId, appSeries, hasPerScreen);
        }

        // ── Background Templates (filtered presets) ──
        const templateCats = ['all', 'gradient', 'mesh', 'warm', 'cool', 'neon', 'earth', 'aurora', 'glass', 'solid'];
        if (templateCats.includes(catFilter)) {
            const filtered = catFilter === 'all' ? this.PRESETS : this.PRESETS.filter(p => p.category === catFilter);
            html += `<div class="bg-sub-label" style="margin:8px 0 4px;font-size:9px;color:#71717a">Background Templates</div>`;
            html += `<div class="bg-preset-grid">`;
            filtered.forEach(p => {
                const isActive = currentBg?.presetId === p.id;
                html += `<div class="bg-preset-swatch ${isActive ? 'active' : ''}" data-preset="${p.id}"
                    title="${p.name}" style="background:${p.css}">
                    <span class="bg-preset-name">${p.name}</span>
                    ${isActive ? '<span class="bg-preset-check"><span class="material-symbols-outlined" style="font-size:12px">check</span></span>' : ''}
                </div>`;
            });
            html += `</div>`;
        }

        // ── Atmosphere Moods (swatch style) ──
        if (catFilter === 'atmos' || catFilter === 'all') {
            html += `<div class="bg-sub-label" style="margin:8px 0 4px;font-size:9px;color:#71717a">Atmosphere Moods — one-click mood (bg + filters)</div>`;
            html += `<div class="bg-preset-grid">`;
            this.ATMOSPHERES.forEach(a => {
                html += `<div class="bg-preset-swatch bg-atmo-swatch" data-atmo="${a.id}"
                    title="${a.name}" style="background:${a.bgCss}">
                    <span class="bg-preset-name">${a.name}</span>
                </div>`;
            });
            html += `</div>`;
        }

        // ── Custom Backgrounds (promoted from "My Library") ──
        if (catFilter === 'all' || catFilter === 'custom') {
            html += `<div class="bg-sub-label" style="margin:12px 0 4px">Custom Backgrounds</div>`;
            if (this._customLibrary.backgrounds.length > 0) {
                html += `<div class="bg-preset-grid">`;
                this._customLibrary.backgrounds.forEach(bg => {
                    const isActive = currentBg?.css === bg.css;
                    html += `<div class="bg-preset-swatch ds-lib-item ${isActive ? 'active' : ''}" data-lib-bg="${bg.id}"
                        title="${bg.name}" style="background:${bg.css}">
                        <span class="bg-preset-name">${bg.name}</span>
                        <button class="ds-lib-edit" data-edit-lib-bg="${bg.id}" title="Edit"><span class="material-symbols-outlined" style="font-size:12px">edit</span></button>
                        <button class="ds-lib-del" data-del-lib-bg="${bg.id}" title="Delete"><span class="material-symbols-outlined" style="font-size:12px">close</span></button>
                    </div>`;
                });
                html += `</div>`;
            } else {
                html += `<div class="bg-empty" style="padding:12px;font-size:10px;color:#71717a;text-align:center">
                    No custom backgrounds yet. Use the Editor to create and save your own.
                </div>`;
            }
        }

        // ── Image Backgrounds (placeholder) ──
        if (catFilter === 'all' || catFilter === 'images') {
            html += `<div class="bg-sub-label" style="margin:12px 0 4px">Image Backgrounds</div>`;
            html += `<div class="bg-empty" style="padding:16px;font-size:10px;color:#52525b;text-align:center;border:1px dashed rgba(255,255,255,0.08);border-radius:8px">
                Image backgrounds — coming soon
            </div>`;
        }

        // Custom CSS input
        if (catFilter === 'all' || catFilter === 'custom') {
            html += `<div class="bg-custom-section">
                <div class="bg-sub-label">Custom CSS</div>
                <input type="text" id="bg-custom-input" class="bg-custom-input"
                    placeholder="e.g. linear-gradient(135deg, #1a1a2e, #16213e)" />
                <button class="bg-apply-custom" id="bg-apply-custom">Apply</button>
            </div>`;
        }

        return html;
    },


    // ═══════════════════════════════════════
    //  BACKGROUND MODE — Editor (Gradient Builder)
    // ═══════════════════════════════════════

    _renderBgEditor(screenId) {
        const css = this._buildGradientCSS();
        let html = '';

        // Live preview
        html += `<div class="bg-builder-preview" style="background:${css};height:80px;border-radius:8px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.08)"></div>`;

        // Gradient type selector
        html += `<div class="bg-sub-label" style="margin-bottom:4px">TYPE</div>`;
        html += `<div class="bg-builder-types" style="display:flex;gap:4px;margin-bottom:10px">`;
        ['linear', 'radial', 'conic'].forEach(t => {
            const icon = t === 'linear' ? '<span class="material-symbols-outlined" style="font-size:12px">trending_up</span>' : t === 'radial' ? '<span class="material-symbols-outlined" style="font-size:12px">radio_button_checked</span>' : '<span class="material-symbols-outlined" style="font-size:12px">donut_large</span>';
            html += `<button class="bg-builder-type ${this._gradientType === t ? 'active' : ''}" data-gtype="${t}">${icon} ${t[0].toUpperCase() + t.slice(1)}</button>`;
        });
        html += `</div>`;

        // Angle control (for linear/conic)
        if (this._gradientType !== 'radial') {
            html += `<div class="bg-sub-label" style="margin-bottom:4px">ANGLE: ${this._gradientAngle}°</div>`;
            html += `<input type="range" class="bg-slider" id="bg-builder-angle" min="0" max="360" value="${this._gradientAngle}" style="width:100%;margin-bottom:10px" />`;
        }

        // Radial position (for radial)
        if (this._gradientType === 'radial') {
            html += `<div style="display:flex;gap:8px;margin-bottom:10px">`;
            html += `<div style="flex:1"><div class="bg-sub-label" style="margin-bottom:2px">X: ${this._gradientRadialX}%</div><input type="range" class="bg-slider" id="bg-builder-rx" min="0" max="100" value="${this._gradientRadialX}" style="width:100%" /></div>`;
            html += `<div style="flex:1"><div class="bg-sub-label" style="margin-bottom:2px">Y: ${this._gradientRadialY}%</div><input type="range" class="bg-slider" id="bg-builder-ry" min="0" max="100" value="${this._gradientRadialY}" style="width:100%" /></div>`;
            html += `</div>`;
        }

        // Color stops
        html += `<div class="bg-sub-label" style="margin-bottom:6px">COLOR STOPS</div>`;
        html += `<div class="bg-builder-stops">`;
        this._gradientStops.forEach((stop, i) => {
            html += `<div class="bg-builder-stop ${i === this._selectedStop ? 'selected' : ''}" data-stop-idx="${i}">
                <input type="color" class="bg-stop-color" data-stop-idx="${i}" value="${stop.color}" />
                <input type="range" class="bg-stop-pos" data-stop-idx="${i}" min="0" max="100" value="${stop.position}" title="${stop.position}%" />
                <span class="bg-stop-pct">${stop.position}%</span>
                ${this._gradientStops.length > 2 ? `<button class="bg-stop-del" data-stop-idx="${i}">×</button>` : ''}
            </div>`;
        });
        html += `</div>`;
        html += `<button class="bg-builder-add-stop" id="bg-builder-add-stop" style="margin:6px 0 10px">+ Add Color Stop</button>`;

        // Name input for saving
        html += `<input type="text" id="bg-save-name" class="bg-custom-input" placeholder="Name for saving..." style="margin-bottom:6px" />`;

        // Apply, Save & Copy
        html += `<div style="display:flex;gap:6px">`;
        html += `<button class="bg-palette-use" id="bg-builder-apply" style="flex:1">Apply</button>`;
        html += `<button class="bg-palette-use ds-save-btn" id="bg-builder-save" style="flex:0;padding:4px 10px" title="Save to Library"><span class="material-symbols-outlined" style="font-size:12px">save</span></button>`;
        html += `<button class="bg-palette-use" id="bg-builder-copy" style="flex:0;padding:4px 10px" title="Copy CSS"><span class="material-symbols-outlined" style="font-size:12px">content_copy</span></button>`;
        html += `</div>`;
        html += `<div class="bg-sub-label" style="margin-top:8px;font-size:8px;color:#71717a;word-break:break-all">${css}</div>`;

        // ── Card Isolation slider ──
        const hasActiveBg = screenId ? !!this._backgrounds[screenId] : !!this._globalBg;
        if (hasActiveBg) {
            const co = this._cardOpacity;
            const presetLabel = co <= 5 ? 'Glass' : co <= 25 ? 'Frosted' : co <= 55 ? 'Semi' : co <= 80 ? 'Matte' : 'Solid';
            html += `<div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">`;
            html += `<div class="bg-sub-label" style="margin-bottom:4px">CARD ISOLATION</div>`;
            html += `<div style="font-size:9px;color:#71717a;margin-bottom:6px">Control how much background bleeds through cards</div>`;
            html += `<div class="bg-slider-row">
                <div class="bg-slider-header">
                    <span class="bg-slider-icon"></span>
                    <span class="bg-slider-label">Card Opacity</span>
                    <span class="bg-slider-value" id="sb-card-opacity-val">${co}% · ${presetLabel}</span>
                </div>
                <div class="bg-slider-track">
                    <input type="range" class="bg-slider" id="sb-card-opacity-slider"
                        min="0" max="100" step="1" value="${co}" />
                </div>
            </div>`;
            html += `<div style="display:flex;justify-content:space-between;font-size:8px;color:#52525b;margin-top:2px;padding:0 2px">
                <span>Glass</span><span>Frosted</span><span>Semi</span><span>Matte</span><span>Solid</span>
            </div>`;
            html += `</div>`;

            // ── Text Brightness slider ──
            const tb = this._textBrightness;
            html += `<div style="margin-top:10px">`;
            html += `<div class="bg-slider-row">
                <div class="bg-slider-header">
                    <span class="bg-slider-icon"></span>
                    <span class="bg-slider-label">Text Brightness</span>
                    <span class="bg-slider-value" id="sb-text-brightness-val">${tb}%</span>
                </div>
                <div class="bg-slider-track">
                    <input type="range" class="bg-slider" id="sb-text-brightness-slider"
                        min="50" max="150" step="1" value="${tb}" />
                </div>
            </div>`;
            html += `<div style="font-size:8px;color:#52525b;margin-top:2px;padding:0 2px">
                Adjusts brightness of text elements inside screens
            </div>`;
            html += `</div>`;
        }

        return html;
    },


    // ═══════════════════════════════════════
    //  BACKGROUND MODE — FX (Animate + Regions)
    // ═══════════════════════════════════════

    _renderBgFx(screenId) {
        let html = '';

        // ── Animations ──
        html += '<div class="bg-sub-label" style="margin-bottom:4px">Animations</div>';
        html += '<div style="font-size:9px;color:#71717a;margin-bottom:8px">Add motion to your background</div>';
        html += '<div class="bg-atmo-grid">';
        this.ANIMATIONS.forEach(a => {
            const isActive = this._activeAnimation === a.id;
            html += `<div class="bg-atmo-card ${isActive ? 'active' : ''}" data-anim="${a.id}">
                <div class="bg-atmo-preview" style="background:linear-gradient(135deg,#7c3aed,#3b82f6,#06b6d4);${a.style}"></div>
                <span class="bg-atmo-name">${a.name}</span>
            </div>`;
        });
        html += '</div>';
        if (this._activeAnimation) {
            html += `<button class="bg-palette-use" id="bg-stop-anim" style="margin-top:10px;width:100%;background:#dc2626">Stop Animation</button>`;
        }

        // ── Regions ──
        html += '<div class="bg-sub-label" style="margin-top:16px;margin-bottom:6px">Region Effects</div>';
        html += '<div style="font-size:9px;color:#71717a;margin-bottom:8px">Add gradient overlays to specific areas</div>';

        html += `<div class="bg-region-presets">`;
        this.REGION_PRESETS.forEach((rp, i) => {
            html += `<button class="bg-region-preset-btn" data-rp="${i}" title="${rp.name}">
                <span>${rp.icon}</span>
                <span class="bg-rp-name">${rp.name}</span>
            </button>`;
        });
        html += `</div>`;

        // Active regions list
        const regions = screenId ? (this._regions[screenId] || []) : [];
        if (screenId && regions.length) {
            html += `<div class="bg-sub-label" style="margin-top:10px;margin-bottom:6px">Active Regions (${regions.length})</div>`;
            html += `<div class="bg-region-list">`;
            regions.forEach((r, i) => {
                html += `<div class="bg-region-item">
                    <span class="bg-region-preview" style="background:${r.gradient};opacity:${r.opacity}"></span>
                    <span class="bg-region-info">Region ${i + 1} · ${r.w}×${r.h}%</span>
                    <div class="bg-region-controls">
                        <label class="bg-region-opacity-label">
                            <input type="range" class="bg-region-opacity-slider" data-region="${r.id}"
                                min="0" max="100" value="${Math.round(r.opacity * 100)}" />
                        </label>
                        <button class="bg-region-delete" data-del-region="${r.id}" title="Remove"><span class="material-symbols-outlined" style="font-size:12px">close</span></button>
                    </div>
                </div>`;
            });
            html += `</div>`;
            html += `<button class="bg-clear-regions" id="bg-clear-regions">Clear All Regions</button>`;
        } else if (!screenId) {
            html += `<div class="bg-empty" style="padding:12px">Select a specific screen to add regions</div>`;
        }

        return html;
    },


    // ═══════════════════════════════════════
    //  UI ELEMENTS MODE — Gallery (Palettes)
    // ═══════════════════════════════════════

    _renderUiGallery(screenId) {
        let html = '';

        // Active theme indicator
        if (this._activeTheme) {
            const activePal = this.PALETTES.find(p => p.id === this._activeTheme.paletteId);
            html += `<div class="ds-active-theme">
                <span class="ds-active-dot"><span class="material-symbols-outlined" style="font-size:12px">check</span></span>
                <span class="ds-active-name">${activePal?.name || 'Custom'}</span>
                <div class="ds-active-swatches">
                    ${(this._activeTheme.colors || []).map(c => `<div class="ds-mini-swatch" style="background:${c}"></div>`).join('')}
                </div>
                <button class="ds-clear-theme-btn" id="bg-clear-theme"><span class="material-symbols-outlined" style="font-size:12px">close</span></button>
            </div>`;
        }

        // Group palettes by category
        const cats = {};
        this.PALETTES.forEach(p => { (cats[p.cat] = cats[p.cat] || []).push(p); });
        html += '<div class="bg-palette-grid">';
        for (const [cat, palettes] of Object.entries(cats)) {
            html += `<div class="bg-sub-label" style="font-size:9px;margin:6px 0 2px;color:#71717a">${cat}</div>`;
            palettes.forEach(p => {
                const isActive = this._activeTheme?.paletteId === p.id;
                const activeStyle = isActive ? 'border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.05)' : '';
                html += `<div class="bg-palette-row" style="${activeStyle}">
                    <span class="bg-palette-name">${p.name}</span>
                    <div class="bg-palette-swatches">
                        ${p.colors.map(c => `<div class="bg-palette-swatch" style="background:${c}" title="${c}"></div>`).join('')}
                    </div>
                    <button class="bg-palette-use" data-palette="${p.id}">${isActive ? '<span class="material-symbols-outlined" style="font-size:12px">check</span>' : 'Apply'}</button>
                </div>`;
            });
        }
        html += '</div>';

        // Custom palette library
        if (this._customLibrary.palettes.length > 0) {
            html += `<div class="bg-sub-label" style="margin:12px 0 4px">My Palettes</div>`;
            html += '<div class="bg-palette-grid">';
            this._customLibrary.palettes.forEach(p => {
                const isActive = this._activeTheme?.paletteId === p.id;
                html += `<div class="bg-palette-row ds-lib-item" style="${isActive ? 'border-color:rgba(34,197,94,0.4)' : ''}">
                    <span class="bg-palette-name">${p.name}</span>
                    <div class="bg-palette-swatches">
                        ${p.colors.map(c => `<div class="bg-palette-swatch" style="background:${c}" title="${c}"></div>`).join('')}
                    </div>
                    <button class="bg-palette-use" data-custom-palette="${p.id}">${isActive ? '<span class="material-symbols-outlined" style="font-size:12px">check</span>' : 'Apply'}</button>
                    <button class="ds-lib-del" data-del-lib-pal="${p.id}" title="Delete"><span class="material-symbols-outlined" style="font-size:12px">close</span></button>
                </div>`;
            });
            html += '</div>';
        }

        return html;
    },


    // ═══════════════════════════════════════
    //  UI ELEMENTS MODE — Editor (Palette Editor)
    // ═══════════════════════════════════════

    _renderUiEditor(screenId) {
        const pal = this._editingPalette || {
            name: '',
            colors: ['#050b1a', '#0e182f', '#2764e7', '#4786eb', '#e77727', '#e2e4e9']
        };
        const roles = ['Deep', 'Surface', 'Primary', 'Secondary', 'Accent', 'Warm'];

        let html = '';

        // Preview bar
        html += `<div class="ds-pal-preview">`;
        pal.colors.forEach(c => {
            html += `<div style="flex:1;background:${c}"></div>`;
        });
        html += `</div>`;

        // Color role editors
        html += `<div class="bg-sub-label" style="margin:10px 0 6px">COLOR ROLES</div>`;
        html += `<div class="ds-pal-roles">`;
        roles.forEach((role, i) => {
            html += `<div class="ds-pal-role">
                <input type="color" class="ds-pal-color-input" data-role-idx="${i}" value="${pal.colors[i]}" />
                <div class="ds-pal-role-info">
                    <span class="ds-pal-role-name">${role}</span>
                    <span class="ds-pal-role-hex">${pal.colors[i]}</span>
                </div>
            </div>`;
        });
        html += `</div>`;

        // Name & actions
        html += `<div class="ds-pal-actions">
            <input type="text" id="ds-pal-name" class="bg-custom-input" placeholder="Palette name…" value="${pal.name || ''}" style="flex:1" />
        </div>`;

        html += `<div style="display:flex;gap:6px;margin-top:8px">`;
        html += `<button class="bg-palette-use" id="ds-pal-apply" style="flex:1">Apply Theme</button>`;
        html += `<button class="bg-palette-use ds-save-btn" id="ds-pal-save" title="Save to Library"><span class="material-symbols-outlined" style="font-size:12px">save</span></button>`;
        html += `</div>`;

        // Load from existing palette
        html += `<div class="bg-sub-label" style="margin:14px 0 4px;font-size:9px;color:#71717a">Load from palette to edit:</div>`;
        html += `<select id="ds-pal-load" class="bg-custom-input" style="width:100%">`;
        html += `<option value="">— Select a palette —</option>`;
        this.PALETTES.forEach(p => {
            html += `<option value="${p.id}">${p.cat} · ${p.name}</option>`;
        });
        html += `</select>`;

        return html;
    },


    // ═══════════════════════════════════════
    //  UI ELEMENTS MODE — FX
    // ═══════════════════════════════════════

    _renderUiFx(screenId) {
        let html = '';
        html += '<div class="bg-sub-label" style="margin-bottom:6px">Element Effects</div>';
        html += '<div style="font-size:10px;color:#71717a;margin-bottom:10px">Apply visual effects to targeted UI elements</div>';

        const effects = [
            { id: 'glow', name: 'Glow', desc: 'Soft glow around elements' },
            { id: 'elevate', name: 'Elevate', desc: 'Lift with shadow depth' },
            { id: 'glass', name: 'Glass', desc: 'Glassmorphism blur effect' },
            { id: 'neon-border', name: 'Neon Border', desc: 'Glowing neon outline' },
            { id: 'fade-in', name: 'Fade In', desc: 'Gentle opacity entrance' },
            { id: 'scale-hover', name: 'Scale', desc: 'Subtle scale on hover' }
        ];

        html += '<div class="bg-atmo-grid">';
        effects.forEach(e => {
            html += `<div class="bg-atmo-card ds-effect-card" data-effect="${e.id}">
                <div class="bg-atmo-preview" style="background:linear-gradient(135deg,rgba(129,140,248,0.1),rgba(129,140,248,0.05));display:flex;align-items:center;justify-content:center;font-size:20px">${e.name.split(' ')[0]}</div>
                <span class="bg-atmo-name">${e.name.split(' ').slice(1).join(' ')}</span>
            </div>`;
        });
        html += '</div>';

        html += `<div class="bg-empty" style="padding:12px;margin-top:8px;font-size:10px;color:#71717a">
            Effects apply to elements selected in the Target bar above
        </div>`;

        return html;
    },


    // ═══════════════════════════════════════
    //  SHARED — Adjust (mode-aware)
    // ═══════════════════════════════════════

    _renderAdjustTool(screenId) {
        const mode = this._studioMode;
        // Use the correct filter state based on mode
        const f = mode === 'background' ? this._getBgFilters(screenId) : this._getFilters(screenId);
        const isDefault = Object.keys(this.DEFAULT_FILTERS).every(k => f[k] === this.DEFAULT_FILTERS[k]);

        let html = `<div class="bg-adjust-header">
            <span class="bg-sub-label">${mode === 'background' ? 'Background' : 'Element'} Filters</span>
            ${!isDefault ? '<button class="bg-reset-filters" id="bg-reset-filters"><span class="material-symbols-outlined" style="font-size:12px">restart_alt</span> Reset All</button>' : ''}
        </div>`;

        // Layer indicator
        html += `<div style="padding:4px 8px;margin-bottom:6px;background:rgba(129,140,248,0.08);border-radius:6px;font-size:9px;color:#a1a1aa;text-align:center">`;
        if (mode === 'background') {
            html += `These filters affect the <strong style="color:#818cf8">background layer</strong> only`;
        } else {
            html += `These filters affect <strong style="color:#818cf8">UI elements</strong> only`;
        }
        html += `</div>`;

        html += `<div class="bg-adjust-sliders">`;
        this.FILTER_META.forEach(meta => {
            const val = f[meta.key];
            const isModified = val !== this.DEFAULT_FILTERS[meta.key];
            html += `<div class="bg-slider-row ${isModified ? 'modified' : ''}">
                <div class="bg-slider-header">
                    <span class="bg-slider-icon">${meta.icon}</span>
                    <span class="bg-slider-label">${meta.label}</span>
                    <span class="bg-slider-value" id="bg-val-${meta.key}">${val}${meta.unit}</span>
                </div>
                <div class="bg-slider-track">
                    <input type="range" class="bg-slider" data-key="${meta.key}"
                        min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${val}" />
                </div>
            </div>`;
        });
        html += `</div>`;

        return html;
    },


    // ═══════════════════════════════════════
    //  WIRE EVENTS — Unified delegation + input/change listeners
    // ═══════════════════════════════════════

    /** Wire all panel events using event delegation for clicks
     *  and individual listeners for input/change events only */
    _wireEvents(body, screenId) {

        // Choose correct re-render function based on context
        const reRender = () => {
            if (this._focusedMode) {
                this._renderFocusedPanel();
            } else {
                this._render();
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  CLICK DELEGATION — single handler on bg-body
        //  Catches ALL click interactions robustly
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        body.onclick = (e) => {
            // Mode switch (Background / UI Elements)
            const modeSwitch = e.target.closest('[data-studio-mode]');
            if (modeSwitch) {
                this._studioMode = modeSwitch.dataset.studioMode;
                this._activeSubTool = 'gallery';
                reRender();
                return;
            }
            // Sub-tool tabs (Gallery / Editor / Adjust / FX)
            const tab = e.target.closest('[data-subtool]');
            if (tab) {
                this._activeSubTool = tab.dataset.subtool;
                reRender();
                return;
            }
            // Element targeting chips
            const chip = e.target.closest('.ds-target-chip');
            if (chip) {
                const id = chip.dataset.target;
                if (id === 'all') {
                    this._elementTargets = ['all'];
                } else {
                    this._elementTargets = this._elementTargets.filter(x => x !== 'all');
                    if (this._elementTargets.includes(id)) {
                        this._elementTargets = this._elementTargets.filter(x => x !== id);
                    } else {
                        this._elementTargets.push(id);
                    }
                    if (this._elementTargets.length === 0) this._elementTargets = ['all'];
                }
                reRender();
                return;
            }
            // Screen scope — "All Screens" button (sidebar)
            const scopeBtn = e.target.closest('.bg-mode-btn');
            if (scopeBtn && scopeBtn.dataset.mode === 'global') {
                this._currentScreenId = null;
                reRender();
                return;
            }
            // Screen Editor scope toggle (This Screen / All Screens)
            if (scopeBtn && scopeBtn.dataset.scope) {
                this._focusedScope = scopeBtn.dataset.scope;
                reRender();
                return;
            }
            // Category filter chips
            const cat = e.target.closest('.bg-cat-chip');
            if (cat) {
                this._activeCatFilter = cat.dataset.cat;
                reRender();
                return;
            }
            // Preset swatch (excluding library items)
            const preset = e.target.closest('.bg-preset-swatch:not(.ds-lib-item):not(.bg-atmo-swatch)');
            if (preset && preset.dataset.preset) {
                this._lastAppliedPresetId = preset.dataset.preset;
                this.applyPreset(preset.dataset.preset, screenId);
                const p = this.PRESETS.find(x => x.id === preset.dataset.preset);
                if (p) {
                    this._loadCSSIntoEditor(p.css);
                    // Auto-switch to Editor tab so user can fine-tune
                    this._activeSubTool = 'editor';
                    reRender();
                }
                return;
            }
            // Clear background
            if (e.target.closest('#bg-clear')) {
                this.clearBackground(screenId);
                return;
            }
            // Apply custom CSS
            if (e.target.closest('#bg-apply-custom')) {
                const val = document.getElementById('bg-custom-input')?.value?.trim();
                if (val) this.applyCustom(val, screenId);
                return;
            }
            // Atmosphere mood cards (swatch or card style)
            const atmo = e.target.closest('.bg-atmo-swatch[data-atmo], .bg-atmo-card[data-atmo]');
            if (atmo) {
                const atmoObj = this.ATMOSPHERES.find(a => a.id === atmo.dataset.atmo);
                this.applyAtmosphere(atmo.dataset.atmo, screenId);
                if (atmoObj) {
                    this._loadCSSIntoEditor(atmoObj.bgCss);
                    this._activeSubTool = 'editor';
                    reRender();
                }
                return;
            }
            // Animation cards
            const anim = e.target.closest('[data-anim]');
            if (anim) {
                this.applyAnimation(anim.dataset.anim, screenId);
                return;
            }
            // Stop animation button
            if (e.target.closest('#bg-stop-anim')) {
                this.stopAnimation(screenId);
                return;
            }
            // Library background — edit
            const editBg = e.target.closest('[data-edit-lib-bg]');
            if (editBg) {
                e.stopPropagation();
                const bg = this._customLibrary.backgrounds.find(b => b.id === editBg.dataset.editLibBg);
                if (bg) {
                    this._loadCSSIntoEditor(bg.css);
                    const nameInput = document.getElementById('bg-save-name');
                    if (nameInput) nameInput.value = bg.name || '';
                    this._activeSubTool = 'editor';
                    reRender();
                }
                return;
            }
            // Library background — delete
            const delBg = e.target.closest('[data-del-lib-bg]');
            if (delBg) {
                e.stopPropagation();
                this._customLibrary.backgrounds = this._customLibrary.backgrounds.filter(b => b.id !== delBg.dataset.delLibBg);
                this._saveLibrary();
                reRender();
                return;
            }
            // Library background — apply
            const libBg = e.target.closest('[data-lib-bg]');
            if (libBg) {
                const bg = this._customLibrary.backgrounds.find(b => b.id === libBg.dataset.libBg);
                if (bg) this.applyCustom(bg.css, screenId);
                return;
            }
            // Palette — use from gallery
            const palUse = e.target.closest('.bg-palette-use[data-palette]');
            if (palUse) {
                this.applyPalette(palUse.dataset.palette, screenId);
                return;
            }
            // Clear theme
            if (e.target.closest('#bg-clear-theme')) {
                this.clearTheme(screenId);
                return;
            }
            // Library palette — delete
            const delPal = e.target.closest('[data-del-lib-pal]');
            if (delPal) {
                e.stopPropagation();
                this._customLibrary.palettes = this._customLibrary.palettes.filter(p => p.id !== delPal.dataset.delLibPal);
                this._saveLibrary();
                reRender();
                return;
            }
            // Library palette — apply
            const customPal = e.target.closest('[data-custom-palette]');
            if (customPal) {
                const pal = this._customLibrary.palettes.find(p => p.id === customPal.dataset.customPalette);
                if (pal) {
                    this._activeTheme = { paletteId: pal.id, colors: pal.colors };
                    this._eachScreen(sid => this._injectThemeCSS(sid, pal.colors));
                    this._save();
                    reRender();
                }
                return;
            }
            // Gradient builder — type selector
            const gType = e.target.closest('.bg-builder-type');
            if (gType) {
                this._gradientType = gType.dataset.gtype;
                reRender();
                return;
            }
            // Gradient builder — delete color stop
            const stopDel = e.target.closest('.bg-stop-del');
            if (stopDel) {
                const idx = parseInt(stopDel.dataset.stopIdx);
                if (this._gradientStops.length > 2 && idx >= 0 && idx < this._gradientStops.length) {
                    this._gradientStops.splice(idx, 1);
                    if (this._selectedStop >= this._gradientStops.length) this._selectedStop = 0;
                    reRender();
                }
                return;
            }
            // Gradient builder — add stop
            if (e.target.closest('#bg-builder-add-stop')) {
                const last = this._gradientStops[this._gradientStops.length - 1]?.color || '#ffffff';
                this._gradientStops.push({ color: last, position: 50 });
                reRender();
                return;
            }
            // Gradient builder — apply
            if (e.target.closest('#bg-builder-apply')) {
                this.applyCustom(this._buildGradientCSS(), screenId);
                return;
            }
            // Gradient builder — save to library
            if (e.target.closest('#bg-builder-save')) {
                const nameInput = document.getElementById('bg-save-name');
                const name = nameInput?.value?.trim() || prompt('Name for this gradient:', 'My Gradient');
                if (name) {
                    this._customLibrary.backgrounds.push({
                        id: 'lib-bg-' + Date.now(), name,
                        css: this._buildGradientCSS(), createdAt: Date.now(),
                        sourcePresetId: this._lastAppliedPresetId || null
                    });
                    this._saveLibrary();
                    reRender();
                }
                return;
            }
            // Gradient builder — copy CSS
            if (e.target.closest('#bg-builder-copy')) {
                navigator.clipboard?.writeText(this._buildGradientCSS());
                return;
            }
            // Palette editor — apply
            if (e.target.closest('#ds-pal-apply')) {
                if (!this._editingPalette) return;
                this._activeTheme = { paletteId: 'custom-edit', colors: [...this._editingPalette.colors] };
                this._eachScreen(sid => this._injectThemeCSS(sid, this._editingPalette.colors));
                this._save();
                reRender();
                return;
            }
            // Palette editor — save to library
            if (e.target.closest('#ds-pal-save')) {
                if (!this._editingPalette) return;
                const nameInput = document.getElementById('ds-pal-name');
                const name = nameInput?.value?.trim() || 'Custom Palette';
                this._customLibrary.palettes.push({
                    id: 'lib-pal-' + Date.now(), name,
                    colors: [...this._editingPalette.colors], createdAt: Date.now()
                });
                this._saveLibrary();
                reRender();
                return;
            }
            // Series — save
            if (e.target.closest('#bg-save-series')) {
                const nameInput = document.getElementById('bg-series-name');
                const name = nameInput?.value?.trim() || 'Untitled Series';
                this.saveSeries(name);
                return;
            }
            // Series — load
            const loadSeries = e.target.closest('[data-load-series]');
            if (loadSeries) {
                this.loadSeries(loadSeries.dataset.loadSeries);
                return;
            }
            // Series — delete
            const delSeries = e.target.closest('[data-del-series]');
            if (delSeries) {
                e.stopPropagation();
                this.deleteSeries(delSeries.dataset.delSeries);
                return;
            }
            // Filter reset
            if (e.target.closest('#bg-reset-filters')) {
                this.resetFilters(screenId);
                return;
            }
            // Region preset buttons
            const rPreset = e.target.closest('.bg-region-preset-btn');
            if (rPreset) {
                const rp = this.REGION_PRESETS[parseInt(rPreset.dataset.rp)];
                const sid = screenId || this._getFirstScreenId();
                if (sid && rp) this.addRegion(sid, { ...rp });
                return;
            }
            // Region delete
            const rDel = e.target.closest('.bg-region-delete');
            if (rDel) {
                this.removeRegion(screenId, rDel.dataset.delRegion);
                return;
            }
            // Clear all regions
            if (e.target.closest('#bg-clear-regions')) {
                this.clearRegions(screenId);
                return;
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  INPUT / CHANGE EVENTS — require addEventListener
        //  (cannot be handled via click delegation)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // Screen picker dropdown
        document.getElementById('bg-screen-picker')?.addEventListener('change', (e) => {
            this._currentScreenId = e.target.value || null;
            reRender();
        });

        // Gradient builder — angle slider
        const liveGrad = () => {
            const css = this._buildGradientCSS();
            const preview = body.querySelector('.bg-builder-preview');
            if (preview) preview.style.background = css;
            const bgDef = { presetId: null, name: 'Custom', css };
            if (screenId) {
                this._backgrounds[screenId] = bgDef;
                this._applyToScreen(screenId, bgDef);
            } else {
                this._globalBg = bgDef;
                this._eachScreen(sid => {
                    if (!this._backgrounds[sid]) this._applyToScreen(sid, bgDef);
                });
            }
            this._save();
        };
        document.getElementById('bg-builder-angle')?.addEventListener('input', (e) => {
            this._gradientAngle = parseInt(e.target.value);
            liveGrad();
        });
        document.getElementById('bg-builder-angle')?.addEventListener('change', () => reRender());
        document.getElementById('bg-builder-rx')?.addEventListener('input', (e) => {
            this._gradientRadialX = parseInt(e.target.value);
            liveGrad();
        });
        document.getElementById('bg-builder-rx')?.addEventListener('change', () => reRender());
        document.getElementById('bg-builder-ry')?.addEventListener('input', (e) => {
            this._gradientRadialY = parseInt(e.target.value);
            liveGrad();
        });
        document.getElementById('bg-builder-ry')?.addEventListener('change', () => reRender());

        // Gradient builder — color stop inputs
        body.querySelectorAll('.bg-stop-color').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.stopIdx);
                if (idx >= 0 && idx < this._gradientStops.length) {
                    this._gradientStops[idx].color = e.target.value;
                    liveGrad();
                }
            });
        });
        body.querySelectorAll('.bg-stop-pos').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.stopIdx);
                if (idx >= 0 && idx < this._gradientStops.length) {
                    this._gradientStops[idx].position = parseInt(e.target.value);
                    const pct = e.target.closest('.bg-builder-stop')?.querySelector('.bg-stop-pct');
                    if (pct) pct.textContent = e.target.value + '%';
                    liveGrad();
                }
            });
        });

        // Palette editor — color picker inputs
        body.querySelectorAll('.ds-pal-color-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.roleIdx);
                if (!this._editingPalette) {
                    this._editingPalette = { name: '', colors: ['#050b1a', '#0e182f', '#2764e7', '#4786eb', '#e77727', '#e2e4e9'] };
                }
                this._editingPalette.colors[idx] = e.target.value;
                const preview = body.querySelector('.ds-pal-preview');
                if (preview) {
                    preview.innerHTML = this._editingPalette.colors.map(c => `<div style="flex:1;background:${c}"></div>`).join('');
                }
                const hex = e.target.closest('.ds-pal-role')?.querySelector('.ds-pal-role-hex');
                if (hex) hex.textContent = e.target.value;
            });
        });

        // Palette editor — load preset dropdown
        document.getElementById('ds-pal-load')?.addEventListener('change', (e) => {
            const pal = this.PALETTES.find(p => p.id === e.target.value);
            if (pal) {
                this._editingPalette = { name: pal.name + ' (edit)', colors: [...pal.colors] };
                reRender();
            }
        });

        // Filter adjustment sliders
        body.querySelectorAll('.bg-slider[data-key]').forEach(slider => {
            slider.addEventListener('input', () => {
                const key = slider.dataset.key;
                const val = parseFloat(slider.value);
                const meta = this.FILTER_META.find(m => m.key === key);
                const valEl = document.getElementById(`bg-val-${key}`);
                if (valEl) valEl.textContent = `${val}${meta?.unit || ''}`;
                this.setFilter(key, val, screenId);
                slider.closest('.bg-slider-row')?.classList.toggle('modified', val !== this.DEFAULT_FILTERS[key]);
            });
        });

        // Region opacity sliders
        body.querySelectorAll('.bg-region-opacity-slider').forEach(slider => {
            slider.addEventListener('input', () => {
                const regionId = slider.dataset.region;
                const opacity = parseInt(slider.value) / 100;
                const regions = this._regions[screenId] || [];
                const region = regions.find(r => r.id === regionId);
                if (region) {
                    region.opacity = opacity;
                    this._applyRegionToScreen(screenId, region);
                    this._save();
                }
            });
        });

        // Card isolation slider — live update via CSS re-injection
        const cardSlider = document.getElementById('sb-card-opacity-slider');
        if (cardSlider) {
            cardSlider.addEventListener('input', () => {
                const val = parseInt(cardSlider.value);
                this._cardOpacity = val;
                const presetLabel = val <= 5 ? 'Glass' : val <= 25 ? 'Frosted' : val <= 55 ? 'Semi' : val <= 80 ? 'Matte' : 'Solid';
                const valEl = document.getElementById('sb-card-opacity-val');
                if (valEl) valEl.textContent = `${val}% · ${presetLabel}`;

                // Live-update: re-inject card isolation CSS into all iframes
                this._eachScreen(sid => {
                    const iframe = this._getIframe(sid);
                    if (!iframe) return;
                    try {
                        const doc = iframe.contentDocument;
                        if (!doc) return;
                        const existing = doc.getElementById('sb-card-isolation');
                        if (existing) existing.remove();
                        const css = this._buildCardIsolationCSS();
                        if (css) {
                            const s = doc.createElement('style');
                            s.id = 'sb-card-isolation';
                            s.textContent = css;
                            doc.head.appendChild(s);
                        }
                    } catch (e) { }
                });
                this._save();
            });
        }

        // Text brightness slider — live update
        const textBrSlider = document.getElementById('sb-text-brightness-slider');
        if (textBrSlider) {
            textBrSlider.addEventListener('input', () => {
                const val = parseInt(textBrSlider.value);
                this._textBrightness = val;
                const valEl = document.getElementById('sb-text-brightness-val');
                if (valEl) valEl.textContent = `${val}%`;
                this._applyTextBrightness();
                this._save();
            });
        }
    },

    /** Apply text brightness filter to text elements in all iframes */
    _applyTextBrightness() {
        const brightness = this._textBrightness;
        if (brightness === 100) {
            // Remove text brightness override
            this._eachScreen(sid => {
                const iframe = this._getIframe(sid);
                if (!iframe) return;
                try {
                    const s = iframe.contentDocument?.getElementById('sb-text-brightness');
                    if (s) s.remove();
                } catch (e) { }
            });
            return;
        }
        const css = `
            /* ═══ Text Brightness Override ═══ */
            h1, h2, h3, h4, h5, h6, p, span, label, a, li, td, th,
            [class*="title"], [class*="label"], [class*="text"],
            [class*="heading"], [class*="desc"] {
                filter: brightness(${brightness / 100}) !important;
            }
        `;
        this._eachScreen(sid => {
            const iframe = this._getIframe(sid);
            if (!iframe) return;
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.head) return;
                const existing = doc.getElementById('sb-text-brightness');
                if (existing) existing.remove();
                const s = doc.createElement('style');
                s.id = 'sb-text-brightness';
                s.textContent = css;
                doc.head.appendChild(s);
            } catch (e) { }
        });
    },

    /** Build CSS gradient string from builder state */
    _buildGradientCSS() {
        const sorted = [...this._gradientStops].sort((a, b) => a.position - b.position);
        const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
        if (this._gradientType === 'linear') {
            return `linear-gradient(${this._gradientAngle}deg, ${stops})`;
        } else if (this._gradientType === 'radial') {
            return `radial-gradient(circle at ${this._gradientRadialX}% ${this._gradientRadialY}%, ${stops})`;
        } else {
            return `conic-gradient(from ${this._gradientAngle}deg, ${stops})`;
        }
    },


    /** Apply animation to current background */
    applyAnimation(animId, screenId) {
        const anim = this.ANIMATIONS.find(a => a.id === animId);
        if (!anim) return;
        this._activeAnimation = animId;

        // Inject keyframes into page head (not iframe)
        let styleEl = document.getElementById('sb-anim-keyframes');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'sb-anim-keyframes';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = anim.keyframes;

        const applyToSlot = (sid) => {
            const slot = document.querySelector(`.ss[data-scr="${sid}"]`);
            const df = slot?.querySelector('.df');
            if (df) {
                df.style.cssText += anim.style;
            }
        };

        if (screenId) {
            applyToSlot(screenId);
        } else {
            this._eachScreen(sid => applyToSlot(sid));
        }
        this._save();
        this._refreshPanel();
    },

    /** Stop animation on all screens */
    stopAnimation(screenId) {
        this._activeAnimation = null;
        // Remove keyframes
        const styleEl = document.getElementById('sb-anim-keyframes');
        if (styleEl) styleEl.remove();

        const clearAnim = (sid) => {
            const slot = document.querySelector(`.ss[data-scr="${sid}"]`);
            const df = slot?.querySelector('.df');
            if (df) {
                df.style.animation = '';
                df.style.backgroundSize = '';
                df.style.backgroundPosition = '';
            }
        };
        if (screenId) { clearAnim(screenId); }
        else { this._eachScreen(sid => clearAnim(sid)); }
        this._save();
        this._refreshPanel();
    },

    /** Apply a palette as UI theme — injects CSS overrides into iframes */
    applyPalette(paletteId, screenId) {
        const pal = this.PALETTES.find(p => p.id === paletteId);
        if (!pal) return;
        this._activeTheme = { paletteId: pal.id, colors: pal.colors };
        const applyTo = (sid) => this._injectThemeCSS(sid, pal.colors);
        if (screenId) { applyTo(screenId); }
        else { this._eachScreen(sid => applyTo(sid)); }
        this._save();
        this._refreshPanel();
    },

    /** Clear active theme from all screens */
    clearTheme(screenId) {
        this._activeTheme = null;
        const clearFrom = (sid) => {
            const iframe = this._getIframe(sid);
            if (!iframe) return;
            try {
                const s = iframe.contentDocument?.getElementById('sb-theme');
                if (s) s.remove();
            } catch (e) { }
        };
        if (screenId) { clearFrom(screenId); }
        else { this._eachScreen(sid => clearFrom(sid)); }
        this._save();
        this._refreshPanel();
    },

    /** Convert hex color to RGB components */
    _hexToRGB(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    },

    /** Extract the darkest color from the current gradient stops as R,G,B string */
    _getDarkestGradientRGB() {
        if (!this._gradientStops || this._gradientStops.length === 0) return '15, 15, 25';
        let darkest = null;
        let minLum = Infinity;
        this._gradientStops.forEach(stop => {
            const { r, g, b } = this._hexToRGB(stop.color);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < minLum) { minLum = lum; darkest = { r, g, b }; }
        });
        return darkest ? `${darkest.r}, ${darkest.g}, ${darkest.b}` : '15, 15, 25';
    },

    /** Build card isolation CSS block (empty string when _cardOpacity is 0) */
    _buildCardIsolationCSS() {
        if (this._cardOpacity <= 0) return '';
        const opacity = (0.04 + (this._cardOpacity / 100) * 0.91).toFixed(3);
        const cardRGB = this._getDarkestGradientRGB();
        return `
                    /* ═══ Card Isolation — override glass transparency ═══ */
                    .glass, .glass-v, .glass-bright, .glass-cyan, .glass-deep,
                    .glass-warm, .glass-indigo,
                    [class*="card"], [class*="panel"], [class*="medical-card"] {
                        background-color: rgba(${cardRGB}, ${opacity}) !important;
                    }
        `;
    },

    /** Inject comprehensive CSS theme overrides into an iframe */
    _injectThemeCSS(screenId, colors) {
        const iframe = this._getIframe(screenId);
        if (!iframe) return;

        const inject = () => {
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.head) return false;

                // Remove old theme
                const old = doc.getElementById('sb-theme');
                if (old) old.remove();

                const [deep, surface, primary, secondary, accent, warm] = colors;
                const pRGB = this._hexToRGB(primary);
                const sRGB = this._hexToRGB(secondary);
                const aRGB = this._hexToRGB(accent);
                const wRGB = this._hexToRGB(warm);
                const surfRGB = this._hexToRGB(surface);

                const css = `
/* ═══ Screen Backgrounds — UI Theme Override ═══ */
:root {
  --sb-deep: ${deep};
  --sb-surface: ${surface};
  --sb-primary: ${primary};
  --sb-secondary: ${secondary};
  --sb-accent: ${accent};
  --sb-warm: ${warm};
  --sb-primary-rgb: ${pRGB.r}, ${pRGB.g}, ${pRGB.b};
  --sb-secondary-rgb: ${sRGB.r}, ${sRGB.g}, ${sRGB.b};
  --sb-accent-rgb: ${aRGB.r}, ${aRGB.g}, ${aRGB.b};
  --sb-warm-rgb: ${wRGB.r}, ${wRGB.g}, ${wRGB.b};
  --sb-surface-rgb: ${surfRGB.r}, ${surfRGB.g}, ${surfRGB.b};
}

/* === CONTAINER BACKGROUNDS (not body — overlay needs body transparent) === */
[class*="bg-void"], [class*="bg-parchment"], [class*="bg-night"] { background-color: ${deep} !important; }

/* Primary color overrides */
[class*="bg-primary"]:not([class*="bg-primary/"]):not([class*="bg-primary-"]) { background-color: ${primary} !important; }
[class*="text-primary"] { color: ${primary} !important; }
[class*="border-primary"] { border-color: ${primary} !important; }

/* Primary with opacity — use rgb with tw-opacity */
[class*="bg-primary/"] { background-color: rgb(${pRGB.r} ${pRGB.g} ${pRGB.b} / var(--tw-bg-opacity, 0.2)) !important; }

/* Card / surface colors */
[class*="bg-card"] { background-color: ${surface} !important; }

/* Glass components — tinted with theme primary (respects card opacity) */
.glass, .glass-bright, .glass-cyan, .glass-indigo, .glass-v {
  background: rgba(${pRGB.r}, ${pRGB.g}, ${pRGB.b}, ${(0.04 + (this._cardOpacity / 100) * 0.91).toFixed(3)}) !important;
  border-color: rgba(${pRGB.r}, ${pRGB.g}, ${pRGB.b}, 0.12) !important;
}

/* Glow effects */
[class*="neon-glow"], .neon-glow {
  box-shadow: 0 0 20px rgba(${pRGB.r}, ${pRGB.g}, ${pRGB.b}, 0.2), 0 0 40px rgba(${pRGB.r}, ${pRGB.g}, ${pRGB.b}, 0.1) !important;
}

/* Violet / secondary colors */
[class*="bg-violet"], [class*="bg-deep"] { background-color: ${secondary} !important; }
[class*="text-violet"], [class*="text-deep"], [class*="text-lavender"] { color: ${secondary} !important; }
[class*="border-violet"] { border-color: ${secondary} !important; }

/* Accent/pink colors */
[class*="bg-pink"], [class*="bg-accent"] { background-color: ${accent} !important; }
[class*="text-pink"], [class*="text-accent"], [class*="text-moon"] { color: ${accent} !important; }

/* Warm/gold colors */
[class*="text-vintage"], [class*="text-warm"] { color: ${warm} !important; }
[class*="bg-vintage"] { background-color: ${warm} !important; }
[class*="border-vintage"] { border-color: ${warm} !important; }

/* === GRADIENTS === */
[class*="from-primary"] { --tw-gradient-from: ${primary} !important; }
[class*="to-violet"], [class*="to-lavender"] { --tw-gradient-to: ${secondary} !important; }
[class*="to-primary"] { --tw-gradient-to: ${primary} !important; }

/* === SVG === */
svg circle[stroke="${this._detectPrimaryColor(doc)}"] { stroke: ${primary} !important; }
svg circle[stroke]:not([stroke="none"]):not([stroke="rgba(255,255,255,0.04)"]) { stroke: ${primary}; }

/* Radial glow backgrounds — re-tint */
.aurora-glow, .bio-glow, .night-glow {
  background: radial-gradient(ellipse at 30% 20%, rgba(${pRGB.r},${pRGB.g},${pRGB.b},0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, rgba(${sRGB.r},${sRGB.g},${sRGB.b},0.1) 0%, transparent 50%) !important;
}

/* Particles & decorative elements */
.particle, .star { background: ${primary} !important; }
`;

                const styleEl = doc.createElement('style');
                styleEl.id = 'sb-theme';
                styleEl.textContent = css;
                doc.head.appendChild(styleEl);

                // Re-inject card isolation AFTER theme so it takes priority
                if (this._cardOpacity > 0) {
                    const cardCss = this._buildCardIsolationCSS();
                    if (cardCss) {
                        const existing = doc.getElementById('sb-card-isolation');
                        if (existing) existing.remove();
                        const cardStyle = doc.createElement('style');
                        cardStyle.id = 'sb-card-isolation';
                        cardStyle.textContent = cardCss;
                        doc.head.appendChild(cardStyle);
                    }
                }

                return true;
            } catch (e) { return false; }
        };

        if (!inject()) {
            iframe.addEventListener('load', () => setTimeout(inject, 100), { once: true });
        }
    },

    /** Try to detect the app's original primary color from Tailwind config */
    _detectPrimaryColor(doc) {
        try {
            const scripts = doc.querySelectorAll('script');
            for (const s of scripts) {
                const m = s.textContent.match(/["']primary["']\s*:\s*["'](#[0-9a-fA-F]{3,6})["']/);
                if (m) return m[1];
            }
        } catch (e) { }
        return '#000000';
    },

    /** Apply an atmosphere mode (background + filters + regions) */
    applyAtmosphere(atmoId, screenId) {
        const atmo = this.ATMOSPHERES.find(a => a.id === atmoId);
        if (!atmo) return;
        // Apply background
        const bgDef = { presetId: null, name: atmo.name, css: atmo.bgCss };
        if (screenId) {
            this._backgrounds[screenId] = bgDef;
            this._applyToScreen(screenId, bgDef);
        } else {
            this._globalBg = bgDef;
            this._eachScreen(sid => this._applyToScreen(sid, bgDef));
        }
        // Apply filters (atmosphere filters go to background layer)
        if (atmo.filters && Object.keys(atmo.filters).length > 0) {
            const f = { ...this.DEFAULT_FILTERS, ...atmo.filters };
            if (screenId) { this._bgFilters[screenId] = f; } else { this._globalBgFilters = f; }
            if (screenId) {
                this._applyBgFiltersToScreen(screenId);
            } else {
                this._eachScreen(sid => this._applyBgFiltersToScreen(sid));
            }
        }
        // Apply region presets
        if (atmo.regionPresets?.length && screenId) {
            this._regions[screenId] = [];
            atmo.regionPresets.forEach(name => {
                const rp = this.REGION_PRESETS.find(r => r.name.toLowerCase().replace(/\s+/g, '-') === name);
                if (rp) this._regions[screenId].push({ ...rp, id: Date.now() + Math.random() });
            });
            this._regions[screenId].forEach(r => this._applyRegionToScreen(screenId, r));
        }
        this._save();
        this._refreshPanel();
        if (this._focusedMode) this._syncFilmstripBackgrounds();
    },

    // ═════════════════════════════════════════════════════
    //  ALL-SAVED REAPPLY
    // ═════════════════════════════════════════════════════

    _applyAllSaved() {
        // Global background
        if (this._globalBg) {
            this._eachScreen(sid => {
                if (!this._backgrounds[sid]) this._applyToScreen(sid, this._globalBg);
            });
        }
        // Per-screen backgrounds
        Object.entries(this._backgrounds).forEach(([sid, bgDef]) => {
            this._applyToScreen(sid, bgDef);
        });
        // Global background filters (applied to .sb-bg-layer)
        if (this._globalBgFilters) {
            this._eachScreen(sid => {
                if (!this._bgFilters[sid]) this._applyBgFiltersToScreen(sid);
            });
        }
        // Per-screen background filters
        Object.keys(this._bgFilters).forEach(sid => {
            this._applyBgFiltersToScreen(sid);
        });
        // Global UI element filters (applied to iframe)
        if (this._globalFilters) {
            this._eachScreen(sid => {
                if (!this._filters[sid]) this._applyUiFiltersToScreen(sid);
            });
        }
        // Per-screen UI element filters
        Object.keys(this._filters).forEach(sid => {
            this._applyUiFiltersToScreen(sid);
        });
        // Per-screen regions
        Object.entries(this._regions).forEach(([sid, regions]) => {
            regions.forEach(r => this._applyRegionToScreen(sid, r));
        });
        // Active theme
        if (this._activeTheme) {
            this._eachScreen(sid => this._injectThemeCSS(sid, this._activeTheme.colors));
        }
        // Card isolation — must come LAST to override theme glass styles
        if (this._cardOpacity > 0) {
            this._applyCardIsolation();
        }
        // Text brightness
        if (this._textBrightness !== 100) {
            this._applyTextBrightness();
        }
    },

    /** Inject card isolation CSS into all iframes (always as the last style) */
    _applyCardIsolation() {
        const css = this._buildCardIsolationCSS();
        if (!css) return;
        this._eachScreen(sid => {
            const iframe = this._getIframe(sid);
            if (!iframe) return;
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.head) return;
                const existing = doc.getElementById('sb-card-isolation');
                if (existing) existing.remove();
                const s = doc.createElement('style');
                s.id = 'sb-card-isolation';
                s.textContent = css;
                doc.head.appendChild(s);
            } catch (e) { }
        });
    },

    refreshAfterRender() {
        // Called after ScreenManager finishes rendering a screen
        // Re-apply any saved backgrounds/filters/regions
        if (this._isOpen) {
            setTimeout(() => this._applyAllSaved(), 100);
        } else {
            this._applyAllSaved();
        }
    },


    // ═════════════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════════════

    _getIframe(screenId) {
        // In focused mode, return the focused iframe for the current screen
        if (this._focusedMode && this._currentScreenId === screenId) {
            const focusedIframe = document.querySelector('#focused-frame iframe');
            if (focusedIframe) return focusedIframe;
        }
        const slot = document.querySelector(`.ss[data-scr="${screenId}"]`);
        return slot?.querySelector('.df iframe');
    },

    _eachScreen(fn) {
        document.querySelectorAll('.ss[data-scr]').forEach(slot => {
            const sid = slot.dataset.scr;
            if (sid) fn(sid);
        });
    },

    _getFirstScreenId() {
        const first = document.querySelector('.ss[data-scr]');
        return first?.dataset?.scr || null;
    },


    // ═════════════════════════════════════════════════════
    //  PERSISTENCE
    // ═════════════════════════════════════════════════════

    _load() {
        try {
            const raw = localStorage.getItem('sb-state');
            if (raw) {
                const state = JSON.parse(raw);
                this._backgrounds = state.backgrounds || {};
                this._globalBg = state.globalBg || null;
                this._filters = state.filters || {};
                this._globalFilters = state.globalFilters || null;
                this._bgFilters = state.bgFilters || {};
                this._globalBgFilters = state.globalBgFilters || null;
                this._regions = state.regions || {};
                this._activeTheme = state.activeTheme || null;
                this._activeAnimation = state.activeAnimation || null;
                this._studioMode = state.studioMode || 'background';
                this._cardOpacity = state.cardOpacity || 0;
                this._textBrightness = state.textBrightness || 100;
            }
        } catch (e) {
            console.warn('[DesignStudio] Failed to load state:', e);
        }
    },

    _save() {
        try {
            localStorage.setItem('sb-state', JSON.stringify({
                backgrounds: this._backgrounds,
                globalBg: this._globalBg,
                filters: this._filters,
                globalFilters: this._globalFilters,
                bgFilters: this._bgFilters,
                globalBgFilters: this._globalBgFilters,
                regions: this._regions,
                activeTheme: this._activeTheme,
                activeAnimation: this._activeAnimation,
                studioMode: this._studioMode,
                cardOpacity: this._cardOpacity,
                textBrightness: this._textBrightness
            }));
        } catch (e) {
            console.warn('[DesignStudio] Failed to save state:', e);
        }
    },


    // ═════════════════════════════════════════════════════
    //  EVENT SETUP
    // ═════════════════════════════════════════════════════

    _setupEvents() {
        document.getElementById('bg-close')?.addEventListener('click', () => this.close());
    },


    // ═════════════════════════════════════════════════════
    //  CUSTOM LIBRARY
    // ═════════════════════════════════════════════════════

    _saveLibrary() {
        try { localStorage.setItem('sb-library', JSON.stringify(this._customLibrary)); } catch (e) { }
    },

    _loadLibrary() {
        try {
            const raw = localStorage.getItem('sb-library');
            if (raw) {
                this._customLibrary = JSON.parse(raw);
                if (!this._customLibrary.backgrounds) this._customLibrary.backgrounds = [];
                if (!this._customLibrary.palettes) this._customLibrary.palettes = [];
                if (!this._customLibrary.series) this._customLibrary.series = [];
            }
        } catch (e) { }
    },

    /** Parse CSS gradient string → load into editor state */
    _loadCSSIntoEditor(css) {
        if (!css) return;
        // Detect type
        if (css.startsWith('radial-gradient')) {
            this._gradientType = 'radial';
        } else if (css.startsWith('conic-gradient')) {
            this._gradientType = 'conic';
        } else {
            this._gradientType = 'linear';
        }
        // Parse angle
        const angleMatch = css.match(/(\d+)deg/);
        if (angleMatch) this._gradientAngle = parseInt(angleMatch[1]);
        // Parse radial position
        const posMatch = css.match(/at\s+(\d+)%\s+(\d+)%/);
        if (posMatch) {
            this._gradientRadialX = parseInt(posMatch[1]);
            this._gradientRadialY = parseInt(posMatch[2]);
        }
        // Parse color stops
        const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\s*(\d+)?%?/g;
        const stops = [];
        let match;
        while ((match = stopRegex.exec(css)) !== null) {
            stops.push({
                color: match[1],
                position: match[2] ? parseInt(match[2]) : Math.round((stops.length / Math.max(1, stops.length)) * 100)
            });
        }
        if (stops.length >= 2) {
            // Fix positions if needed
            if (stops[0].position === undefined) stops[0].position = 0;
            if (stops[stops.length - 1].position === undefined) stops[stops.length - 1].position = 100;
            for (let i = 0; i < stops.length; i++) {
                if (stops[i].position === undefined || isNaN(stops[i].position)) {
                    stops[i].position = Math.round((i / (stops.length - 1)) * 100);
                }
            }
            this._gradientStops = stops;
            this._selectedStop = 0;
        }
    },


    // ═════════════════════════════════════════════════════
    //  BACKGROUND SERIES
    // ═════════════════════════════════════════════════════

    /** Save current per-screen backgrounds as a named series */
    saveSeries(name) {
        const appId = window.curApp?.id;
        if (!appId) return;
        const screens = window.curApp?.screens || [];
        const mappings = {};
        screens.forEach(sid => {
            if (this._backgrounds[sid]) {
                mappings[sid] = { ...this._backgrounds[sid] };
            }
        });
        if (Object.keys(mappings).length === 0 && !this._globalBg) return;

        const series = {
            id: 'series-' + Date.now(),
            name: name || 'Untitled Series',
            appId,
            createdAt: Date.now(),
            mappings,
            globalBg: this._globalBg ? { ...this._globalBg } : null,
            bgFilters: {},
            cardOpacity: this._cardOpacity,
            textBrightness: this._textBrightness
        };
        // Snapshot per-screen bg filters
        screens.forEach(sid => {
            if (this._bgFilters[sid]) {
                series.bgFilters[sid] = { ...this._bgFilters[sid] };
            }
        });
        this._customLibrary.series.push(series);
        this._saveLibrary();
        this._refreshPanel();
    },

    /** Load a saved series — restore all mappings */
    loadSeries(seriesId) {
        const series = this._customLibrary.series.find(s => s.id === seriesId);
        if (!series) return;

        // Restore global
        this._globalBg = series.globalBg ? { ...series.globalBg } : null;
        // Restore per-screen
        Object.entries(series.mappings || {}).forEach(([sid, bgDef]) => {
            this._backgrounds[sid] = { ...bgDef };
        });
        // Restore filters
        Object.entries(series.bgFilters || {}).forEach(([sid, filterDef]) => {
            this._bgFilters[sid] = { ...filterDef };
        });
        // Restore card opacity & text brightness
        if (series.cardOpacity !== undefined) this._cardOpacity = series.cardOpacity;
        if (series.textBrightness !== undefined) this._textBrightness = series.textBrightness;

        // Apply everything
        this._applyAllSaved();
        this._save();
        this._refreshPanel();
        if (this._focusedMode) this._syncFilmstripBackgrounds();
    },

    /** Delete a series from library */
    deleteSeries(seriesId) {
        this._customLibrary.series = this._customLibrary.series.filter(s => s.id !== seriesId);
        this._saveLibrary();
        this._refreshPanel();
    },

    /** Render series section for gallery */
    _renderSeriesSection(screenId, appSeries, hasPerScreen) {
        let html = '';
        html += `<div class="bg-series-section">`;
        html += `<div class="bg-sub-label" style="margin-bottom:6px">Background Series</div>`;

        // Save current as series (only if per-screen backgrounds exist)
        if (hasPerScreen) {
            html += `<div style="display:flex;gap:4px;margin-bottom:8px">
                <input type="text" id="bg-series-name" class="bg-custom-input" placeholder="Series name..." style="flex:1;margin-bottom:0" />
                <button class="bg-palette-use" id="bg-save-series" style="white-space:nowrap">Save</button>
            </div>`;
        }

        // List saved series for current app
        if (appSeries.length > 0) {
            appSeries.forEach(s => {
                const count = Object.keys(s.mappings || {}).length;
                const date = new Date(s.createdAt).toLocaleDateString();
                html += `<div class="bg-series-item">
                    <div class="bg-series-info">
                        <span class="bg-series-name">${s.name}</span>
                        <span class="bg-series-meta">${count} screens · ${date}</span>
                    </div>
                    <button class="bg-palette-use" data-load-series="${s.id}" style="padding:3px 8px;font-size:9px">Apply</button>
                    <button class="ds-lib-del" data-del-series="${s.id}" title="Delete" style="position:static;opacity:1"><span class="material-symbols-outlined" style="font-size:12px">close</span></button>
                </div>`;
            });
        } else if (!hasPerScreen) {
            html += `<div style="font-size:9px;color:#52525b;padding:4px 0">No saved series for this app</div>`;
        }

        html += `</div>`;
        return html;
    },


    // ═════════════════════════════════════════════════════
    //  FOCUSED DESIGN MODE
    // ═════════════════════════════════════════════════════

    /** Enter focused design mode for a specific screen */
    enterFocusedMode(screenId) {
        if (!window.curApp) return;
        // Auto-select screen #1 if no screen provided
        if (!screenId) screenId = window.curApp.screens[0];
        const idx = window.curApp.screens.indexOf(screenId);
        if (idx === -1) return;

        this._focusedMode = true;
        this._focusedScreenIdx = idx;
        this._currentScreenId = screenId;
        this._focusedScope = 'screen';
        if (!this._activeTab) this._activeTab = 'design';

        const overlay = document.getElementById('focused-overlay');
        if (overlay) {
            overlay.classList.add('on');
            // Filmstrip hidden by default
            const filmstrip = document.getElementById('focused-filmstrip');
            if (filmstrip) filmstrip.classList.add('collapsed');
            this._updateFocusedScreen();
            this._setupFocusedEvents();
        }
    },

    /** Exit focused design mode */
    exitFocusedMode() {
        this._focusedMode = false;
        const overlay = document.getElementById('focused-overlay');
        if (overlay) {
            overlay.classList.remove('on');
            overlay._eventsWired = false;  // Reset so events re-wire on next entry
        }
    },

    /** Update the focused screen iframe and panel */
    _updateFocusedScreen() {
        if (!window.curApp) return;
        const screens = window.curApp.screens;
        const idx = this._focusedScreenIdx;
        const scr = screens[idx];
        if (!scr) return;

        this._currentScreenId = scr;

        // Update title bar
        const title = document.getElementById('focused-title');
        const screenLabel = scr.replace(/^\d+-/, '').replace(/-/g, ' ');
        if (title) title.textContent = `Screen Editor — ${screenLabel}`;
        const counter = document.getElementById('focused-counter');
        if (counter) counter.textContent = `${idx + 1} / ${screens.length}`;

        // Update iframe
        const frame = document.getElementById('focused-frame');
        if (frame) {
            frame.innerHTML = `<iframe src="${window.curApp.id}/screens/${scr}.html"
                style="width:430px;height:884px;border-radius:40px;border:3px solid #2a2a35;background:#fff;pointer-events:auto"></iframe>`;

            // Apply backgrounds to focused iframe after load
            const iframe = frame.querySelector('iframe');
            if (iframe) {
                iframe.addEventListener('load', () => {
                    const bgDef = this._backgrounds[scr] || this._globalBg;
                    if (bgDef) {
                        this._injectBackgroundIntoIframe(iframe, scr, bgDef.css);
                    }
                    if (this._activeTheme) {
                        this._injectThemeCSS(scr, this._activeTheme.colors);
                    }
                    if (this._textBrightness !== 100) {
                        this._applyTextBrightness();
                    }
                }, { once: true });
            }
        }

        // Render info panel
        this._renderInfoPanel();

        // Render filmstrip
        this._renderFilmstrip();

        // Render design panel
        this._renderFocusedPanel();

        // Update prev/next button states
        const prev = document.getElementById('focused-prev');
        const next = document.getElementById('focused-next');
        if (prev) prev.disabled = idx === 0;
        if (next) next.disabled = idx === screens.length - 1;
    },

    /** Render the design panel in focused mode — 3-tab structure */
    _renderFocusedPanel() {
        const container = document.getElementById('focused-bg-body');
        if (!container) return;

        const screenId = this._currentScreenId;
        const tab = this._activeTab || 'design';
        let html = '';

        // ── Tab bar (Design / Effects / Inspect) ──
        html += `<div class="se-tabs">
            <button class="se-tab ${tab === 'design' ? 'active' : ''}" data-se-tab="design">
                <span class="material-symbols-outlined">palette</span> Design
            </button>
            <button class="se-tab ${tab === 'effects' ? 'active' : ''}" data-se-tab="effects">
                <span class="material-symbols-outlined">auto_fix_high</span> Effects
            </button>
            <button class="se-tab ${tab === 'inspect' ? 'active' : ''}" data-se-tab="inspect">
                <span class="material-symbols-outlined">search</span> Inspect
            </button>
        </div>`;

        // ── Tab content ──
        if (tab === 'design') {
            html += this._renderDesignTab(screenId);
        } else if (tab === 'effects') {
            html += this._renderEffectsTab(screenId);
        } else if (tab === 'inspect') {
            html += this._renderInspectTab(screenId);
        }

        container.innerHTML = html;

        // Wire tab clicks
        container.querySelectorAll('[data-se-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._activeTab = btn.dataset.seTab;
                this._renderFocusedPanel();
            });
        });

        // Wire sub-content events
        // When Design tab scope is "all", pass null so apply methods go global
        const wireScreenId = (tab === 'design' && this._focusedScope === 'all') ? null : screenId;
        try {
            if (tab === 'design' || tab === 'effects') {
                this._wireEvents(container, wireScreenId);
            }
            if (tab === 'inspect') {
                this._wireInspectEvents(container, screenId);
            }
        } catch (err) {
            console.error('[ScreenEditor] event wiring error:', err);
        }
    },

    /** Design tab — backgrounds + palettes combined */
    _renderDesignTab(screenId) {
        const mode = this._studioMode;
        const scope = this._focusedScope || 'screen';
        // When scope is "all", pass null as screenId so apply methods go global
        const effectiveScreenId = scope === 'all' ? null : screenId;
        let html = '';

        // Scope toggle (This Screen / All Screens)
        const screenLabel = screenId ? screenId.replace(/^\d+-/, '').replace(/-/g, ' ') : '';
        html += `<div class="bg-mode-bar" style="margin-bottom:8px">
            <button class="bg-mode-btn ${scope === 'screen' ? 'active' : ''}" data-scope="screen">
                <span class="material-symbols-outlined" style="font-size:12px">phone_iphone</span> This Screen
            </button>
            <button class="bg-mode-btn ${scope === 'all' ? 'active' : ''}" data-scope="all">
                <span class="material-symbols-outlined" style="font-size:12px">devices</span> All Screens
            </button>
        </div>`;
        if (scope === 'all') {
            html += `<div class="bg-screen-indicator" style="background:rgba(52,211,153,0.06);border-color:rgba(52,211,153,0.12)">
                <span class="material-symbols-outlined" style="font-size:12px;color:#34d399">public</span>
                <span style="color:#6ee7b7;font-weight:600">Applying to all screens</span>
            </div>`;
        }

        // Mode switch (Background / UI Elements)
        html += `<div class="ds-mode-switch" style="margin-bottom:8px">
            <button class="ds-mode-btn ${mode === 'background' ? 'active' : ''}" data-studio-mode="background">
                <span class="ds-mode-icon"><span class="material-symbols-outlined" style="font-size:14px">wallpaper</span></span> Background
            </button>
            <button class="ds-mode-btn ${mode === 'elements' ? 'active' : ''}" data-studio-mode="elements">
                <span class="ds-mode-icon"><span class="material-symbols-outlined" style="font-size:14px">palette</span></span> UI Elements
            </button>
        </div>`;

        // Sub-tool tabs
        const subLabels = {
            gallery: mode === 'background' ? '<span class="material-symbols-outlined" style="font-size:13px">palette</span> Gallery' : '<span class="material-symbols-outlined" style="font-size:13px">palette</span> Palettes',
            editor: mode === 'background' ? '<span class="material-symbols-outlined" style="font-size:13px">edit</span> Editor' : '<span class="material-symbols-outlined" style="font-size:13px">brush</span> Editor',
        };
        html += `<div class="bg-tab-bar">`;
        for (const [key, label] of Object.entries(subLabels)) {
            html += `<button class="bg-tab ${this._activeSubTool === key ? 'active' : ''}" data-subtool="${key}">${label}</button>`;
        }
        html += `</div>`;

        // Content — pass effectiveScreenId so global scope works
        if (this._activeSubTool === 'gallery' || this._activeSubTool === 'adjust' || this._activeSubTool === 'fx') {
            html += mode === 'background' ? this._renderBgGallery(effectiveScreenId) : this._renderUiGallery(effectiveScreenId);
        } else if (this._activeSubTool === 'editor') {
            html += mode === 'background' ? this._renderBgEditor(effectiveScreenId) : this._renderUiEditor(effectiveScreenId);
        }

        return html;
    },

    /** Effects tab — Filters + FX stacked */
    _renderEffectsTab(screenId) {
        let html = '';

        // Filters section
        html += this._renderAdjustTool(screenId);

        // Separator
        html += `<div style="height:1px;background:var(--border);margin:14px 0"></div>`;

        // FX section
        const mode = this._studioMode;
        html += mode === 'background' ? this._renderBgFx(screenId) : this._renderUiFx(screenId);

        return html;
    },

    /** Inspect tab — Design tokens for current screen */
    _renderInspectTab(screenId) {
        let html = '';
        html += `<div style="font-size:10px;color:#71717a;margin-bottom:10px;display:flex;align-items:center;gap:4px">
            <span class="material-symbols-outlined" style="font-size:13px">info</span>
            Design tokens extracted from the current screen
        </div>`;
        html += `<div id="se-inspect-results"><div class="se-inspect-empty">
            <span class="material-symbols-outlined" style="font-size:24px;color:#3f3f46;margin-bottom:6px">hourglass_empty</span><br>
            Scanning screen tokens...
        </div></div>`;

        // Trigger async scan after render
        setTimeout(() => this._scanScreenTokens(screenId), 50);

        return html;
    },

    /** Scan tokens from the focused screen iframe */
    _scanScreenTokens(screenId) {
        const resultsEl = document.getElementById('se-inspect-results');
        if (!resultsEl) return;

        const frame = document.getElementById('focused-frame');
        const iframe = frame?.querySelector('iframe');
        if (!iframe) {
            resultsEl.innerHTML = `<div class="se-inspect-empty">No screen loaded</div>`;
            return;
        }

        let doc;
        try { doc = iframe.contentDocument; } catch (e) {
            resultsEl.innerHTML = `<div class="se-inspect-empty">Cannot access screen content</div>`;
            return;
        }
        if (!doc || !doc.body) {
            resultsEl.innerHTML = `<div class="se-inspect-empty">Screen still loading...</div>`;
            return;
        }

        const colors = {}, fonts = {}, fontSizes = {}, radii = {};
        const skipColors = new Set(['transparent', 'rgba(0, 0, 0, 0)', 'initial', 'inherit', 'currentcolor']);
        const colorProps = ['color', 'background-color', 'border-color', 'border-top-color', 'border-bottom-color'];

        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (n) => ['SCRIPT','STYLE','LINK','META','NOSCRIPT'].includes(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        let el, count = 0;
        while (el = walker.nextNode()) {
            count++;
            const cs = iframe.contentWindow.getComputedStyle(el);
            // Colors
            for (const prop of colorProps) {
                const v = cs.getPropertyValue(prop);
                if (!v || skipColors.has(v.toLowerCase())) continue;
                colors[v] = (colors[v] || 0) + 1;
            }
            // Fonts
            const ff = cs.getPropertyValue('font-family');
            if (ff) {
                const primary = ff.split(',')[0].trim().replace(/['"]/g, '');
                if (primary && !['serif','sans-serif','monospace'].includes(primary)) {
                    fonts[primary] = (fonts[primary] || 0) + 1;
                }
            }
            // Font sizes
            const fs = cs.getPropertyValue('font-size');
            if (fs && fs !== '0px') fontSizes[fs] = (fontSizes[fs] || 0) + 1;
            // Border radius
            const br = cs.getPropertyValue('border-radius');
            if (br && br !== '0px') radii[br] = (radii[br] || 0) + 1;
        }

        // Render results
        let html = '';

        // Colors
        const sortedColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 20);
        if (sortedColors.length) {
            html += `<div class="se-inspect-section">
                <div class="se-inspect-label"><span class="material-symbols-outlined">palette</span> Colors (${sortedColors.length})</div>
                <div class="se-token-grid">`;
            sortedColors.forEach(([c, n]) => {
                html += `<div class="se-token-swatch" style="background:${c}" title="${c} (${n}x)"></div>`;
            });
            html += `</div></div>`;
        }

        // Fonts
        const sortedFonts = Object.entries(fonts).sort((a, b) => b[1] - a[1]);
        if (sortedFonts.length) {
            html += `<div class="se-inspect-section">
                <div class="se-inspect-label"><span class="material-symbols-outlined">text_fields</span> Fonts (${sortedFonts.length})</div>`;
            sortedFonts.forEach(([f, n]) => {
                html += `<div class="se-token-item"><span>${f}</span> <span style="color:#52525b">${n}x</span></div>`;
            });
            html += `</div>`;
        }

        // Font sizes
        const sortedSizes = Object.entries(fontSizes).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
        if (sortedSizes.length) {
            html += `<div class="se-inspect-section">
                <div class="se-inspect-label"><span class="material-symbols-outlined">format_size</span> Type Scale (${sortedSizes.length})</div>`;
            sortedSizes.forEach(([s, n]) => {
                html += `<div class="se-token-item"><span>${s}</span> <span style="color:#52525b">${n}x</span></div>`;
            });
            html += `</div>`;
        }

        // Border radii
        const sortedRadii = Object.entries(radii).sort((a, b) => b[1] - a[1]);
        if (sortedRadii.length) {
            html += `<div class="se-inspect-section">
                <div class="se-inspect-label"><span class="material-symbols-outlined">rounded_corner</span> Radii (${sortedRadii.length})</div>`;
            sortedRadii.slice(0, 8).forEach(([r, n]) => {
                html += `<div class="se-token-item"><span>${r}</span> <span style="color:#52525b">${n}x</span></div>`;
            });
            html += `</div>`;
        }

        html += `<div style="font-size:9px;color:#52525b;margin-top:8px;text-align:center">${count} elements scanned</div>`;

        resultsEl.innerHTML = html;
    },

    /** Wire inspect tab events */
    _wireInspectEvents(container, screenId) {
        // Token swatches — click to copy
        container.querySelectorAll('.se-token-swatch').forEach(sw => {
            sw.addEventListener('click', () => {
                const color = sw.title.split(' (')[0];
                navigator.clipboard?.writeText(color);
                if (typeof toast === 'function') toast(`Copied: ${color}`);
            });
        });
    },

    /** Render the info panel (left side) */
    _renderInfoPanel() {
        const body = document.getElementById('focused-info-body');
        if (!body) return;
        if (!window.curApp) return;

        const scr = this._currentScreenId;
        const k = typeof aK === 'function' ? aK(window.curApp.id, scr) : `${window.curApp.id}/${scr}`;
        const a = typeof getA === 'function' ? getA(k) : { notes: '', tags: [], starred: false, grade: '', status: '', images: [] };
        const screenLabel = scr.replace(/^\d+-/, '').replace(/-/g, ' ');

        let html = '';

        // Screen title
        html += `<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px">${screenLabel}</div>`;
        html += `<div style="font-size:10px;color:var(--dim);margin-bottom:12px">${window.curApp.name}</div>`;

        // Star + Grade
        html += `<div class="fi-section">
            <div class="fi-label"><span class="material-symbols-outlined">star</span> Rating</div>
            <div style="display:flex;align-items:center;gap:6px">
                <button class="fi-star-btn ${a.starred ? 'on' : ''}" id="fi-star">
                    <span class="material-symbols-outlined" style="font-size:13px">${a.starred ? 'star' : 'star_border'}</span> Star
                </button>
                <div class="fi-grades">
                    <button class="fi-grade ${a.grade === 'A' ? 'on' : ''}" data-fi-g="A">A</button>
                    <button class="fi-grade ${a.grade === 'B' ? 'on' : ''}" data-fi-g="B">B</button>
                    <button class="fi-grade ${a.grade === 'C' ? 'on' : ''}" data-fi-g="C">C</button>
                    <button class="fi-grade ${a.grade === 'D' ? 'on' : ''}" data-fi-g="D">D</button>
                </div>
            </div>
        </div>`;

        // Status
        html += `<div class="fi-section">
            <div class="fi-label"><span class="material-symbols-outlined">flag</span> Status</div>
            <div class="fi-status-bar">
                <button class="fi-status-btn ${a.status === 'approved' ? 'on' : ''}" data-fi-s="approved"><span class="material-symbols-outlined">check</span> Approved</button>
                <button class="fi-status-btn ${a.status === 'wip' ? 'on' : ''}" data-fi-s="wip"><span class="material-symbols-outlined">bolt</span> WIP</button>
                <button class="fi-status-btn ${a.status === 'needs-work' ? 'on' : ''}" data-fi-s="needs-work"><span class="material-symbols-outlined">close</span> Needs Work</button>
                <button class="fi-status-btn ${a.status === 'review' ? 'on' : ''}" data-fi-s="review"><span class="material-symbols-outlined">visibility</span> Review</button>
            </div>
        </div>`;

        // Notes
        html += `<div class="fi-section">
            <div class="fi-label"><span class="material-symbols-outlined">edit_note</span> Notes <span class="fi-saved" id="fi-saved"><span class="material-symbols-outlined">check</span> Saved</span></div>
            <textarea class="fi-notes" id="fi-notes" placeholder="Add design notes, feedback...">${a.notes || ''}</textarea>
        </div>`;

        // Tags
        html += `<div class="fi-section">
            <div class="fi-label"><span class="material-symbols-outlined">label</span> Tags</div>
            <input class="fi-tag-input" id="fi-tag-input" placeholder="Type tag + Enter">
            <div class="fi-tags" id="fi-tags">`;
        (a.tags || []).forEach(t => {
            html += `<span class="fi-tag" data-fi-tag="${t}">${t} &times;</span>`;
        });
        html += `</div></div>`;

        // Screen metadata
        html += `<div class="fi-section">
            <div class="fi-label"><span class="material-symbols-outlined">info</span> Metadata</div>
            <div class="fi-meta-row"><span>File</span><span>${scr}.html</span></div>
            <div class="fi-meta-row"><span>App</span><span>${window.curApp.name}</span></div>
            <div class="fi-meta-row"><span>Index</span><span>${this._focusedScreenIdx + 1} of ${window.curApp.screens.length}</span></div>
            <div class="fi-meta-row"><span>Size</span><span>430 × 884</span></div>
        </div>`;

        body.innerHTML = html;
        this._wireInfoEvents(body);
    },

    /** Wire info panel events */
    _wireInfoEvents(body) {
        const scr = this._currentScreenId;
        if (!scr || !window.curApp) return;
        const k = typeof aK === 'function' ? aK(window.curApp.id, scr) : `${window.curApp.id}/${scr}`;
        const saveFn = typeof save === 'function' ? save : () => {};

        // Star
        body.querySelector('#fi-star')?.addEventListener('click', () => {
            const a = typeof getA === 'function' ? getA(k) : { starred: false };
            a.starred = !a.starred;
            if (typeof annotations !== 'undefined') annotations[k] = a;
            saveFn();
            this._renderInfoPanel();
            if (typeof renderCanvas === 'function') renderCanvas();
        });

        // Grade buttons
        body.querySelectorAll('[data-fi-g]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = typeof getA === 'function' ? getA(k) : { grade: '' };
                a.grade = a.grade === btn.dataset.fiG ? '' : btn.dataset.fiG;
                if (typeof annotations !== 'undefined') annotations[k] = a;
                saveFn();
                this._renderInfoPanel();
                if (typeof renderCanvas === 'function') renderCanvas();
            });
        });

        // Status buttons
        body.querySelectorAll('[data-fi-s]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = typeof getA === 'function' ? getA(k) : { status: '' };
                a.status = a.status === btn.dataset.fiS ? '' : btn.dataset.fiS;
                if (typeof annotations !== 'undefined') annotations[k] = a;
                saveFn();
                this._renderInfoPanel();
            });
        });

        // Notes — auto-save on input
        let noteTimer;
        body.querySelector('#fi-notes')?.addEventListener('input', (e) => {
            clearTimeout(noteTimer);
            noteTimer = setTimeout(() => {
                const a = typeof getA === 'function' ? getA(k) : {};
                a.notes = e.target.value;
                if (typeof annotations !== 'undefined') annotations[k] = a;
                saveFn();
                const saved = body.querySelector('#fi-saved');
                if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 1500); }
            }, 400);
        });

        // Tag input
        body.querySelector('#fi-tag-input')?.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const v = e.target.value.trim().toLowerCase();
            if (!v) return;
            const a = typeof getA === 'function' ? getA(k) : {};
            if (!a.tags) a.tags = [];
            if (!a.tags.includes(v)) {
                a.tags.push(v);
                if (typeof annotations !== 'undefined') annotations[k] = a;
                saveFn();
                this._renderInfoPanel();
            }
            e.target.value = '';
        });

        // Tag removal
        body.querySelectorAll('[data-fi-tag]').forEach(tag => {
            tag.addEventListener('click', () => {
                const a = typeof getA === 'function' ? getA(k) : {};
                a.tags = (a.tags || []).filter(t => t !== tag.dataset.fiTag);
                if (typeof annotations !== 'undefined') annotations[k] = a;
                saveFn();
                this._renderInfoPanel();
                if (typeof renderCanvas === 'function') renderCanvas();
            });
        });
    },

    /** Render the filmstrip at the bottom */
    _renderFilmstrip() {
        const track = document.getElementById('film-track');
        if (!track || !window.curApp) return;

        const screens = window.curApp.screens;
        const idx = this._focusedScreenIdx;

        track.innerHTML = screens.map((s, i) => {
            const label = s.replace(/^\d+-/, '').replace(/-/g, ' ');
            const isActive = i === idx;
            return `<div class="film-item">
                <div class="film-label">${label}</div>
                <div class="film-thumb ${isActive ? 'active' : ''}" data-film-idx="${i}" title="${label}">
                    <iframe class="film-thumb-frame" src="${window.curApp.id}/screens/${s}.html" loading="lazy"></iframe>
                </div>
            </div>`;
        }).join('');

        // Inject backgrounds into filmstrip iframes after they load
        track.querySelectorAll('.film-thumb-frame').forEach((iframe, i) => {
            const scrId = screens[i];
            iframe.addEventListener('load', () => {
                const bgDef = this._backgrounds[scrId] || this._globalBg;
                if (bgDef) {
                    this._injectBackgroundIntoIframe(iframe, scrId, bgDef.css);
                }
                if (this._activeTheme) {
                    try { this._injectThemeCSS(scrId, this._activeTheme.colors); } catch(e) {}
                }
            }, { once: true });
        });

        // Auto-scroll active into view
        const activeThumb = track.querySelector('.film-thumb.active');
        if (activeThumb) {
            activeThumb.closest('.film-item')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    },

    /** Sync backgrounds into all filmstrip iframes (call after applying a background) */
    _syncFilmstripBackgrounds() {
        const track = document.getElementById('film-track');
        if (!track || !window.curApp) return;
        const screens = window.curApp.screens;
        track.querySelectorAll('.film-thumb-frame').forEach((iframe, i) => {
            const scrId = screens[i];
            const bgDef = this._backgrounds[scrId] || this._globalBg;
            if (bgDef) {
                this._injectBackgroundIntoIframe(iframe, scrId, bgDef.css);
            }
        });
    },

    /** Setup focused mode event listeners */
    _setupFocusedEvents() {
        const overlay = document.getElementById('focused-overlay');
        if (!overlay || overlay._eventsWired) return;
        overlay._eventsWired = true;

        overlay.addEventListener('click', (e) => {
            // Close button
            if (e.target.closest('#focused-close')) {
                this.exitFocusedMode();
                return;
            }
            // Prev button
            if (e.target.closest('#focused-prev')) {
                if (this._focusedScreenIdx > 0) {
                    this._focusedScreenIdx--;
                    this._updateFocusedScreen();
                }
                return;
            }
            // Next button
            if (e.target.closest('#focused-next')) {
                const max = (window.curApp?.screens?.length || 1) - 1;
                if (this._focusedScreenIdx < max) {
                    this._focusedScreenIdx++;
                    this._updateFocusedScreen();
                }
                return;
            }
            // Toggle filmstrip
            if (e.target.closest('#focused-toggle-filmstrip')) {
                const filmstrip = document.getElementById('focused-filmstrip');
                if (filmstrip) filmstrip.classList.toggle('collapsed');
                return;
            }
            // Toggle info panel
            if (e.target.closest('#focused-toggle-info')) {
                const panel = document.getElementById('focused-info-panel');
                if (panel) panel.classList.toggle('collapsed');
                return;
            }
            // Toggle design panel
            if (e.target.closest('#focused-toggle-panel')) {
                const panel = document.getElementById('focused-design-panel');
                if (panel) panel.classList.toggle('collapsed');
                return;
            }
            // Filmstrip thumb click
            const thumb = e.target.closest('.film-thumb[data-film-idx]');
            if (thumb) {
                this._focusedScreenIdx = parseInt(thumb.dataset.filmIdx);
                this._updateFocusedScreen();
                return;
            }
            // Filmstrip arrows
            if (e.target.closest('#film-prev')) {
                const track = document.getElementById('film-track');
                if (track) track.scrollBy({ left: -300, behavior: 'smooth' });
                return;
            }
            if (e.target.closest('#film-next')) {
                const track = document.getElementById('film-track');
                if (track) track.scrollBy({ left: 300, behavior: 'smooth' });
                return;
            }
            // Dot navigation (legacy, hidden but still works)
            const dot = e.target.closest('.focused-dot');
            if (dot) {
                this._focusedScreenIdx = parseInt(dot.dataset.focusedIdx);
                this._updateFocusedScreen();
                return;
            }
        });
    }

};

