# 💎 ZenVault — Personal Finance & Wealth Intelligence

> **Style Territory:** Liquid Glassmorphism × Aurora Shaders × Spatial Depth
> **Platform:** iOS 18+ / Android 15+ (Material You)
> **Total Screens:** 14

---

## [DESIGN SYSTEM]

### Visual Language
`Crystalline Luxury` · `Refractive Transparency` · `Living Aurora` · `Spatial Finance` · `Vault Grade Security`

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--vault-void` | `#0A0E1A` | Primary background |
| `--vault-surface` | `#111827` | Card backgrounds |
| `--vault-glass` | `rgba(255,255,255,0.06)` | Glass panels |
| `--aurora-teal` | `#00D4AA` | Primary accent / Growth |
| `--aurora-violet` | `#7C3AED` | Secondary / Premium |
| `--aurora-rose` | `#F43F5E` | Loss / Alerts |
| `--aurora-gold` | `#F59E0B` | Highlights / Goals |
| `--text-primary` | `#F9FAFB` | Headlines |
| `--text-secondary` | `#9CA3AF` | Labels |
| `--specular-white` | `rgba(255,255,255,0.12)` | Top-edge glass highlight |

### Background System
Full-screen GLSL Aurora shader (`u_time` + `u_mouse` driven FBM noise) — 3 octaves of Simplex noise creating organic teal/violet plasma waves behind all content. Rendered via WebGL/Metal, throttled to 30fps for battery.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | **Space Grotesk** | 700 | 32–48px |
| Heading | Space Grotesk | 600 | 20–28px |
| Body | **Inter** | 400 | 14–16px |
| Mono/Numbers | **JetBrains Mono** | 500 | 18–32px |

### Material Recipes
- **Primary Glass:** `backdrop-filter: blur(40px) saturate(180%)` + `border: 1px solid rgba(255,255,255,0.08)` + top-edge specular gradient
- **Elevated Glass:** Same + triple shadow: `0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25), 0 24px 48px rgba(0,0,0,0.2)`
- **Active Aura:** `box-shadow: 0 0 20px rgba(0,212,170,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`

---

## [SCREENS — 14 Total]

### 1. Onboarding — Welcome (Splash)
- Full-screen aurora shader animation
- App logo materializes from particle cluster (500 tiny dots converge → logo shape over 2s)
- Tagline fades in: "Your Wealth. Crystallized." with 0.6s staggered letter reveal
- Single "Get Started" CTA with aurora glow border pulse

### 2. Onboarding — Account Connection
- 3-step wizard with progress orbs (glass circles, filled = teal glow)
- Bank connection cards with institution logos — spring-in from bottom (stagger 80ms)
- Each connected account shows a "secure lock" pulse animation
- Skip option with subtle ghost styling (dashed border, 15% opacity)

### 3. Onboarding — Profile & Goals
- Wealth goal selector — horizontal scroll cards (Retire Early, Emergency Fund, Travel, Custom)
- Each goal card has micro-illustration (SVG line art) + glassmorphic background
- Monthly savings input with haptic feedback on value changes (10ms per tick)
- Risk tolerance slider: gradient from teal (conservative) → violet (aggressive) → rose (YOLO)

### 4. Dashboard — Net Worth Command Center
- **Hero Module:** Massive JetBrains Mono net worth number (48px) with counting animation on load
- +/- percentage badge with color coding (teal up, rose down) + arrow icon
- **Portfolio Allocation Ring:** Conic-gradient donut chart with glassmorphic center showing total
- **Aurora Pulse:** Background shader intensity tied to portfolio health (calm=slow, volatile=fast)
- **Quick Stats Row:** 4 mini glass cards (Assets, Liabilities, Monthly Cashflow, Savings Rate)
- **Recent Transactions:** 3 preview items with category icon, merchant, amount — tap for full list
- Pull-to-refresh: liquid "mercury drop" animation that stretches and snaps

### 5. Portfolio — Asset Breakdown
- **Tab Bar:** Stocks | Crypto | Real Estate | Cash — underline indicator slides with spring physics
- **Holding Cards:** Glass cards with sparkline (7-day mini chart), ticker, value, % change
- Cards support long-press → 3D tilt (perspective transform following finger position)
- Sort options: Value ↕ | Change ↕ | Name ↕ — button group with active glow state
- **Asset Correlation Matrix:** Heatmap grid showing correlation coefficients between holdings

### 6. Portfolio — Individual Asset Detail
- Full-width interactive chart (30d/90d/1y/5y/All toggles)
- Chart area uses gradient fill below line (teal→transparent for gains, rose→transparent for losses)
- **Key Metrics Grid:** 2×3 bento layout (Market Cap, P/E, Dividend Yield, 52w High/Low, Volume, Beta)
- **AI Insight Card:** Glassmorphic card with violet accent — "ZenAI" summary of recent performance
- Buy/Sell action buttons: weighted haptic (50ms) on tap + scale bounce (0.95→1.02→1.0)

### 7. Transactions — Full History
- Infinite scroll list with date section headers (sticky)
- Each transaction: category icon (filled circle bg) + merchant name + amount + time
- Swipe-right to categorize (teal slide), swipe-left to exclude (rose slide)
- Search bar with glassmorphic background — icon magnifies on focus
- Filter chips: All | Income | Expense | Transfer — horizontal scroll with spring haptics

### 8. Budget — Monthly Planner
- **Budget Ring:** Large circular progress (conic-gradient) — spent vs budget with pulsing threshold zone
- **Category Bars:** Horizontal progress bars per category (Food, Transport, Entertainment, etc.)
- Each bar: gradient fill (teal→gold as approaching limit, gold→rose when exceeded)
- Over-budget categories trigger subtle "breathing" red glow animation
- **Add Budget** FAB button with aurora-glow ring — expands to modal on tap

### 9. Goals — Wealth Milestones
- Vertical timeline layout — nodes connected by luminous glass threads
- Each goal node: circular progress ring + title + target amount + ETA
- Completed goals: "crystallized" effect (faceted glass texture + gold shimmer)
- Active goals: pneumatic breathing animation (scale 1.0↔1.02 on 4s cycle)
- Tap goal → expands inline with contribution history chart

### 10. Analytics — Spending Intelligence
- **Spending Heatmap:** Calendar grid, each day colored by spend intensity (teal→gold→rose)
- **Category Treemap:** Weighted rectangles showing proportional spend — tap to drill down
- **AI Insights Feed:** Scrollable cards with ZenAI observations ("You spent 23% more on dining this month")
- **Trend Lines:** Multi-line chart comparing current month vs 3-month average
- Period selector: Week | Month | Quarter | Year — animated underline transition

### 11. Vault — Security Center
- **Biometric Gate:** Fingerprint/FaceID animation on screen entry (ring pulse + haptic ceremony)
- **Connected Accounts:** List with institution logo, last sync time, status indicator (green dot = active)
- **Security Score:** Radial gauge 0–100 with gradient fill and current score in center
- **Privacy Controls:** Toggle switches for data sharing, notifications, export — each toggle has micro-haptic
- Dark vault aesthetic: extra 10% darker than standard background

### 12. Notifications — Smart Alerts
- Grouped by date with glassmorphic section headers
- Alert types with distinct icons: 📊 Market (violet), 💰 Transaction (teal), ⚠️ Budget (gold), 🔒 Security (rose)
- Swipe-to-dismiss with physics-based slide-out (momentum + friction)
- Unread indicator: glowing dot with subtle 2s pulse
- "Mark All Read" action at top with confirmation haptic

### 13. Settings — Preferences
- Section groups: Account, Appearance, Notifications, Security, Data Export, About
- Dark/Light mode toggle (though primary design is dark)
- Currency selector with country flag icons
- Haptic feedback toggle
- Sound effects toggle
- Data export button → generates encrypted PDF/CSV

### 14. Widget — iOS/Android Home Screen
- **Small (2×2):** Net worth number + daily change badge
- **Medium (4×2):** Net worth + sparkline + top 3 holdings
- **Large (4×4):** Full dashboard mini-view with budget ring + portfolio donut
- All widgets: frosted glass background sampling device wallpaper

---

## [ANIMATIONS & MICRO-INTERACTIONS]

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Shared element morph + fade | 350ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Card press | Scale 1.0→0.97 + shadow reduce | 150ms | ease-out |
| Card release | Scale 0.97→1.02→1.0 (spring) | 300ms | spring(300, 20) |
| Number counting | Odometer roll-up from 0 | 1200ms | ease-out |
| Pull-to-refresh | Mercury blob stretch→snap | 600ms | spring physics |
| Tab switch | Underline slide + content crossfade | 250ms | ease-in-out |
| Chart load | Line draws left→right with glow trail | 800ms | ease-out |
| Toast notification | Slide down from top + blur-in | 300ms | spring(400, 28) |
| Goal completion | Crystallization sparkle burst | 1500ms | sequential |
| Biometric auth | Ring expand + ripple + haptic ceremony | 800ms | ease-out |

### Haptic Patterns

| Event | Pattern | Intensity |
|-------|---------|-----------|
| Button tap | `vibrate(10)` | Light |
| Value change tick | `vibrate(5)` | Ultra-light |
| Transaction saved | `vibrate(50)` | Medium |
| Budget exceeded | `vibrate([100, 50, 100])` | Strong warning |
| Goal achieved | `vibrate([50, 30, 50, 30, 100])` | Ceremony |
| Biometric unlock | `vibrate([30, 20, 30, 20, 60, 40, 100])` | Building reveal |

---

## [LOGIC & DATA ARCHITECTURE]

### State Management
- **Portfolio Sync:** Real-time WebSocket for stock/crypto prices (throttled to 5s updates)
- **Transaction Feed:** Plaid/TrueLayer API integration, polling every 15 minutes
- **Offline Cache:** SQLite local DB with last 90 days of transactions + full portfolio snapshot
- **Encryption:** AES-256 for local storage, TLS 1.3 for API calls

### Navigation Structure
```
TabBar (5 tabs)
├── Dashboard (Screen 4)
│   ├── → Portfolio (Screen 5)
│   │   └── → Asset Detail (Screen 6)
│   └── → Transactions (Screen 7)
├── Budget (Screen 8)
├── Goals (Screen 9)
├── Analytics (Screen 10)
└── Settings (Screen 13)
    ├── → Vault (Screen 11)
    └── → Notifications (Screen 12)
```

### Tab Bar Design
- Fixed bottom, 64px height, glassmorphic background
- 5 icons: Dashboard (grid), Portfolio (chart-line), Budget (pie-chart), Goals (target), Settings (gear)
- Active icon: teal fill + label + glow dot underneath
- Inactive: 40% opacity outline
- Haptic on each tab switch (10ms light tap)
