---
description: Browser agent audit of 4 new App Viewer features — Design Tokens, Style Presets, Screen Backgrounds, Design Comparison
---

# App Viewer — New Features Audit (Phase 2)

## Pre-requisites
The HTTP server is already running on port 3456.

## Open the App
Navigate to `http://localhost:3456/app-viewer.html`.

Wait 3 seconds for all iframes to load.

---

## PHASE 1: Toolbar Verification (Screenshot required)

### 1.1 New Toolbar Buttons
Take a screenshot of the full toolbar. Verify these **new buttons** are present (in order):
- 🔍 **Inspector** (search icon) — existing
- 🎨 **Design Tokens** (palette icon) — NEW
- ✨ **Style Presets** (style icon) — NEW
- 🖼️ **Screen Backgrounds** (wallpaper icon) — NEW
- ⚖️ **Compare** (compare icon) — NEW

Verify all new buttons have proper tooltips on hover.

---

## PHASE 2: Design Tokens Inspector ⭐

### 2.1 Opening
- Click the **palette** (🎨) toolbar button — verify:
  - Panel slides in from the right side
  - Button gets highlighted/active state
  - Panel header shows "Design Tokens" with palette icon
  - Panel has Re-scan, Export, and Close buttons in header
  - Body shows "Click Re-scan to analyze design tokens" placeholder
- Take a screenshot of the panel

### 2.2 Keyboard Shortcut
- Close the panel first
- Press `T` key — verify the panel opens again
- Press `T` again — verify it toggles closed
- Press `Escape` — verify it closes if open

### 2.3 Scanning
- Open the panel and click the **Re-scan** (refresh icon) button — verify:
  - Loading spinner appears with "Scanning..." text
  - After scan completes, results appear with sections:
    - **Color Palette** — grid of color swatches with hex values and usage counts
    - **Typography** — font family names with frequency bars
    - **Font Sizes** — list of used sizes with distribution
    - **Font Weights** — weight chips (400, 500, 600, 700 etc.)
    - **Spacing** — spacing values with visual bar indicators
    - **Border Radii** — radius values with preview shapes
- Take a screenshot of the scan results

### 2.4 Interactions
- Click a group header (e.g. "Color Palette") — verify it collapses/expands
- Hover over a color swatch — verify hover scale animation
- Click a color swatch — verify it copies the hex value (check toast)
- Click **Export** (download icon) — verify JSON file downloads

### 2.5 Close
- Click the Close (✕) button — verify panel slides out smoothly
- Verify toolbar button deactivates

---

## PHASE 3: Style Presets Panel

### 3.1 Opening
- Click the **style** (✨) toolbar button — verify:
  - Panel slides in from the right
  - Button gets highlighted
  - Panel header shows "Style Presets" with style icon
  - Header has: Add (+), Undo, Undo All, Import, Export, Close buttons
  - Search input is visible
  - Body shows "No presets yet" placeholder message
- Take a screenshot

### 3.2 Saving a Preset (requires Inspector)
- First, activate the Element Inspector (press `I`)
- Click an element inside a phone screen (e.g. a button or card)
- In the Inspector panel, click "Pick" to capture the style
- Verify toast: "Style captured"
- Now open Style Presets panel (click the style button)
- Click the **Add (+)** button in the header — verify:
  - Save dialog appears with:
    - Name input (pre-filled with element type)
    - Category radio buttons (Cards, Buttons, Typography, etc.)
    - Preview swatch showing the captured style
    - Cancel and Save Preset buttons
- Edit the name to "Test Preset"
- Click "Save Preset" — verify:
  - Toast: "Preset saved"
  - Preset card appears in the list with:
    - Category icon
    - Name "Test Preset"
    - Property count and source tag
    - Preview swatch at bottom
- Take a screenshot of the saved preset

### 3.3 Applying a Preset
- With Inspector active, select a DIFFERENT element in another screen
- In Style Presets panel, click the **Apply** (paint brush) button on the saved preset — verify:
  - Visual style change on the selected element
  - Toast: "Applied ..."
- Click **Undo** button in the panel header — verify:
  - Style reverts on the element
  - Toast: "Undid ..."

### 3.4 Category Filter
- Save 2-3 more presets from different element types
- Verify category filter chips appear (All, Cards, Buttons, etc.)
- Click a category chip — verify filtering works
- Type in search box — verify text filtering works

### 3.5 Duplicate & Delete
- Hover over a preset card — verify action buttons appear (Apply, Duplicate, Delete)
- Click Duplicate — verify copy appears
- Click Delete on the copy — verify it's removed

### 3.6 Export/Import
- Click **Export** (download icon) in header — verify JSON file downloads
- Click **Import** (upload icon) — verify file picker opens

---

## PHASE 4: Screen Backgrounds

### 4.1 Opening
- Click the **wallpaper** (🖼️) toolbar button — verify:
  - Panel slides in from the right
  - Button gets highlighted
  - Panel header shows "Screen Backgrounds" with wallpaper icon
  - Mode bar shows "🌐 All Screens" button (active by default)
  - Category chips: All, Gradients, Mesh, Glass, Solid
  - Preset grid with colorful gradient/solid swatches
  - Custom CSS input at bottom
- Take a screenshot

### 4.2 Applying Global Background
- Click any gradient preset swatch (e.g. "Aurora Night" or "Purple Haze") — verify:
  - Background appears behind ALL screen cards on the canvas
  - Selected swatch gets a green checkmark (✓) and border
  - Current background indicator bar appears at top showing name + clear button
- Take a screenshot showing screens with the background

### 4.3 Category Filtering
- Click "Mesh" chip — verify only mesh presets show (4 presets)
- Click "Glass" chip — verify glass presets show (2 presets)
- Click "Solid" chip — verify solid color presets show
- Click "All" — verify all presets return

### 4.4 Clearing Background
- Click the **✕ Clear** button in the current background indicator — verify:
  - Background is removed from all screens
  - Preset swatch deselects (no checkmark)
  - Current indicator bar disappears

### 4.5 Custom CSS
- In the Custom CSS input, type: `linear-gradient(45deg, #ff0000, #0000ff)`
- Click "Apply" — verify custom gradient appears behind screens
- Clear it with the ✕ button

### 4.6 Persistence
- Apply a background preset
- Refresh the page (F5)
- Verify the background reappears after reload

---

## PHASE 5: Design Comparison

### 5.1 Opening
- Click the **compare** (⚖️) toolbar button — verify:
  - Full-screen overlay appears with dark backdrop
  - Top bar shows: "Design Comparison" title, mode buttons (Side by Side, Overlay, Diff), Close button
  - Screen selector row with: Screen A dropdown, Swap button (↔), Screen B dropdown
  - Placeholder: "Select two screens above to compare"
- Take a screenshot

### 5.2 Selecting Screens
- Open the "Screen A" dropdown — verify all screens from current app are listed
- Select a screen for A
- Select a different screen for B — verify:
  - Two iframes appear side-by-side showing the selected screens
  - Each pane has a label (A: screenname, B: screenname)
  - Purple divider between them
- Take a screenshot of side-by-side view

### 5.3 Swap
- Click the ↔ swap button — verify:
  - Screen A and B swap positions
  - Button animates (180° rotation)

### 5.4 Overlay Mode
- Click "Overlay" mode button — verify:
  - Both screens are now stacked on top of each other
  - Opacity slider appears (0-100%)
  - Drag slider to adjust overlay opacity
  - Verify opacity changes in real-time
- Take a screenshot of overlay mode

### 5.5 Diff Mode
- Click "Diff" mode button — verify:
  - Screens are shown with mix-blend-mode difference
  - Identical areas appear BLACK
  - Different areas appear COLORED
  - Legend at bottom: "■ Identical" and "■ Different"
- Take a screenshot of diff mode

### 5.6 Closing
- Click the Close (✕) button — verify overlay closes
- Press Escape — verify it closes if open
- Verify toolbar button deactivates

---

## PHASE 6: Cross-Feature Interactions

### 6.1 Panel Stacking
- Open Design Tokens panel (T key)
- While it's open, open Style Presets panel (click button)
- Verify one panel is visible (Presets should be on top, z-index 601 vs 600)
- Close both panels

### 6.2 Inspector + Presets Workflow
- Activate Inspector (I key)
- Click an element in a screen
- Pick its style ("Pick" button)
- Open Style Presets panel
- Save the preset
- Select a different element
- Apply the preset from the panel
- Verify the full workflow works end-to-end

### 6.3 Background + Comparison
- Apply a background preset to all screens
- Open Design Comparison
- Verify the comparison shows screen CONTENT only (not the backgrounds)
- Close comparison
- Verify backgrounds are still applied

---

## PHASE 7: Console Errors & Edge Cases

### 7.1 JavaScript Errors
- Open browser dev console (F12 → Console)
- Report ALL JavaScript errors, warnings, or failed requests
- Specifically check for errors when:
  - Opening/closing each panel
  - Scanning tokens
  - Saving/applying presets
  - Toggling backgrounds

### 7.2 Performance
- Open all 4 panels one after another — report any lag
- Running a token scan with many screens visible — report timing

---

## PHASE 8: Audit Report

Compile a detailed report with:

### 🐛 Bugs Found
For each bug: description, steps to reproduce, severity (Critical/High/Medium/Low), screenshot

### ✅ Features Working Correctly
List each feature and sub-feature that works as expected

### 🎨 UI/UX Observations
- Panel design consistency
- Animation smoothness
- Color scheme coherence
- Button/icon clarity

### 💡 Improvement Suggestions
- Missing features
- UX enhancements
- Polish opportunities

### 📊 Feature Scores (1-10)
Rate each new feature:
- Design Tokens Inspector: _/10
- Style Transfer Presets: _/10
- Screen Backgrounds: _/10
- Design Comparison: _/10
- Overall Integration: _/10
