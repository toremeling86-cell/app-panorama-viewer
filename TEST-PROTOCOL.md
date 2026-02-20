# App Viewer — Testprotokoll v1.0

**Dato:** 2026-02-20
**App:** Mobile App Panorama Viewer (app-viewer.html)
**Formål:** Kartlegge at alle funksjoner i appen fungerer korrekt.

> **Instruksjoner til tester:**
> - Åpne `mobile-apps/app-viewer.html` i Chrome (nyeste versjon)
> - Gå gjennom hvert testområde i rekkefølge
> - Merk av ✅ (bestått), ❌ (feilet), eller ⚠️ (delvis)
> - Skriv kommentar ved feil — beskriv hva som skjedde vs. forventet oppførsel
> - Test med minst 2 forskjellige apper (f.eks. ZenVault og AuraFit)

---

## 1. OPPSTART OG LASTING

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 1.1 | Åpne app-viewer.html i nettleser | Siden laster uten feil. Canvas vises med skjermer fra standardappen. | | |
| 1.2 | Sjekk konsollen for JavaScript-feil | Ingen røde feilmeldinger i konsollen (F12 → Console) | | |
| 1.3 | Verifiser at topbar vises | App-ikon, appnavn og antall skjermer vises øverst | | |
| 1.4 | Verifiser at alle skjermer rendres | Alle iframes laster inn innhold (ingen blanke rammer) | | |
| 1.5 | Skjermnavn vises over hver skjerm | Navn som "Dashboard", "Portfolio" osv. vises OVER skjermkortene, ikke under | | |
| 1.6 | Skjermnavn er lesbare | Tekststørrelsen er stor nok til å lese komfortabelt (13px navn, 10px nummer) | | |

---

## 2. APP-MENY OG APP-BYTTE

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 2.1 | Klikk hamburger-menyen (☰) | App-overlay åpnes med grid av alle tilgjengelige apper | | |
| 2.2 | Trykk **M** på tastaturet | Samme overlay åpnes/lukkes | | |
| 2.3 | Søk etter app i søkefeltet | Kun apper som matcher søket vises | | |
| 2.4 | Klikk på en annen app (f.eks. AuraFit) | Canvas oppdateres med ny app, topbar viser nytt navn | | |
| 2.5 | Trykk **Esc** for å lukke menyen | Overlay lukkes uten å bytte app | | |
| 2.6 | Aktiv app er visuelt markert | Gjeldende app har synlig ramme/highlight i menyen | | |
| 2.7 | Statistikk vises per app | Totalt antall skjermer, annoterte og stjernemerkede vises | | |

---

## 3. CANVAS — NAVIGASJON OG ZOOM

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 3.1 | Scroll musehjulet opp/ned på canvas | Zoom inn/ut — prosentverdi oppdateres i topbar | | |
| 3.2 | Trykk **+** / **-** på tastaturet | Zoom inn/ut i trinn | | |
| 3.3 | Bruk zoom-slideren i topbar | Zoom endres jevnt, skjermer skaleres | | |
| 3.4 | Trykk **F** | Alle skjermer passer inn i viewport ("Fit all") | | |
| 3.5 | Dra på tom canvas (ikke på skjerm) | Canvas panorerer — skjermene følger med | | |
| 3.6 | Verifiser minimappet (nedre høyre) | Minimappet viser alle skjermposisjoner og viewport-rektangel | | |
| 3.7 | Klikk i minimappet | Canvas hopper til klikket posisjon | | |

---

## 4. CANVAS — LAYOUT-MODUSER

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 4.1 | Trykk **1** — Tight strip | Skjermene legges i en horisontal rekke | | |
| 4.2 | Trykk **2** — Grid | Skjermene legges i et rutenett | | |
| 4.3 | Trykk **3** — User flow | Skjermene legges ut for flytdiagram | | |
| 4.4 | Klikk layout-knappene i topbar | Samme resultat som tastatursnarvei 1/2/3 | | |
| 4.5 | Bytt app og tilbake | Posisjoner huskes per app | | |

---

## 5. CANVAS — DRAG & DROP AV SKJERMER

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 5.1 | Dra en skjerm til ny posisjon | Skjermen følger musen og plasseres der du slipper | | |
| 5.2 | Trykk **S** for å aktivere snap | Snap-grid aktiveres — toast-melding vises "Snap ON" | | |
| 5.3 | Dra skjerm med snap aktivert | Hjelpeguider (blå linjer) vises ved kantjustering | | |
| 5.4 | Trykk **S** igjen for å deaktivere snap | Snap deaktiveres — toast "Snap OFF" | | |
| 5.5 | Dra skjerm og slipp — posisjon lagres | Last siden på nytt → skjermen er fortsatt på ny posisjon | | |

---

## 6. SELEKSJON — ENKELT OG MULTI

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 6.1 | Klikk på en skjerm | Skjermen markeres med lysende ramme, annotasjonspanel åpnes | | |
| 6.2 | **Shift+klikk** på en annen skjerm | Begge skjermene er valgt (blå ramme) | | |
| 6.3 | **Shift+dra** på tom canvas | Rubber-band-seleksjon — alle skjermer innenfor boksen velges | | |
| 6.4 | Toast viser antall valgte | Melding "Selected N screens" vises | | |
| 6.5 | Klikk på tom canvas | All seleksjon fjernes | | |

---

## 7. HØYREKLIKKMENY (CONTEXT MENU)

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 7.1 | Høyreklikk på en skjerm | Kontekstmeny vises med alle alternativer | | |
| 7.2 | Velg "Annotate" | Annotasjonscanvas åpnes over skjermen | | |
| 7.3 | Velg "Inspect Element" | Inspektørmodus aktiveres | | |
| 7.4 | Velg "Toggle Star" | Skjermen får/mister stjerne — visuell indikator oppdateres | | |
| 7.5 | Velg "Present from here" | Presentasjonsmodus starter fra denne skjermen | | |
| 7.6 | Velg "Screen Editor" | Fokusert designmodus åpnes | | |
| 7.7 | Velg "Open in Tab" | Skjermen åpnes i ny nettleserfane | | |
| 7.8 | Velg "Connect to..." | Tilkoblingsmodus aktiveres — klikk annen skjerm for å koble | | |
| 7.9 | Velg "Bring to Front" / "Send to Back" | Z-rekkefølge endres synlig | | |

---

## 8. KOBLINGER MELLOM SKJERMER (CONNECTIONS)

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 8.1 | Opprett kobling: Høyreklikk → "Connect to..." → klikk annen skjerm | Pil/linje tegnes mellom skjermene med label | | |
| 8.2 | Klikk på koblingslabel | Popup vises med type, label, fra/til og slett-knapp | | |
| 8.3 | Endre koblingstype (Tap/Swipe/Auto/Back/Link) | Linjestil og farge endres tilsvarende | | |
| 8.4 | Skriv egendefinert label | Teksten på koblingen oppdateres | | |
| 8.5 | Slett kobling via popup | Kobling fjernes fra canvas | | |
| 8.6 | Trykk **Delete** | Alle koblinger slettes (med bekreftelse) | | |
| 8.7 | Last siden på nytt | Koblinger er bevart (localStorage) | | |

---

## 9. ANNOTASJONSPANEL (HØYRE SIDEPANEL)

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 9.1 | Klikk en skjerm → panel åpnes | Annotasjonspanel vises til høyre med skjerminfo | | |
| 9.2 | Klikk stjerne-knappen | Skjermen markeres/avmarkeres — stjerne-dot vises på thumbnail | | |
| 9.3 | Klikk grade A/B/C/D | Grade settes — klikk igjen for å fjerne | | |
| 9.4 | Velg status (Approved/WIP/Needs Work/Review) | Status-badge vises på skjermen | | |
| 9.5 | Skriv i notater-feltet | Tekst lagres automatisk (400ms debounce) — "Saved" bekreftes | | |
| 9.6 | Legg til tag (skriv + Enter) | Tag vises som chip — tag-dot vises på thumbnail | | |
| 9.7 | Slett tag (klikk X) | Tag fjernes | | |
| 9.8 | Dra bilde til drop-zone | Bilde lagres som vedlegg — bilde-dot vises | | |
| 9.9 | Slett vedlagt bilde | Bildet fjernes fra grid | | |
| 9.10 | Lukk panel (X eller Esc) | Panel lukkes, canvas returnerer til normal | | |
| 9.11 | Last siden på nytt | Alle annotasjoner (stjerne, grade, status, notater, tags, bilder) er bevart | | |

---

## 10. SCREEN EDITOR — FOKUSERT DESIGNMODUS

### 10a. Åpning og navigasjon

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.1 | Trykk **D** eller velg "Screen Editor" fra kontekstmeny | Fokusert modus åpnes: stor iframe i midten, designpanel til høyre | | |
| 10.2 | Klikk **Prev** / **Next** knapper | Navigerer mellom skjermer — iframe og panel oppdateres | | |
| 10.3 | Trykk **←** / **→** piltaster | Samme navigasjon som Prev/Next | | |
| 10.4 | Klikk "Screens" knappen | Filmstrip (thumbnail-rekke) vises/skjules nederst | | |
| 10.5 | Klikk en thumbnail i filmstrip | Hopper til valgt skjerm | | |
| 10.6 | Klikk "Panel" knappen | Designpanelet vises/skjules | | |
| 10.7 | Klikk "Info" knappen | Info-panel vises/skjules til venstre | | |
| 10.8 | Trykk **Esc** eller klikk lukk-knappen | Fokusert modus lukkes, tilbake til canvas | | |
| 10.9 | Gå inn i Screen Editor igjen etter å ha lukket | Alt fungerer normalt ved re-entry (events re-wires) | | |

### 10b. Scope-toggle

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.10 | Klikk "This Screen" | Endringer gjelder kun gjeldende skjerm | | |
| 10.11 | Klikk "All Screens" | Endringer gjelder alle skjermer i appen | | |

### 10c. Design-fane — Bakgrunn

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.12 | Velg "Background" modus | Bakgrunnsverktøy vises (Gallery/Editor) | | |
| 10.13 | Klikk "Gallery" underfane | Forhåndsdefinerte bakgrunner vises i grid | | |
| 10.14 | **LIVE TEST:** Klikk en bakgrunnspreset | ⚡ Iframe i midten oppdateres UMIDDELBART med ny bakgrunn | | |
| 10.15 | Filtrer presets etter kategori | Kun presets i valgt kategori vises | | |
| 10.16 | Klikk en atmosphere-swatch | ⚡ Iframe oppdateres live med atmosphere-bakgrunn | | |
| 10.17 | Klikk "Clear" for å fjerne bakgrunn | ⚡ Bakgrunn fjernes fra iframe umiddelbart | | |

### 10d. Design-fane — Gradient Editor

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.18 | Klikk "Editor" underfane | Gradient builder vises med forhåndsvisning | | |
| 10.19 | Velg type: Linear / Radial / Conic | Gradient-type endres i preview | | |
| 10.20 | **LIVE TEST:** Dra vinkel-slider | ⚡ Iframe oppdateres i sanntid mens du drar | | |
| 10.21 | **LIVE TEST:** Endre farge på et color stop | ⚡ Iframe oppdateres live når fargevelger endres | | |
| 10.22 | **LIVE TEST:** Dra posisjon-slider for color stop | ⚡ Gradient i iframe oppdateres live | | |
| 10.23 | Legg til nytt color stop (+ Add) | Nytt stop legges til i listen | | |
| 10.24 | Slett et color stop (X) | Stop fjernes (minimum 2 stops) | | |
| 10.25 | Klikk "Apply" | Gradient brukes som bakgrunn | | |
| 10.26 | For Radial: Dra X/Y senterpunkt-slidere | ⚡ Radial gradient-senter flytter seg live | | |

### 10e. Design-fane — Card Isolation & Text Brightness

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.27 | **LIVE TEST:** Dra Card Opacity-slider | ⚡ Kort-bakgrunner endrer gjennomsiktighet live i iframe | | |
| 10.28 | Slider ved 0% viser "Glass" | Label oppdateres: Glass → Frosted → Semi → Matte → Solid | | |
| 10.29 | **LIVE TEST:** Dra Text Brightness-slider | ⚡ Tekstlysstyrke endres live i iframe | | |
| 10.30 | Text Brightness ved 100% = standard | Ingen filter aktiv ved standardverdi | | |

### 10f. Design-fane — UI Elements & Paletter

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.31 | Klikk "UI Elements" modus | Palette-verktøy vises | | |
| 10.32 | Klikk "Palettes" underfane | Liste over 96 fargeskjemaer vises gruppert etter kategori | | |
| 10.33 | **LIVE TEST:** Klikk "Apply" på en palett | ⚡ Farger i iframe endres umiddelbart | | |
| 10.34 | **PALETTBUG-TEST:** Bruk palett ETTER å ha satt Card Opacity > 0 | ⚡ Card opacity BEHOLDES — kort skal IKKE bli gjennomsiktige | | |
| 10.35 | **PALETTBUG-TEST:** Sett Card Opacity til 80%, bytt palett 3 ganger | ⚡ Opacity forblir ~80% etter hvert palettbytte | | |
| 10.36 | Klikk "Editor" underfane (palettmodus) | Fargevelgere for 6 palette-roller vises | | |
| 10.37 | Endre en farge i palette editor | ⚡ Fargeendring reflekteres live i iframe | | |
| 10.38 | Klikk "Clear" (X) for å fjerne palett | Originale farger gjenopprettes | | |

### 10g. Effects-fane — Filtre

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.39 | Klikk "Effects" tab | Filterverktøy vises | | |
| 10.40 | **LIVE TEST:** Dra Brightness-slider (bakgrunn) | ⚡ Bakgrunnens lysstyrke endres live | | |
| 10.41 | **LIVE TEST:** Dra Contrast-slider | ⚡ Kontrast endres live | | |
| 10.42 | **LIVE TEST:** Dra Blur-slider | ⚡ Uskarphet endres live | | |
| 10.43 | **LIVE TEST:** Dra Hue-rotate-slider | ⚡ Fargetone roteres live | | |
| 10.44 | **LIVE TEST:** Dra Saturation-slider | ⚡ Metning endres live | | |
| 10.45 | Klikk "Reset" for filtre | Alle filtere tilbakestilles til standard | | |

### 10h. Inspect-fane

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 10.46 | Klikk "Inspect" tab | Inspeksjonsinformasjon vises | | |

---

## 11. DESIGN STUDIO — SIDEPANEL (CANVAS-MODUS)

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 11.1 | Klikk bakgrunns-knappen i topbar | Design Studio panel åpnes | | |
| 11.2 | Velg en skjerm i dropdown | Bakgrunn påvirker kun valgt skjerm | | |
| 11.3 | Bruk "Global" modus | Bakgrunn påvirker alle skjermer | | |
| 11.4 | Custom Library — lagre gradient | Gradient lagres med navn | | |
| 11.5 | Custom Library — last lagret gradient | Lagret gradient brukes | | |
| 11.6 | Lukk panel (X) | Panel lukkes | | |

---

## 12. ELEMENT INSPECTOR

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 12.1 | Trykk **I** eller velg fra kontekstmeny | Inspektørmodus aktiveres — modusbar vises øverst | | |
| 12.2 | Klikk på et element i en iframe | Inspektør-panel åpnes med elementdetaljer | | |
| 12.3 | Verifiser box model-visualisering | Margin, border, padding, content-mål vises riktig | | |
| 12.4 | Verifiser CSS-egenskaper | Layout, farger, typografi, effekter vises gruppert | | |
| 12.5 | Klikk "Copy CSS" | CSS kopieres til utklippstavle | | |
| 12.6 | Klikk "Copy Tailwind" | Tailwind-klasser kopieres | | |
| 12.7 | Klikk "Pick" — fang stil | Grønn chip vises: "Style picked" | | |
| 12.8 | Naviger til annet element → klikk "Apply" | Fanget stil påføres nytt element | | |
| 12.9 | Klikk "Undo" | Stilendring reverseres | | |
| 12.10 | Trykk **Esc** | Inspektørmodus avsluttes | | |
| 12.11 | Dra panelet i header | Panel er flyttbart | | |

---

## 13. DESIGN TOKENS

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 13.1 | Trykk **T** | Design Tokens panel åpnes | | |
| 13.2 | Klikk "Re-scan" | Tokens analyseres fra alle synlige skjermer | | |
| 13.3 | Farger vises med frekvens | Farge-palletter med brukstelling vises | | |
| 13.4 | Typografi vises | Fonter, størrelser, vekter med antall | | |
| 13.5 | Spacing vises | Padding, margin, gap-verdier | | |
| 13.6 | Border radius vises | Vanlige radius-verdier | | |
| 13.7 | Dobbeltklikk en token → rediger | Verdi endres live i alle matchende skjermer | | |
| 13.8 | **Ctrl+Z** for å angre redigering | Token-endring reverseres | | |
| 13.9 | **Ctrl+Y** for å gjøre om | Token-endring gjenopprettes | | |
| 13.10 | Klikk "Reset" | Alle redigeringer nullstilles | | |
| 13.11 | Klikk "Export JSON" | Token-definisjon lastes ned som JSON-fil | | |
| 13.12 | Trykk **Esc** for å lukke | Panel lukkes | | |

---

## 14. STYLE PRESETS

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 14.1 | Åpne Style Presets panel | Panel vises med eksisterende presets | | |
| 14.2 | Søk etter preset | Filtrering fungerer | | |
| 14.3 | Klikk for å bruke en preset | Stil påføres valgt element | | |
| 14.4 | Lagre ny preset fra Inspector | Preset lagres med navn og kategori | | |
| 14.5 | Angre siste preset-bruk | Elementet tilbakestilles | | |
| 14.6 | Eksporter presets | JSON-fil lastes ned | | |
| 14.7 | Importer presets | Presets legges til biblioteket | | |

---

## 15. DESIGN COMPARISON

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 15.1 | Åpne sammenligningsverktøyet | Comparison overlay vises | | |
| 15.2 | Velg Screen A og Screen B | To skjermer lastes inn | | |
| 15.3 | Modus: Side-by-Side | Skjermene vises side om side | | |
| 15.4 | Modus: Overlay | En skjerm vises over den andre med opacity-slider | | |
| 15.5 | Dra overlay opacity-slider | Gjennomsiktighet endres jevnt | | |
| 15.6 | Modus: Diff | Pikselforskjeller markeres visuelt | | |
| 15.7 | Swap-knapp (A ↔ B) | Skjermene bytter plass | | |
| 15.8 | Trykk **Esc** for å lukke | Overlay lukkes | | |

---

## 16. ACCESSIBILITY SCANNER

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 16.1 | Trykk **A** | Accessibility Scanner panel åpnes | | |
| 16.2 | Klikk "Re-scan" | Skjermen analyseres for WCAG-brudd | | |
| 16.3 | Kontrastforhold rapporteres | Tekst vs bakgrunn-kontrast vises (AA/AAA) | | |
| 16.4 | Touch targets rapporteres | Elementer < 48x48px markeres | | |
| 16.5 | ARIA-validering kjøres | Manglende/feil ARIA-attributter rapporteres | | |
| 16.6 | Fargeblindhet: Protanopia | Simulering vises korrekt | | |
| 16.7 | Fargeblindhet: Deuteranopia | Simulering vises korrekt | | |
| 16.8 | Fargeblindhet: Tritanopia | Simulering vises korrekt | | |
| 16.9 | Fargeblindhet: Achromatopsia | Simulering vises korrekt | | |
| 16.10 | Eksporter resultater som JSON | Fil lastes ned | | |
| 16.11 | Trykk **Esc** for å lukke | Panel lukkes | | |

---

## 17. CODE EXPORT

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 17.1 | Velg en skjerm → åpne Code Export | Eksportpanel vises med kildekode | | |
| 17.2 | Format: HTML | Ren, formatert HTML vises | | |
| 17.3 | Format: React TSX | Funksjonell React-komponent vises | | |
| 17.4 | Format: Vue SFC | Vue Single File Component vises | | |
| 17.5 | Format: Svelte | Svelte-komponent vises | | |
| 17.6 | Format: Tailwind | HTML med Tailwind-klasser (konvertert fra inline CSS) | | |
| 17.7 | Klikk "Copy" | Kode kopieres til utklippstavle | | |
| 17.8 | Klikk "Download" | Fil lastes ned med riktig endelse | | |
| 17.9 | Syntaksutheving fungerer | Fargekodet visning av tags, attributter, strenger | | |

---

## 18. RESPONSIVE PREVIEW

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 18.1 | Velg skjerm → trykk **R** | Responsive preview åpnes | | |
| 18.2 | Alle 4 breakpoints vises | Mobile (430px), Tablet (768px), Laptop (1280px), Desktop (1920px) | | |
| 18.3 | Toggle individuelt breakpoint av/på | Breakpoint skjules/vises | | |
| 18.4 | Layout: Side-by-Side | Alle breakpoints i rad | | |
| 18.5 | Layout: Stacked | Alle breakpoints i kolonne | | |
| 18.6 | Layout: Focus | Én om gangen, større forhåndsvisning | | |
| 18.7 | Egendefinert bredde-input | Korrekt bredde brukes | | |
| 18.8 | Synkronisert scrolling | Alle viewports scroller sammen | | |
| 18.9 | Trykk **Esc** for å lukke | Preview lukkes | | |

---

## 19. ANNOTASJONSCANVAS (TEGNEVERKTØY)

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 19.1 | Høyreklikk skjerm → "Annotate" | Fullskjerm tegneoverlay åpnes over skjermbildet | | |
| 19.2 | Verktøy: Rektangel (R) | Tegn rektangel med klikk+dra | | |
| 19.3 | Verktøy: Highlight (H) | Tegn markert område | | |
| 19.4 | Verktøy: Ellipse (E) | Tegn sirkel/oval | | |
| 19.5 | Verktøy: Callout (C) | Nummerert boble plasseres | | |
| 19.6 | Verktøy: Pil (A) | Retningspil tegnes | | |
| 19.7 | Verktøy: Linje (L) | Enkel linje tegnes | | |
| 19.8 | Verktøy: Frihånd (D) | Pennetegning fungerer jevnt | | |
| 19.9 | Verktøy: Tekst (T) | Tekstlabel plasseres | | |
| 19.10 | Verktøy: Select (V) | Klikk for å velge/flytte former | | |
| 19.11 | Endre farge (rød/grønn/blå/gul/lilla) | Neste tegning bruker ny farge | | |
| 19.12 | Endre strektykkelse (tynn/medium/tykk) | Linjetykkelse endres | | |
| 19.13 | Velg form → sett Intent (Fix/Question/Suggestion/Approved) | Intent lagres på formen | | |
| 19.14 | Velg form → sett Severity (Blocking/Minor/Cosmetic) | Severity lagres | | |
| 19.15 | Slett valgt form (Del-tast) | Form fjernes | | |
| 19.16 | **Ctrl+Z** for å angre | Siste handling angres (maks 20 steg) | | |
| 19.17 | **Ctrl+Y** for å gjøre om | Angret handling gjenopprettes | | |
| 19.18 | Eksporter som PNG | Bilde med annotasjoner lastes ned | | |
| 19.19 | Eksporter som JSON | Formdata lastes ned som JSON | | |
| 19.20 | Trykk **Esc** for å lukke | Canvas lukkes, annotasjoner lagres | | |
| 19.21 | Åpne annotasjon igjen | Tidligere tegninger er bevart | | |

---

## 20. PRESENTASJONSMODUS

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 20.1 | Trykk **P** | Presentasjon starter fra skjerm 1 | | |
| 20.2 | Kontekstmeny → "Present from here" | Presentasjon starter fra valgt skjerm | | |
| 20.3 | Klikk **→** (Neste) | Neste skjerm vises i telefonramme | | |
| 20.4 | Klikk **←** (Forrige) | Forrige skjerm vises | | |
| 20.5 | Bruk piltaster for navigering | Venstre/høyre navigerer mellom skjermer | | |
| 20.6 | Klikk prikk-navigasjon | Hopper direkte til valgt skjerm | | |
| 20.7 | Teller oppdateres | "X / N" viser riktig posisjon | | |
| 20.8 | Bakgrunn vises i presentasjon | Hvis bakgrunn er satt, vises den rundt telefon-rammen | | |
| 20.9 | Trykk **Esc** | Presentasjon avsluttes | | |

---

## 21. INTERACT-MODUS

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 21.1 | Klikk Interact-toggle i topbar | Interact ON — toast vises | | |
| 21.2 | Klikk inne i en iframe (interact ON) | Iframe-innhold reagerer (knapper, scrolling, etc.) | | |
| 21.3 | Dra en skjerm (interact ON) | Skjermen dras IKKE — iframe fanger klikk | | |
| 21.4 | Deaktiver Interact | Iframe-klikk ignoreres, dra fungerer igjen | | |

---

## 22. DATA EKSPORT OG PERSISTENS

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 22.1 | Klikk "Export" knapp i topbar | JSON-fil lastes ned med alle app-data | | |
| 22.2 | Verifiser JSON-innhold | Metadata, posisjoner, koblinger, annotasjoner inkludert | | |
| 22.3 | Sett diverse annotasjoner → last siden på nytt | Alt er bevart via localStorage | | |
| 22.4 | Sett bakgrunner → last siden på nytt | Bakgrunner og filtre er bevart | | |
| 22.5 | Bytt app → bytt tilbake | Per-app data er isolert og bevart | | |

---

## 23. TASTATURSNARVEI-OPPSUMMERING

Test at alle snarveier fungerer:

| # | Tast | Forventet handling | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 23.1 | **M** | Toggle app-meny | | |
| 23.2 | **1** | Tight strip layout | | |
| 23.3 | **2** | Grid layout | | |
| 23.4 | **3** | User flow layout | | |
| 23.5 | **I** | Toggle Inspector | | |
| 23.6 | **T** | Toggle Design Tokens | | |
| 23.7 | **A** | Toggle Accessibility Scanner | | |
| 23.8 | **R** | Toggle Responsive Preview | | |
| 23.9 | **D** | Åpne Screen Editor (fokusert modus) | | |
| 23.10 | **P** | Start presentasjon | | |
| 23.11 | **F** | Fit all i viewport | | |
| 23.12 | **S** | Toggle snap grid | | |
| 23.13 | **+** / **-** | Zoom inn/ut | | |
| 23.14 | **Esc** | Lukk åpent panel/overlay/modus | | |
| 23.15 | **Delete** | Slett koblinger | | |
| 23.16 | **Shift+klikk** | Multi-select skjerm | | |
| 23.17 | **Shift+dra** | Rubber-band seleksjon | | |

---

## 24. EDGE CASES OG REGRESJONSTESTER

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 24.1 | Åpne Screen Editor → bruk alle verktøy → lukk → åpne igjen | Alt fungerer normalt ved re-entry | | |
| 24.2 | Sett bakgrunn → bytt skjerm → gå tilbake | Bakgrunn er bevart på opprinnelig skjerm | | |
| 24.3 | Sett "All Screens" bakgrunn → bytt til "This Screen" | Per-skjerm overstyring fungerer | | |
| 24.4 | Åpne Inspector → lukk → åpne Screen Editor | Ingen konflikter mellom moduser | | |
| 24.5 | Bruk palett → sett Card Opacity → bytt palett | Card Opacity beholdes ved palettbytte | | |
| 24.6 | Sett mange filtre → Clear All | Alle tilbakestilles rent | | |
| 24.7 | Last app med 14 skjermer → bruk alle layout-moduser | Ingen ytelsesproblem eller visuell glitch | | |
| 24.8 | Zoom til minimum (6%) | Skjermer er synlige, minimap korrekt | | |
| 24.9 | Zoom til maksimum (120%) | Skjermer vises store, scrolling fungerer | | |
| 24.10 | Åpne flere paneler samtidig | Z-index håndteres — sist klikket panel er øverst | | |
| 24.11 | Prøv alle verktøy i Screen Editor med tom bakgrunn | Filtre, opacity, brightness fungerer uten satt bakgrunn | | |
| 24.12 | Sett bakgrunn → presenter → verifiser at bakgrunn vises | Presentasjonsmodus bruker lagrede bakgrunner | | |

---

## 25. YTELSE OG STABILITET

| # | Test | Forventet resultat | Status | Kommentar |
|---|------|--------------------|--------|-----------|
| 25.1 | Last app med flest skjermer (14 stk) | Laster innen rimelig tid, ingen frys | | |
| 25.2 | Dra skjermer raskt rundt på canvas | Jevn dragging uten hakking | | |
| 25.3 | Bytt mellom 5 apper raskt | Ingen minnelekkasjer, stabil ytelse | | |
| 25.4 | Åpne/lukke Screen Editor 10 ganger | Ingen hendelsesduplisering eller merkbar treging | | |
| 25.5 | Bruk gradient editor med raske slider-endringer | Live preview holder følge uten lag | | |

---

## OPPSUMMERING

| Område | Antall tester | Bestått | Feilet | Delvis |
|--------|:------------:|:-------:|:------:|:------:|
| 1. Oppstart | 6 | | | |
| 2. App-meny | 7 | | | |
| 3. Canvas navigasjon | 7 | | | |
| 4. Layout-moduser | 5 | | | |
| 5. Dra & slipp | 5 | | | |
| 6. Seleksjon | 5 | | | |
| 7. Kontekstmeny | 9 | | | |
| 8. Koblinger | 7 | | | |
| 9. Annotasjonspanel | 11 | | | |
| 10. Screen Editor | 46 | | | |
| 11. Design Studio (canvas) | 6 | | | |
| 12. Element Inspector | 11 | | | |
| 13. Design Tokens | 12 | | | |
| 14. Style Presets | 7 | | | |
| 15. Design Comparison | 8 | | | |
| 16. Accessibility Scanner | 11 | | | |
| 17. Code Export | 9 | | | |
| 18. Responsive Preview | 9 | | | |
| 19. Annotasjonscanvas | 21 | | | |
| 20. Presentasjonsmodus | 9 | | | |
| 21. Interact-modus | 4 | | | |
| 22. Eksport & Persistens | 5 | | | |
| 23. Tastatursnarveier | 17 | | | |
| 24. Edge cases | 12 | | | |
| 25. Ytelse | 5 | | | |
| **TOTALT** | **249** | | | |

---

**Tester:** ________________________
**Dato gjennomført:** ________________________
**Nettleser/versjon:** ________________________
**Skjermoppløsning:** ________________________
**Generelle kommentarer:**

