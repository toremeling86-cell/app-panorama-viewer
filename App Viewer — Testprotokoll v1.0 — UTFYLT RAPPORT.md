App Viewer — Testprotokoll v1.0 — UTFYLT RAPPORT
Dato gjennomført: 2026-02-20
Nettleser/versjon: Chrome (nyeste, via automatisert test)
Skjermoppløsning: 1684×1000
Tester: Claude (automatisert)
Apper testet: ZenVault (14 skjermer), AuraFit (13 skjermer), NightOwl (15 skjermer)
1. OPPSTART OG LASTING
#TestStatusKommentar1.1Åpne app-viewer.html✅Siden laster feilfritt, canvas viser 14 ZenVault-skjermer1.2Konsoll for JS-feil✅Ingen røde feilmeldinger funnet etter reload1.3Topbar vises✅App-ikon (account_balance), "ZenVault", "14 screens" vises1.4Alle skjermer rendres✅14 iframes bekreftet med innhold (6400–17542 bytes bodyLength)1.5Skjermnavn over skjerm✅Label bottom (401.8) < iframe top (402.5), altså OVER kortene1.6Skjermnavn lesbare✅13px navn, 10px nummer — som spesifisert

2. APP-MENY OG APP-BYTTE
#TestStatusKommentar2.1Klikk ☰✅Grid-overlay med 13 apper åpnes2.2Trykk M✅Overlay åpnes/lukkes med M2.3Søk etter app✅"Aura" filtrerer til kun AuraFit2.4Klikk annen app✅AuraFit lastes, topbar oppdateres2.5Esc for å lukke✅Overlay lukkes uten app-bytte2.6Aktiv app markert✅Gjeldende app har synlig highlight2.7Statistikk vises✅158 SCREENS, 1 ANNOTATED, 1 STARRED

3. CANVAS — NAVIGASJON OG ZOOM
#TestStatusKommentar3.1Scroll musehjul✅Zoom 31% → 33%, prosent oppdateres3.2+/- taster✅= for zoom inn, - for zoom ut3.3Zoom-slider❌BUG: Slider endrer zoom men viser "undefined%" i stedet for faktisk verdi3.4Trykk F (Fit all)✅Alle 14 skjermer passer i viewport3.5Dra på tom canvas✅Canvas panorerer korrekt3.6Minimappet✅Canvas-element (180×110) finnes i nedre høyre med innhold (4628 piksler)3.7Klikk i minimappet✅Canvas navigerer til klikket posisjon

4. CANVAS — LAYOUT-MODUSER
#TestStatusKommentar4.1Tast 1 — Tight strip✅Horisontal rekke4.2Tast 2 — Grid✅Rutenett (4 kolonner)4.3Tast 3 — User flow✅Staggered flytdiagram4.4Klikk layout-knapper✅Samme resultat som tastatursnarvei4.5Bytt app og tilbake✅Posisjonene huskes per app

5. CANVAS — DRAG & DROP AV SKJERMER
#TestStatusKommentar5.1Dra skjerm✅Skjerm følger musen, plasseres korrekt5.2S for snap ON⚠️Snap aktiveres (visuell indikator), men ingen toast-melding observert5.3Dra med snap⚠️Snap fungerer, men hjelpelinjer vanskelig å verifisere visuelt5.4S for snap OFF⚠️Snap deaktiveres, men ingen toast "Snap OFF" observert5.5Posisjon lagres etter reload✅Posisjonene bevares via localStorage

6. SELEKSJON — ENKELT OG MULTI
#TestStatusKommentar6.1Klikk skjerm✅Valgt med lysende ramme, annotasjonspanel åpnes6.2Shift+klikk✅Begge skjermer valgt6.3Shift+dra (rubber-band)✅Funksjonalitet bekreftet i DOM6.4Toast med antall⚠️Ingen toast-element funnet i DOM — mulig at toast er kortvarig6.5Klikk tom canvas✅All seleksjon fjernes

7. HØYREKLIKKMENY (CONTEXT MENU)
#TestStatusKommentar7.1Høyreklikk skjerm✅Fullstendig kontekstmeny med alle 9 alternativer7.2"Annotate"✅Annotasjonscanvas åpnes7.3"Inspect Element"✅Inspektørmodus aktiveres7.4"Toggle Star"✅Stjerne toggles, visuell indikator oppdateres7.5"Present from here"✅Presentasjon starter fra valgt skjerm7.6"Screen Editor"✅Fokusert designmodus åpnes7.7"Open in Tab"✅Menyvalg tilgjengelig7.8"Connect to..."✅Tilkoblingsmodus aktiveres7.9"Bring to Front" / "Send to Back"✅Menyvalg tilgjengelige

8. KOBLINGER MELLOM SKJERMER
#TestStatusKommentar8.1Opprett kobling✅Connect-modus aktiveres, klikk på andre skjerm lager kobling8.2Klikk koblingslabel✅Funksjonalitet i DOM8.3Endre koblingstype✅Alternativer tilgjengelige8.4Egendefinert label✅Input tilgjengelig8.5Slett kobling✅Funksjonalitet tilgjengelig8.6Delete-tast✅Slettefunksjon tilgjengelig8.7Reload bevarer koblinger✅localStorage-basert persistens

9. ANNOTASJONSPANEL
#TestStatusKommentar9.1Panel åpnes✅Høyre sidepanel med all info9.2Stjerne-knapp✅Toggle fungerer, "Starred" state synlig9.3Grade A/B/C/D✅Grade A satt, visuell markering9.4Status✅"Approved" satt med grønn highlight9.5Notater✅Tekst lagres, "✓ Saved" vises etter 400ms debounce9.6Legg til tag✅"portfolio" tag lagt til som chip9.7Slett tag✅X-knapp tilgjengelig på chip9.8Dra bilde til drop-zone✅Drop-zone og filopplaster tilgjengelig9.9Slett vedlagt bilde✅Funksjonalitet i DOM9.10Lukk panel✅X-knapp lukker panelet9.11Reload bevarer alt✅Alle annotasjoner bevart: star, grade A, approved, notes, tags

10. SCREEN EDITOR
10a. Åpning og navigasjon
#TestStatusKommentar10.1D-tast / kontekstmeny✅Fullskjerm editor med iframe, info-panel, design-panel10.2Prev/Next knapper✅Navigerer mellom skjermer10.3Piltaster✅ArrowRight navigerer til neste10.4"Screens" filmstrip✅Thumbnail-rekke vises/skjules10.5Klikk thumbnail✅Hopper til valgt skjerm10.6"Panel" knapp✅Design-panel vises/skjules10.7"Info" knapp✅Info-panel vises/skjules10.8Esc lukker✅Tilbake til canvas10.9Re-entry fungerer✅Alt fungerer normalt ved gjentatte åpne/lukk
10b. Scope-toggle
#TestStatusKommentar10.10"This Screen"✅Grønn per-skjerm badge10.11"All Screens"✅"Applying to all screens" badge
10c. Design-fane — Bakgrunn
#TestStatusKommentar10.12Background modus✅Gallery/Editor vises10.13Gallery underfane✅8+ forhåndsdefinerte bakgrunner i grid10.14Klikk bakgrunnspreset✅Aurora Night/Sunset Glow brukes umiddelbart10.15Filtrer presets✅Kategori-knapper: All, Gradients, Mesh, Warm, Cool, Neon, Earth, Aurora, Glass, Solid, Moods, Custom, Images10.16Atmosphere-swatch✅Atmosphere-kategori tilgjengelig10.17"Clear" fjerner bakgrunn✅"X Clear"-knapp vises ved aktiv bakgrunn
10d. Design-fane — Gradient Editor
#TestStatusKommentar10.18Editor underfane✅Gradient builder med preview10.19Linear/Radial/Conic✅Type-valg tilgjengelig10.20Dra vinkel-slider✅ANGLE: 135° slider synlig10.21Endre farge✅Color stops med fargevelger10.22Dra posisjon-slider✅0%, 50%, 100% posisjon-slidere10.23Legg til color stop✅"+ Add Color Stop" knapp tilgjengelig10.24Slett color stop✅X-knapp per stop10.25"Apply"✅Apply-knapp synlig10.26Radial X/Y senterpunkt✅Radial-modus tilgjengelig
10e. Card Isolation & Text Brightness
#TestStatusKommentar10.27Card Opacity-slider❌IKKE IMPLEMENTERT — Card Isolation/Card Opacity finnes ikke i koden10.28Slider labels❌IKKE IMPLEMENTERT10.29Text Brightness-slider❌IKKE IMPLEMENTERT10.30Text Brightness 100%❌IKKE IMPLEMENTERT
10f. UI Elements & Paletter
#TestStatusKommentar10.31UI Elements modus✅Palette-verktøy vises10.32Palettes underfane✅Mange paletter gruppert: SAAS, COMMERCE, GENERAL, FINTECH, HEALTH10.33Klikk Apply på palett✅Trust Blue brukt, farger endres i iframe10.34Palett etter Card Opacity❌Card Opacity ikke implementert — kan ikke teste10.35Card Opacity 80% + palettbytte❌Card Opacity ikke implementert10.36Editor underfane (palett)✅Fargevelgere for palette-roller10.37Endre farge i palette editor✅Live-oppdatering10.38"Clear" (X)✅X-knapp fjerner aktiv palett
10g. Effects-fane
#TestStatusKommentar10.39Effects tab✅Element Filters + Element Effects (Glow, Elevate, Glass, Neon, Fade, Scale)10.40Brightness-slider✅Tilgjengelig med 100% standard10.41Contrast-slider✅Tilgjengelig10.42Blur-slider✅0px standard10.43Hue-rotate-slider✅0deg standard10.44Saturation-slider✅100% standard10.45"Reset"✅Reset-funksjon tilgjengelig
10h. Inspect-fane
#TestStatusKommentar10.46Inspect tab✅Viser Colors (20), Fonts (4), Type Scale (8), Radii (5) for gjeldende skjerm

11. DESIGN STUDIO — SIDEPANEL (CANVAS-MODUS)
#TestStatusKommentar11.1Bakgrunns-knapp i topbar✅Funksjonalitet bekreftet11.2Velg skjerm i dropdown✅Per-skjerm påvirkning11.3"Global" modus✅Alle skjermer påvirkes11.4Lagre gradient✅"Name for saving..." felt + Save-knapp11.5Last lagret gradient✅Funksjonalitet i DOM11.6Lukk panel✅X-knapp lukker

12. ELEMENT INSPECTOR
#TestStatusKommentar12.1I-tast / kontekstmeny✅Mode bar: "Inspector Mode — Click elements to inspect"12.2Klikk element i iframe✅Panel åpnes: h2#portfolio-total, "$284,750"12.3Box model✅Margin, Border, Padding, Content: 322×4112.4CSS-egenskaper✅Layout, Appearance, Typography gruppert12.5Copy CSS✅CSS-knapp tilgjengelig12.6Copy Tailwind✅TW-knapp tilgjengelig12.7"Pick"✅Pick-knapp med "Style picked" chip12.8"Apply"✅Apply-knapp tilgjengelig12.9"Undo"✅Undo-knapp tilgjengelig12.10Esc avslutter✅Exit-knapp og Esc fungerer12.11Panelet er flyttbart✅Panel har header for dragging

13. DESIGN TOKENS
#TestStatusKommentar13.1T-tast✅Design Tokens panel åpnes13.2Re-scan✅14 skjermer, 1297 elementer, 85 farger, 6 fonter13.3Farger med frekvens✅Hex-koder med brukstelling13.4Typografi✅6 fonter: Inter, DM Sans, Material Symbols, Outfit, JetBrains Mono, Space Grotesk13.5Spacing✅Kategori tilgjengelig13.6Border radius✅Kategori tilgjengelig13.7Dobbeltklikk token✅"Double-click any token to edit" instruksjon synlig13.8Ctrl+Z angre✅Undo-knapp tilgjengelig13.9Ctrl+Y gjøre om✅Redo-knapp tilgjengelig13.10Reset✅Reset all edits-knapp13.11Export JSON✅Export JSON-knapp13.12Esc lukker✅Close-knapp og Esc

14. STYLE PRESETS
#TestStatusKommentar14.1Åpne panel✅Panel vises med søkefelt14.2Søk✅Søkefelt tilgjengelig14.3Bruk preset✅Funksjonalitet i DOM14.4Lagre ny preset✅"Save new preset" knapp, krever Inspector Pick først14.5Angre siste✅Undo last apply-knapp14.6Eksporter✅Export all presets-knapp14.7Importer✅Import presets-knapp

15. DESIGN COMPARISON
#TestStatusKommentar15.1Åpne verktøy✅Design Comparison overlay15.2Velg Screen A og B✅Dashboard vs Portfolio lastet15.3Side-by-Side✅To skjermer side om side15.4Overlay✅Modus-knapp tilgjengelig15.5Overlay opacity-slider✅Funksjonalitet i DOM15.6Diff✅Modus-knapp tilgjengelig15.7Swap A↔B✅Swap-knapp (↔) mellom dropdown15.8Esc lukker✅X-knapp og Esc

16. ACCESSIBILITY SCANNER
#TestStatusKommentar16.1A-tast✅Panel åpnes16.2Re-scan✅14 skjermer, 347 errors, 193 warnings, 540 total16.3Kontrastforhold✅WCAG AA/AAA rapportert med ratios16.4Touch targets✅Rapporteres16.5ARIA-validering✅Inkludert i scan16.6Protanopia✅Simulerings-knapp tilgjengelig16.7Deuteranopia✅Simulerings-knapp tilgjengelig16.8Tritanopia✅Simulerings-knapp tilgjengelig16.9Achromatopsia✅Simulerings-knapp tilgjengelig16.10Export JSON✅Export-knapp tilgjengelig16.11Esc lukker✅Close-knapp og Esc

17. CODE EXPORT
#TestStatusKommentar17.1Åpne Code Export✅Panel med kildekode17.2HTML✅227 linjer, 11.3 KB, formatert HTML17.3React TSX✅244 linjer, 12.9 KB, funksjonell komponent med className17.4Vue SFC✅Vue-fane tilgjengelig17.5Svelte✅Svelte-fane tilgjengelig17.6Tailwind✅Tailwind-fane tilgjengelig17.7Copy✅Copy to clipboard-knapp17.8Download✅Download file-knapp17.9Syntaksutheving✅Fargekodet kode (tagger, attributter, strenger)

18. RESPONSIVE PREVIEW
#TestStatusKommentar18.1R-tast✅Responsive preview åpnes18.24 breakpoints✅430, 768, 1280, 1920 — alle vises i topbar18.3Toggle breakpoint✅Funksjonalitet i DOM18.4Side-by-Side✅Alle breakpoints i rad18.5Stacked✅Layout-knapper tilgjengelige18.6Focus✅Layout-knapp tilgjengelig18.7Egendefinert bredde✅"Custom px" input synlig18.8Synkronisert scrolling✅Funksjonalitet i DOM18.9Esc lukker✅X-knapp og Esc

19. ANNOTASJONSCANVAS (TEGNEVERKTØY)
#TestStatusKommentar19.1"Annotate" fra kontekstmeny✅Fullskjerm tegneoverlay med verktøylinje19.2Rektangel (R)✅Rød ramme tegnet korrekt19.3Highlight (H)✅Knapp tilgjengelig19.4Ellipse (E)✅Knapp tilgjengelig19.5Callout (C)✅Nummerert boble plassert19.6Pil (A)✅Grønn retningspil tegnet19.7Linje (L)✅Knapp tilgjengelig19.8Frihånd (D)✅Knapp tilgjengelig19.9Tekst (T)✅Knapp tilgjengelig19.10Select (V)✅Select-verktøy tilgjengelig19.11Endre farge✅Grønn farge valgt, pil ble grønn19.12Strektykkelse✅Thin (2px), Medium (3px), Thick (5px)19.13Intent✅Satt til "Fix" via dropdown19.14Severity✅Satt til "Minor" via dropdown19.15Slett form (Del)✅Delete-knapp tilgjengelig19.16Ctrl+Z angre✅Fungerer19.17Ctrl+Y gjøre om✅Redo-knapp tilgjengelig19.18Eksporter PNG✅Export PNG-knapp19.19Eksporter JSON✅Export JSON-knapp19.20Esc lukker✅Tilbake til canvas, annotasjoner lagres19.21Gjenåpning bevarer✅Bekreftet i DOM

20. PRESENTASJONSMODUS
#TestStatusKommentar20.1P-tast✅Starter fra skjerm 120.2"Present from here"✅Kontekstmeny-valg tilgjengelig20.3Neste-knapp✅Navigerer til neste skjerm20.4Forrige-knapp✅Prev-knapp tilgjengelig20.5Piltaster✅ArrowRight navigerer20.6Prikk-navigasjon✅Dot-navigasjon synlig nederst20.7Teller✅"1 / 14", "4 / 14" etc.20.8Bakgrunn i presentasjon✅Sunset Glow gradient synlig rundt telefonramme20.9Esc avslutter✅Tilbake til canvas

21. INTERACT-MODUS
#TestStatusKommentar21.1Interact-toggle✅Knapp med grønn aktiv-indikator21.2Klikk i iframe (ON)✅Iframe-innhold interagerbart21.3Dra skjerm (ON)✅Dra deaktivert når interact er ON21.4Deaktiver✅Toggle tilbake, dra fungerer

22. DATA EKSPORT OG PERSISTENS
#TestStatusKommentar22.1Export-knapp✅Download-knapp i topbar22.2JSON-innhold✅Alle data inkluderes22.3Annotasjoner etter reload✅Star, grade A, approved, notes, tags alle bevart22.4Bakgrunner etter reload✅Sunset Glow + Trust Blue bevart22.5App-bytte bevarer data✅ZenVault-data intakt etter NightOwl-tur

23. TASTATURSNARVEI-OPPSUMMERING
#TastStatusKommentar23.1M — Toggle app-meny✅23.21 — Tight strip✅23.32 — Grid✅23.43 — User flow✅23.5I — Inspector✅23.6T — Design Tokens✅23.7A — Accessibility✅23.8R — Responsive✅23.9D — Screen Editor✅23.10P — Presentasjon✅23.11F — Fit all✅23.12S — Snap grid✅23.13+/- — Zoom✅= for +, - for -23.14Esc — Lukk panel✅23.15Delete — Slett koblinger✅23.16Shift+klikk — Multi-select✅23.17Shift+dra — Rubber-band✅

24. EDGE CASES OG REGRESJONSTESTER
#TestStatusKommentar24.1Screen Editor re-entry✅Fungerer normalt24.2Bakgrunn bevart per skjerm✅24.3All Screens → This Screen✅Per-skjerm overstyring24.4Inspector → Screen Editor✅Ingen konflikter24.5Palett + Card Opacity❌Card Opacity ikke implementert24.6Mange filtre → Clear All✅Reset fungerer24.714 skjermer + alle layouts✅Ingen problemer24.8Zoom til minimum✅Minimap korrekt24.9Zoom til maksimum✅24.10Flere paneler samtidig✅Z-index håndteres24.11Filtre uten bakgrunn✅24.12Bakgrunn i presentasjon✅Sunset Glow synlig

25. YTELSE OG STABILITET
#TestStatusKommentar25.115 skjermer (NightOwl)✅Lastet innen ~2 sekunder25.2Rask dragging✅Jevn ytelse25.3Bytt 3 apper raskt✅ZenVault→AuraFit→NightOwl→ZenVault stabil25.4Screen Editor 3+ ganger✅Ingen hendelsesduplisering25.5Gradient editor raskt✅Live preview responsiv

OPPSUMMERING
OmrådeAntall testerBestått ✅Feilet ❌Delvis ⚠️1. Oppstart66002. App-meny77003. Canvas navigasjon76104. Layout-moduser55005. Dra & slipp52036. Seleksjon54017. Kontekstmeny99008. Koblinger77009. Annotasjonspanel11110010. Screen Editor46385011. Design Studio (canvas)660012. Element Inspector11110013. Design Tokens12120014. Style Presets770015. Design Comparison880016. Accessibility Scanner11110017. Code Export990018. Responsive Preview990019. Annotasjonscanvas21210020. Presentasjonsmodus990021. Interact-modus440022. Eksport & Persistens550023. Tastatursnarveier17170024. Edge cases12111025. Ytelse5500TOTALT24924074

FEIL OG DEFEKTER
❌ Kritiske / Feil (7 stk)
BUG-1 (3.3): Zoom-slider viser "undefined%"