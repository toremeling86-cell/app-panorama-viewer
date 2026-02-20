---
description: Comprehensive browser agent audit of App Panorama Viewer — tests functionality, UX, bugs, and proposes improvements
---

# App Panorama Viewer — Full Audit

## Pre-requisites
The HTTP server must be running. If not started:
```
cd e:\UI Database\ui-ux-pro-max-skill\mobile-apps
npx -y serve . -p 3456 --cors
```
// turbo

## Open the App
Navigate to the server URL (likely `http://localhost:56931/app-viewer.html` or `http://localhost:3456/app-viewer.html`).

Wait 3 seconds for all iframes to load.

---

## PHASE 1: Core Navigation & Layout (Screenshot after each step)

### 1.1 Sidebar
- Verify all 13 apps are listed in the sidebar
- Click each app and confirm screens load on the canvas
- Verify the screen count badge updates correctly
- Check sidebar footer stats (Screens / Annotated / Starred)

### 1.2 Canvas & Zoom
- Zoom slider: drag from 6% to 100% — verify smooth scaling
- Keyboard zoom: press `+` and `-`
- Press `F` — verify "Fit All" works, all screens are visible
- Pan by clicking empty canvas area and dragging

### 1.3 Layouts
- Press `1` — verify "Tight strip" layout (all screens in a row)
- Press `2` — verify "Grid" layout (screens in rows/columns)
- Press `3` — verify "User flow" layout (branching tree)
- Check that the active layout button is highlighted

### 1.4 Screen Interactions
- Click a screen card — verify it gets selected (blue border)
- Click the same screen again — verify it deselects
- Shift+click multiple screens — verify multi-selection works
- Drag a screen — verify it moves and snaps to grid when snap is on
- Toggle snap (press `S`) — verify indicator changes

### 1.5 Context Menu
- Right-click a screen — verify context menu appears with options:
  - Annotate, Inspect Element, Toggle Star, Present from here, Open in Tab, Connect to…, Bring to Front, Send to Back, Reset Position
- Click "Toggle Star" — verify star icon appears
- Click "Open in Tab" — verify screen HTML opens in new tab
- Click "Bring to Front" / "Send to Back" — verify z-index changes

### 1.6 Search
- Type in the search bar — verify screens filter by name
- Clear search — verify all screens reappear

---

## PHASE 2: Annotation Panel (Right Side)

### 2.1 Panel Opening
- Click a screen to select it — verify the right annotation panel opens
- Verify panel shows: screen name, app name, Rating, Status, Notes, Tags, Attachments, Screen Info

### 2.2 Panel Features
- Click "★ Star" — verify starred state toggles
- Click A/B/C/D grade buttons — verify grade is saved
- Click status buttons (Approved, WIP, Needs Work, Review) — verify badge appears on screen
- Type in Notes textarea — verify saves (check "✓ Saved" indicator)
- Type a tag and press Enter — verify tag chip appears
- Type another tag — verify multiple tags work
- Click a tag's × to remove it

### 2.3 Persistence
- Refresh the page — verify annotations, stars, grades, status, notes, and tags persist

---

## PHASE 3: SVG Annotation Canvas

### 3.1 Opening
- Right-click a screen → select "Annotate"
- Verify fullscreen annotation canvas opens over the screen

### 3.2 Drawing Tools
- Select Rectangle tool → draw a rectangle — verify it renders
- Select Ellipse tool → draw an ellipse
- Select Line tool → draw a line
- Select Arrow tool → draw an arrow
- Select Freehand tool → draw freehand
- Select Text tool → click to add text → type text → verify it renders

### 3.3 Colors & Strokes
- Click each color button (Red, Green, Blue, Amber, Purple) — verify color changes on next drawn shape
- Click each stroke width (Thin, Medium, Thick) — verify stroke changes

### 3.4 Actions
- Draw something, then press Ctrl+Z — verify undo works
- Press Ctrl+Y — verify redo works
- Select a shape, press Delete — verify deletion
- Click "Toggle shapes list" — verify shapes list panel

### 3.5 Export
- Click PNG export — verify download
- Click JSON export — verify download
- Press Escape — verify canvas closes

---

## PHASE 4: Element Inspector ⭐ (Most Important to Test)

### 4.1 Activation
- Click the 🔍 (magnifying glass) button in the toolbar — verify:
  - Button gets highlighted/active state
  - Purple "Inspector Mode" bar slides down from top
  - Toast notification "Inspector activated"
- Alternative: press `I` key — verify same activation

### 4.2 Hover Highlighting
- Move mouse over a phone screen — verify:
  - Blue overlay appears on hovered HTML elements inside the iframe
  - Tooltip shows tag name, dimensions, and classes (e.g. `<div>  352 × 48  .flex .items-center`)
  - Highlight follows cursor as you move between elements
  - Highlight updates smoothly (60ms transition)

### 4.3 Element Selection
- Click an element inside a phone screen — verify:
  - Dashed selection overlay appears on the clicked element
  - Floating properties panel opens to the right of the element
  - Panel shows:
    - **Tag name** (purple, e.g. `<div>`)
    - **ID** (yellow, if present)
    - **Dimensions** (e.g. `352 × 48`)
    - **Breadcrumb** path (e.g. `body › div.relative › div.flex`)
    - **Tailwind classes** as chips
    - **Text content** preview (if element has text)
    - **Box Model** visualization (margin/border/padding/content)
    - **Style Groups** (Layout, Appearance, Typography, Effects) — collapsible
    - **Notes** textarea

### 4.4 Panel Interactions
- Click style group headers — verify they collapse/expand
- Verify color swatches appear next to color values
- Type in the Notes field — verify auto-save (✓ Saved indicator)
- Drag the panel header — verify panel is freely draggable
- Click panel close button — verify it closes

### 4.5 Copy & Style Transfer
- Click "CSS" button in footer — verify "CSS copied" toast
- Click "TW" button — verify "Tailwind classes copied" toast
- Click "Pick" button — verify:
  - Style chip appears at bottom of screen: "div style picked"
  - Toast: "Style captured"
- Select a different element → click "Apply" — verify:
  - Visual style change on target element
  - Toast: "Style applied"
- Click undo (↩) — verify style reverts

### 4.6 Cross-Screen Inspection
- While inspector is active, click elements in different phone screens
- Verify the panel updates to show the new element's properties
- Verify the previous screen's selection overlay is removed

### 4.7 Deactivation
- Press Escape — verify:
  - Inspector mode bar hides
  - Button deactivates
  - All overlays removed
  - Toast: "Inspector deactivated"

---

## PHASE 5: Presentation Mode

### 5.1
- Press `P` — verify fullscreen presentation mode
- Click Next/Prev — verify navigation between screens
- Verify screen counter updates
- Press Escape or click Close — verify exit

---

## PHASE 6: Connections

### 6.1
- Right-click screen A → "Connect to…" → Click screen B
- Verify SVG arrow appears between the two screens
- Switch to layout 3 (flow) — verify connected screens are arranged in tree

---

## PHASE 7: Cross-Browser & Edge Cases

### 7.1 Error Handling
- Open browser developer console (F12 → Console tab)
- Report ANY JavaScript errors, warnings, or failed network requests
- Check if there are errors related to `iframe.contentDocument` access (CORS/sandbox issues)

### 7.2 Performance
- With all 14 screens visible, zoom in and out rapidly — report any lag
- Scroll through all screens at zoom level 35% — report rendering issues

### 7.3 Responsive
- Resize browser window to 1024×768 — verify layout adapts
- Resize to 1920×1080 — verify layout adapts

---

## PHASE 8: Audit Report

After completing all phases, compile a detailed report with:

### 🐛 Bugs Found
List each bug with: description, reproduction steps, severity (Critical/High/Medium/Low), and screenshot

### 🎨 UI/UX Improvements
- Visual issues (misalignment, contrast, spacing)
- Interaction issues (confusing flows, missing feedback)
- Accessibility issues (keyboard nav, focus states, contrast ratios)

### ⚡ Performance Issues
- Slow operations, jank during animations, memory leaks

### 💡 Feature Suggestions
Consider these planned features and suggest additional ones:
1. **Design Tokens Inspector** — scan all screens for shared colors, fonts, spacing patterns
2. **Design Comparison** — side-by-side and overlay diff between screens
3. **Style Transfer Presets** — save captured styles as reusable presets
4. **Screen Backgrounds** — custom backgrounds per screen (gradients, patterns, images)
5. **Batch Operations** — apply style/annotations to multiple screens at once
6. **Export Improvements** — export annotated screens as PDF, export design tokens as JSON
7. **Collaborative Notes** — structured feedback format (task, severity, assignee)
8. **Component Detection** — auto-identify reused UI patterns across screens

### 📊 Overall Score
Rate each area 1-10:
- Navigation & Controls
- Visual Design Quality
- Element Inspector
- Annotation System
- Data Persistence
- Performance
- Error Handling
