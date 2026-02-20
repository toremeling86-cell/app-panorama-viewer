# 🌦️ SkyLens — Weather & Atmospheric Intelligence

> **Style Territory:** Chronobiological Gradients × Aurora UI × Panoramic Horizon
> **Platform:** iOS 18+ / Android 15+ (Material You)
> **Total Screens:** 11

---

## [DESIGN SYSTEM]

### Visual Language
`Atmospheric Living` · `Circadian Intelligence` · `Sky Photography` · `Fluid Weather` · `Panoramic Depth`

### Color Palette — Dynamic (Time-Synced)

| Token | Dawn (6-9) | Day (9-17) | Sunset (17-20) | Night (20-6) |
|-------|-----------|-----------|----------------|-------------|
| `--sky-bg` | `#1a1a2e→#FF9A76` | `#4A90D9→#87CEEB` | `#FF6B35→#1a1a2e` | `#0A0E1A→#1B1464` |
| `--sky-accent` | `#FFB347` | `#00B4D8` | `#FF4757` | `#7C3AED` |
| `--sky-text` | `#1a1a2e` | `#1E293B` | `#F1F5F9` | `#F1F5F9` |

| Static Token | Hex | Usage |
|-------------|-----|-------|
| `--sky-glass` | `rgba(255,255,255,0.08)` | Glass panels |
| `--temp-hot` | `#FF4757` | High temperatures |
| `--temp-cold` | `#00B4D8` | Low temperatures |
| `--rain-blue` | `#3B82F6` | Precipitation |
| `--sun-gold` | `#F59E0B` | UV / Solar data |

### Background System
**SkyDial Circadian Engine:** Real-time `Date()` maps to solar arc position. GLSL shader generates atmospheric gradient with:
- Procedural cloud layer (FBM noise, 3 octaves)
- Solar orb following parabolic Bezier path (6:00→20:00 mapped to left→right arc)
- Star field fading in/out based on solar altitude
- Luminosity-based text contrast flip (dark text for bright sky, white for dark sky)

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Temperature | **Outfit** | 200 (Thin) | 72–96px |
| Heading | Outfit | 600 | 20–28px |
| Body | **Inter** | 400 | 14–16px |
| Data | **JetBrains Mono** | 500 | 16–20px |

---

## [SCREENS — 11 Total]

### 1. Onboarding — Location Permission
- Full-screen animated sky (dawn palette) — clouds drift slowly across
- "Where are you?" — location permission request with glass card explanation
- Location pin animation: drops from top with gravity bounce
- Manual city search option with autocomplete glass dropdown
- Weather condition previews cycle in background (sun→clouds→rain→snow)

### 2. Dashboard — Sky Now
- **Hero Temperature:** Ultra-thin 96px number + condition text ("Partly Cloudy")
- **SkyDial Background:** Full-screen atmospheric shader synced to real local time
- **Solar Arc Widget:** Thin curved line showing sun's path — current position as glowing orb
- **Quick Row:** Feels-like, Wind, Humidity, UV Index — 4 glass mini-cards
- **Hourly Scroll:** Horizontal 24h forecast — temp + condition icon + precipitation % per hour
- **Precipitation Timeline:** Gradient bar showing next 2h rain probability (0→100% mapped to blue intensity)
- Pull-to-refresh: clouds swirl + new data materializes

### 3. Forecast — 10-Day Outlook
- Vertical list of daily cards — each shows: Day name, icon, high/low temp, precipitation %
- **Temperature Range Bar:** Horizontal bar per day — gradient from cold-blue to hot-red with marker dots for high/low
- Expanded day view (inline): hourly breakdown + wind + UV + humidity charts
- **Temperature Trend Line:** Sparkline connecting all 10 days' averages with gradient fill
- Tap day → smooth inline expansion with spring animation (200ms)

### 4. Radar — Live Weather Map
- Full-screen map (MapKit/Google Maps) with weather overlay
- **Layer Toggles:** Rain | Cloud | Temp | Wind | Pressure — chip bar at top
- **Radar Playback:** Timeline slider at bottom — plays last 3h + next 1h radar animation
- **Storm Cells:** Polygons with pulsing red borders for severe weather warnings
- Pinch-to-zoom with smooth level-of-detail change
- Current location blue pulsing dot with range ring

### 5. Air Quality — Atmospheric Health
- **AQI Gauge:** Large radial gauge (0–500) with gradient fill (green→yellow→orange→red→purple)
- **Pollutant Breakdown:** 6 mini-cards (PM2.5, PM10, O3, NO2, SO2, CO) each with value + bar
- **Health Advice Card:** Glass card with activity recommendations based on AQI level
- **24h AQI Chart:** Line chart showing AQI trend with colored zones as background
- **Pollen Forecast:** 3 categories (Tree, Grass, Weed) with low/medium/high indicators

### 6. Astronomy — Sky Events
- **Sun/Moon Card:** Dual semicircle showing sun/moon rise-set times + arc positions
- **Moon Phase:** Large moon illustration with current phase name + illumination %
- **Golden Hour Widget:** Countdown to next golden/blue hour — photographer-targeted
- **Upcoming Events:** Meteor showers, eclipses, visible planets — timeline list
- **Star Visibility Score:** Based on cloud cover + light pollution — glass card with sky quality rating
- Night mode auto-activates (extra dark for stargazing screens)

### 7. Severe Weather — Alert Center
- **Active Alerts:** Red-bordered cards with warning type + area + timeframe
- Alert severity colors: Yellow (Advisory), Orange (Watch), Red (Warning), Purple (Extreme)
- **Alert Map:** Mini-map showing alert polygons over current region
- **Historical:** Previous 7 days of alerts — timeline view
- Push notification preview for each alert type
- Emergency haptic pattern on critical alerts: `vibrate([200, 100, 200, 100, 300])`

### 8. Weather History — Climate Data
- **This Day in History:** Average temp, record high/low, historical precipitation
- **Monthly Climate Chart:** Grouped bar chart (avg high/low per month) + precipitation overlay
- **Year Comparison:** Multi-line overlay showing current year vs 10-year average
- **Data Depth:** Access to 30+ years of historical data with drill-down capability
- Glassmorphic data tables with alternating row opacity

### 9. Locations — Multi-City Manager
- **Location List:** Reorderable list with city name + current temp + condition icon
- Each row: mini glass card with live weather summary
- **Add Location:** Search with autocomplete — globe icon animation while searching
- Swipe-to-delete with physics-based slide
- Current location pinned to top with GPS icon + "Current" badge
- Drag-to-reorder with magnetic snap + haptic detents (10ms)

### 10. Settings & Customization
- **Units:** °C/°F toggle, km/h/mph, hPa/inHg — each with instant preview
- **SkyDial Config:** Toggle circadian sync, manual time offset
- **Notifications:** Severe weather, daily forecast summary, rain alert timing
- **Widget Refresh Interval:** 15min / 30min / 1h
- **Data Sources:** OpenWeather, Tomorrow.io, Apple WeatherKit selector
- Appearance: Auto (circadian) / Light / Dark override

### 11. Widgets — Home Screen
- **Small:** Current temp + condition icon + hi/lo
- **Medium:** Current + hourly 6h forecast bar
- **Large:** Current + hourly + 5-day outlook
- **Lock Screen:** Inline temp + condition text
- All widgets use circadian background sampling

---

## [ANIMATIONS & MICRO-INTERACTIONS]

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Parallax sky shift + content slide | 400ms | spring(280, 24) |
| Temperature update | Odometer digit roll | 600ms | ease-out |
| Hourly forecast scroll | Magnetic snap per hour + haptic detent | — | spring physics |
| Rain probability bar | Gradient fill sweep left→right | 800ms | ease-in-out |
| Radar playback | Frame-by-frame at 250ms/frame | — | linear |
| AQI gauge fill | Arc draw + glow intensify | 1200ms | ease-out |
| Sun/Moon arc load | Orb traces arc path | 1500ms | cubic-bezier(0.25,1,0.5,1) |
| Alert entry | Slide-in from right + red flash | 300ms | spring(400, 28) |
| Cloud drift (bg) | translateX loop | 60000ms | linear infinite |
| Pull-to-refresh | Cloud swirl + lightning flash | 800ms | ease-in-out |

### Haptic Patterns

| Event | Pattern |
|-------|---------|
| Location switch | `vibrate(10)` |
| Unit toggle | `vibrate(8)` |
| Alert received | `vibrate([100, 50, 100])` |
| Extreme alert | `vibrate([200, 100, 200, 100, 300])` |
| Radar frame advance | `vibrate(3)` |
| Hourly snap | `vibrate(5)` |

---

## [LOGIC & NAVIGATION]

```
TabBar (4 tabs)
├── Now (Screen 2)
│   ├── → Forecast (Screen 3)
│   └── → Severe (Screen 7)
├── Radar (Screen 4)
├── Air (Screen 5)
│   └── → Astronomy (Screen 6)
├── Locations (Screen 9)
│   └── → History (Screen 8)
└── Settings (Screen 10) — accessible via gear icon in header
```

Tab Bar: 56px, glass + adaptive tint matching sky palette. Icons: Sun, Map, Wind, MapPin. Active = sky-accent color.

### Data: WeatherKit/OpenWeather API, 15-min polling, 48h hourly cache, 10-day daily cache, SQLite local storage.
