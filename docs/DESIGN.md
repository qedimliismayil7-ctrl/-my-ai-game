# Nuanza design system (app.css)

The identity is modern Eastern: lacquer navy, pomegranate (nar), saffron (zəfəran) and ivory. Carpet motifs stay in four places: the rug band under the header, the 8-point star, the faint carpet field on lacquer panels, and saffron hairlines. Everything else is a calm, precise product UI.

**Rules**
- Use the tokens for every colour (`var(--…)`). Do not put hex values in screen CSS. Theme switching only works through tokens.
- Prefix screen CSS with the screen id (`.home-…`, `.translate-…`). `nz-` is reserved for nuanza.js and `mc-` for meclis.js. The shell uses `hdr`, `dr-`, `onb-`, `sheet-`, `dialog-` and `toast`.
- Open/closed state is the class `.on` (`.open` also works) on `.drawer`, `.scrim`, `.sheet` and `.dialog`.
- Selected state is set through ARIA: `aria-pressed` (seg, chip, choice, swatch, icon-btn), `aria-selected` (tabs), `aria-current="page"` (nav), `aria-expanded` (burger), `aria-busy` (button loading) and `aria-invalid` (inputs).
- Set `document.documentElement.lang = "az"`. Uppercase labels need it to produce `İ` correctly.
- Append overlays (sheet, dialog, toasts, scrim, fx canvas) to `document.body`, never inside `.screen` or `.hdr`. Both of those can carry a transform or backdrop-filter, which would trap `position:fixed`.

---

## 1. Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F6F2EA | #10132A | page ground (body) |
| `--surface` | #FFFDF8 | #171B38 | cards, sheets, inputs |
| `--surface2` | #EFE8DA | #1D2246 | wells, hover, tracks |
| `--surface3` | #FFFDF8 | #272D5A | raised segment inside surface2 |
| `--ink` / `--soft` / `--faint` | #1B1F3B / #6A6577 / #958F9F | #F1ECE1 / #A9A5B8 / #7E7A96 | text tiers |
| `--line` / `--line-2` | #E2D8C5 / #CFC2A8 | #2B3160 / #3B4277 | dividers / control borders |
| `--lacquer` | #1E2A5A | #8EA2FF | secondary actions, switches, selected chips |
| `--nar` | #A3253A | #F0697D | primary action, current nav, errors |
| `--zafaran` | #C58B2A | #E5B45A | ornaments, hairlines, warnings |
| `--zafaran-ink` | #8A5D12 | #E5B45A | saffron **text** (contrast-safe) |
| `--gold-hi` | #F2D08A | #F5D79B | gold on lacquer panels, medal highlight |
| `--ivory` | #FFFDF8 | #F6EFE2 | logo core |
| `--rug` | #9E2337 | #93283E | physical rugs (onboarding, council) |
| `--deep` / `--deep-2` | #1E2A5A / #16204A | #232E66 / #1A2253 | lacquer hero panels (always dark) |
| `--on-deep` / `--on-deep-soft` | ivory / 72% | same | text on `--deep` |
| `--on-nar` / `--on-lacquer` / `--on-zafaran` | ivory / ivory / ink | #10132A ×3 | text on solid fills |
| `--ok` + `--ok-t` | #2E7D5B | #5CCB97 | success |
| `--nar-t` `--zaf-t` `--lac-t` | 9–14% tints | 13–14% tints | badge/icon/callout fills |
| `--conf-high/mid/low` | ok / zafaran / nar | — | confidence underline |
| `--focus` | #9A6A14 | #E5B45A | focus ring |
| `--scrim`, `--hl`, `--shimmer`, `--knob` | — | — | overlay, top highlight, skeleton, switch knob |
| `--inv-bg/ink/soft/ok/bad/gold/info` | dark navy toast | ivory toast | inverted surfaces (toasts) |
| `--av-nar/lacquer/zafaran/firuze/benovse/zeytun`, `--on-av` | deep hues | lifted hues | avatar colours, always ivory initials |

**Type.** `--f-display` is Noto Serif Display, used for headlines, numbers, the wordmark and avatar initials. `--f-body` is Noto Sans for UI. `--f-mono` is for segment numbers and kbd.

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 12px | labels, meta |
| `--fs-sm` | 13px | secondary text, chips, small buttons |
| `--fs-base` | 15px | body (body default) |
| `--fs-md` | 17px | h3 |
| `--fs-lg` | 20px | h2, card and sheet titles |
| `--fs-xl` | 24px | big emphasis |
| `--fs-2xl` | 28→36px fluid | h1 (page titles) |
| `--fs-3xl` | 34→48px fluid | onboarding hero |

Line heights are `--lh-tight` 1.12, `--lh-snug` 1.3 and `--lh-body` 1.55. `h1 em` renders as italic pomegranate ("Salam, *Aysel*"), and as gold on lacquer.

**Spacing** follows a 4px base: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48. The page gutter is `--gutter` 16px. Use `gap`, not margins.

**Radii.** `--r-xs` 6 (kbd) · `--r-sm` 10 (small buttons) · `--r-md` 12 (buttons, inputs, nav links) · `--r-lg` 18 (cards, tables, tiles) · `--r-xl` 24 (sheets, dialogs) · `--r-pill` (chips, badges, switch).

**Shadows.** `--sh-pop` for buttons and raised segments, `--sh-1` for cards at rest, `--sh-2` for hover lift and lacquer panels, `--sh-3` for drawer, sheets, dialogs and toasts.

**Motion.** Easing is `--ease-out` (UI), `--ease-in-out` and `--ease-spring` (playful pops). Durations are `--t-fast` 120ms (press, hover) · `--t-base` 200ms (state change) · `--t-slow` 320ms (drawer, sheet) · `--t-page` 220ms (screen enter). Buttons press to `scale(.98)`, cards lift 2px on hover (hover devices only), and the logo star rotates 45° on hover.

**Layout.** `--page-max` 960 · `--hdr-h` 60 · `--band-h` 10 · `--sidebar-w` 272 (≥1024px) · `--dock` 64 (companion).

**Z-index.** `--z-hdr` 30 · `--z-sidebar` 35 · `--z-dock` 38 · `--z-scrim` 40 · `--z-drawer` 41 · `--z-sheet-scrim` 59 · `--z-sheet` 60 · `--z-meclis` 70 · `--z-toast` 80 · `--z-onb` 90 · `--z-fx` 100.

**Motif masks** (geometry only; the colour comes from `background`): `--m-band`, `--m-band2`, `--m-bandv`, `--m-bandv2`, `--m-field` (56px lattice), `--m-gul` (stepped medallion), `--m-star` (8-point star), `--m-check`.
```css
.home-hero::after{content:"";position:absolute;inset:0;background:var(--zafaran);opacity:.12;
  -webkit-mask:var(--m-field) 0 0/56px 56px;mask:var(--m-field) 0 0/56px 56px}
```

**Reduced motion.** The OS setting, or `<html data-motion="reduce">` (the in-app setting), shortens every animation and transition to 1ms, so each element lands on its final state. To keep a deliberate fade-only fallback, add the class `motion-safe` to that element and write your own reduced-motion rule. The council overlay does this.

**Dark mode.** Set `data-theme="dark"|"light"` on `<html>`. When neither is set, the page follows the system.

---

## 2. Shell markup (app.js)

```html
<a class="skip-link" href="#main">Məzmuna keç</a>
<div class="app">
  <header class="hdr">            <!-- add .scrolled after scrollY > 4 -->
    <div class="hdr-in">
      <button class="burger" aria-label="Menyunu aç" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>
      <a class="brand" href="#home" aria-label="Nuanza — ana səhifə">
        <svg class="logo" viewBox="-20 -20 40 40" aria-hidden="true">
          <polygon class="l-star" points="0,-19 5.56,-13.43 13.43,-13.43 13.43,-5.56 19,0 13.43,5.56 13.43,13.43 5.56,13.43 0,19 -5.56,13.43 -13.43,13.43 -13.43,5.56 -19,0 -13.43,-5.56 -13.43,-13.43 -5.56,-13.43"/>
          <circle class="l-ring" r="8"/><circle class="l-dot" r="2.6"/>
        </svg>
        <b>Nuanza</b><!-- optional: <small>Akademiya</small> -->
      </a>
      <button class="avatar av-nar" aria-label="Profil və ayarlar">AM</button>
    </div>
    <div class="rugband" aria-hidden="true"></div>
  </header>

  <nav class="drawer" id="drawer" aria-label="Əsas menyu">   <!-- .on when open (mobile) -->
    <button class="dr-profile" type="button">
      <span class="avatar lg av-nar">AM</span>
      <span class="who"><b>Aysel Məmmədova</b><small>Freelance tərcüməçi · EN/RU → AZ</small><span class="badge">Peşəkar</span></span>
    </button>
    <div class="dr-mode"><div class="seg block" role="group" aria-label="Rejim">
      <button aria-pressed="true">Peşəkar</button><button aria-pressed="false">Akademiya</button></div></div>
    <div class="dr-nav">
      <div class="dr-grp">Peşəkar</div>
      <a class="dr-link" href="#home" aria-current="page">ICON<span>Masa</span></a>
      <a class="dr-link" href="#projects">ICON<span>Layihələr</span><span class="badge red">3</span></a>
    </div>
    <div class="dr-foot">
      <button class="icon-btn ghost theme-toggle" aria-label="Rəng rejimini dəyiş">
        <span class="i-moon">MOON</span><span class="i-sun">SUN</span></button>
      <span class="ver">Nuanza 2.0 · Bakı</span>
    </div>
  </nav>
  <div class="scrim"></div>                      <!-- drawer scrim, .on when open -->

  <main class="main" id="main"><section class="screen enter">…render(el)…</section></main>
  <div class="companion"></div>                   <!-- Nuanza dock mounts here -->
</div>
<div class="toasts" aria-live="polite"></div>
<canvas class="fx-layer"></canvas>
```
- Wrap each nav label in a `<span>`, which pushes the badge and the current-page star marker to the right.
- At ≥1024px the drawer becomes the sidebar. The burger is hidden there and the drawer scrim is not displayed. JS should skip the focus trap and must not set `inert` on the drawer when `matchMedia('(min-width:1024px)')` matches.
- Give the screen section the class `screen`. Add `enter` on navigation to stagger the `.page` children, and remove it after about 600ms so later partial re-renders do not animate.

**Sheet** (bottom sheet on phones, centred dialog at ≥640px; `.sheet.wide` for 760px):
```html
<div class="scrim top on"></div>
<div class="sheet on" role="dialog" aria-modal="true" aria-labelledby="sh1">
  <div class="sheet-grab"></div>
  <div class="sheet-h"><h2 id="sh1">Təhvil paketi</h2><button class="icon-btn ghost" aria-label="Bağla">X</button></div>
  <div class="sheet-b">…</div>
  <div class="sheet-f"><button class="btn btn-ghost">Ləğv et</button><button class="btn btn-primary">Hazırla</button></div>
</div>
```
**Dialog** (App.confirm):
```html
<div class="scrim top on"></div>
<div class="dialog on" role="alertdialog" aria-modal="true" aria-labelledby="dg1" aria-describedby="dg1t">
  <div class="dialog-ic danger">ICON</div>
  <h2 id="dg1">Layihə silinsin?</h2>
  <p id="dg1t">«SOCAR — İllik hesabat 2025» və onun 214 seqmenti silinəcək.</p>
  <div class="dialog-f"><button class="btn btn-ghost">Ləğv et</button><button class="btn btn-danger">Sil</button></div>
</div>
```
**Toast** (kinds `ok`, `err`, `warn`, `info`; add `.out` 220ms before removing):
```html
<div class="toast ok" role="status"><span class="t-ic">CHECK</span><span class="t-tx">Hazırdır<small>DOCX və TMX paketi yığıldı</small></span><button class="t-act">Bax</button></div>
```
**Score ring** (App.ring). Set `pathLength="100"` on the circles. Use `.mid` for scores 60–79 and `.low` below 60. Size variants are `.sm` and `.lg`.
```html
<div class="ring-wrap">
  <div class="ring" style="--v:92">
    <svg viewBox="0 0 120 120"><circle class="ring-orn" cx="60" cy="60" r="59" pathLength="100"/><circle class="ring-track" cx="60" cy="60" r="50" pathLength="100"/><circle class="ring-val" cx="60" cy="60" r="50" pathLength="100"/></svg>
    <div class="ring-txt"><b>92</b><span>bal</span></div>
  </div>
  <p class="ring-sub">Təhvilə hazırdır</p>
</div>
```
**Onboarding:**
```html
<div class="onb" role="dialog" aria-modal="true" aria-label="Nuanza-ya xoş gəldiniz">
  <div class="onb-in">
    <div class="onb-step">
      <svg class="onb-star" viewBox="-20 -20 40 40" aria-hidden="true">
        <path class="l-star" pathLength="1" d="M0 -19 5.56 -13.43 13.43 -13.43 13.43 -5.56 19 0 13.43 5.56 13.43 13.43 5.56 13.43 0 19 -5.56 13.43 -13.43 13.43 -13.43 5.56 -19 0 -13.43 -5.56 -13.43 -13.43 -5.56 -13.43Z"/>
        <circle class="l-ring" r="8"/><circle class="l-dot" r="2.6"/>
      </svg>
      <div class="onb-rug" aria-hidden="true"></div>
      <div class="onb-stage"><!-- Nuanza size:'full' --></div>
      <h1 class="onb-h">Salam, mən <em>Nuanza</em>yam</h1>
      <p class="onb-p">Mətnin mənasını birlikdə tutacağıq.</p>
      <div class="onb-choices"><button class="choice" aria-pressed="true"><span class="ic nar">ICON</span><span><b>Peşəkar tərcüməçi</b><small>Layihələr, lüğətlər, QA</small></span></button>…</div>
      <div class="onb-actions"><button class="btn btn-primary btn-lg">Davam et</button></div>
      <div class="onb-dots"><i class="on"></i><i></i><i></i></div>
    </div>
  </div>
</div>
```
Close it by adding `.out` and removing the element after 350ms.

---

## 3. Components

**Page**
```html
<div class="page">
  <div class="page-h">
    <div><span class="eyebrow">Peşəkar</span><h1>Salam, <em>Aysel</em></h1><p>Bu həftə 3 təhvil var.</p></div>
    <div class="actions"><button class="btn btn-secondary">…</button><button class="btn btn-primary">Yeni layihə</button></div>
  </div>
  <div class="sec-h"><h2>Son layihələr</h2><a href="#projects">Hamısı</a></div>
  <div class="grid-2">…</div>   <!-- .grid-3; both stack under 640px; .span-all spans the row -->
</div>
```
Text helpers: `.eyebrow` (uppercase label with a saffron star; `.eyebrow.plain` drops the star) and `.muted`. Utilities: `.stack` / `.stack-sm` / `.stack-lg`, `.row` (`.row.between`), `.grow`, `.tnum`, `.small`, `.serif`, `.truncate`, `.sr-only`, `.link` (a button styled as a link) and `.prose`.

**Cards**
```html
<section class="card"><div class="card-h"><div><span class="eyebrow">Situasiya</span><h2>Kimə, nə üçün?</h2></div><div class="actions"><button class="icon-btn sm ghost">…</button></div></div>…</section>
<section class="card pad-lg">…</section>
<button class="card clickable">…</button>      <!-- any a/button.card lifts on hover -->
<section class="card lacquer"><span class="eyebrow">Rütbəniz</span><h2><em>Mirzə</em></h2><div class="progress gold"><i style="width:62%"></i></div></section>
<section class="card framed">…</section>       <!-- inner saffron hairline: situation card, deliverables -->
<section class="card flat">…</section>          <!-- surface2 well, no shadow -->
<section class="card danger">…</section>        <!-- settings "Təhlükəli zona" -->
```
**Tiles and icon tiles**
```html
<div class="tiles"><button class="tile"><span class="ic">ICON</span><span><b>Lüğət</b><small>1 284 termin</small></span></button></div>
<span class="ic nar|gold|green|lg">ICON</span>
```
**Buttons**
```html
<button class="btn btn-primary">Tərcümə et</button>       <!-- pomegranate; one per view -->
<button class="btn btn-secondary">Məclisə göndər</button>  <!-- lacquer -->
<button class="btn">Önizlə</button>                       <!-- neutral -->
<button class="btn btn-ghost">Ləğv et</button>
<button class="btn btn-danger">Hesabı sil</button>
<button class="btn btn-primary btn-sm|btn-lg|btn-block">…</button>
<button class="btn btn-primary" aria-busy="true">Yoxlanır…</button>  <!-- spinner -->
<button class="icon-btn" aria-label="Axtar">ICON</button>  <!-- .ghost .sm, aria-pressed -->
<span class="spinner"></span>
```
**Forms**
```html
<div class="field">
  <label for="pf-name">Ad və soyad <span class="opt">məcburi</span></label>
  <input id="pf-name" class="input" value="Aysel Məmmədova">
  <span class="hint">Müştərilər təhvil sənədində bu adı görür.</span>
  <!-- <span class="err">ICON E-poçt düzgün deyil</span> + aria-invalid="true" on the input -->
</div>
<textarea class="textarea" id="tr-src"></textarea>
<select class="select" id="pf-pair"><option>EN → AZ</option></select>
<label class="input-ic">SEARCH-ICON<input class="input" id="pj-q" placeholder="Layihə axtar"></label>
<label class="switch"><input type="checkbox" id="st-tm" checked><span></span></label>
<div class="seg" role="group" aria-label="Üslub">
  <button aria-pressed="false">Danışıq</button><button aria-pressed="false">Neytral</button>
  <button aria-pressed="true" class="detected">Rəsmi</button><button aria-pressed="false">Hüquqi</button>
</div>   <!-- .detected = saffron dot "auto-detected"; .seg.block full width; .seg.sm -->
<div class="chips"><button class="chip" aria-pressed="true">EN → AZ</button><span class="chip">Hüquq<button class="x" aria-label="Sil">X</button></span></div>
<div class="swatches"><button class="swatch av-nar" aria-pressed="true" aria-label="Nar"></button><button class="swatch av-firuze" aria-label="Firuzə"></button></div>
<button class="choice" aria-pressed="false"><span class="ic">ICON</span><span><b>Tələbə — Akademiya</b><small>Dərslər, xal, rütbə</small></span></button>
<label class="dropzone"><input type="file" hidden><span class="ic nar">UPLOAD</span><b>Faylı bura atın</b><span>DOCX, PDF, XLIFF · 20 MB-a qədər</span></label>
```
Do not nest a `.switch` label inside a `label.list-row`. Use a `div.list-row` and put the switch in `.end`.

**Status and data**
```html
<span class="badge">Qaralama</span> <span class="badge gold">Peşəkar</span> <span class="badge red">Gecikir</span>
<span class="badge navy">TM 98%</span> <span class="badge green dot">Təhvil verildi</span>
<div class="tabs" role="tablist"><button role="tab" aria-selected="true">Hamısı <span class="badge">12</span></button><button role="tab" aria-selected="false">Aktiv</button></div>
<div class="list">
  <a class="list-row" href="#settings"><span class="ic">ICON</span><span class="tx"><b>Bildirişlər</b><small>Telegram, e-poçt</small></span><span class="end">2 aktiv <svg class="chev">…</svg></span></a>
  <div class="list-row"><span class="ic gold">ICON</span><span class="tx"><b>Tərcümə yaddaşı</b><small>Uyğunluqları avtomatik qoy</small></span><span class="end"><label class="switch"><input type="checkbox" id="s1"><span></span></label></span></div>
</div>   <!-- .list-row.danger for destructive rows -->
<div class="stats"><div class="stat"><b>38 400 <span class="delta">+12%</span></b><span>söz bu ay</span></div></div>   <!-- .delta.down -->
<div class="progress"><i style="width:64%"></i></div>   <!-- .gold .navy .green · .thin .lg · .indet -->
<kbd class="kbd">Ctrl</kbd> <kbd class="kbd">Enter</kbd>
<hr class="divider"> <div class="divider orn"></div>
<div class="callout"><svg>…</svg><div><b>Diqqət:</b> «actual» — «faktiki», «aktual» deyil.</div></div>   <!-- .red .navy .green -->
<dl class="kv"><dt>Tarif</dt><dd>Peşəkar · aylıq</dd><dt>Növbəti ödəniş</dt><dd>7 noyabr 2026</dd></dl>
<div class="bubble">Salam! Bu gün nə tərcümə edirik?</div>   <!-- .br = tail bottom-right -->
```
**Empty and loading states**
```html
<div class="empty"><div class="empty-art"><!-- Nuanza mini, or leave empty for a gul ornament --></div>
  <h3>Hələ layihə yoxdur</h3><p>İlk sənədi yükləyin, Nuanza terminləri və üslubu özü tapacaq.</p>
  <div class="actions"><button class="btn btn-primary">Layihə yarat</button></div></div>
<div class="sk-stack"><span class="skeleton title"></span><span class="skeleton text"></span><span class="skeleton text" style="width:80%"></span></div>
<span class="skeleton circle" style="width:40px;height:40px"></span> <span class="skeleton block"></span>
```
**Table** (scrolls inside its wrap; min 560px; `.table.compact` drops the minimum)
```html
<div class="table-wrap"><table class="table">
  <thead><tr><th>Layihə</th><th>Müştəri</th><th>Cüt</th><th class="num">Söz</th><th>Status</th></tr></thead>
  <tbody><tr class="clickable"><td><b>İllik hesabat 2025</b></td><td class="muted">SOCAR</td><td>EN → AZ</td><td class="num">12 480</td><td><span class="badge gold">Redaktədə</span></td></tr></tbody>
</table></div>
```
**Segment editor and confidence** (on phones the source stacks above the target)
```html
<div class="seg-editor">
  <div class="seg-head"><span>#</span><span>Mənbə · EN</span><span>Tərcümə · AZ</span><span></span></div>
  <div class="seg-row active">
    <span class="seg-n">14</span>
    <div class="seg-src">The Contractor shall notify the Employer within 14 days.</div>
    <div class="seg-tgt" contenteditable="true" data-placeholder="Tərcümə…">Podratçı <span class="conf-high">14 gün ərzində</span> <span class="conf-mid" title="«Sifarişçi» də ola bilər">İşəgötürəni</span> xəbərdar etməlidir.</div>
    <span class="seg-st ok">CHECK</span>   <!-- .ok .warn .err .busy, none = draft -->
    <div class="seg-meta"><span class="badge navy">TM 87%</span><span class="badge">Hüquqi</span></div>
  </div>
</div>
<div class="conf-legend"><span class="conf-high">Əmin</span><span class="conf-mid">Yoxlayın</span><span class="conf-low">Şübhəli</span></div>
```
**Carpet pieces**
```html
<div class="rugband" aria-hidden="true"></div>        <!-- .thin (6px) .thick (14px) .v (vertical) -->
<span class="medal" aria-hidden="true"><b>M</b></span>  <!-- .sm 40 · default 72 · .lg 104 · .xl 148 · .nar · .locked · .pop -->
<div class="carpet">…</div>                            <!-- faint carpet field behind content -->
```
**Avatar.** `.avatar` comes in `.sm` 28 · 40 · `.lg` 52 · `.xl` 88. Choose the colour with `av-nar`, `av-lacquer`, `av-zafaran`, `av-firuze`, `av-benovse` or `av-zeytun`, and store `profile.avatarColor` as one of those names.

**Companion and fx.** `.companion` is the fixed bottom-right slot above the safe area. `.fx-layer` is the full-screen canvas, with `pointer-events:none` and z-index 100.
