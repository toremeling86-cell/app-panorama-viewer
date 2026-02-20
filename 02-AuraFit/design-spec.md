# 🏋️ AuraFit — AI Fitness & Body Analytics

> **Style Territory:** Biomimetic UI × Haptic Holograms × Cyberpunk Accents
> **Platform:** iOS 18+ / Android 15+ (Material You)
> **Total Screens:** 12

---

## [DESIGN SYSTEM]

### Visual Language
`Living Organism` · `Holographic Depth` · `Pulse-Reactive` · `Evolutionary Growth` · `Athletic Precision`

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--aura-void` | `#050B14` | Primary background |
| `--aura-surface` | `#0F1923` | Card backgrounds |
| `--aura-glass` | `rgba(255,255,255,0.05)` | Glass panels |
| `--bio-cyan` | `#00F0FF` | Primary accent / Active |
| `--bio-lime` | `#A3E635` | Achievement / PR |
| `--bio-magenta` | `#E040FB` | AI Insights / Premium |
| `--bio-orange` | `#FB923C` | Calories / Energy |
| `--bio-rose` | `#FF4757` | Heart Rate / Intensity |
| `--text-primary` | `#F1F5F9` | Headlines |
| `--text-muted` | `#64748B` | Labels |

### Background System
WebGL Reaction-Diffusion Gray-Scott model — organic coral/cellular patterns that respond to touch as chemical source. Colors shift between cyan and magenta based on active workout zone. Rendered on `<canvas>` behind all content at 20% opacity.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | **Outfit** | 800 | 36–56px |
| Heading | Outfit | 600 | 20–28px |
| Body | **Inter** | 400 | 14–16px |
| Stats | **JetBrains Mono** | 600 | 24–48px |

### Material Recipes
- **Bio-Glass:** `backdrop-filter: blur(32px) saturate(160%)` + `border: 1px solid rgba(0,240,255,0.08)` + inner cyan glow
- **Holographic Card:** `transform-style: preserve-3d` + `rotateX/Y` via touch + `mix-blend-mode: overlay` + shifting gradient
- **Pulse Ring:** `conic-gradient` with animated `rotate` — heart rate color mapped

---

## [SCREENS — 12 Total]

### 1. Onboarding — Body Scan
- Full-screen silhouette with scanning laser line sweeping top→bottom (2s loop)
- Holographic grid overlay on body outline — reacts to device gyroscope tilt
- "Calibrating Your Aura..." text with data decoder effect (random chars → final text)
- Input: Height, Weight, Age via haptic scroll wheels
- Gender selector: glass capsules with bio-glow on active state

### 2. Onboarding — Fitness Goals
- Goal cards in 2×2 grid: Build Muscle | Lose Fat | Endurance | Flexibility
- Each card: gradient icon (SVG) + glass background + selected state = cyan aura border
- Intensity slider: 3 levels (Beginner/Intermediate/Beast Mode) with haptic detents
- Experience level affects the Reaction-Diffusion background complexity (more iterations = more experienced)

### 3. Dashboard — Today's Overview
- **Hero Card:** Today's workout plan — exercise name + muscle group icons + estimated duration
- **Activity Ring:** Triple ring (Move/Exercise/Stand inspired) — conic-gradient fills + center stat
- **Heart Rate Live:** Large JetBrains Mono BPM number with pulse wave ECG line drawing behind it
- **Streak Counter:** Flame icon with consecutive days — flame size scales with streak length
- **Quick Stats:** 4 glass mini-cards (Calories, Steps, Active Min, Water)
- **AI Coach Card:** Magenta-accented glass card with daily insight from AuraAI

### 4. Workout — Exercise Library
- **Category Tabs:** Push | Pull | Legs | Core | Cardio — horizontal scroll with magnetic snap
- **Exercise Cards:** Holographic cards (3D tilt on touch) with:
  - Muscle group SVG illustration (line art, cyan glow on target muscles)
  - Exercise name + difficulty badge (color-coded)
  - Personal best indicator (lime glow if PR exists)
- Search bar with glass background — results filter in real-time with spring animations
- Long-press card → quick-add to today's workout with haptic confirmation

### 5. Workout — Active Session
- **Timer:** Massive 56px JetBrains Mono countdown with pulsing ring matching heart rate zone
- **Current Exercise:** Name + set/rep schema + rest timer
- **Rep Logger:** Large increment/decrement buttons with haptic ticks per rep count change
- **Weight Input:** Horizontal scroll picker with magnetic snap at standard plates (5, 10, 15, 20, 25kg)
- **Rest Timer:** Auto-starts between sets — circular countdown with breathing animation
- **Zone Indicator:** Background color shifts based on HR zone (blue→green→yellow→orange→red)
- Completion animation: biomimetic "cell division" burst effect

### 6. Workout — Session Complete
- **Summary Card:** Duration, volume, calories burned, avg HR — glassmorphic hero card
- **Performance Graph:** Bar chart comparing this session vs last 5 sessions
- **PR Badges:** If personal records hit, holographic trophy badges materialize with particle burst
- **AI Analysis:** Magenta card with form tips and progressive overload suggestions
- **Share Button:** Generates Instagram-ready story card with workout stats + holographic border

### 7. Progress — Body Analytics
- **Body Composition Chart:** Stacked area chart (Muscle/Fat/Water/Bone) over time
- **Measurement Cards:** Glass cards for chest, waist, biceps, thigh — each with trend arrow
- **Photo Timeline:** Horizontal scroll of progress photos with body outline overlay alignment
- **Prediction Curve:** AI-projected body composition 4 weeks ahead (dashed line + probability cone)
- **Bio-Scan Button:** Opens camera for posture/physique analysis via MediaPipe Pose

### 8. Nutrition — Macro Tracker
- **Daily Ring:** Triple ring (Protein/Carbs/Fat) with target vs consumed
- **Meal Logger:** Vertical list of meals (Breakfast/Lunch/Dinner/Snack) — tap to expand
- **Food Search:** Barcode scan button + text search — results show macros inline
- **Water Tracker:** Bottle fill animation (liquid rise effect on glass container)
- **AI Meal Suggestion:** Based on remaining macros + preferences — magenta accent card

### 9. Statistics — Performance Hub
- **Muscle Group Heatmap:** Body silhouette SVG with heat colors (cool→hot) showing volume distribution
- **Strength Curves:** Multi-line chart tracking major lifts (Bench/Squat/Deadlift) over months
- **Volume Histogram:** Weekly total volume bars with trend line overlay
- **Personal Records Wall:** Grid of PR cards with exercise name + weight + date — holographic shimmer

### 10. AI Coach — Training Intelligence
- Chat interface with AuraAI — glassmorphic message bubbles
- AI messages: magenta left-aligned, User messages: cyan right-aligned
- **Program Generator:** Input goals/availability → AI creates periodized program
- **Form Analyzer:** Video upload → AI feedback with annotated keyframes
- Typing indicator: three dots with bio-pulse animation

### 11. Profile — Athlete Card
- **Hero Card:** Full-width holographic card with profile photo + name + level + XP bar
- **Achievement Grid:** 3×3 badge grid (First Workout, 7-Day Streak, 100kg Club, etc.)
- **Stats Overview:** Total workouts, Total volume (tons), Hours trained, Current streak
- **Leaderboard Position:** If social features enabled — rank badge with community percentile
- Edit profile → glass modal with field inputs

### 12. Settings & Widgets
- Section groups: Account, Workout Preferences, Notifications, Integrations, About
- **Apple Health / Google Fit sync toggle** with status indicator
- **Wearable Connection:** Pair HR monitor/smartwatch — BLE scanning animation
- **Widget Specs:**
  - Small: Activity ring + calories
  - Medium: Today's workout preview + streak
  - Large: Full dashboard mini-view

---

## [ANIMATIONS & MICRO-INTERACTIONS]

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Shared element morph + bio-pulse | 350ms | spring(300, 22) |
| Exercise card tap | 3D tilt toward finger + holographic shimmer | 200ms | spring physics |
| Rep count change | Scale bounce 1.0→1.15→1.0 + haptic tick | 150ms | spring(400, 30) |
| Set complete | Biomimetic cell split VFX | 600ms | ease-out |
| PR achieved | Holographic trophy materialize + particle burst | 1200ms | sequential |
| Rest timer tick | Pulse ring contract 2% per second | 1000ms | linear |
| Activity ring fill | Animated arc draw with glow trail | 1500ms | ease-in-out |
| Heart rate update | ECG line draw + number crossfade | 300ms | ease-out |
| Water add | Liquid rise in glass container | 400ms | spring(200, 18) |
| Streak flame | Flicker loop (scale jitter + opacity) | infinite | random(0.8-1.0) |

### Haptic Patterns

| Event | Pattern | Intensity |
|-------|---------|-----------|
| Rep count tick | `vibrate(5)` | Ultra-light |
| Set complete | `vibrate([30, 20, 50])` | Medium |
| Workout finish | `vibrate([50, 30, 50, 30, 100])` | Ceremony |
| PR achieved | `vibrate([100, 40, 100, 40, 150])` | Celebration |
| Zone change | `vibrate(25)` | Light |
| Rest timer end | `vibrate([80, 40, 80])` | Alert |

---

## [LOGIC & NAVIGATION]

### Navigation Structure
```
TabBar (5 tabs)
├── Dashboard (Screen 3)
│   └── → Active Session (Screen 5) → Session Complete (Screen 6)
├── Workouts (Screen 4)
│   └── → Active Session (Screen 5)
├── Progress (Screen 7)
│   └── → Nutrition (Screen 8)
├── Stats (Screen 9)
│   └── → AI Coach (Screen 10)
└── Profile (Screen 11)
    └── → Settings (Screen 12)
```

### Tab Bar: 64px fixed bottom, glass + dark blur, icons: Home, Dumbbell, Chart-trending-up, Brain, User
### Data: Local SQLite + optional cloud sync, HealthKit & Google Fit integration, workout history retention forever
