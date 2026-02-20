# 🍳 Culinary — AI Recipe & Kitchen Intelligence

> **Style Territory:** Synthetic Flora × Bento Grids × Generative Filigree
> **Platform:** iOS 18+ / Android 15+ (Material You)
> **Total Screens:** 12

---

## [DESIGN SYSTEM]

### Visual Language
`Botanical Luxury` · `Organic Intelligence` · `Bento Modularity` · `Seasonal Freshness` · `Chef-Grade Precision`

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--chef-cream` | `#FFF8F0` | Primary background (warm white) |
| `--chef-surface` | `#FFFFFF` | Card backgrounds |
| `--chef-dark` | `#1C1917` | Deep text / Dark mode bg |
| `--herb-green` | `#16A34A` | Primary accent / Vegetable |
| `--saffron-gold` | `#D97706` | Premium / Featured |
| `--tomato-red` | `#DC2626` | Alerts / Meat / Hot |
| `--berry-purple` | `#7C3AED` | AI Features |
| `--ocean-blue` | `#0284C7` | Seafood |
| `--text-primary` | `#1C1917` | Headlines |
| `--text-muted` | `#78716C` | Labels |
| `--filigree-gold` | `rgba(217,119,6,0.15)` | Decorative borders |

### Background System
**Synthetic Flora L-System:** Subtle botanical line drawings (fractal herbs/vine patterns) generated via Canvas L-System engine. Low-opacity (5-8%) on cream background. Patterns regenerate per session — unique every visit. Seasonal color shifts: Spring (green) → Summer (gold) → Autumn (amber) → Winter (silver).

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | **Playfair Display** | 700 | 32–48px |
| Heading | Playfair Display | 600 | 20–28px |
| Body | **Inter** | 400 | 14–16px |
| Data/Timer | **JetBrains Mono** | 500 | 20–36px |

Playfair Display adds editorial/cookbook elegance. Inter provides modern readability for instructions.

---

## [SCREENS — 12 Total]

### 1. Onboarding — Taste Profile
- Warm cream background with L-System vine growing from bottom edge (2s animation)
- Dietary preferences: grid selection (Omnivore, Vegetarian, Vegan, Pescatarian, Keto, Paleo)
- Each option: bento card with food-category SVG + selection state (gold border + herb check)
- Allergen input: tag-style chips (Nuts, Dairy, Gluten, Shellfish, Soy, Eggs)
- Skill level: Beginner / Home Cook / Chef — horizontal selector with illustration

### 2. Onboarding — Kitchen Setup
- Equipment checklist: Oven, Stovetop, Air Fryer, Instant Pot, Sous Vide, Grill, Blender
- Each item: bento toggle card with SVG icon — checked = herb-green fill
- Serving size default: number picker with haptic detents
- Measurement preference: Metric / Imperial toggle
- "You're ready!" — filigree border animation draws around confirmation card

### 3. Dashboard — Today's Kitchen
- **Hero Recipe Card:** Featured recipe with full-bleed food image + gradient overlay + title
- Image has subtle parallax on scroll (background shifts 20% slower than foreground)
- **Meal Plan Row:** Breakfast | Lunch | Dinner — 3 bento cards with thumbnails + recipe names
- **Quick Actions:** 3 glass buttons (Scan Pantry, What Can I Make?, Random Inspiration)
- **Recently Cooked:** Horizontal scroll of mini-cards (last 5 recipes)
- **Seasonal Banner:** Thin strip showcasing seasonal ingredients with botanical illustrations

### 4. Recipe Browser — Discovery
- **Category Grid:** Bento layout (2×2 + hero) — Cuisines, Quick (<30min), One-Pot, Baking, Healthy, Party
- **Search Bar:** Expandable with ingredient-based search ("I have chicken, rice, and bell peppers")
- **Filter System:** Diet, Time, Difficulty, Cuisine, Course — side sheet with toggle chips
- **Recipe Cards:** Masonry grid with varying heights — each card:
  - Food photo (aspect-ratio preserved) + recipe name + cook time + difficulty dots (1-3)
  - Long-press → quick preview modal with ingredients list
- **Infinite Scroll** with skeleton loading (shimmer cards)

### 5. Recipe Detail — Full View
- **Hero Image:** Full-width photo with parallax + gradient overlay
- **Title Block:** Playfair Display name + cuisine tag + difficulty + ratings stars
- **Quick Info Row:** Prep time | Cook time | Servings | Calories — 4 mini-bento cards
- **Serving Adjuster:** +/- buttons that recalculate all ingredient quantities in real-time
- **Ingredients List:** Checklist with checkbox per item — checked items strikethrough + dim
- **Step-by-Step:** Numbered cards with instruction text + optional step photo
- **Nutrition Panel:** Collapsible table with macros + key micronutrients
- **Timer Integration:** Inline timer buttons within steps ("Cook for 8 min" → tap to start timer)
- Save/Bookmark button: heart icon with spring scale bounce + haptic

### 6. Cooking Mode — Hands-Free
- **Full-Screen Step View:** One step at a time — large text, minimal UI
- **Voice Control:** "Next step" / "Repeat" / "Start timer" — voice command badge
- **Active Timer:** Huge JetBrains Mono countdown with ring progress — alarm on completion
- **Step Progress Bar:** Dots at bottom showing total steps + current position
- Swipe left/right to navigate steps — magnetic snap + haptic
- Screen stays awake (wake lock) during cooking mode
- Dark mode auto-option for OLED visibility in kitchen

### 7. Pantry — Inventory Manager
- **Item List:** Grouped by category (Produce, Protein, Dairy, Pantry Staples, Spices)
- Each item: name + quantity + expiry indicator (green→yellow→red based on days remaining)
- **Expiring Soon Alert:** Top banner with items expiring within 3 days
- **Add Item:** Barcode scan (camera) or manual text entry with category autocomplete
- **"What Can I Make?" Button:** Generates recipes from current pantry items
- Swipe-left to delete with physics slide + haptic confirmation

### 8. Meal Planner — Weekly Calendar
- **Week Grid:** 7 columns × 3 rows (Breakfast/Lunch/Dinner) — bento calendar layout
- Each cell: mini recipe card (thumbnail + name) or empty "+" placeholder
- Drag-and-drop between cells with magnetic snap + spring physics
- **Shopping List Generator:** Button at top — aggregates all ingredients for the week
- **AI Meal Plan:** Purple-accent button — AI generates balanced week plan based on preferences
- Week navigator: swipe left/right between weeks with date range header

### 9. Shopping List — Smart Grocery
- **Auto-Categorized:** Items grouped by store section (Produce, Meat, Dairy, Bakery, Frozen)
- Each item: checkbox + name + quantity + recipe source tag
- Checked items: strikethrough + move to bottom of section
- **Add Manual Item:** Quick-add input at top with section autocomplete
- **Share Button:** Export list as text/PDF to messaging apps
- **Store Mode:** Simplified large-text view for in-store use — easy single-thumb checking

### 10. AI Chef — Kitchen Intelligence
- Chat interface with CulinaryAI — warm-toned glass message bubbles
- AI messages: saffron-gold left-aligned, User messages: herb-green right-aligned
- **Capabilities:** Recipe suggestions, substitution advice, technique explanations, wine pairing
- **Photo Analysis:** Upload food photo → AI identifies dish + provides recipe estimate
- **Voice Input:** Microphone button for hands-free kitchen queries
- Typing indicator: three dots with gentle botanical grow animation

### 11. Profile & Stats
- **Cooking Stats:** Total recipes cooked, Cuisine diversity chart, Avg cook time
- **Favorite Cuisines:** Radial chart showing cuisine distribution
- **Achievement Badges:** 3×3 grid (First Recipe, 7-Day Streak, 50 Recipes, Cuisine Explorer, etc.)
- **Taste Profile Summary:** Visualized preferences (Sweet↔Savory, Spicy↔Mild, Simple↔Complex)
- **Cookbook Collection:** Saved recipes organized in custom folders

### 12. Settings & Widgets
- **Diet Preferences:** Update from onboarding settings
- **Notifications:** Meal plan reminders, Expiry alerts, Weekly inspiration
- **Units:** Metric/Imperial, Temperature °C/°F
- **Theme:** Light (Cream) / Dark (Chef-Dark) / Auto
- **Widgets:**
  - Small: Today's dinner recipe name + cook time
  - Medium: Today's 3 meals with thumbnails
  - Large: Weekly meal plan grid mini-view

---

## [ANIMATIONS & MICRO-INTERACTIONS]

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Shared recipe image morph + content fade | 400ms | spring(280, 24) |
| Recipe card tap | Scale 0.98 + shadow lift | 150ms | ease-out |
| Step swipe (cooking) | Magnetic snap + haptic detent | — | spring physics |
| Timer countdown | Ring arc shrink + color shift (green→amber→red) | per second | linear |
| Timer alarm | Pulse scale 1.0↔1.05 + glow + sound | 200ms loop | ease-in-out |
| Ingredient check | Strikethrough draw + dim + haptic | 200ms | ease-out |
| Serving adjuster | Number counter roll + quantity cascade update | 300ms | ease-out |
| Heart/save | Scale 1.0→1.3→1.0 + color fill sweep | 400ms | spring(350, 20) |
| Pantry scan | Camera viewfinder pulse + barcode highlight | 300ms | ease-out |
| L-System bg growth | Vine branches extend over 2s on session start | 2000ms | ease-out |
| Bento card drag | Lift (shadow + scale 1.05) + neighbor spring-away | realtime | spring physics |

### Haptic Patterns

| Event | Pattern |
|-------|---------|
| Ingredient check | `vibrate(8)` |
| Step navigation | `vibrate(10)` |
| Recipe saved | `vibrate([20, 10, 30])` |
| Timer complete | `vibrate([100, 50, 100, 50, 150])` |
| Serving adjust tick | `vibrate(5)` |
| Barcode detected | `vibrate(25)` |

---

## [LOGIC & NAVIGATION]

```
TabBar (5 tabs)
├── Home (Screen 3)
│   └── → Recipe Detail (Screen 5) → Cooking Mode (Screen 6)
├── Browse (Screen 4)
│   └── → Recipe Detail (Screen 5) → Cooking Mode (Screen 6)
├── Plan (Screen 8)
│   └── → Shopping List (Screen 9)
├── Pantry (Screen 7)
│   └── → "What Can I Make?" → Browse (filtered)
└── AI Chef (Screen 10)
    Profile (Screen 11) + Settings (Screen 12) via header nav
```

Tab Bar: 56px, warm cream glass, icons: ChefHat, Search, Calendar, Box, Sparkles. Active = herb-green fill.

### Data: Spoonacular/Edamam API for recipes, local SQLite for pantry/meal plans, image caching, offline recipe saving.
