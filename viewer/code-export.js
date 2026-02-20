// ═══════════════════════════════════════════════════════════════
// CODE EXPORT — Extract & Convert Screen HTML to Frameworks
// Extracts HTML from screen iframes and converts to:
//   - Clean, formatted HTML
//   - React TSX functional components
//   - Vue Single File Components (SFC)
//   - Svelte components
//   - Tailwind-enhanced HTML (inline CSS -> utility classes)
// Features syntax highlighting, line numbers, copy & download.
// ═══════════════════════════════════════════════════════════════

const CodeExport = {

    // ── State ──────────────────────────────────────────────
    _panelEl: null,
    _isOpen: false,
    _currentFormat: 'html',
    _extractedHTML: '',
    _cachedOutput: {},
    _selectedScreenId: null,

    // ── Tailwind: direct property:value -> class ──────────
    TAILWIND_MAP: {
        'display:flex': 'flex', 'display:inline-flex': 'inline-flex', 'display:grid': 'grid',
        'display:block': 'block', 'display:inline-block': 'inline-block', 'display:none': 'hidden',
        'flex-direction:row': 'flex-row', 'flex-direction:column': 'flex-col',
        'flex-direction:row-reverse': 'flex-row-reverse', 'flex-direction:column-reverse': 'flex-col-reverse',
        'flex-wrap:wrap': 'flex-wrap', 'flex-wrap:nowrap': 'flex-nowrap',
        'justify-content:center': 'justify-center', 'justify-content:flex-start': 'justify-start',
        'justify-content:flex-end': 'justify-end', 'justify-content:space-between': 'justify-between',
        'justify-content:space-around': 'justify-around', 'justify-content:space-evenly': 'justify-evenly',
        'align-items:center': 'items-center', 'align-items:flex-start': 'items-start',
        'align-items:flex-end': 'items-end', 'align-items:stretch': 'items-stretch',
        'align-items:baseline': 'items-baseline',
        'position:relative': 'relative', 'position:absolute': 'absolute',
        'position:fixed': 'fixed', 'position:sticky': 'sticky',
        'overflow:hidden': 'overflow-hidden', 'overflow:auto': 'overflow-auto',
        'overflow:scroll': 'overflow-scroll',
        'text-align:center': 'text-center', 'text-align:left': 'text-left',
        'text-align:right': 'text-right', 'text-align:justify': 'text-justify',
        'text-transform:uppercase': 'uppercase', 'text-transform:lowercase': 'lowercase',
        'text-transform:capitalize': 'capitalize',
        'font-weight:100': 'font-thin', 'font-weight:200': 'font-extralight',
        'font-weight:300': 'font-light', 'font-weight:400': 'font-normal',
        'font-weight:500': 'font-medium', 'font-weight:600': 'font-semibold',
        'font-weight:700': 'font-bold', 'font-weight:800': 'font-extrabold', 'font-weight:900': 'font-black',
        'font-style:italic': 'italic', 'font-style:normal': 'not-italic',
        'white-space:nowrap': 'whitespace-nowrap', 'white-space:pre': 'whitespace-pre',
        'cursor:pointer': 'cursor-pointer', 'cursor:not-allowed': 'cursor-not-allowed',
        'object-fit:cover': 'object-cover', 'object-fit:contain': 'object-contain',
        'pointer-events:none': 'pointer-events-none', 'pointer-events:auto': 'pointer-events-auto',
        'width:100%': 'w-full', 'height:100%': 'h-full',
        'width:100vw': 'w-screen', 'height:100vh': 'h-screen',
    },

    // ── Tailwind: px value -> spacing scale token ────────
    SIZE_MAP: {
        '0px': '0', '1px': 'px', '2px': '0.5', '4px': '1', '6px': '1.5', '8px': '2',
        '10px': '2.5', '12px': '3', '14px': '3.5', '16px': '4', '20px': '5', '24px': '6',
        '28px': '7', '32px': '8', '36px': '9', '40px': '10', '44px': '11', '48px': '12',
        '56px': '14', '64px': '16', '80px': '20', '96px': '24',
    },

    // ── Tailwind: size-based property prefix mapping ─────
    // Properties that use SIZE_MAP with a Tailwind prefix
    SIZE_PREFIXES: {
        'padding': 'p', 'padding-top': 'pt', 'padding-right': 'pr', 'padding-bottom': 'pb', 'padding-left': 'pl',
        'margin': 'm', 'margin-top': 'mt', 'margin-right': 'mr', 'margin-bottom': 'mb', 'margin-left': 'ml',
        'gap': 'gap', 'row-gap': 'gap-y', 'column-gap': 'gap-x',
        'width': 'w', 'height': 'h', 'top': 'top', 'right': 'right', 'bottom': 'bottom', 'left': 'left',
    },

    FONT_SIZE_MAP: {
        '12px': 'text-xs', '14px': 'text-sm', '16px': 'text-base', '18px': 'text-lg',
        '20px': 'text-xl', '24px': 'text-2xl', '30px': 'text-3xl', '36px': 'text-4xl',
        '48px': 'text-5xl', '60px': 'text-6xl',
    },

    RADIUS_MAP: {
        '0px': 'rounded-none', '2px': 'rounded-sm', '4px': 'rounded', '6px': 'rounded-md',
        '8px': 'rounded-lg', '12px': 'rounded-xl', '16px': 'rounded-2xl', '24px': 'rounded-3xl',
        '9999px': 'rounded-full',
    },

    // ── Syntax highlighting colors ───────────────────────
    HL: {
        tag: '#60a5fa', attr: '#67e8f9', string: '#4ade80', comment: '#71717a',
        cssProp: '#c084fc', cssVal: '#fbbf24', keyword: '#f472b6',
        component: '#fb923c', punct: '#a1a1aa',
    },


    // ═════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═════════════════════════════════════════════════════

    init() {
        this._panelEl = document.getElementById('ce-panel');
        if (!this._panelEl) this._createPanel();
        this._setupEvents();
        if (this._panelEl) {
            FloatingWindows.setupDrag(this._panelEl, this._panelEl.querySelector('.ce-header'));
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
        document.getElementById('btn-code-export')?.classList.add('on');
        this._cachedOutput = {};
        this._extractAndRender();
    },

    close() {
        this._isOpen = false;
        this._panelEl?.classList.remove('open');
        document.getElementById('btn-code-export')?.classList.remove('on');
    },

    toggle() { this._isOpen ? this.close() : this.open(); },


    // ═════════════════════════════════════════════════════
    //  PANEL CREATION (dynamic DOM + CSS injection)
    // ═════════════════════════════════════════════════════

    _createPanel() {
        const aside = document.createElement('aside');
        aside.id = 'ce-panel';
        aside.innerHTML = `
            <div class="ce-header">
                <div class="ce-header-info">
                    <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent)">code</span>
                    <span class="ce-title">Code Export</span>
                </div>
                <div class="ce-header-actions">
                    <button class="ce-hbtn" id="ce-copy" title="Copy to clipboard"><span class="material-symbols-outlined" style="font-size:14px">content_copy</span></button>
                    <button class="ce-hbtn" id="ce-download" title="Download file"><span class="material-symbols-outlined" style="font-size:14px">download</span></button>
                    <button class="ce-hbtn" id="ce-close" title="Close"><span class="material-symbols-outlined" style="font-size:14px">close</span></button>
                </div>
            </div>
            <div class="ce-tabs" id="ce-tabs"></div>
            <div class="ce-screen-bar" id="ce-screen-bar"></div>
            <div class="ce-code-wrap" id="ce-code-wrap">
                <div class="ce-lines" id="ce-lines"></div>
                <pre class="ce-code" id="ce-code"></pre>
            </div>
            <div class="ce-status" id="ce-status"></div>`;
        document.body.appendChild(aside);
        this._panelEl = aside;
        this._injectStyles();
    },

    _injectStyles() {
        if (document.getElementById('ce-styles')) return;
        const s = document.createElement('style');
        s.id = 'ce-styles';
        s.textContent = `
#ce-panel{position:fixed;right:140px;top:180px;width:410px;max-height:calc(100vh - 200px);background:rgba(12,12,16,.95);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);border:1px solid rgba(96,165,250,.12);border-radius:12px;z-index:500;display:none;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:'Inter',-apple-system,sans-serif;overflow:hidden}
#ce-panel.open{display:flex}
.ce-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
.ce-header-info{display:flex;align-items:center;gap:7px}
.ce-title{font-size:12px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.5px}
.ce-header-actions{display:flex;gap:2px}
.ce-hbtn{background:0;border:0;color:var(--dim);padding:5px;border-radius:5px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
.ce-hbtn:hover{color:var(--text);background:var(--s3)}
.ce-tabs{display:flex;gap:1px;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0;overflow-x:auto}
.ce-tab{background:0;border:0;color:var(--dim);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;white-space:nowrap;transition:all .15s}
.ce-tab:hover{color:var(--text);background:var(--s2)}
.ce-tab.active{color:#fff;background:var(--adim,#4f46e5)}
.ce-screen-bar{padding:4px 10px;border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0;display:none}
.ce-screen-bar.show{display:block}
.ce-screen-select{width:100%;background:var(--s2);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-size:11px;font-family:inherit;cursor:pointer}
.ce-screen-select:focus{outline:1px solid var(--accent);border-color:var(--accent)}
.ce-code-wrap{flex:1;overflow:auto;display:flex;position:relative;background:var(--bg)}
.ce-code-wrap::-webkit-scrollbar{width:6px;height:6px}
.ce-code-wrap::-webkit-scrollbar-track{background:transparent}
.ce-code-wrap::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.ce-lines{flex-shrink:0;padding:12px 0;text-align:right;user-select:none;color:var(--muted,#52525b);font:12px/1.6 'JetBrains Mono','Fira Code','Cascadia Code',monospace;min-width:40px;padding-right:8px;padding-left:8px;border-right:1px solid rgba(255,255,255,.04);position:sticky;left:0;background:var(--bg);z-index:1}
.ce-line-num{display:block;height:1.6em;font-size:10px;opacity:.6}
.ce-code{flex:1;margin:0;padding:12px 14px;font:12px/1.6 'JetBrains Mono','Fira Code','Cascadia Code',monospace;color:var(--text);white-space:pre;overflow:visible;tab-size:2;background:transparent}
.ce-status{padding:5px 12px;border-top:1px solid rgba(255,255,255,.04);font-size:10px;color:var(--dim);flex-shrink:0;display:flex;justify-content:space-between;align-items:center}
.ce-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--dim);gap:8px;padding:40px 20px;text-align:center}
.ce-empty-icon{font-size:32px;opacity:.4}
.ce-empty-text{font-size:12px;line-height:1.5}`;
        document.head.appendChild(s);
    },


    // ═════════════════════════════════════════════════════
    //  HTML EXTRACTION
    // ═════════════════════════════════════════════════════

    _getScreenIframe(screenId) {
        const id = screenId || selScreen;
        if (!id) return null;
        const slot = document.querySelector(`.ss[data-scr="${id}"]`);
        return slot?.querySelector('iframe') || null;
    },

    _extractHTML(screenId) {
        const iframe = this._getScreenIframe(screenId);
        if (!iframe) return '';
        let doc;
        try { doc = iframe.contentDocument; } catch (e) { return ''; }
        if (!doc?.body) return '';

        const clone = doc.body.cloneNode(true);
        clone.querySelectorAll('script, noscript, link, meta, [id^="ei-"]').forEach(el => el.remove());
        return this._cleanHTML(clone.innerHTML);
    },

    _cleanHTML(html) {
        if (!html) return '';
        return html.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();
    },

    _formatHTML(html) {
        if (!html) return '';
        let indent = 0;
        const TAB = '  ';

        // Tokenize into tags and text
        const tokens = [];
        let buf = '', inTag = false;
        for (let i = 0; i < html.length; i++) {
            const ch = html[i];
            if (ch === '<') {
                if (buf.trim()) tokens.push({ t: 'text', v: buf.trim() });
                buf = '<'; inTag = true;
            } else if (ch === '>' && inTag) {
                buf += '>'; inTag = false;
                tokens.push({ t: 'tag', v: buf }); buf = '';
            } else buf += ch;
        }
        if (buf.trim()) tokens.push({ t: 'text', v: buf.trim() });

        const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
        const INLINE = new Set(['a','abbr','b','br','cite','code','em','i','kbd','mark','q','s','small','span','strong','sub','sup','time','u','var','wbr']);

        const lines = [];
        let prevInline = false;

        for (const tok of tokens) {
            if (tok.t === 'text') {
                if (prevInline && lines.length) lines[lines.length - 1] += tok.v;
                else lines.push(TAB.repeat(indent) + tok.v);
                prevInline = true;
                continue;
            }
            const m = tok.v.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
            if (!m) { lines.push(TAB.repeat(indent) + tok.v); prevInline = false; continue; }

            const tag = m[1].toLowerCase();
            const closing = tok.v.startsWith('</');
            const selfClose = tok.v.endsWith('/>') || VOID.has(tag);
            const inl = INLINE.has(tag);

            if (closing) {
                indent = Math.max(0, indent - 1);
                if (inl && prevInline && lines.length) lines[lines.length - 1] += tok.v;
                else { lines.push(TAB.repeat(indent) + tok.v); prevInline = false; }
            } else if (selfClose) {
                if (inl && prevInline && lines.length) lines[lines.length - 1] += tok.v;
                else { lines.push(TAB.repeat(indent) + tok.v); prevInline = inl; }
            } else {
                if (inl && prevInline && lines.length) lines[lines.length - 1] += tok.v;
                else { lines.push(TAB.repeat(indent) + tok.v); prevInline = inl; }
                if (!inl) { indent++; prevInline = false; }
            }
        }
        return lines.join('\n').replace(/^\s+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    },


    // ═════════════════════════════════════════════════════
    //  FRAMEWORK CONVERSIONS
    // ═════════════════════════════════════════════════════

    _toReact(html) {
        if (!html) return '';
        let tsx = html;

        // Attribute conversions
        tsx = tsx.replace(/\bclass="/g, 'className="');
        tsx = tsx.replace(/\bfor="/g, 'htmlFor="');
        tsx = tsx.replace(/\btabindex="/g, 'tabIndex="');

        // Inline style="..." -> style={{ ... }}
        tsx = tsx.replace(/style="([^"]*)"/g, (_, s) => `style={${this._cssToJsStyle(s)}}`);

        // Self-close void elements
        ['img','input','br','hr','source','track','wbr','col','embed','area'].forEach(tag => {
            tsx = tsx.replace(new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi'), `<${tag}$1 />`);
        });

        const name = this._toComponentName(this._selectedScreenId || selScreen || 'Screen');
        return `import React from 'react';\n\nexport default function ${name}() {\n  return (\n${this._indent(tsx, '    ')}\n  );\n}`;
    },

    _cssToJsStyle(str) {
        if (!str?.trim()) return '{{}}';
        const entries = [];
        for (const decl of str.split(';').filter(s => s.trim())) {
            const ci = decl.indexOf(':');
            if (ci === -1) continue;
            let key = decl.slice(0, ci).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            let val = decl.slice(ci + 1).trim();
            if (/^\d+px$/.test(val)) entries.push(`${key}: ${parseInt(val, 10)}`);
            else entries.push(`${key}: '${val.replace(/'/g, "\\'")}'`);
        }
        if (!entries.length) return '{{}}';
        return entries.length <= 2 ? `{{ ${entries.join(', ')} }}` : `{{\n${entries.map(e => `      ${e}`).join(',\n')}\n    }}`;
    },

    _toVue(html) {
        if (!html) return '';
        const name = this._toComponentName(this._selectedScreenId || selScreen || 'Screen');
        let tpl = html, cnt = 0;
        const rules = [];

        tpl = tpl.replace(/style="([^"]*)"/g, (_, s) => {
            if (!s.trim()) return '';
            cnt++;
            const cls = `v-${cnt}`;
            rules.push(`.${cls} {\n${this._fmtCSS(s)}\n}`);
            return `data-v-style="${cls}"`;
        });
        tpl = tpl.replace(/class="([^"]*)"([^>]*)data-v-style="([^"]*)"/g, 'class="$1 $3"$2');
        tpl = tpl.replace(/data-v-style="([^"]*)"/g, 'class="$1"');

        const out = [`<template>`, this._indent(tpl, '  '), `</template>`, '', `<script setup>`, `// ${name} component`, `</script>`];
        if (rules.length) out.push('', `<style scoped>`, rules.join('\n\n'), `</style>`);
        return out.join('\n');
    },

    _toSvelte(html) {
        if (!html) return '';
        const name = this._toComponentName(this._selectedScreenId || selScreen || 'Screen');
        let tpl = html, cnt = 0;
        const rules = [];

        tpl = tpl.replace(/style="([^"]*)"/g, (_, s) => {
            if (!s.trim()) return '';
            cnt++;
            const cls = `s-${cnt}`;
            rules.push(`.${cls} {\n${this._fmtCSS(s)}\n}`);
            return `data-sv-style="${cls}"`;
        });
        tpl = tpl.replace(/class="([^"]*)"([^>]*)data-sv-style="([^"]*)"/g, 'class="$1 $3"$2');
        tpl = tpl.replace(/data-sv-style="([^"]*)"/g, 'class="$1"');

        const out = [`<script>`, `  // ${name} component`, `</script>`, '', tpl];
        if (rules.length) out.push('', `<style>`, rules.join('\n\n'), `</style>`);
        return out.join('\n');
    },

    _toTailwind(html) {
        if (!html) return '';
        let out = html.replace(/style="([^"]*)"/g, (_, s) => {
            const { classes, remaining } = this._inlineToTailwind(s);
            let r = '';
            if (classes.length) r = `data-tw-classes="${classes.join(' ')}"`;
            if (remaining.trim()) r += (r ? ' ' : '') + `style="${remaining.trim()}"`;
            return r || '';
        });
        out = out.replace(/class="([^"]*)"([^>]*)data-tw-classes="([^"]*)"/g, 'class="$1 $3"$2');
        out = out.replace(/data-tw-classes="([^"]*)"/g, 'class="$1"');
        return out;
    },

    _inlineToTailwind(str) {
        if (!str) return { classes: [], remaining: '' };
        const classes = [], remaining = [];

        for (const decl of str.split(';').map(s => s.trim()).filter(Boolean)) {
            const ci = decl.indexOf(':');
            if (ci === -1) continue;
            const prop = decl.slice(0, ci).trim().toLowerCase();
            const val = decl.slice(ci + 1).trim().toLowerCase();
            const key = `${prop}:${val}`;

            // Direct map
            if (this.TAILWIND_MAP[key]) { classes.push(this.TAILWIND_MAP[key]); continue; }

            let matched = false;

            // Size-based properties (padding, margin, gap, width, height, inset)
            if (this.SIZE_PREFIXES[prop] && this.SIZE_MAP[val]) {
                classes.push(`${this.SIZE_PREFIXES[prop]}-${this.SIZE_MAP[val]}`);
                matched = true;
            }
            // Font size
            else if (prop === 'font-size' && this.FONT_SIZE_MAP[val]) {
                classes.push(this.FONT_SIZE_MAP[val]); matched = true;
            }
            // Border radius
            else if (prop === 'border-radius' && this.RADIUS_MAP[val]) {
                classes.push(this.RADIUS_MAP[val]); matched = true;
            }
            // Line height
            else if (prop === 'line-height') {
                const lh = { '1': 'leading-none', '1.25': 'leading-tight', '1.5': 'leading-normal', '2': 'leading-loose' };
                if (lh[val]) { classes.push(lh[val]); matched = true; }
            }
            // Colors as arbitrary values
            else if (prop === 'color' && val.startsWith('#')) { classes.push(`text-[${val}]`); matched = true; }
            else if (prop === 'background-color' && val.startsWith('#')) { classes.push(`bg-[${val}]`); matched = true; }
            else if (prop === 'border-color' && val.startsWith('#')) { classes.push(`border-[${val}]`); matched = true; }
            // Border width
            else if (prop === 'border-width') {
                const bw = { '0px': 'border-0', '1px': 'border', '2px': 'border-2', '4px': 'border-4' };
                if (bw[val]) { classes.push(bw[val]); matched = true; }
            }
            // Z-index
            else if (prop === 'z-index') {
                const zi = { '0': 'z-0', '10': 'z-10', '20': 'z-20', '30': 'z-30', '40': 'z-40', '50': 'z-50' };
                if (zi[val]) { classes.push(zi[val]); matched = true; }
            }

            if (!matched) remaining.push(decl);
        }
        return { classes, remaining: remaining.join('; ') + (remaining.length ? ';' : '') };
    },


    // ═════════════════════════════════════════════════════
    //  SYNTAX HIGHLIGHTING
    // ═════════════════════════════════════════════════════

    _highlight(code, lang) {
        if (!code) return '';
        let esc = this._escHtml(code);
        if (lang === 'react') return this._hlJSX(esc);
        return this._hlHTML(esc);
    },

    _hlHTML(c) {
        const H = this.HL;
        // Comments
        c = c.replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span style="color:${H.comment}">$1</span>`);
        // Tag names
        c = c.replace(/(&lt;\/?)([\w-]+)/g, `<span style="color:${H.punct}">$1</span><span style="color:${H.tag}">$2</span>`);
        // Closing brackets
        c = c.replace(/(\/?&gt;)/g, `<span style="color:${H.punct}">$1</span>`);
        // Attributes with values
        c = c.replace(/\s([\w-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
            ` <span style="color:${H.attr}">$1</span><span style="color:${H.punct}">$2</span><span style="color:${H.string}">$3</span>`);
        // CSS in <style> blocks
        c = c.replace(/(<span[^>]*>style<\/span><span[^>]*>&gt;<\/span>)([\s\S]*?)(<span[^>]*>&lt;\/<\/span><span[^>]*>style<\/span>)/g,
            (_, open, css, close) => open + this._hlCSS(css) + close);
        return c;
    },

    _hlJSX(c) {
        const H = this.HL;
        // Keywords
        c = c.replace(/\b(import|export|default|function|return|const|let|var|from)\b/g, `<span style="color:${H.keyword}">$1</span>`);
        // React attributes
        c = c.replace(/\b(className|htmlFor|tabIndex|style)\b/g, `<span style="color:${H.attr}">$1</span>`);
        // JSX braces
        c = c.replace(/(\{(?!\{))/g, `<span style="color:${H.cssVal}">$1</span>`);
        c = c.replace(/((?!\})\})/g, `<span style="color:${H.cssVal}">$1</span>`);
        // Tags (capitalized = component)
        c = c.replace(/(&lt;\/?)([\w-]+)/g, (_, br, tag) => {
            const color = /^[A-Z]/.test(tag) ? H.component : H.tag;
            return `<span style="color:${H.punct}">${br}</span><span style="color:${color}">${tag}</span>`;
        });
        c = c.replace(/(\/?&gt;)/g, `<span style="color:${H.punct}">$1</span>`);
        // Strings
        c = c.replace(/(&quot;[^&]*?&quot;)/g, `<span style="color:${H.string}">$1</span>`);
        c = c.replace(/(&#39;[^&]*?&#39;)/g, `<span style="color:${H.string}">$1</span>`);
        // Numbers
        c = c.replace(/\b(\d+(?:\.\d+)?)\b/g, `<span style="color:${H.cssVal}">$1</span>`);
        return c;
    },

    _hlCSS(css) {
        const H = this.HL;
        css = css.replace(/([\w-]+)(\s*:\s*)([^;{}\n]+)/g, (m, p, colon, v) => {
            if (p.includes('</span>')) return m;
            return `<span style="color:${H.cssProp}">${p}</span>${colon}<span style="color:${H.cssVal}">${v}</span>`;
        });
        css = css.replace(/(\.[\w-]+)/g, `<span style="color:${H.tag}">$1</span>`);
        return css;
    },


    // ═════════════════════════════════════════════════════
    //  PANEL RENDERING
    // ═════════════════════════════════════════════════════

    _extractAndRender() {
        const sid = this._selectedScreenId || selScreen;
        this._extractedHTML = this._extractHTML(sid);
        this._cachedOutput = {};
        if (!this._extractedHTML) { this._showEmpty(); return; }
        this._renderTabs();
        this._renderScreenBar();
        this._renderCode();
        this._updateStatus();
    },

    _renderTabs() {
        const el = document.getElementById('ce-tabs');
        if (!el) return;
        const fmts = [['html','HTML'],['react','React'],['vue','Vue'],['svelte','Svelte'],['tailwind','Tailwind']];
        el.innerHTML = fmts.map(([id, label]) =>
            `<button class="ce-tab${id === this._currentFormat ? ' active' : ''}" data-format="${id}">${label}</button>`
        ).join('');
        el.querySelectorAll('.ce-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this._currentFormat = tab.dataset.format;
                this._renderTabs(); this._renderCode(); this._updateStatus();
            });
        });
    },

    _renderScreenBar() {
        const bar = document.getElementById('ce-screen-bar');
        if (!bar) return;
        if (!curApp?.screens || curApp.screens.length <= 1) { bar.classList.remove('show'); return; }
        bar.classList.add('show');
        const active = this._selectedScreenId || selScreen || curApp.screens[0];
        bar.innerHTML = `<select class="ce-screen-select" id="ce-screen-select">${
            curApp.screens.map(s => `<option value="${s}" ${s === active ? 'selected' : ''}>${this._label(s)}</option>`).join('')
        }</select>`;
        document.getElementById('ce-screen-select')?.addEventListener('change', (e) => {
            this._selectedScreenId = e.target.value;
            this._cachedOutput = {};
            this._extractAndRender();
        });
    },

    _renderCode() {
        let codeEl = document.getElementById('ce-code');
        let linesEl = document.getElementById('ce-lines');
        if (!codeEl || !linesEl) {
            const wrap = document.getElementById('ce-code-wrap');
            if (!wrap) return;
            wrap.innerHTML = '<div class="ce-lines" id="ce-lines"></div><pre class="ce-code" id="ce-code"></pre>';
            codeEl = document.getElementById('ce-code');
            linesEl = document.getElementById('ce-lines');
        }

        let code = this._cachedOutput[this._currentFormat];
        if (!code) {
            const html = this._formatHTML(this._extractedHTML);
            const converters = { html: h => h, react: h => this._toReact(h), vue: h => this._toVue(h), svelte: h => this._toSvelte(h), tailwind: h => this._toTailwind(h) };
            code = (converters[this._currentFormat] || converters.html)(html);
            this._cachedOutput[this._currentFormat] = code;
        }

        codeEl.innerHTML = this._highlight(code, this._currentFormat);
        const n = code.split('\n').length;
        let nums = '';
        for (let i = 1; i <= n; i++) nums += `<span class="ce-line-num">${i}</span>`;
        linesEl.innerHTML = nums;

        const wrap = document.getElementById('ce-code-wrap');
        if (wrap) wrap.scrollTop = 0;
    },

    _showEmpty() {
        const wrap = document.getElementById('ce-code-wrap');
        if (wrap) wrap.innerHTML = `<div class="ce-empty"><div class="ce-empty-icon">{ }</div><div class="ce-empty-text">Select a screen to extract<br>and export its HTML code</div></div>`;
        this._updateStatus();
    },

    _updateStatus() {
        const el = document.getElementById('ce-status');
        if (!el) return;
        const code = this._cachedOutput[this._currentFormat] || '';
        const lines = code ? code.split('\n').length : 0;
        const labels = { html: 'HTML', react: 'React TSX', vue: 'Vue SFC', svelte: 'Svelte', tailwind: 'Tailwind' };
        el.innerHTML = `<span>${labels[this._currentFormat] || 'HTML'} ${this._ext()}</span><span>${lines} lines · ${this._bytes(code.length)}</span>`;
    },


    // ═════════════════════════════════════════════════════
    //  ACTIONS: COPY & DOWNLOAD
    // ═════════════════════════════════════════════════════

    _copyToClipboard() {
        const code = this._cachedOutput[this._currentFormat];
        if (!code) { toast('No code to copy'); return; }
        navigator.clipboard.writeText(code).then(() => toast('Copied to clipboard')).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = code; ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); toast('Copied to clipboard'); }
            catch { toast('Failed to copy'); }
            document.body.removeChild(ta);
        });
    },

    _downloadFile() {
        const code = this._cachedOutput[this._currentFormat];
        if (!code) { toast('No code to download'); return; }
        const ext = this._ext();
        const sid = this._selectedScreenId || selScreen || 'screen';
        const filename = `${this._kebab(sid)}${ext}`;
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        toast(`Downloaded ${filename}`);
    },


    // ═════════════════════════════════════════════════════
    //  EVENTS
    // ═════════════════════════════════════════════════════

    _setupEvents() {
        document.getElementById('ce-close')?.addEventListener('click', () => this.close());
        document.getElementById('ce-copy')?.addEventListener('click', () => this._copyToClipboard());
        document.getElementById('ce-download')?.addEventListener('click', () => this._downloadFile());
    },


    // ═════════════════════════════════════════════════════
    //  UTILITIES
    // ═════════════════════════════════════════════════════

    _escHtml(s) {
        return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
    },

    _toComponentName(id) {
        if (!id) return 'Screen';
        return id.replace(/^\d+-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },

    _kebab(id) { return id ? id.replace(/^\d+-/, '').toLowerCase() : 'screen'; },

    _label(id) {
        return id ? id.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'No screen';
    },

    _indent(text, prefix) {
        return text ? text.split('\n').map(l => prefix + l).join('\n') : '';
    },

    _fmtCSS(str) {
        return str ? str.split(';').map(s => s.trim()).filter(Boolean).map(s => `  ${s};`).join('\n') : '';
    },

    _ext() {
        return { html: '.html', react: '.tsx', vue: '.vue', svelte: '.svelte', tailwind: '.html' }[this._currentFormat] || '.html';
    },

    _bytes(n) {
        if (n < 1024) return `${n} B`;
        return n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
    },
};
