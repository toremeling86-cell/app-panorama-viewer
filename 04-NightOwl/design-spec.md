# 🦉 NightOwl — Sleep Science & Circadian Optimizer

> **Style Territory:** Phantom Velvet × Pneumatic Breathing × Abyssal Bioluminescence
> **Platform:** iOS 18+ / Android 15+ (Material You)
> **Total Screens:** 13

---

## [DESIGN SYSTEM]

### Visual Language
`Deep Void Luxury` · `Breathing Rhythm` · `Bioluminescent Calm` · `Circadian Science` · `Velvet Depth`

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--owl-void` | `#020208` | Primary background (true void) |
| `--owl-surface` | `#0A0A1A` | Card backgrounds |
| `--owl-glass` | `rgba(255,255,255,0.04)` | Glass panels |
| `--dream-indigo` | `#6366F1` | Primary accent / Deep sleep |
| `--dream-lavender` | `#A78BFA` | REM / Dreams |
| `--dream-amber` | `#F59E0B` | Awake / Alert phases |
| `--dream-teal` | `#14B8A6` | Success / Good sleep |
| `--dream-rose` | `#FB7185` | Sleep debt / Alerts |
| `--text-primary` | `#E2E8F0` | Headlines (soft white) |
| `--text-muted` | `#475569` | Labels (very subtle) |
| `--jewel-glow` | `rgba(99,102,241,0.25)` | Indigo glow layers |

### Background System
Ultra-dark void with **Bioluminescent Particle Field**: slow-drifting soft dots (indigo/lavender) in Brownian motion at 5% opacity. Particles pulse with breathing rhythm (4-7-8 timing). All content sits within deep velvet darkness to minimize eye strain.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | **Outfit** | 300 (Light) | 40–64px |
| Heading | Outfit | 500 | 18–24px |
| Body | **Inter** | 300 | 14–16px |
| Time | **JetBrains Mono** | 400 | 48–72px |

Light weights throughout — heavy text is antithetical to sleep-oriented UX.

---

## [SCREENS — 13 Total]

### 1. Onboarding — Chronotype Quiz
- Dark void entry — single bioluminescent orb pulses slowly in center
- 5-question chronotype assessment: "When do you naturally feel most alert?"
- Answer options as glass capsule buttons with soft indigo glow on selection
- Progress: 5 tiny glass dots at bottom, filled dots glow lavender
- Final result reveals chronotype (Lion/Bear/Wolf/Dolphin) with matching animal constellation SVG

### 2. Onboarding — Sleep Goals
- Ideal bedtime/wake-time picker — dual circular time selectors with haptic detents every 5 min
- Sleep duration recommendation based on chronotype — glassmorphic card with explanation
- "Sleep Window" visualization: dark arc for sleep + amber arc for wake on 24h circle
- Notification permission request — soft glass card with reasoning text

### 3. Dashboard — Tonight's Plan
- **Bedtime Countdown:** Massive thin-weight time remaining ("4h 23m to Sleep Window")
- **Sleep Score Ring:** Large radial gauge (0–100) — last night's score with colored fill
- **Stage Breakdown Mini:** Stacked horizontal bar (Awake/Light/Deep/REM) with color coding
- **Circadian Phase Indicator:** Glass card showing current phase (Morning Peak/Afternoon Dip/Evening Wind-Down)
- **Quick Actions:** Start Sleep, Breathing Exercise, Sleep Sounds — 3 large glass buttons with icons
- **Weekly Trend:** Sparkline showing 7-day sleep score trend

### 4. Sleep Tracker — Active Sleep Mode
- **Minimalist Dark Screen:** Near-black interface to prevent light disruption
- **Clock:** Ultra-dim 48px time display (2% brightness in OLED dark)
- **Sound Indicator:** Subtle waveform if sleep sounds are playing
- **Microphone Active:** Recording indicator (tiny lavender dot) for snore/movement detection
- Double-tap to brighten momentarily → fades back to near-black in 5s
- Motion detection via accelerometer for automatic sleep/wake logging

### 5. Sleep Report — Morning Analysis
- **Sleep Score:** Hero card with 64px score + quality label ("Excellent", "Good", "Fair", "Poor")
- **Hypnogram:** Full-width stage chart (time vs stage) with colored bands:
  - Awake = amber, Light = lavender (light), Deep = indigo, REM = lavender (bright)
- **Duration Stats:** Glass cards — Total time, Time to fall asleep, Awakenings count, Efficiency %
- **Sound Events:** Timeline markers for detected snoring/talking/environment sounds
- **Heart Rate Overnight:** Line chart with resting HR highlighted
- **AI Insight:** Indigo card with personalized analysis ("Your deep sleep improved 12% when you went to bed before 11pm")

### 6. Sleep History — Calendar View
- **Month Grid:** Calendar with each day colored by sleep score (green→yellow→red)
- **Selected Day:** Expanding card with mini hypnogram + key stats
- **Weekly Averages:** Bar chart comparing Mon–Sun sleep durations
- **Trends:** Multi-week moving average for bedtime consistency + sleep efficiency
- Tap any day → inline expansion with full report preview

### 7. Circadian Rhythm — 24h Body Clock
- **Circadian Wheel:** Large 24h circle showing biological rhythms:
  - Melatonin rise/fall curve (lavender)
  - Cortisol curve (amber)
  - Body temperature curve (teal)
  - Alertness zone markers
- **Current Phase:** Active segment highlighted with glow + description card
- **Light Exposure Log:** Timeline showing bright light intake from phone sensors
- **Recommendations:** Phase-specific glass cards ("Avoid caffeine now", "Best time for exercise in 2h")

### 8. Breathing — Guided Exercises
- **4-7-8 Breathing:** Expanding/contracting circle with phase labels (Inhale/Hold/Exhale)
- Circle uses pneumatic breathing animation: scale 0.6↔1.0 with weighted easing
- **Box Breathing (4-4-4-4):** Square that draws sides sequentially
- **Calm Breathing (5-5):** Simple slow pulse
- Haptic cues sync to breathing phases: gentle pulse on inhale/exhale transitions
- Session timer + completed cycles counter
- Background particles sync to breathing rhythm (expand/contract with circle)

### 9. Sleep Sounds — Ambient Mixer
- **Sound Categories:** Rain | Ocean | Forest | White Noise | Lo-Fi | Binaural
- **Mixer Interface:** 6 circular sliders (volume knobs) for layering sounds
- Each knob: glass circle with fill level indication
- **Timer:** Set auto-stop at 15/30/45/60 min or "Until Wake"
- **Presets:** Saved mixes — glass cards with waveform preview
- Waveform visualization at bottom — ambient audio spectrum in dim lavender

### 10. Smart Alarm — Gentle Wake
- **Alarm Time Picker:** Circular selector with "Smart Window" zone (30 min before set time)
- Smart alarm analyzes sleep stage — wakes during lightest sleep in window
- **Alarm Sound:** Sunrise simulation (screen gradually brightens from 0→30% over 15min)
- **Wake Tasks:** Configurable (Math puzzle, Shake device, QR scan) to prevent snooze
- **Gradual Volume:** Sound starts at 10% → rises to 80% over 60 seconds
- Weekly schedule with per-day enable/disable toggles

### 11. Analytics — Sleep Intelligence
- **Sleep Debt Calculator:** Running deficit/surplus vs recommended hours — large number with trend
- **Factor Correlation:** Charts showing how caffeine, exercise, screen time affect sleep quality
- **Monthly Report Card:** Grade (A+→F) for: Consistency, Depth, Duration, Efficiency
- **Comparative Stats:** Your sleep vs age-group averages (anonymized)
- **Export:** Generate PDF sleep report for healthcare provider

### 12. Profile & Integrations
- **Chronotype Badge:** Animal constellation icon + type name
- **Streak Counter:** Consecutive nights tracked — moon icon with count
- **Connected Devices:** Apple Watch, Oura Ring, Withings — BLE pairing with status
- **Health Sync:** Apple Health / Google Fit sleep data sync toggle
- **Partner Mode:** Share sleep data with partner for compatibility analysis

### 13. Settings & Widgets
- **Sleep Window Config:** Adjust ideal bed/wake times
- **Audio:** Default sounds, volume curve, fade-out timing
- **Notifications:** Bedtime reminder, weekly report, sleep goal nudges
- **Display:** Always ultra-dark, OLED black optimization toggle
- **Widgets:**
  - Small: Sleep score + hours slept
  - Medium: Score + stage breakdown bar + bedtime countdown
  - Large: 7-day trend + tonight's plan

---

## [ANIMATIONS & MICRO-INTERACTIONS]

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Screen transition | Slow fade + vertical parallax (dream-like) | 500ms | ease-in-out |
| Breathing circle | Scale 0.6↔1.0 + glow pulse | 4000–8000ms | cubic-bezier(0.45,0,0.55,1) |
| Sleep score reveal | Counter roll 0→score + ring arc draw | 1500ms | ease-out |
| Hypnogram load | Draw left→right with stage colors | 1200ms | ease-in-out |
| Particle drift | Brownian random walk | infinite | random velocity |
| Calendar day tap | Inline glass card expands | 300ms | spring(300, 24) |
| Sound knob adjust | Rotation tracks finger + haptic ticks | realtime | direct manipulation |
| Alarm sunrise | Screen brightness 0→30% | 900000ms (15min) | linear |
| Score ring fill | Conic-gradient arc sweep | 1500ms | ease-out |
| PR sleep record | Subtle constellation sparkle + jewel glow | 2000ms | sequential |

### Haptic Patterns

| Event | Pattern |
|-------|---------|
| Breathing phase change | `vibrate(15)` |
| Alarm snooze | `vibrate([20, 10, 20])` |
| Sleep tracking start | `vibrate([10, 5, 10, 5, 30])` |
| Good sleep score (80+) | `vibrate(40)` |
| Sleep debt warning | `vibrate([80, 40, 80])` |
| Sound knob tick | `vibrate(3)` |

---

## [LOGIC & NAVIGATION]

```
TabBar (4 tabs)
├── Tonight (Screen 3)
│   ├── → Sleep Tracker (Screen 4) → Sleep Report (Screen 5)
│   └── → Breathing (Screen 8)
├── History (Screen 6)
│   └── → Circadian (Screen 7)
├── Sounds (Screen 9)
│   └── → Smart Alarm (Screen 10)
└── Insights (Screen 11)
    └── → Profile (Screen 12) → Settings (Screen 13)
```

Tab Bar: 56px, ultra-dark blur, icons: Moon, Calendar, Music, Brain. Active = dream-indigo glow.

### Data: Accelerometer + microphone for sleep tracking, HealthKit/Google Fit sync, 365-day local history.
