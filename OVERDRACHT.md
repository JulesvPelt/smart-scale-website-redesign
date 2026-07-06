# Overdracht — Smart-Scale redesign (chat van 6 juli 2026)

Dit bestand vat een werksessie met Claude Code samen, zodat je in een nieuwe chat, op een ander account of een andere computer direct verder kunt. Geef dit bestand (of de relevante delen) als context mee aan de nieuwe sessie.

## Project

- **Map:** `C:\Users\jules\smart-scale-website-redesign`
- **Website-bestanden:** `nieuwe-website/` (statische site: HTML/CSS/JS, géén build-stap)
- **Repo:** https://github.com/joshmarketingnl/smart-scale-website-redesign.git — branch `premium-homepage-redesign`
- **Lokaal draaien:** `node tools/serve.js` (of `npm start`) → http://localhost:8000
- **Belangrijk:** open pagina's nooit als `file://` — de paden zijn root-absoluut (`/style.css`, `/images/...`)
- **Tech:** GSAP 3 + ScrollTrigger + Lenis (lokaal in `nieuwe-website/js/`), `gsap.matchMedia()` voor desktop (≥901px) vs mobiel (≤900px), `prefers-reduced-motion` overal gerespecteerd

## ⚠️ Status: wijzigingen zijn NIET gecommit

Alle werk hieronder staat alleen lokaal (working tree). `git status` toont o.a. gewijzigd:
- `nieuwe-website/index.html`
- `nieuwe-website/script.js`
- `nieuwe-website/websites/index.html`
- nieuw: `nieuwe-website/js/lenis.min.js`

**Eerste actie op een andere machine: eerst hier committen en pushen, anders is het werk daar niet beschikbaar.**

## Wat er in deze sessie is gebouwd

### 1. Homepage (`nieuwe-website/index.html` + `script.js`)

- **Websites-sectie**: code→website overgang is nu één doorlopende clip-path wipe-reveal gekoppeld aan scroll, met gloeiende gele scanlijn op de wipe-rand, rijkere mockup (nav, hero-balken, CTA, gradient-afbeelding, 3 kaartjes met stagger). Geen leeg frame meer tussen de fases.
- **Sectievolgorde**: Websites staat nu vóór Voicebot in de DOM; nav-volgorde aangepast.
- **Hero**: canvas-nodes reageren op de muis (repel max ~18px, spring-back via frame-rate-onafhankelijke lerp, glow/scale tot 1.4x, lijnen naar 3 dichtstbijzijnste nodes). Alleen actief bij `(hover: hover) and (pointer: fine)`; alles in de bestaande RAF-loop.
- **Voicebot-telefoon**: ziet eruit als echte iPhone zonder Apple-logo's — Dynamic Island met cameradot, statusbalk-SVG's (signaal/wifi/batterij), zijknoppen, titanium-frame. Inkomende oproep heeft een kleurrijke iOS-achtige gradient-achtergrond (eigen gradient, geen Apple-beeldmateriaal) en een **"swipe om op te nemen"-balk die meebeweegt met de scroll** (scrollen = swipen; bij volledig doorgeschoven springt hij naar het verbonden gesprek met 2×3 knoppengrid en rode Einde-knop).
- **AI Automations-sectie**: volledig herbouwd als pinned scroll-journey (~3200px). Links 6 stappen met active/completed states; rechts één doorgroeiende "Smart-Scale Automation"-interface (lead Sophie de Vries → AI-analyse → CRM → follow-up-mail → agenda-afspraak → samenvatting + "Workflow voltooid ✓"). Afgeronde stappen klappen in tot compacte ✓-regels. Mobiel: gestapelde stap+visual-paren. Reduced motion: statisch volledig zichtbaar.
- **Bounce-fix**: paneel-overgangen gebruiken `grid-template-rows: 0fr ↔ 1fr` (met `.af-p-clip` binnenwrapper) i.p.v. `max-height`, zodat in-/uitklappen exact synchroon loopt. Hoogte per overgang gemeten: strikt monotoon, geen terugvering.

### 2. Websites-pagina (`nieuwe-website/websites/index.html`)

Herbouwd volgens bouwbrief (leesbaarheid + customer journey), alleen deze pagina:
- Bodytekst 17px / lh 1,6 / `max-width: 65ch`; laagste gemeten contrast 16,1:1 (eis 4,5:1).
- Afwisselende sectie-tinten; volgorde: Hero → Wat je krijgt → Hoe het werkt → **Resultaat** → Waarom statisch → CTA.
- "Wat je krijgt": 3 kaartjes met vinkjes (Ontwerp & tekst / Snelheid & vindbaarheid / Contact & livegang) — puntteksten ongewijzigd.
- Stappenplan: doorlopende verticale lijn, stap 6 "Live" gevuld geel.
- Resultaatsectie met bestaande cijfers groot: D → B (GTmetrix), 97 (PageSpeed), 4+ → 2 sec (laadtijd).
- CMS-sectie ingekort; "Geen webshop of login"-kaartje behouden.
- Eén primaire knop per sectie; "Bekijk voorbeeld" en "App ons" zijn outline (`btn ghost`).
- Label "↕ Scroll en klik door dit voorbeeld" onder de BlueShield-preview (iframe onaangeraakt).
- Focus-stijlen, mobiel (1 kolom, geen overflow) en reduced-motion geverifieerd.

## Belangrijke lessen / valkuilen (voor de volgende sessie)

1. **ScrollTrigger pin-volgorde**: gepinde secties moeten in `script.js` in dezelfde volgorde worden *aangemaakt* als hun DOM-volgorde. Alleen `ScrollTrigger.refresh()` aanroepen is niet genoeg — bij het omwisselen van secties ook de JS-setup-blokken omwisselen. (Dit veroorzaakte eerder overlappende pins.)
2. **Globale `.btn`-override in `style.css`** (regel ~1016): `.btn { background: var(--accent) !important; ... }` slaat de `.btn.ghost`/`.btn.secondary` varianten plat op **alle pagina's**. Op de Websites-pagina is dit page-scoped teruggedraaid met `!important` in de inline `<style>`. **Openstaand:** dezelfde fix is waarschijnlijk op de andere pagina's gewenst, of de override netjes globaal oplossen.
3. **n8n chat-widget code in `script.js` nooit aanraken** (bestaande afspraak).
4. **Copy moet door Joshua goedgekeurd worden** — o.a. de namen/teksten in de Automations-interface (Sophie de Vries, De Vries Automotive, tijden, mailtekst) komen uit de bouwbrief maar zijn nog niet expliciet akkoord.
5. **Testen**: Playwright staat in de project-`node_modules`. Testscripts als `tools/_check-*.js` neerzetten en draaien vanuit de projectmap (niet vanuit een temp-map, anders `Cannot find module 'playwright'`). Node op Windows: `export PATH="/c/Program Files/nodejs:$PATH"` per shell.
6. Screenshots van `data-reveal`-content: eerst door de pagina scrollen (IntersectionObserver), anders lijken secties leeg.

## Openstaande punten

- [ ] **Committen + pushen** van al het bovenstaande (niet gedaan; alleen op expliciet verzoek)
- [ ] Ghost/outline-knoppen fixen op de overige pagina's (zie valkuil 2)
- [ ] Copy-check door Joshua (voicebot-teksten, Automations-interface, Websites-pagina groepstitels)
- [ ] `screenshots/`-map bevat veel ongetrackte test-PNG's — beslissen: committen of opruimen
