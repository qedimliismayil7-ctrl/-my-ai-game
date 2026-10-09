/* =====================================================================
   NUANZA — app shell (window.App)
   Router · header · drawer/sidebar · mode switch · theme · toast · sheet
   confirm · score ring · DOM builder · icons · store · profile · fakeAI
   companion dock (Nuanza) · big jobs (Mirzə Məclisi) · first-run onboarding.
   Plain browser JS. Every optional dependency is guarded.
   ===================================================================== */
(function () {
  'use strict';

  var W = window, D = document, R = D.documentElement;
  var VERSION = '2.0';
  var App = W.App = W.App || {};

  /* ------------------------------------------------------------------
     0. UTILITIES
     ------------------------------------------------------------------ */
  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function $(sel, ctx) { return (ctx || D).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || D).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (has(s, k)) t[k] = s[k]; }
    return t;
  }
  function clone(v) { if (v === undefined || v === null || typeof v !== 'object') return v; try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function hash(str) { var x = 2166136261; str = String(str == null ? '' : str); for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function cap(s) { s = String(s == null ? '' : s); return s ? upper(s.charAt(0)) + s.slice(1) : s; }
  function fold(s) {
    return lower(s).replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/\u0307/g, '');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function mq(q) { try { return W.matchMedia(q); } catch (e) { return { matches: false, media: q }; } }
  function onMq(m, fn) { try { m.addEventListener('change', fn); } catch (e) { try { m.addListener(fn); } catch (e2) { /* old engines */ } } }
  var mqDesk = mq('(min-width:1024px)'), mqReduce = mq('(prefers-reduced-motion: reduce)'), mqDark = mq('(prefers-color-scheme: dark)');
  /* Motion preference: 'full' (default — always animate, even when the OS asks to reduce motion),
     'system' (follow the OS) or 'reduce'. Mirrored on <html data-motion>. */
  function motionPref() { var m = R.getAttribute('data-motion'); return m === 'reduce' || m === 'system' ? m : 'full'; }
  function reducedMotion() { var m = motionPref(); return m === 'reduce' || (m === 'system' && !!mqReduce.matches); }
  function isDesktop() { return !!mqDesk.matches; }
  function isTyping(el) { if (!el || el === D.body) return false; var t = el.tagName; return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || !!el.isContentEditable; }
  var IS_MAC = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var MOD = IS_MAC ? '⌘' : 'Ctrl';
  function later(fn, ms) { return setTimeout(fn, ms || 0); }
  function log(e) { try { if (W.console) console.error('[Nuanza]', e); } catch (x) { /* ignore */ } }
  function emit(name, detail) { try { D.dispatchEvent(new CustomEvent('nuanza:' + name, { detail: detail })); } catch (e) { /* ignore */ } }
  function on(name, fn) { var w = function (e) { fn(e.detail); }; D.addEventListener('nuanza:' + name, w); return function () { D.removeEventListener('nuanza:' + name, w); }; }
  function wordsOf(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []); }
  function countWords(s) { return wordsOf(s).length; }

  /* ------------------------------------------------------------------
     1. STORE (localStorage under 'nuanza2:' — every access guarded)
     ------------------------------------------------------------------ */
  var PFX = 'nuanza2:', mem = {}, internalSet = false, started = false;
  var store = {
    get: function (key, fallback) {
      if (has(mem, key) && mem[key] !== undefined) return clone(mem[key]);
      try {
        var raw = W.localStorage.getItem(PFX + key);
        if (raw !== null && raw !== undefined) { var v = JSON.parse(raw); mem[key] = v; return clone(v); }
      } catch (e) { /* storage blocked or bad JSON */ }
      return fallback;
    },
    set: function (key, value) {
      mem[key] = clone(value);
      try { W.localStorage.setItem(PFX + key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
      if (!internalSet) storeWatch(key);
      return value;
    },
    remove: function (key) {
      delete mem[key];
      try { W.localStorage.removeItem(PFX + key); } catch (e) { /* storage blocked */ }
      if (!internalSet) storeWatch(key);
    }
  };
  function iset(key, value) { internalSet = true; try { store.set(key, value); } finally { internalSet = false; } }
  var watchTimer = null;
  function storeWatch(key) {
    if (!started) return;
    try {
      if (key === 'theme') applyTheme(store.get('theme', 'dark'));
      else if (key === 'motion') applyMotion();
      else if (key === 'companion') { clearTimeout(watchTimer); watchTimer = later(mountCompanion, 30); }
      else if (key === 'profile') renderProfile();
      else if (key === 'mode') { var m = store.get('mode', 'pro'); if (m !== curMode) setMode(m); }
    } catch (e) { log(e); }
  }

  /* ------------------------------------------------------------------
     2. DOM BUILDER
     ------------------------------------------------------------------ */
  var DEFER_PROPS = { value: 1, checked: 1, selected: 1, indeterminate: 1 };
  function appendKids(el, kids) {
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c === null || c === undefined || c === false || c === true) continue;
      if (Array.isArray(c)) { appendKids(el, c); continue; }
      if (typeof c === 'object' && c.nodeType) { el.appendChild(c); continue; }
      el.appendChild(D.createTextNode(String(c)));
    }
    return el;
  }
  function h(tag, attrs) {
    var el = D.createElement(tag || 'div');
    var kids = Array.prototype.slice.call(arguments, 2);
    if (attrs !== null && attrs !== undefined && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    var deferred = null;
    if (attrs) {
      for (var k in attrs) {
        if (!has(attrs, k)) continue;
        var v = attrs[k];
        if (k.indexOf('aria-') === 0 || k.indexOf('data-') === 0) { if (v !== null && v !== undefined) el.setAttribute(k, String(v)); continue; }
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class' || k === 'className') el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : String(v);
        else if (k === 'text') el.textContent = String(v);
        else if (k === 'html') el.innerHTML = String(v);
        else if (k === 'style') {
          if (typeof v === 'string') el.style.cssText = v;
          else for (var s in v) { if (!has(v, s) || v[s] == null) continue; if (s.indexOf('--') === 0) el.style.setProperty(s, v[s]); else el.style[s] = v[s]; }
        }
        else if (k === 'dataset') { for (var d in v) if (has(v, d) && v[d] != null) el.dataset[d] = v[d]; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (DEFER_PROPS[k]) { (deferred = deferred || {})[k] = v; }
        else if (k === 'htmlFor') el.setAttribute('for', v);
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    appendKids(el, kids);
    if (deferred) for (var p in deferred) { try { el[p] = deferred[p]; } catch (e) { /* ignore */ } }
    return el;
  }
  function frag(html) { var t = D.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild || t.content.firstChild; }

  /* ------------------------------------------------------------------
     3. ICONS (24px, stroke 1.75, round joins)
     ------------------------------------------------------------------ */
  var ICONS = {
    home: '<path d="M3.5 10.2 12 3.5l8.5 6.7"/><path d="M5.5 8.8V19a1.5 1.5 0 0 0 1.5 1.5h3.5V15h3v5.5H17a1.5 1.5 0 0 0 1.5-1.5V8.8"/>',
    translate: '<path d="M3 5.5h10"/><path d="M8 3.5v2"/><path d="M11 5.5c-.9 4-3.4 7-7 8.8"/><path d="M5.6 9.2c1.3 2.1 3.2 3.7 5.6 4.6"/><path d="m12.5 20.5 4.25-9.5 4.25 9.5"/><path d="M14 17.3h5.5"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>',
    edit: '<path d="M4 20h4.2L19.3 8.9a2.6 2.6 0 0 0-3.7-3.7L4.5 16.3Z"/><path d="m14.2 6.6 3.7 3.7"/>',
    shield: '<path d="M12 3.2 5 6v5.2c0 4.4 2.9 8.1 7 9.6 4.1-1.5 7-5.2 7-9.6V6Z"/><path d="m9 12.2 2.1 2.1 4.1-4.3"/>',
    book: '<path d="M4.5 18.5v-13a2 2 0 0 1 2-2h13v14h-13a2 2 0 0 0 0 4h13"/><path d="M8.5 7.5h7"/>',
    cards: '<rect x="3.5" y="7" width="12.5" height="13.5" rx="2"/><path d="M7.5 7V5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H16"/>',
    star: '<path d="M12 3.2 14.6 8.6 20.4 9.4 16.2 13.4 17.2 19.2 12 16.4 6.8 19.2 7.8 13.4 3.6 9.4 9.4 8.6Z"/>',
    chart: '<path d="M3.5 20.5h17"/><path d="M6.5 16.5v-4"/><path d="M10.5 16.5v-8"/><path d="M14.5 16.5v-6"/><path d="M18.5 16.5V5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    bell: '<path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5"/><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>',
    palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2.3-1.8 3.6-4 3.6h-2.1a1.9 1.9 0 0 0-1.4 3.1A1.4 1.4 0 0 1 12 21Z"/><circle cx="7.6" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/><path d="M6 15h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    logout: '<path d="M9 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H9"/><path d="m16 16.5 4.5-4.5L16 7.5"/><path d="M20.5 12H9.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 15V3.5"/><path d="m7 8 5-4.5L17 8"/><path d="M20 15v3.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V15"/>',
    check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    sparkle: '<path d="M11 3.5 12.7 8.3 17.5 10l-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7Z"/><path d="M18.5 14.5l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75L16 17l1.75-.75Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    download: '<path d="M12 3.5V15"/><path d="m7 10.5 5 4.5 5-4.5"/><path d="M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15"/>',
    send: '<path d="M21 3 10 14"/><path d="m21 3-6.5 18-4.5-7-7-4.5Z"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    flame: '<path d="M12 21.5c3.6 0 6.5-2.6 6.5-6.4 0-4.4-3.5-6.6-4.6-11.1-2.3 1.6-3.6 4-3.4 6.8-1.1-.5-2-1.6-2.3-3.1-1.7 1.8-2.7 4.1-2.7 6.6 0 4 2.9 7.2 6.5 7.2Z"/>',
    trophy: '<path d="M8 3.5h8v5.5a4 4 0 0 1-8 0Z"/><path d="M8 5.5H5.5a2.5 2.5 0 0 0 2.7 4.2"/><path d="M16 5.5h2.5a2.5 2.5 0 0 1-2.7 4.2"/><path d="M12 13v4"/><path d="M8.5 20.5h7"/><path d="M9.5 20.5c0-2 1-3.5 2.5-3.5s2.5 1.5 2.5 3.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
    play: '<path d="M8 5.5v13l10.5-6.5Z"/>',
    pause: '<path d="M8.5 5v14M15.5 5v14"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.6A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4"/><path d="M6.6 6.7C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.7-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5"/><path d="M12 17.3h.01"/>',
    filter: '<path d="M4 5h16l-6.2 7.6V19l-3.6 1.5v-7.9Z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18.5 14.2a6.5 6.5 0 0 1 3 5.8"/>',
    quill: '<path d="M20 4c-6.5.5-11 4.6-12.6 11.4L6 20"/><path d="M20 4c.5 5.5-2.6 10.3-9.6 11.6"/><path d="M10.4 15.6 7.4 15.4"/>',
    medal: '<circle cx="12" cy="9.5" r="6"/><circle cx="12" cy="9.5" r="2.6"/><path d="m8.6 14.5-1.6 6 5-2.2 5 2.2-1.6-6"/>',
    stamp: '<path d="M9 13.5V9.8a3 3 0 1 1 6 0v3.7"/><path d="M5 13.5h14a1 1 0 0 1 1 1V17H4v-2.5a1 1 0 0 1 1-1Z"/><path d="M6 20.5h12"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-13"/><path d="M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.3-2.4 3.8"/><path d="M12 17.2h.01"/>',
    more: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0Z"/><circle cx="8" cy="8" r="1.3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    zap: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12Z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
    message: '<path d="M20 15.5a1.5 1.5 0 0 1-1.5 1.5H8.5L4 20.5V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 6Z"/>',
    telegram: '<path d="M21.2 4.6 3 11.4c-.8.3-.8 1.4 0 1.7l4.5 1.5 1.8 5.3c.2.6 1 .8 1.5.3l2.6-2.5 4.5 3.3c.6.4 1.4.1 1.6-.6l2.9-14.6c.1-.6-.6-1.2-1.2-.9Z"/><path d="m7.6 14.5 9.9-6.4-7.4 7.3"/>',
    wand: '<path d="m4 20 11-11"/><path d="m13.5 7.5 3 3"/><path d="M17 3v3M15.5 4.5h3"/><path d="M20 9v2M19 10h2"/><path d="M10 3.5v2M9 4.5h2"/>',
    cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5Z"/><path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11"/><path d="M21.5 9v5"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    dot: '<circle cx="12" cy="12" r="3"/>'
  };
  var ICON_ALIAS = {
    glossary: 'book', dictionary: 'book', lesson: 'book', lessons: 'book', tm: 'database', memory: 'database', qa: 'shield',
    academy: 'cap', practice: 'target', streak: 'flame', profile: 'user', notifications: 'bell', security: 'lock',
    appearance: 'palette', theme: 'palette', billing: 'card', shortcuts: 'keyboard', about: 'info', close: 'x', add: 'plus',
    next: 'arrow', right: 'chevron', 'chevron-right': 'chevron', projects: 'folder', project: 'folder', stats: 'chart',
    analytics: 'chart', review: 'shield', check2: 'check', warning: 'alert', error: 'alert', ok: 'check', seal: 'stamp',
    chat: 'message', bot: 'telegram', ai: 'sparkle', magic: 'wand', rank: 'medal', award: 'medal', time: 'clock', docs: 'file', document: 'file'
  };
  function icon(name, cls) {
    var n = ICONS[name] ? name : (ICON_ALIAS[name] || 'dot');
    return '<svg class="i i-' + esc(name) + (n === 'chevron' ? ' chev' : '') + (cls ? ' ' + esc(cls) : '') +
      '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICONS[n] + '</svg>';
  }
  function iconEl(name, cls) { return frag(icon(name, cls)); }
  /* göl — stepped carpet diamond (the brand mark; replaced the old 8-point star) */
  var STAR_PTS = '0,-19 4.22,-14.78 4.22,-11.61 7.39,-11.61 11.61,-7.39 11.61,-4.22 14.78,-4.22 19,0 14.78,4.22 11.61,4.22 11.61,7.39 7.39,11.61 4.22,11.61 4.22,14.78 0,19 -4.22,14.78 -4.22,11.61 -7.39,11.61 -11.61,7.39 -11.61,4.22 -14.78,4.22 -19,0 -14.78,-4.22 -11.61,-4.22 -11.61,-7.39 -7.39,-11.61 -4.22,-11.61 -4.22,-14.78';
  function logoSvg(cls) {
    return '<svg class="' + (cls || 'logo') + '" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false"><polygon class="l-star" points="' + STAR_PTS +
      '"/><polygon class="l-ring" points="0,-10 10,0 0,10 -10,0"/><polygon class="l-dot" points="0,-5 5,0 0,5 -5,0"/></svg>';
  }

  /* ------------------------------------------------------------------
     4. FORMATTING + REFERENCE DATA
     ------------------------------------------------------------------ */
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  var WEEKDAYS = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'];
  function groupInt(s) { return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }
  var fmt = {
    num: function (n, dec) {
      n = Number(n); if (!isFinite(n)) return '—';
      var neg = n < 0; n = Math.abs(n);
      var s = dec != null ? n.toFixed(dec) : String(Math.round(n * 100) / 100);
      var parts = s.split('.');
      return (neg ? '−' : '') + groupInt(parts[0]) + (parts[1] ? ',' + parts[1] : '');
    },
    money: function (n, cur) { return fmt.num(n, (Math.round(n) === n) ? 0 : 2) + '\u00A0' + (cur || '₼'); },
    pct: function (n, dec) { return fmt.num(n, dec) + '%'; },
    date: function (d, withDay) {
      d = d instanceof Date ? d : new Date(d); if (isNaN(d)) return '—';
      var s = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      return withDay ? s + ', ' + WEEKDAYS[d.getDay()] : s;
    },
    short: function (d) { d = d instanceof Date ? d : new Date(d); if (isNaN(d)) return '—'; return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); },
    time: function (d) { d = d instanceof Date ? d : new Date(d); if (isNaN(d)) return '—'; return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); },
    rel: function (d) {
      d = d instanceof Date ? d : new Date(d); if (isNaN(d)) return '—';
      var s = (Date.now() - d.getTime()) / 1000, f = s < 0; s = Math.abs(s);
      if (s < 60) return f ? 'bir azdan' : 'indicə';
      var m = Math.round(s / 60), hr = Math.round(s / 3600), dd = Math.round(s / 86400);
      if (m < 60) return m + ' dəq ' + (f ? 'sonra' : 'əvvəl');
      if (hr < 24) return hr + ' saat ' + (f ? 'sonra' : 'əvvəl');
      if (dd === 1) return f ? 'sabah' : 'dünən';
      if (dd < 7) return dd + ' gün ' + (f ? 'sonra' : 'əvvəl');
      return fmt.date(d);
    },
    words: function (n) { return fmt.num(n) + ' söz'; }
  };
  var LANGS = { az: 'Azərbaycan', en: 'İngilis', ru: 'Rus', tr: 'Türk' };
  var PAIRS = [
    { id: 'en-az', label: 'EN → AZ', name: 'İngilis → Azərbaycan' },
    { id: 'az-en', label: 'AZ → EN', name: 'Azərbaycan → İngilis' },
    { id: 'ru-az', label: 'RU → AZ', name: 'Rus → Azərbaycan' },
    { id: 'az-ru', label: 'AZ → RU', name: 'Azərbaycan → Rus' },
    { id: 'tr-az', label: 'TR → AZ', name: 'Türk → Azərbaycan' },
    { id: 'az-tr', label: 'AZ → TR', name: 'Azərbaycan → Türk' }
  ];
  function pairLabel(id) { var p = String(id || '').split('-'); return p.length === 2 ? upper(p[0]) + ' → ' + upper(p[1]) : String(id || ''); }
  function pairsShort(pairs) {
    var byT = {}, order = [];
    (pairs || []).forEach(function (p) { var a = String(p).split('-'); if (a.length !== 2) return; if (!byT[a[1]]) { byT[a[1]] = []; order.push(a[1]); } byT[a[1]].push(a[0].toUpperCase()); });
    return order.map(function (t) { return byT[t].join('/') + ' → ' + t.toUpperCase(); }).join(', ');
  }
  var REG_LABEL = { danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var REGISTERS = [
    { id: 'danisiq', label: 'Danışıq', hint: 'Dost, həmkar, sosial şəbəkə' },
    { id: 'neytral', label: 'Neytral', hint: 'İnterfeys, xəbər, təlimat' },
    { id: 'resmi', label: 'Rəsmi', hint: 'İşgüzar məktub, hesabat' },
    { id: 'huquqi', label: 'Hüquqi', hint: 'Müqavilə, qanun, etibarnamə' }
  ];
  function normReg(r) {
    var f = fold(r || '');
    if (!f || f === 'auto' || f === 'avto') return null;
    if (/^(danis|casual|informal|chat)/.test(f)) return 'danisiq';
    if (/^(neyt|neutr)/.test(f)) return 'neytral';
    if (/^(resm|formal|offic)/.test(f)) return 'resmi';
    if (/^(huq|legal|law)/.test(f)) return 'huquqi';
    return null;
  }
  var RANKS = [
    { name: 'Şagird', min: 0 }, { name: 'Katib', min: 400 }, { name: 'Münşi', min: 1200 },
    { name: 'Mirzə', min: 2500 }, { name: 'Dilmanc', min: 5000 }, { name: 'Ustad', min: 10000 }
  ];
  function rankOf(xp) {
    xp = Number(xp) || 0; var i = 0;
    for (var k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].min) i = k;
    var cur = RANKS[i], nx = RANKS[i + 1] || null;
    return {
      name: cur.name, index: i, min: cur.min, xp: xp, next: nx ? nx.min : null, nextName: nx ? nx.name : null,
      progress: nx ? clamp((xp - cur.min) / (nx.min - cur.min), 0, 1) : 1, toNext: nx ? nx.min - xp : 0
    };
  }
  var ELDERS = [
    { id: 'lugetci', name: 'Lüğətçi Mirzə', short: 'L', av: 'av-lacquer', role: 'Terminologiya', doing: 'Terminlər lüğətlə tutuşdurulur…', done: 'Terminlər lüğətə uyğundur' },
    { id: 'menaci', name: 'Mənaçı Mirzə', short: 'M', av: 'av-firuze', role: 'Məna və mənbə', doing: 'Məna mənbə ilə müqayisə olunur…', done: 'Məna itkisi yoxdur' },
    { id: 'uslubcu', name: 'Üslubçu Mirzə', short: 'Ü', av: 'av-nar', role: 'Üslub, söz sırası', doing: 'Üslub və söz sırası cilalanır…', done: 'Üslub ardıcıldır' },
    { id: 'dilci', name: 'Dilçi Nənə', short: 'D', av: 'av-benovse', role: 'Orfoqrafiya, türk formaları', doing: 'Orfoqrafiya və türk formaları yoxlanılır…', done: 'Ədəbi normaya uyğundur' },
    { id: 'mohurdar', name: 'Möhürdar Mirzə', short: 'M', av: 'av-zafaran', role: 'Rəqəm, ad, tarix, möhür', doing: 'Rəqəmlər, adlar və tarixlər yoxlanılır…', done: 'Möhür vuruldu' }
  ];
  var ELDER_BY_TYPE = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Söz sırası': 'Üslubçu Mirzə',
    'Ardıcıllıq': 'Üslubçu Mirzə', 'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə',
    'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə'
  };

  /* ------------------------------------------------------------------
     5. PROFILE
     ------------------------------------------------------------------ */
  /* A new user's real, empty profile: nothing invented, no plan/billing fields.
     memberSince is the first-run date, stored once (see firstRun()). */
  var PROFILE_DEFAULTS = {
    name: '', email: '', phone: '', telegram: '', role: '', city: '', school: '', bio: '',
    pairs: ['en-az'], specialties: [], avatarColor: 'av-firuze', rate: null, currency: 'AZN',
    memberSince: '', xp: 0, streak: 0, bestStreak: 0, dailyGoal: 30
  };
  /* Values the old demo profile ("Aysel") shipped with — scrubbed from stored data once. */
  var LEGACY_FAKE = {
    name: 'Aysel Məmmədova', email: 'aysel.mammadova@nuanza.az', phone: '+994 50 412 36 18', telegram: '@aysel_tercume',
    role: 'Freelance tərcüməçi', city: 'Bakı', school: 'Bakı Dövlət Universiteti · Tərcümə fakültəsi', memberSince: '2024-03-11'
  };
  function firstRun() {
    var d = store.get('firstRun', '');
    if (!d || isNaN(new Date(d).getTime())) { d = new Date().toISOString(); iset('firstRun', d); }
    return d;
  }
  function cleanStoredProfile() {
    if (store.get('profileClean', false)) return;
    var cur = store.get('profile', null);
    if (cur && typeof cur === 'object') {
      Object.keys(LEGACY_FAKE).forEach(function (k) { if (cur[k] === LEGACY_FAKE[k]) delete cur[k]; });
      if (typeof cur.bio === 'string' && /SOCAR|Kapital Bank|ADA Universiteti/.test(cur.bio)) delete cur.bio;
      ['plan', 'planPrice', 'planRenews'].forEach(function (k) { delete cur[k]; });
      iset('profile', cur);
    }
    iset('profileClean', true);
  }
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '';
    return upper((p[0].charAt(0) || '') + (p.length > 1 ? p[p.length - 1].charAt(0) : (p[0].charAt(1) || '')));
  }
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
  function profile() {
    cleanStoredProfile();
    var p = assign({}, PROFILE_DEFAULTS, store.get('profile', {}) || {});
    if (!p.memberSince) p.memberSince = firstRun();
    ['plan', 'planPrice', 'planRenews'].forEach(function (k) { delete p[k]; });
    p.name = String(p.name || '').trim();
    if (!Array.isArray(p.pairs) || !p.pairs.length) p.pairs = PROFILE_DEFAULTS.pairs.slice();
    var r = rankOf(p.xp);
    p.initials = initials(p.name); p.firstName = firstName(p.name);
    p.pairsLabel = pairsShort(p.pairs); p.rank = r.name; p.rankInfo = r;
    return p;
  }
  function setProfile(patch) {
    var cur = store.get('profile', {}) || {};
    assign(cur, patch || {});
    ['initials', 'firstName', 'pairsLabel', 'rank', 'rankInfo', 'plan', 'planPrice', 'planRenews'].forEach(function (k) { delete cur[k]; });
    iset('profile', cur);
    renderProfile();
    var p = profile();
    emit('profile', p);
    return p;
  }

  /* ------------------------------------------------------------------
     6. SHELL CSS (shell-only pieces not in app.css; tokens only)
     ------------------------------------------------------------------ */
  var cssDone = {};
  function css(id, text) {
    if (!id || cssDone[id] || D.getElementById('css-' + id)) { cssDone[id] = true; return; }
    cssDone[id] = true;
    var st = D.createElement('style'); st.id = 'css-' + id; st.textContent = String(text || '');
    /* After app.css in the cascade, so screen rules win over component rules of equal specificity. */
    (D.body || D.head || R).appendChild(st);
  }
  var SHELL_CSS = [
    '.screen[tabindex="-1"]:focus,.screen[tabindex="-1"]:focus-visible{outline:none}',
    '.dr-tools{flex:none;padding:6px 20px 2px 12px}',
    '.dr-search{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:0 8px 0 12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2);color:var(--soft);font:500 var(--fs-sm)/1 var(--f-body);text-align:left;cursor:pointer;transition:border-color var(--t-fast),color var(--t-fast),background var(--t-fast)}',
    '.dr-search svg{width:16px;height:16px}.dr-search .lbl{flex:1;min-width:0}',
    '.dr-search:hover{color:var(--ink);border-color:var(--line-2)}.dr-search:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.dr-nav.anim .dr-link,.dr-nav.anim .dr-grp{animation:rise .32s var(--ease-out) both;animation-delay:calc(var(--i,0) * 22ms)}',
    '.dr-profile .who .badge{display:inline-flex}.dr-profile .who .badge:empty{display:none}',
    '.avatar > svg.av-ic{width:56%;height:56%}',
    '.dr-profile.incomplete .who small{color:var(--firuze)}',
    '.shell-dock{position:relative;width:var(--dock);height:var(--dock);padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;',
    '  background:radial-gradient(circle at 35% 28%,color-mix(in srgb,var(--deep) 70%,var(--ivory)),var(--deep) 70%);',
    '  box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--firuze),var(--sh-2);transition:transform var(--t-base) var(--ease-spring)}',
    '.shell-dock svg{width:34px;height:34px;transition:transform .7s var(--ease-spring)}',
    '@media (hover:hover){.shell-dock:hover{transform:translateY(-2px) scale(1.04)}.shell-dock:hover svg{transform:rotate(45deg)}}',
    '.shell-dock:active{transform:scale(.94)}.shell-dock.bump{animation:medal-pop .6s var(--ease-spring)}',
    '.shell-dock-bubble{position:absolute;right:0;bottom:calc(100% + 12px);width:max-content;max-width:min(260px,calc(100vw - 32px));animation:toast-in .32s var(--ease-spring) both;transform-origin:100% 100%}',
    '.sheet-grab{position:relative;touch-action:none}.sheet-grab::before{content:"";position:absolute;inset:-12px -56px}',
    '@media (max-width:639px){.sheet-h{touch-action:none}}',
    '.sheet.dragging,.drawer.dragging{transition:none!important}',
    '.sheet-nz{display:flex;align-items:flex-end;gap:12px;padding:2px 0 10px}',
    '.sheet-nz-art{flex:none;width:84px;min-height:84px;display:grid;place-items:end center}',
    '.sheet-nz-art .medal{--size:64px}',
    '.sheet-nz .bubble{flex:1;min-width:0;max-width:none}',
    '.sheet-pal .sheet-b{padding-top:4px}',
    '.sheet-pal-list{display:grid;gap:2px;margin-top:12px}',
    '.sheet-pal-grp{padding:12px 10px 4px;font-size:.6875rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}',
    '.sheet-pal-it{display:flex;align-items:center;gap:12px;width:100%;min-height:50px;padding:6px 10px;border:0;border-radius:var(--r-md);background:none;color:var(--ink);text-align:left;font:500 var(--fs-base)/1.3 var(--f-body);cursor:pointer;transition:background var(--t-fast)}',
    '.sheet-pal-it .ic{width:34px;height:34px;border-radius:10px}.sheet-pal-it .ic svg{width:18px;height:18px}',
    '.sheet-pal-it .tx{flex:1;min-width:0}.sheet-pal-it small{display:block;color:var(--soft);font-size:var(--fs-xs);font-weight:400}',
    '.sheet-pal-it .end{display:flex;align-items:center;gap:6px;color:var(--faint)}.sheet-pal-it .end svg{width:16px;height:16px;opacity:0;transition:opacity var(--t-fast),transform var(--t-base) var(--ease-out)}',
    '.sheet-pal-it[aria-selected="true"],.sheet-pal-it:hover{background:var(--surface2)}',
    '.sheet-pal-it[aria-selected="true"] .end svg{opacity:1;transform:translateX(2px)}',
    '.sheet-pal-it:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.sheet-pal-empty{padding:28px 10px;text-align:center;color:var(--soft)}',
    '.sheet-job-res{display:grid;justify-items:center;gap:12px;text-align:center;padding:10px 0 4px;animation:rise .4s var(--ease-out) both}',
    '.sheet-job-res p{max-width:44ch;color:var(--soft)}',
    '.sheet-job .list-row .avatar{flex:none}',
    '.sheet-keys .list-row .end{gap:4px}',
    '.onb-skip{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));z-index:2}',
    '.onb-hero{position:relative;width:100%;display:grid;justify-items:center}',
    /* room above her head for the greeting bubble so it never sits on the star */
    '.onb-hero .onb-star{width:96px;height:96px;margin-bottom:30px}',
    '.onb-hero .onb-stage{position:relative;z-index:1;min-height:120px;align-items:end;transition:opacity var(--t-slow)}',
    '.onb-hero .onb-stage .nz{transition:width .35s var(--ease-out)}',
    '.onb-hero .onb-rug{margin-top:-22px}',
    '.onb-hero.small .onb-star{display:none}',
    /* smaller companion on later steps — sized via --nz-w (not zoom) so her speech bubble keeps a readable 14px */
    '.onb-hero.small .onb-stage{min-height:74px}',
    '.onb-hero.small .onb-stage .nz{--nz-w:min(150px,40vw)}',
    '.onb-hero.small .onb-rug{height:36px;width:min(240px,calc(100% - 24px));margin-top:-14px;animation:none}',
    '.onb-hero .medal{margin-bottom:10px}',
    '@media (max-height:760px){.onb-hero .onb-star{width:76px;height:76px;margin-bottom:24px}}',
    '.onb-host{width:100%}',
    '.onb-step .eyebrow{justify-content:center}',
    '.onb-field{width:100%;max-width:380px;text-align:left;justify-self:center}',
    '.onb-pairs{justify-content:center}',
    '.onb-err{color:var(--nar);font-size:var(--fs-sm);font-weight:500;min-height:1.4em}',
    '.onb-note{font-size:var(--fs-sm);color:var(--soft)}',
    '.shell-fallback .tiles{margin-top:4px}',
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}',
    '::view-transition-new(root){z-index:2}'
  ].join('\n');

  /* ------------------------------------------------------------------
     7. TOASTS
     ------------------------------------------------------------------ */
  var TOAST_IC = { ok: 'check', err: 'x', warn: 'alert', info: 'info' };
  function toastHost() {
    var host = $('.toasts');
    if (!host) { host = h('div', { class: 'toasts', 'aria-live': 'polite' }); D.body.appendChild(host); }
    return host;
  }
  function dismissToast(t) {
    if (!t || t._out) return; t._out = true; t.classList.add('out');
    later(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 230);
  }
  function toast(text, kind, opts) {
    if (text && typeof text === 'object' && !text.nodeType) { opts = text; text = opts.text || opts.title || ''; kind = opts.kind; }
    if (kind && typeof kind === 'object') { opts = kind; kind = opts.kind; }
    opts = opts || {}; kind = TOAST_IC[kind] ? kind : 'ok';
    var main = String(text == null ? '' : text), sub = opts.sub || null;
    if (!sub && main.indexOf('\n') > 0) { sub = main.slice(main.indexOf('\n') + 1); main = main.slice(0, main.indexOf('\n')); }
    var t;
    var act = opts.action ? h('button', {
      class: 't-act', type: 'button', text: opts.action.label || 'Bax',
      onclick: function (e) { e.stopPropagation(); try { if (opts.action.onClick) opts.action.onClick(); } catch (err) { log(err); } dismissToast(t); }
    }) : null;
    t = h('div', { class: 'toast ' + kind, role: kind === 'err' ? 'alert' : 'status' },
      h('span', { class: 't-ic', html: icon(opts.icon || TOAST_IC[kind]) }),
      h('span', { class: 't-tx' }, main, sub ? h('small', { text: sub }) : null),
      act);
    var host = toastHost();
    host.appendChild(t);
    var live = $$('.toast:not(.out)', host);
    if (live.length > 3) dismissToast(live[0]);
    var ms = opts.ms || (act ? 5200 : 3400);
    var timer = later(function () { dismissToast(t); }, ms);
    t.addEventListener('mouseenter', function () { clearTimeout(timer); });
    t.addEventListener('mouseleave', function () { clearTimeout(timer); timer = later(function () { dismissToast(t); }, 1600); });
    t.addEventListener('click', function () { dismissToast(t); });
    return { el: t, close: function () { dismissToast(t); } };
  }

  /* ------------------------------------------------------------------
     8. OVERLAYS — stack, scroll lock, focus trap, sheet, confirm
     ------------------------------------------------------------------ */
  var overlays = [];
  var drawerOpen = false, onb = null;
  function lockScroll() {
    var lock = overlays.length > 0 || (drawerOpen && !isDesktop());
    if (D.body) D.body.classList.toggle('no-scroll', lock);
  }
  function pushOverlay(o) { overlays.push(o); lockScroll(); }
  function popOverlay(o) { var i = overlays.indexOf(o); if (i >= 0) overlays.splice(i, 1); lockScroll(); }
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  function focusables(root) {
    return $$(FOCUSABLE, root).filter(function (el) {
      if (el.closest('[hidden],[inert]')) return false;
      var r = el.getClientRects(); return r.length > 0 || el === D.activeElement;
    });
  }
  function trapTab(root, e) {
    var f = focusables(root);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], a = D.activeElement;
    if (!root.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }
  function focusSoon(el) { if (!el) return; later(function () { try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } } }, 60); }
  function restoreFocus(el) { if (el && el.focus && D.contains(el)) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }

  var BTN_KIND = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger', neutral: '' };
  function btnClass(kind) { if (!kind) return 'btn'; if (String(kind).indexOf('btn-') === 0) return 'btn ' + kind; return 'btn ' + (BTN_KIND[kind] != null ? BTN_KIND[kind] : ''); }

  var ovSeq = 0;
  function enableSheetDrag(el, close) {
    var grab = $('.sheet-grab', el), head = $('.sheet-h', el);
    var y0 = null, dy = 0;
    function down(e) {
      if (W.innerWidth >= 640 || (e.button && e.button !== 0)) return;
      if (e.target.closest('button,a,input,select,textarea')) return;
      y0 = e.clientY; dy = 0; el.classList.add('dragging');
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    }
    function move(e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; }
    function up() {
      if (y0 === null) return; y0 = null;
      el.classList.remove('dragging'); el.style.transform = '';
      if (dy > 90) close();
    }
    [grab, head].forEach(function (t) {
      if (!t) return;
      t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move);
      t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
    });
  }
  function sheet(opts) {
    opts = opts || {};
    var id = 'sh' + (++ovSeq);
    var restore = D.activeElement;
    var closed = false;
    var scrim = h('div', { class: 'scrim top', 'aria-hidden': 'true' });
    var closeBtn = h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Bağla', html: icon('x') });
    var body = h('div', { class: 'sheet-b' });
    var b = opts.body;
    if (typeof b === 'string') body.appendChild(h('p', { class: 'muted', text: b }));
    else if (b) appendKids(body, [b]);
    var titleEl = h('h2', { id: id }, opts.title || 'Nuanza');
    var el = h('div', {
      class: 'sheet' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : ''),
      role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id
    }, h('div', { class: 'sheet-grab', 'aria-hidden': 'true' }), h('div', { class: 'sheet-h' }, titleEl, closeBtn), body);
    var api = {
      el: el, body: body, foot: null,
      close: function (r) { close(r); },
      setTitle: function (t) { titleEl.textContent = t; },
      setActions: function (actions) { setActions(actions); }
    };
    function setActions(actions) {
      if (api.foot && api.foot.parentNode) api.foot.parentNode.removeChild(api.foot);
      api.foot = null;
      if (!actions || !actions.length) return;
      var foot = h('div', { class: 'sheet-f' });
      actions.forEach(function (a) {
        if (!a) return;
        var btn = h('button', { class: btnClass(a.kind), type: 'button', disabled: !!a.disabled }, a.icon ? iconEl(a.icon) : null, a.label || 'OK');
        btn.addEventListener('click', function (e) {
          var r;
          try { r = a.onClick ? a.onClick(e, api) : undefined; } catch (err) { log(err); }
          if (r && typeof r.then === 'function') {
            btn.setAttribute('aria-busy', 'true');
            r.then(function (v) { btn.removeAttribute('aria-busy'); if (v !== false && !a.keepOpen) close(); },
              function (err) { btn.removeAttribute('aria-busy'); log(err); });
          } else if (r !== false && !a.keepOpen) close();
        });
        foot.appendChild(btn);
      });
      el.appendChild(foot); api.foot = foot;
    }
    setActions(opts.actions);
    var ov = { el: el, close: function () { close(); } };
    function close(result) {
      if (closed) return; closed = true;
      el.classList.remove('on'); scrim.classList.remove('on');
      popOverlay(ov);
      later(function () { if (el.parentNode) el.parentNode.removeChild(el); if (scrim.parentNode) scrim.parentNode.removeChild(scrim); }, 400);
      restoreFocus(restore);
      if (typeof opts.onClose === 'function') { try { opts.onClose(result); } catch (e) { log(e); } }
    }
    closeBtn.addEventListener('click', function () { close(); });
    scrim.addEventListener('click', function () { close(); });
    D.body.appendChild(scrim); D.body.appendChild(el);
    void el.offsetWidth;
    scrim.classList.add('on'); el.classList.add('on');
    pushOverlay(ov);
    enableSheetDrag(el, close);
    var auto = $('[autofocus]', body) || focusables(body)[0] || closeBtn;
    focusSoon(auto);
    return api;
  }

  function confirmDlg(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var id = 'dg' + (++ovSeq), restore = D.activeElement, done = false;
      var scrim = h('div', { class: 'scrim top', 'aria-hidden': 'true' });
      var cancel = h('button', { class: 'btn btn-ghost', type: 'button' }, opts.cancelLabel || 'Ləğv et');
      var ok = h('button', { class: 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary'), type: 'button' }, opts.okLabel || (opts.danger ? 'Sil' : 'Təsdiq et'));
      var el = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': id, 'aria-describedby': opts.text ? id + 't' : null },
        h('div', { class: 'dialog-ic' + (opts.danger ? ' danger' : ''), html: icon(opts.icon || (opts.danger ? 'alert' : 'help')) }),
        h('h2', { id: id }, opts.title || 'Əminsiniz?'),
        opts.text ? h('p', { id: id + 't' }, opts.text) : null,
        h('div', { class: 'dialog-f' }, cancel, ok));
      var ov = { el: el, close: function () { finish(false); } };
      function finish(v) {
        if (done) return; done = true;
        el.classList.remove('on'); scrim.classList.remove('on');
        popOverlay(ov);
        later(function () { if (el.parentNode) el.parentNode.removeChild(el); if (scrim.parentNode) scrim.parentNode.removeChild(scrim); }, 320);
        restoreFocus(restore);
        resolve(v);
      }
      ok.addEventListener('click', function () { finish(true); });
      cancel.addEventListener('click', function () { finish(false); });
      scrim.addEventListener('click', function () { finish(false); });
      D.body.appendChild(scrim); D.body.appendChild(el);
      void el.offsetWidth;
      scrim.classList.add('on'); el.classList.add('on');
      pushOverlay(ov);
      if (opts.danger) companion.set('worried', { ms: 1800 });
      focusSoon(opts.danger ? cancel : ok);
    });
  }

  /* ------------------------------------------------------------------
     9. SCORE RING
     ------------------------------------------------------------------ */
  function countUp(el, to, dur) {
    if (reducedMotion()) { el.textContent = String(to); return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e));
      if (p < 1) W.requestAnimationFrame(step);
    }
    W.requestAnimationFrame(step);
    later(function () { el.textContent = String(to); }, dur + 160);
  }
  function ring(value, label, sub, opts) {
    if (label && typeof label === 'object') { opts = label; label = opts.label; sub = opts.sub; }
    opts = opts || {};
    var v = clamp(Math.round(Number(value) || 0), 0, 100);
    var lbl = label == null ? 'bal' : String(label);
    var cls = 'ring' + (v < 60 ? ' low' : v < 80 ? ' mid' : '') + (opts.size ? ' ' + opts.size : '');
    var num = h('b', { class: 'tnum' }, reducedMotion() ? String(v) : '0');
    var r = h('div', { class: cls, style: '--v:' + v, role: 'img', 'aria-label': lbl + ': ' + v + (sub ? '. ' + sub : '') },
      frag('<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-orn" cx="60" cy="60" r="59" pathLength="100"/><circle class="ring-track" cx="60" cy="60" r="50" pathLength="100"/><circle class="ring-val" cx="60" cy="60" r="50" pathLength="100"/></svg>'),
      h('div', { class: 'ring-txt' }, num, h('span', { text: lbl })));
    var wrap = h('div', { class: 'ring-wrap' + (opts.cls ? ' ' + opts.cls : '') }, r, sub ? h('p', { class: 'ring-sub', text: sub }) : null);
    countUp(num, v, opts.duration || 1100);
    wrap.setValue = function (nv) {
      nv = clamp(Math.round(Number(nv) || 0), 0, 100);
      r.style.setProperty('--v', nv);
      r.classList.toggle('low', nv < 60); r.classList.toggle('mid', nv >= 60 && nv < 80);
      countUp(num, nv, 700);
    };
    return wrap;
  }

  /* ------------------------------------------------------------------
     10. FAKE AI — realistic mock engine
     ------------------------------------------------------------------ */
  /* 10.1 Parallel corpus (source → Azerbaijani per register) */
  var CORPUS = [
    /* Legal */
    { lang: 'en', dom: 'legal', src: 'The Contractor shall notify the Employer within 14 days.',
      t: { huquqi: 'Podratçı 14 gün ərzində Sifarişçini xəbərdar etməlidir.', neytral: 'Podratçı 14 gün ərzində Sifarişçiyə məlumat verməlidir.', danisiq: 'Podratçı 14 gün içində sifarişçiyə xəbər verməlidir.' },
      hl: 'Sifarişçi', conf: 'mid', note: '«Employer» FIDIC tipli müqavilələrdə «Sifarişçi» kimi verilir; «İşəgötürən» əmək münasibətləri üçündür.' },
    { lang: 'en', dom: 'legal', tm: 100, src: 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Azerbaijan.',
      t: { huquqi: 'Bu Müqavilə Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq tənzimlənir və şərh olunur.', neytral: 'Bu müqaviləyə Azərbaycan Respublikasının qanunları tətbiq olunur.', danisiq: 'Müqavilə Azərbaycan qanunlarına tabedir.' } },
    { lang: 'en', dom: 'legal', src: 'Any dispute arising out of or in connection with this Agreement shall be settled through negotiations.',
      t: { huquqi: 'Bu Müqavilədən irəli gələn və ya onunla bağlı hər hansı mübahisə danışıqlar yolu ilə həll edilir.', neytral: 'Müqavilə ilə bağlı mübahisələr danışıqlar yolu ilə həll olunur.', danisiq: 'Müqaviləyə görə mübahisə olsa, danışıb həll edəcəyik.' } },
    { lang: 'en', dom: 'legal', src: 'The total contract price shall not exceed AZN 1,250,000.',
      t: { huquqi: 'Müqavilənin ümumi qiyməti 1 250 000 (bir milyon iki yüz əlli min) manatdan artıq olmamalıdır.', neytral: 'Müqavilənin ümumi qiyməti 1 250 000 manatdan çox olmamalıdır.' },
      hl: '(bir milyon iki yüz əlli min)', conf: 'mid', note: 'Məbləğin sözlə yazılışı mənbədə yoxdur, hüquqi sənəddə isə tövsiyə olunur. Müştəri ilə razılaşdırın.' },
    { lang: 'en', dom: 'legal', tm: 100, src: 'Payment shall be made within thirty (30) days of receipt of a valid invoice.',
      t: { huquqi: 'Ödəniş etibarlı hesab-faktura alındıqdan sonra otuz (30) gün ərzində həyata keçirilir.', neytral: 'Ödəniş düzgün hesab-faktura alındıqdan sonra 30 gün ərzində edilir.', danisiq: 'Hesab-fakturanı alandan sonra 30 gün ərzində ödəyəcəyik.' } },
    { lang: 'en', dom: 'legal', src: "Either Party may terminate this Agreement by giving sixty (60) days' prior written notice to the other Party.",
      t: { huquqi: 'Tərəflərdən hər biri digər Tərəfə altmış (60) gün əvvəl yazılı bildiriş göndərməklə bu Müqaviləyə xitam verə bilər.', neytral: 'Tərəflərdən hər biri 60 gün əvvəl yazılı xəbərdarlıq etməklə müqaviləni dayandıra bilər.' },
      hl: 'xitam verə bilər', conf: 'mid', note: '«terminate»: «xitam vermək» və «ləğv etmək». Layihə lüğətində «xitam vermək» təsdiqlənib, sənəd boyu eyni saxlayın.' },
    { lang: 'en', dom: 'legal', src: 'The Supplier shall not be liable for any indirect or consequential damages.',
      t: { huquqi: 'Təchizatçı hər hansı dolayı və ya nəticə xarakterli zərərə görə məsuliyyət daşımır.', neytral: 'Təchizatçı dolayı zərərə görə cavabdeh deyil.' },
      hl: 'nəticə xarakterli zərərə', conf: 'mid', note: '«consequential damages» üçün sabit qarşılıq yoxdur; bəzi müqavilələrdə «dolayı zərər» ilə birləşdirilir.' },
    { lang: 'en', dom: 'legal', src: 'This Agreement shall enter into force on the date of its signature by both Parties.',
      t: { huquqi: 'Bu Müqavilə hər iki Tərəf tərəfindən imzalandığı gündən qüvvəyə minir.', neytral: 'Müqavilə hər iki tərəf imzaladığı gündən qüvvəyə minir.' } },
    { lang: 'en', dom: 'legal', src: 'Neither Party shall disclose any Confidential Information to third parties.',
      t: { huquqi: 'Tərəflərdən heç biri Məxfi Məlumatı üçüncü şəxslərə açıqlamamalıdır.', neytral: 'Tərəflər məxfi məlumatı üçüncü şəxslərə verməməlidir.', danisiq: 'Gizli məlumatı heç kimə deməməliyik.' } },
    { lang: 'en', dom: 'legal', src: 'Force majeure events shall include, but not be limited to, earthquakes, floods and wars.',
      t: { huquqi: 'Fors-major hallarına zəlzələ, daşqın və müharibə daxildir, lakin bunlarla məhdudlaşmır.', neytral: 'Fors-major hallarına, məsələn, zəlzələ, daşqın və müharibə aiddir.' } },
    { lang: 'en', dom: 'legal', src: 'The Employer shall provide the Contractor with access to the Site.',
      t: { huquqi: 'Sifarişçi Podratçının Tikinti meydançasına daxil olmasını təmin etməlidir.', neytral: 'Sifarişçi Podratçıya tikinti meydançasına giriş imkanı yaratmalıdır.' },
      hl: 'Tikinti meydançasına', conf: 'mid', note: '«Site» kontekstdən asılı olaraq «Tikinti meydançası» və ya «Obyekt» ola bilər.' },
    /* Finance / annual report */
    { lang: 'en', dom: 'finance', src: "In 2025, the Company's net profit increased by 12.4% compared to the previous year.",
      t: { resmi: '2025-ci ildə Şirkətin xalis mənfəəti əvvəlki illə müqayisədə 12,4% artmışdır.', neytral: '2025-ci ildə şirkətin xalis mənfəəti ötən ilə nisbətən 12,4% artıb.', danisiq: 'Şirkət 2025-ci ildə keçən ilə nisbətən 12,4% çox xalis qazanc əldə edib.' } },
    { lang: 'en', dom: 'finance', tm: 96, src: 'Total revenue amounted to AZN 3.8 billion.',
      t: { resmi: 'Ümumi gəlir 3,8 milyard manat təşkil etmişdir.', neytral: 'Ümumi gəlir 3,8 milyard manat olub.' } },
    { lang: 'en', dom: 'finance', src: 'Operating expenses decreased by 5% due to digitalisation.',
      t: { resmi: 'Rəqəmsallaşma hesabına əməliyyat xərcləri 5% azalmışdır.', neytral: 'Rəqəmsallaşma sayəsində əməliyyat xərcləri 5% azalıb.' } },
    { lang: 'en', dom: 'finance', src: 'The Board of Directors recommended a dividend of AZN 0.15 per share.',
      t: { resmi: 'Direktorlar Şurası hər səhm üzrə 0,15 manat dividend ödənilməsini tövsiyə etmişdir.', neytral: 'Direktorlar Şurası hər səhmə 0,15 manat dividend ödənilməsini təklif edib.' },
      hl: 'Direktorlar Şurası', conf: 'mid', note: 'Bəzi şirkətlərin nizamnaməsində «İdarə Heyəti» işlənir. Müştərinin rəsmi adını yoxlayın.' },
    { lang: 'en', dom: 'finance', src: 'Our actual costs were higher than planned.',
      t: { resmi: 'Faktiki xərclərimiz planlaşdırılandan yüksək olmuşdur.', neytral: 'Faktiki xərclərimiz planlaşdırılandan çox oldu.', danisiq: 'Əslində planlaşdırdığımızdan çox xərclədik.' },
      hl: 'Faktiki', conf: 'high', note: '«actual» — «faktiki», «aktual» deyil.' },
    { lang: 'en', dom: 'finance', src: 'The project will eventually be completed in the third quarter.',
      t: { resmi: 'Layihə nəticədə üçüncü rübdə başa çatdırılacaqdır.', neytral: 'Layihə sonda üçüncü rübdə tamamlanacaq.', danisiq: 'Layihə axırda üçüncü rübdə bitəcək.' },
      hl: 'nəticədə', conf: 'mid', note: '«eventually» — «sonda, nəticədə»; «ehtimal ki» mənasında işlənmir.' },
    /* Business letters */
    { lang: 'en', dom: 'letter', src: 'Dear Mr. Aliyev,',
      t: { resmi: 'Hörmətli cənab Əliyev,', neytral: 'Hörmətli cənab Əliyev,', danisiq: 'Salam, cənab Əliyev,' },
      hl: 'Əliyev', conf: 'high', note: 'Soyad Azərbaycan yazılışına qaytarıldı: Aliyev → Əliyev.' },
    { lang: 'en', dom: 'letter', src: 'We are pleased to inform you that your application has been approved.',
      t: { resmi: 'Müraciətinizin təsdiq edildiyini məmnuniyyətlə bildiririk.', neytral: 'Müraciətiniz təsdiq edildi.', danisiq: 'Şad xəbər: müraciətin təsdiqləndi!' } },
    { lang: 'en', dom: 'letter', src: 'Please find attached the signed copy of the contract.',
      t: { resmi: 'Müqavilənin imzalanmış nüsxəsi əlavə olunur.', neytral: 'İmzalanmış müqavilənin nüsxəsini əlavə edirik.', danisiq: 'İmzalı müqaviləni əlavə etdim.' } },
    { lang: 'en', dom: 'letter', tm: 100, src: 'Please do not hesitate to contact us should you have any questions.',
      t: { resmi: 'Hər hansı sualınız yaranarsa, bizimlə əlaqə saxlamaqdan çəkinməyin.', neytral: 'Sualınız olarsa, bizimlə əlaqə saxlayın.', danisiq: 'Sualın olsa, yaz, kömək edərik.' } },
    { lang: 'en', dom: 'letter', src: 'The meeting has been postponed until further notice.',
      t: { resmi: 'Görüş növbəti bildirişədək təxirə salınmışdır.', neytral: 'Görüş növbəti xəbərədək təxirə salındı.', danisiq: 'Görüş hələlik təxirə düşdü, sonra xəbər edəcəyik.' } },
    { lang: 'en', dom: 'letter', src: 'Thank you for your patience.',
      t: { resmi: 'Səbriniz üçün təşəkkür edirik.', neytral: 'Səbriniz üçün təşəkkür edirik.', danisiq: 'Səbr etdiyin üçün sağ ol!' } },
    { lang: 'en', dom: 'letter', src: 'We look forward to our continued cooperation.',
      t: { resmi: 'Əməkdaşlığımızın davam edəcəyinə ümid edirik.', neytral: 'Əməkdaşlığımızı davam etdirməyə şadıq.', danisiq: 'Birlikdə işləməyə davam edək!' } },
    { lang: 'en', dom: 'letter', src: 'Kind regards,', t: { resmi: 'Hörmətlə,', neytral: 'Hörmətlə,', danisiq: 'Salamlar,' } },
    /* Product / UI */
    { lang: 'en', dom: 'tech', src: 'Upload your document and Nuanza will detect the register automatically.',
      t: { neytral: 'Sənədinizi yükləyin — Nuanza üslubu avtomatik müəyyən edəcək.', danisiq: 'Sənədini yüklə, Nuanza üslubu özü tapacaq.', resmi: 'Sənədinizi yükləyin; Nuanza üslubu avtomatik müəyyənləşdirəcəkdir.' } },
    { lang: 'en', dom: 'tech', src: 'Click Save to apply the changes.',
      t: { neytral: 'Dəyişiklikləri tətbiq etmək üçün «Yadda saxla» düyməsini basın.', danisiq: 'Dəyişiklikləri saxlamaq üçün «Yadda saxla»nı bas.' } },
    { lang: 'en', dom: 'tech', src: 'Your translation is ready.', t: { neytral: 'Tərcüməniz hazırdır.', resmi: 'Tərcüməniz hazırdır.', danisiq: 'Tərcümən hazırdır!' } },
    { lang: 'en', dom: 'tech', src: 'Your password must contain at least 8 characters.', t: { neytral: 'Şifrəniz ən azı 8 simvoldan ibarət olmalıdır.', danisiq: 'Şifrən ən azı 8 simvol olmalıdır.' } },
    { lang: 'en', dom: 'tech', src: 'Sign in with Telegram', t: { neytral: 'Telegram ilə daxil olun', danisiq: 'Telegram ilə daxil ol' } },
    /* Tourism */
    { lang: 'en', dom: 'tourism', src: 'Baku is the capital of Azerbaijan.', t: 'Bakı Azərbaycanın paytaxtıdır.' },
    { lang: 'en', dom: 'tourism', src: 'The Old City is a UNESCO World Heritage Site.',
      t: { neytral: 'İçərişəhər UNESCO-nun Ümumdünya İrsi Siyahısına daxildir.', resmi: 'İçərişəhər UNESCO-nun Ümumdünya İrsi Siyahısına daxil edilmişdir.' },
      hl: 'İçərişəhər', conf: 'high', note: '«Old City» Bakı kontekstində xüsusi addır: «İçərişəhər».' },
    { lang: 'en', dom: 'tourism', src: "Don't miss the sunset over the Caspian Sea from the Boulevard.",
      t: { neytral: 'Dənizkənarı bulvardan Xəzər üzərində gün batımını qaçırmayın.', danisiq: 'Bulvardan Xəzərin üstündə gün batımına mütləq bax!' } },
    { lang: 'en', dom: 'tourism', src: 'The Carpet Museum building is shaped like a rolled carpet.', t: 'Xalça Muzeyinin binası bükülmüş xalça formasındadır.' },
    /* Casual */
    { lang: 'en', dom: 'chat', src: 'Hey, can you send me the file by tonight?',
      t: { danisiq: 'Salam, faylı bu axşama qədər göndərə bilərsən?', neytral: 'Faylı bu axşama qədər göndərə bilərsiniz?', resmi: 'Xahiş edirik, faylı bu axşamadək göndərəsiniz.' } },
    { lang: 'en', dom: 'chat', src: "No worries, I'll take care of it.",
      t: { danisiq: 'Narahat olma, özüm həll edərəm.', neytral: 'Narahat olmayın, bununla özüm məşğul olaram.', resmi: 'Narahat olmayın, məsələ həll ediləcək.' } },
    { lang: 'en', dom: 'chat', src: 'Thanks a lot!', t: { danisiq: 'Çox sağ ol!', neytral: 'Çox sağ olun!', resmi: 'Çox təşəkkür edirik!' } },
    { lang: 'en', dom: 'chat', src: "Let's meet at 6 near Fountain Square.",
      t: { danisiq: 'Saat 6-da Fəvvarələr meydanının yanında görüşək.', neytral: 'Saat 6-da Fəvvarələr meydanının yanında görüşək.', resmi: 'Görüşü saat 6-da Fəvvarələr meydanının yaxınlığında keçirməyi təklif edirik.' } },
    /* Medical */
    { lang: 'en', dom: 'medical', src: 'Store below 25°C.', t: '25°C-dən aşağı temperaturda saxlayın.' },
    { lang: 'en', dom: 'medical', src: 'Keep out of the reach of children.', t: 'Uşaqların əli çatmayan yerdə saxlayın.' },
    { lang: 'en', dom: 'medical', src: 'Take one tablet twice a day after meals.', t: 'Gündə iki dəfə yeməkdən sonra bir tablet qəbul edin.' },
    /* Russian */
    { lang: 'ru', dom: 'letter', src: 'Уважаемые коллеги!', t: { resmi: 'Hörmətli həmkarlar!', neytral: 'Hörmətli həmkarlar!', danisiq: 'Əziz həmkarlar!' } },
    { lang: 'ru', dom: 'legal', src: 'Настоящий Договор вступает в силу с момента его подписания.', t: { huquqi: 'Bu Müqavilə imzalandığı andan qüvvəyə minir.', neytral: 'Müqavilə imzalandığı andan qüvvəyə minir.' } },
    { lang: 'ru', dom: 'legal', src: 'Стороны обязуются соблюдать конфиденциальность.', t: { huquqi: 'Tərəflər məxfiliyə riayət etməyi öhdələrinə götürürlər.', neytral: 'Tərəflər məxfiliyi qorumağa söz verirlər.' } },
    { lang: 'ru', dom: 'legal', src: 'Срок поставки составляет 45 календарных дней.', t: { huquqi: 'Təchizat müddəti 45 təqvim günüdür.', neytral: 'Çatdırılma müddəti 45 təqvim günüdür.' },
      hl: 'Təchizat', conf: 'mid', note: '«поставка» müqavilədə «təchizat», logistikada «çatdırılma» kimi verilir.' },
    { lang: 'ru', dom: 'letter', src: 'Просим подтвердить получение данного письма.', t: { resmi: 'Bu məktubun alındığını təsdiq etməyinizi xahiş edirik.', neytral: 'Zəhmət olmasa, məktubu aldığınızı təsdiqləyin.' } },
    { lang: 'ru', dom: 'finance', src: 'Оплата производится в азербайджанских манатах.', t: { resmi: 'Ödəniş Azərbaycan manatı ilə həyata keçirilir.', neytral: 'Ödəniş manatla edilir.' } },
    /* Turkish */
    { lang: 'tr', dom: 'legal', src: 'Sözleşme imzalandığı tarihte yürürlüğe girer.', t: 'Müqavilə imzalandığı tarixdə qüvvəyə minir.',
      hl: 'qüvvəyə minir', conf: 'high', note: 'Türkcə «yürürlüğe girer» → Azərbaycan dilində «qüvvəyə minir».' },
    { lang: 'tr', dom: 'letter', src: "Toplantı yarın saat 10:00'da yapılacaktır.", t: 'İclas sabah saat 10:00-da keçiriləcək.',
      hl: 'keçiriləcək', conf: 'high', note: '«yapılacaktır» hərfən «ediləcək» deyil: iclas «keçirilir».' },
    { lang: 'tr', dom: 'finance', src: 'Ödeme fatura tarihinden itibaren 30 gün içinde yapılır.', t: 'Ödəniş hesab-faktura tarixindən etibarən 30 gün ərzində həyata keçirilir.' }
  ];
  var SAMPLES = {
    legal: "This Agreement shall be governed by and construed in accordance with the laws of the Republic of Azerbaijan. The Contractor shall notify the Employer within 14 days. Payment shall be made within thirty (30) days of receipt of a valid invoice. Either Party may terminate this Agreement by giving sixty (60) days' prior written notice to the other Party.",
    report: "In 2025, the Company's net profit increased by 12.4% compared to the previous year. Total revenue amounted to AZN 3.8 billion. Operating expenses decreased by 5% due to digitalisation. The Board of Directors recommended a dividend of AZN 0.15 per share.",
    letter: 'Dear Mr. Aliyev,\nWe are pleased to inform you that your application has been approved. Please find attached the signed copy of the contract. Please do not hesitate to contact us should you have any questions.\nKind regards,',
    casual: "Hey, can you send me the file by tonight? No worries, I'll take care of it. Thanks a lot!",
    tourism: "Baku is the capital of Azerbaijan. The Old City is a UNESCO World Heritage Site. Don't miss the sunset over the Caspian Sea from the Boulevard.",
    ru: 'Уважаемые коллеги!\nНастоящий Договор вступает в силу с момента его подписания. Срок поставки составляет 45 календарных дней. Оплата производится в азербайджанских манатах.',
    tr: "Sözleşme imzalandığı tarihte yürürlüğe girer. Toplantı yarın saat 10:00'da yapılacaktır."
  };

  /* 10.2 Glossary */
  var GLOSSARY = [
    { a: 'Agreement', b: 'Müqavilə', d: 'Hüquq', note: 'Müəyyən edilmiş termin — böyük hərflə' },
    { a: 'Contractor', b: 'Podratçı', d: 'Hüquq' },
    { a: 'Employer', b: 'Sifarişçi', d: 'Hüquq', note: 'FIDIC; əmək müqaviləsində «İşəgötürən»' },
    { a: 'Supplier', b: 'Təchizatçı', d: 'Hüquq' },
    { a: 'Party', b: 'Tərəf', d: 'Hüquq' },
    { a: 'Subcontractor', b: 'Subpodratçı', d: 'Hüquq' },
    { a: 'governing law', b: 'tətbiq olunan hüquq', d: 'Hüquq' },
    { a: 'force majeure', b: 'fors-major', d: 'Hüquq' },
    { a: 'terminate', b: 'xitam vermək', d: 'Hüquq', note: '«ləğv etmək» yox' },
    { a: 'liability', b: 'məsuliyyət', d: 'Hüquq' },
    { a: 'indemnify', b: 'zərərin əvəzini ödəmək', d: 'Hüquq' },
    { a: 'Confidential Information', b: 'Məxfi Məlumat', d: 'Hüquq' },
    { a: 'warranty', b: 'zəmanət', d: 'Hüquq' },
    { a: 'breach', b: 'pozuntu', d: 'Hüquq' },
    { a: 'invoice', b: 'hesab-faktura', d: 'Hüquq' },
    { a: 'prior written notice', b: 'əvvəlcədən yazılı bildiriş', d: 'Hüquq' },
    { a: 'dispute', b: 'mübahisə', d: 'Hüquq' },
    { a: 'arbitration', b: 'arbitraj', d: 'Hüquq' },
    { a: 'Site', b: 'Tikinti meydançası', d: 'Hüquq' },
    { a: 'net profit', b: 'xalis mənfəət', d: 'Maliyyə' },
    { a: 'revenue', b: 'gəlir', d: 'Maliyyə' },
    { a: 'operating expenses', b: 'əməliyyat xərcləri', d: 'Maliyyə' },
    { a: 'equity', b: 'kapital', d: 'Maliyyə' },
    { a: 'assets', b: 'aktivlər', d: 'Maliyyə' },
    { a: 'liabilities', b: 'öhdəliklər', d: 'Maliyyə' },
    { a: 'cash flow', b: 'pul vəsaitlərinin hərəkəti', d: 'Maliyyə' },
    { a: 'depreciation', b: 'amortizasiya', d: 'Maliyyə' },
    { a: 'dividend', b: 'dividend', d: 'Maliyyə' },
    { a: 'Board of Directors', b: 'Direktorlar Şurası', d: 'Maliyyə' },
    { a: 'fiscal year', b: 'maliyyə ili', d: 'Maliyyə' },
    { a: 'quarter', b: 'rüb', d: 'Maliyyə' },
    { a: 'production sharing agreement', b: 'hasilatın pay bölgüsü sazişi', d: 'Neft-qaz' },
    { a: 'upstream', b: 'kəşfiyyat və hasilat', d: 'Neft-qaz' },
    { a: 'offshore', b: 'dənizdə', d: 'Neft-qaz' },
    { a: 'well', b: 'quyu', d: 'Neft-qaz' },
    { a: 'pipeline', b: 'boru kəməri', d: 'Neft-qaz' },
    { a: 'crude oil', b: 'xam neft', d: 'Neft-qaz' },
    { a: 'Save', b: 'Yadda saxla', d: 'İnterfeys' },
    { a: 'Cancel', b: 'Ləğv et', d: 'İnterfeys' },
    { a: 'Settings', b: 'Ayarlar', d: 'İnterfeys' },
    { a: 'Sign in', b: 'Daxil ol', d: 'İnterfeys' },
    { a: 'Upload', b: 'Yüklə', d: 'İnterfeys' },
    { a: 'Dashboard', b: 'İdarə paneli', d: 'İnterfeys' },
    { a: 'Old City', b: 'İçərişəhər', d: 'Turizm', note: 'Xüsusi ad' },
    { a: 'Boulevard', b: 'Dənizkənarı bulvar', d: 'Turizm' },
    { a: 'side effects', b: 'əlavə təsirlər', d: 'Tibb' },
    { a: 'dosage', b: 'doza', d: 'Tibb' },
    { a: 'prescription', b: 'resept', d: 'Tibb' }
  ];

  /* 10.3 Language + register + domain detection */
  function detectLang(t) {
    t = String(t || '');
    if (/[\u0400-\u04FF]/.test(t)) return 'ru';
    if (/[əƏ]/.test(t)) return 'az';
    if (/[ğışçöüİĞŞÇÖÜ]/.test(t)) return /[xqXQ]/.test(t) ? 'az' : 'tr';
    if (/(^|\s)(ve|için|bir|ile|olarak|değil)(\s|$)/i.test(t)) return 'tr';
    return 'en';
  }
  var REG_CUES = {
    huquqi: ['shall', 'hereby', 'hereinafter', 'pursuant', 'governed', 'agreement', 'contractor', 'employer', 'party', 'parties', 'liable', 'liability', 'indemn', 'force majeure', 'terminate', 'clause', 'whereas', 'договор', 'стороны', 'настоящ', 'sözleşme', 'taraflar', 'yürürlüğe', 'müqavilə', 'tərəflər', 'öhdəlik'],
    resmi: ['dear', 'sincerely', 'regards', 'pleased', 'kindly', 'attached', 'hesitate', 'inform', 'application', 'board', 'annual', 'net profit', 'revenue', 'company', 'dividend', 'уважаем', 'просим', 'hörmətli', 'sayın', 'toplantı', 'bildiririk'],
    danisiq: ['hey', 'hi ', 'thanks', 'gonna', 'wanna', 'guys', 'cool', 'awesome', 'no worries', 'lol', 'btw', "let's", 'salam', 'привет', 'sağ ol', 'merhaba']
  };
  function detectRegister(text) {
    var s = ' ' + lower(text) + ' ';
    var sc = { huquqi: 0, resmi: 0, danisiq: 0, neytral: 0.8 }, reasons = [];
    Object.keys(REG_CUES).forEach(function (k) {
      REG_CUES[k].forEach(function (cue) { if (s.indexOf(cue) >= 0) { sc[k] += (k === 'huquqi' ? 1.2 : 1); if (reasons.length < 4) reasons.push({ reg: k, cue: cue.trim() }); } });
    });
    var ex = (s.match(/!/g) || []).length; if (ex) sc.danisiq += Math.min(ex, 3) * 0.5;
    var best = 'neytral'; Object.keys(sc).forEach(function (k) { if (sc[k] > sc[best]) best = k; });
    var total = sc.huquqi + sc.resmi + sc.danisiq + sc.neytral;
    return { id: best, label: REG_LABEL[best], confidence: Math.round(clamp(sc[best] / total, 0.42, 0.97) * 100) / 100, reasons: reasons.filter(function (r) { return r.reg === best; }) };
  }
  var DOMAINS = {
    legal: { label: 'Hüquq', purpose: 'Müqavilə öhdəliklərini hüquqi dəqiqliklə ötürmək', audience: 'Hüquq şöbəsi və qarşı tərəf', tone: 'Dəqiq, birmənalı' },
    finance: { label: 'Maliyyə', purpose: 'İllik nəticələri investorlara təqdim etmək', audience: 'İnvestorlar və idarə heyəti', tone: 'Rəsmi, faktlara əsaslanan' },
    letter: { label: 'İşgüzar yazışma', purpose: 'Müştəriyə rəsmi cavab vermək', audience: 'Müştəri və tərəfdaşlar', tone: 'Nəzakətli, rəsmi' },
    tech: { label: 'İnterfeys', purpose: 'Tətbiq mətnini lokallaşdırmaq', audience: 'Tətbiq istifadəçiləri', tone: 'Qısa, aydın' },
    tourism: { label: 'Turizm', purpose: 'Qonaqları Bakıya dəvət etmək', audience: 'Xarici turistlər', tone: 'İsti, canlı' },
    chat: { label: 'Gündəlik yazışma', purpose: 'Həmkarla tez razılaşmaq', audience: 'Komanda üzvü', tone: 'Səmimi' },
    medical: { label: 'Tibb', purpose: 'Dərmanın təhlükəsiz istifadəsini izah etmək', audience: 'Pasiyentlər', tone: 'Aydın, təlimat üslubu' },
    general: { label: 'Ümumi', purpose: 'Məlumatı aydın çatdırmaq', audience: 'Geniş auditoriya', tone: 'Neytral' }
  };
  var DOM_CUES = {
    legal: ['shall', 'agreement', 'contract', 'party', 'liable', 'договор', 'sözleşme', 'müqavilə', 'clause'],
    finance: ['profit', 'revenue', 'dividend', 'expenses', 'azn', 'billion', 'million', 'share', 'mənfəət', 'gəlir'],
    letter: ['dear', 'regards', 'sincerely', 'please find', 'уважаем', 'hörmətli'],
    tech: ['click', 'upload', 'password', 'sign in', 'settings', 'app', 'button'],
    tourism: ['baku', 'museum', 'old city', 'caspian', 'boulevard', 'sunset', 'bakı'],
    chat: ['hey', 'thanks', 'tonight', "let's", 'salam'],
    medical: ['tablet', 'dose', 'dosage', 'store below', 'children', 'side effects']
  };
  function detectDomain(text, hits) {
    var votes = {};
    (hits || []).forEach(function (d) { votes[d] = (votes[d] || 0) + 2; });
    var s = lower(text);
    Object.keys(DOM_CUES).forEach(function (k) { DOM_CUES[k].forEach(function (c) { if (s.indexOf(c) >= 0) votes[k] = (votes[k] || 0) + 1; }); });
    var best = 'general', bv = 0; Object.keys(votes).forEach(function (k) { if (votes[k] > bv) { bv = votes[k]; best = k; } });
    return best;
  }

  /* 10.4 Sentence handling + fuzzy lookup */
  var ABBR = /^(mr|mrs|ms|dr|no|st|art|co|ltd|inc|vs|e\.g|i\.e|cənab|г|ст|т\.е|т\.д|prof|jr|sr)\.$/i;
  function splitSentences(p) {
    var out = [], buf = '', toks = String(p).match(/\S+\s*/g) || [];
    toks.forEach(function (tok) {
      buf += tok;
      var core = tok.trim();
      if (/[.!?…]["»”')\]]*$/.test(core) && !ABBR.test(core) && !/^\d+\.$/.test(core)) { out.push(buf.trim()); buf = ''; }
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }
  function normS(s) { return lower(s).replace(/[«»"“”'’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function tokSet(s) { var o = {}; normS(s).split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
  function dice(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b); if (!ka.length || !kb.length) return 0;
    var inter = 0; ka.forEach(function (k) { if (b[k]) inter++; });
    return (2 * inter) / (ka.length + kb.length);
  }
  CORPUS.forEach(function (e) {
    e._n = normS(e.src); e._t = tokSet(e.src);
    e._v = typeof e.t === 'string' ? [e.t] : Object.keys(e.t).map(function (k) { return e.t[k]; });
    e._vn = e._v.map(normS); e._vt = e._v.map(tokSet);
  });
  var CHAIN = { huquqi: ['huquqi', 'resmi', 'neytral', 'danisiq'], resmi: ['resmi', 'huquqi', 'neytral', 'danisiq'], neytral: ['neytral', 'resmi', 'danisiq', 'huquqi'], danisiq: ['danisiq', 'neytral', 'resmi', 'huquqi'] };
  function variantFor(e, reg) {
    if (typeof e.t === 'string') return e.t;
    var ch = CHAIN[reg] || CHAIN.neytral;
    for (var i = 0; i < ch.length; i++) if (e.t[ch[i]]) return e.t[ch[i]];
    return e._v[0];
  }
  function lookup(s, from, to) {
    var n = normS(s), ts = tokSet(s), best = null;
    CORPUS.forEach(function (e) {
      if (to === 'az' && e.lang === from) {
        var sc = e._n === n ? 1 : dice(ts, e._t);
        if (!best || sc > best.score) best = { e: e, score: sc, dir: 'fwd' };
      } else if (from === 'az' && e.lang === to) {
        for (var i = 0; i < e._vn.length; i++) {
          var sc2 = e._vn[i] === n ? 1 : dice(ts, e._vt[i]);
          if (!best || sc2 > best.score) best = { e: e, score: sc2, dir: 'rev' };
        }
      }
    });
    return best;
  }
  /* numbers */
  var NUM_RE = /\d{1,3}(?:[ \u00A0\u202F]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*/g;
  function numsIn(text) {
    var out = [], m; NUM_RE.lastIndex = 0;
    while ((m = NUM_RE.exec(text))) {
      var prev = m.index > 0 ? text.charAt(m.index - 1) : '';
      if (prev && /\p{L}/u.test(prev)) continue;
      out.push({ raw: m[0], index: m.index });
    }
    return out;
  }
  function numVal(raw, style) {
    var s = String(raw).replace(/[ \u00A0\u202F]/g, '');
    if (style === 'en') return parseFloat(s.replace(/,/g, ''));
    var t = s.replace(/\.(?=\d{3}(\D|$))/g, '');
    if (t.indexOf('.') >= 0) return NaN;
    return parseFloat(t.replace(',', '.'));
  }
  function azNum(v, decimals) {
    if (!isFinite(v)) return '';
    var d = decimals != null ? decimals : ((String(v).split('.')[1] || '').length);
    var s = v.toFixed(d), p = s.split('.');
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (p[1] ? ',' + p[1] : '');
  }
  function decimalsOf(raw, style) {
    var s = String(raw).replace(/[ \u00A0\u202F]/g, '');
    var i = s.lastIndexOf(style === 'en' ? '.' : ',');
    return i < 0 ? 0 : s.length - i - 1;
  }
  function styleOf(lang) { return lang === 'en' ? 'en' : 'eu'; }
  function patchNumbers(t, oldSrc, newSrc, lang) {
    var a = numsIn(oldSrc), b = numsIn(newSrc), st = styleOf(lang), changed = false;
    if (a.length !== b.length || !a.length) return { t: t, changed: false };
    a.forEach(function (na, i) {
      var va = numVal(na.raw, st), vb = numVal(b[i].raw, st);
      if (va === vb || !isFinite(vb)) return;
      var fa = azNum(va, decimalsOf(na.raw, st)), fb = azNum(vb, decimalsOf(b[i].raw, st));
      if (t.indexOf(fa) >= 0) { t = t.replace(fa, fb); changed = true; }
      else if (t.indexOf(String(va)) >= 0) { t = t.replace(String(va), fb); changed = true; }
    });
    return { t: t, changed: changed };
  }
  function glossHits(text, limit) {
    var s = ' ' + lower(text) + ' ', out = [];
    GLOSSARY.forEach(function (g) {
      var re = new RegExp('(^|[^\\p{L}])' + reEsc(lower(g.a)) + '(?=$|[^\\p{L}])', 'u');
      if (re.test(s) && out.length < (limit || 10)) out.push({ a: g.a, b: g.b, domain: g.d, note: g.note, enforced: true });
    });
    return out;
  }

  /* 10.5 translate */
  var QUESTIONS = {
    legal: [{ q: '«Employer» üçün hansı termin işlənsin?', options: ['Sifarişçi', 'İşəgötürən'], why: 'FIDIC tipli müqavilələrdə «Sifarişçi» qəbul olunub.' },
      { q: 'Məbləğlər sözlə də yazılsın?', options: ['Bəli, mötərizədə', 'Xeyr, yalnız rəqəmlə'], why: 'Hüquqi sənəddə sözlə yazılış mübahisə riskini azaldır.' }],
    finance: [{ q: 'Valyuta necə göstərilsin?', options: ['manat', 'AZN', '₼'], why: 'Müştərinin illik hesabat üslubuna uyğunlaşdırırıq.' },
      { q: 'Şirkətin adı necə yazılsın?', options: ['«Şirkət» (böyük hərflə)', 'Tam rəsmi ad'], why: 'Mənbədə «the Company» müəyyən edilmiş termindir.' }],
    letter: [{ q: 'Müraciət forması?', options: ['Siz (rəsmi)', 'Sən (səmimi)'], why: 'Mənbədə «Dear Mr.» var — adətən rəsmi «Siz».' }],
    tech: [{ q: 'Düymə adları dırnaqda verilsin?', options: ['«Yadda saxla»', 'Yadda saxla'], why: 'Interfeys elementləri «» içində daha aydın görünür.' }],
    tourism: [{ q: 'Yer adları necə verilsin?', options: ['Yerli ad (İçərişəhər)', 'Tərcümə (Köhnə şəhər)'], why: 'Turist yerli işarələri görəcək.' }],
    chat: [{ q: 'Müraciət: «sən» yoxsa «siz»?', options: ['sən', 'siz'], why: 'Mənbə səmimidir, amma alıcını tanımırıq.' }],
    medical: [{ q: 'Təlimat forması?', options: ['Əmr forması (saxlayın)', 'Təsviri (saxlanılır)'], why: 'Dərman təlimatlarında əmr forması qəbul olunub.' }],
    general: [{ q: 'Mətn kim üçündür?', options: ['Müştəri', 'Daxili istifadə', 'Geniş ictimaiyyət'], why: 'Üslubu dəqiqləşdirmək üçün.' }]
  };
  function spansFor(t, e, conf, note) {
    if (e && e.hl && t.indexOf(e.hl) >= 0) {
      var i = t.indexOf(e.hl), out = [];
      if (i > 0) out.push({ t: t.slice(0, i), confidence: 'high' });
      out.push({ t: e.hl, confidence: e.conf || 'mid', note: e.note });
      if (i + e.hl.length < t.length) out.push({ t: t.slice(i + e.hl.length), confidence: 'high' });
      return out;
    }
    return [{ t: t, confidence: conf, note: note }];
  }
  function translateSentence(s, from, to, reg) {
    var hit = lookup(s, from, to), seg = { src: s };
    if (hit && hit.score >= 0.999) {
      if (hit.dir === 'fwd') {
        var t = variantFor(hit.e, reg), hl = hit.e.hl && t.indexOf(hit.e.hl) >= 0;
        seg.t = t; seg.confidence = hl ? (hit.e.conf || 'mid') : 'high';
        if (hl && hit.e.note) seg.note = hit.e.note;
        if (hit.e.tm) seg.tm = hit.e.tm;
        seg.spans = spansFor(t, hit.e, seg.confidence, seg.note);
      } else {
        seg.t = hit.e.src; seg.confidence = 'high'; seg.spans = [{ t: seg.t, confidence: 'high' }];
      }
      seg.dom = hit.e.dom;
    } else if (hit && hit.score >= 0.6) {
      var pct = Math.round(hit.score * 100);
      var base = hit.dir === 'fwd' ? variantFor(hit.e, reg) : hit.e.src;
      var patched = hit.dir === 'fwd' ? patchNumbers(base, hit.e.src, s, from) : { t: base, changed: false };
      seg.t = patched.t; seg.tm = pct; seg.dom = hit.e.dom;
      seg.confidence = pct >= 75 ? 'mid' : 'low';
      seg.note = 'Tərcümə yaddaşı: ' + pct + '% uyğunluq («' + hit.e.src + '»).' + (patched.changed ? ' Rəqəmlər avtomatik yeniləndi.' : '') + ' Fərqləri yoxlayın.';
      seg.spans = [{ t: seg.t, confidence: seg.confidence, note: seg.note }];
    } else {
      var gh = glossHits(s, 4);
      seg.t = s; seg.confidence = 'low';
      seg.note = 'Prototip yalnız nümunə mətnləri tərcümə edir — bu cümlə korpusda yoxdur.' + (gh.length ? ' Tanınan terminlər: ' + gh.map(function (g) { return g.a + ' → ' + g.b; }).join(', ') + '.' : '');
      seg.spans = [{ t: s, confidence: 'low', note: seg.note }];
    }
    return seg;
  }
  function aiTranslate(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = String(inp.text || inp.src || inp.source || '').trim();
    var demo = false;
    if (!text) { text = SAMPLES.legal; demo = true; }
    var pair = inp.pair ? String(inp.pair).split('-') : null;
    var from = inp.from || detectLang(text);
    var to = inp.to || (pair && pair[1]) || (from === 'az' ? 'en' : 'az');
    if (from !== 'az' && to !== 'az') to = 'az';
    if (to === from) to = from === 'az' ? 'en' : 'az';
    var det = detectRegister(text), req = normReg(inp.register), reg = req || det.id;
    var paras = text.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var segs = [], doms = [];
    paras.forEach(function (p, pi) {
      splitSentences(p).forEach(function (s) { var g = translateSentence(s, from, to, reg); g.para = pi; segs.push(g); if (g.dom) doms.push(g.dom); });
    });
    var outParas = [];
    segs.forEach(function (g, i) {
      g.n = i + 1;
      (outParas[g.para] = outParas[g.para] || []).push(g.t);
      var nx = segs[i + 1];
      var sep = !nx ? '' : (nx.para !== g.para ? '\n\n' : ' ');
      if (sep) { g.t += sep; if (g.spans && g.spans.length) g.spans[g.spans.length - 1].t += sep; }
    });
    var outText = outParas.filter(Boolean).map(function (a) { return a.join(' '); }).join('\n\n');
    var dom = detectDomain(text, doms), D0 = DOMAINS[dom];
    var cnt = { high: 0, mid: 0, low: 0 }, tmHits = 0;
    segs.forEach(function (g) { cnt[g.confidence] = (cnt[g.confidence] || 0) + 1; if (g.tm) tmHits++; });
    return {
      text: outText, register: REG_LABEL[reg], registerId: reg, detected: det.label, detectedId: det.id, auto: !req,
      registerConfidence: det.confidence, from: from, to: to, pair: from + '-' + to, pairLabel: pairLabel(from + '-' + to),
      segments: segs,
      situation: { domain: D0.label, purpose: D0.purpose, audience: D0.audience, register: REG_LABEL[reg], tone: D0.tone },
      terms: from === 'en' ? glossHits(text, 8) : [],
      questions: (QUESTIONS[dom] || QUESTIONS.general).slice(0, 2),
      stats: { words: countWords(text), outWords: countWords(outText), segments: segs.length, high: cnt.high, mid: cnt.mid, low: cnt.low, tm: tmHits },
      demo: demo
    };
  }

  /* 10.6 check (review a translation) */
  var TR_FORMS = [
    ['için', 'üçün'], ['tarafından', 'tərəfindən'], ['şirket', 'şirkət'], ['şirketin', 'şirkətin'], ['şirkete', 'şirkətə'], ['olarak', 'olaraq'],
    ['gerekir', 'lazımdır'], ['gerekli', 'lazımi'], ['gerekiyor', 'lazımdır'], ['değil', 'deyil'], ['ve', 'və'], ['ile', 'ilə'], ['ise', 'isə'],
    ['bilgi', 'məlumat'], ['bilgiler', 'məlumatlar'], ['sözleşme', 'müqavilə'], ['sözleşmenin', 'müqavilənin'], ['ödeme', 'ödəniş'],
    ['müşteri', 'müştəri'], ['teslim', 'təhvil'], ['tedarikçi', 'təchizatçı'], ['fatura', 'hesab-faktura'], ['toplantı', 'iclas'],
    ['lütfen', 'zəhmət olmasa'], ['teşekkürler', 'təşəkkürlər'], ['teşekkür', 'təşəkkür'], ['sayın', 'hörmətli'], ['evet', 'bəli'],
    ['hayır', 'xeyr'], ['şimdi', 'indi'], ['çok', 'çox'], ['önemli', 'vacib'], ['ilgili', 'müvafiq'], ['kurum', 'qurum'], ['belge', 'sənəd'],
    ['belgeler', 'sənədlər'], ['tarih', 'tarix'], ['taraf', 'tərəf'], ['taraflar', 'tərəflər'], ['madde', 'maddə'], ['rapor', 'hesabat'],
    ['yıl', 'il'], ['yılı', 'ili'], ['içinde', 'ərzində'], ['itibaren', 'etibarən'], ['yürürlüğe', 'qüvvəyə'], ['hesap', 'hesab'],
    ['kullanıcı', 'istifadəçi'], ['güncelleme', 'yeniləmə'], ['ayrıca', 'həmçinin'], ['ancak', 'lakin'], ['hizmet', 'xidmət'],
    ['ürün', 'məhsul'], ['ürünler', 'məhsullar'], ['fiyat', 'qiymət'], ['çalışan', 'işçi'], ['yapılır', 'həyata keçirilir'], ['yapılacak', 'keçiriləcək']
  ];
  var RU_FORMS = [['kompaniya', 'şirkət'], ['doqovor', 'müqavilə'], ['dogovor', 'müqavilə'], ['zakaz', 'sifariş'], ['spravka', 'arayış'], ['naçalnik', 'rəis'], ['ştraf', 'cərimə'], ['otçot', 'hesabat'], ['podpis', 'imza']];
  var PLEO = [['geri qaytar', 'qaytar'], ['ən optimal', 'optimal'], ['həmçinin də', 'həmçinin'], ['yuxarı qalx', 'qalx'], ['aşağı en', 'en'], ['ilk debüt', 'debüt'], ['təhvil etməlidir', 'təhvil verməlidir'], ['təhvil etmək', 'təhvil vermək'], ['təhvil edir', 'təhvil verir'], ['iclas ediləcək', 'iclas keçiriləcək'], ['iclas edilir', 'iclas keçirilir']];
  var ORTHO = [['mügavilə', 'müqavilə'], ['muqavile', 'müqavilə'], ['tesdiq', 'təsdiq'], ['tərcumə', 'tərcümə'], ['tercume', 'tərcümə'], ['hormetli', 'hörmətli'], ['xaiş', 'xahiş'], ['mütəxəsis', 'mütəxəssis'], ['məsuliyət', 'məsuliyyət'], ['məsuliyyet', 'məsuliyyət'], ['mənfət', 'mənfəət'], ['kecirilir', 'keçirilir'], ['muellim', 'müəllim'], ['azərbaycan', 'Azərbaycan'], ['bakı', 'Bakı'], ['bakıya', 'Bakıya'], ['bakıda', 'Bakıda']];
  var TERM_CHECK = [
    { en: 'employer', az: ['sifarişçi'], wrong: ['işəgötürən'], b: 'Sifarişçi' },
    { en: 'contractor', az: ['podratçı'], wrong: ['kontraktor', 'müqaviləçi'], b: 'Podratçı' },
    { en: 'supplier', az: ['təchizatçı'], wrong: ['tədarükçü', 'tedarikçi', 'göndərən'], b: 'Təchizatçı' },
    { en: 'invoice', az: ['hesab-faktura', 'hesab faktura'], wrong: ['invoys', 'faktura', 'qaimə'], b: 'hesab-faktura' },
    { en: 'net profit', az: ['xalis mənfəət'], wrong: ['təmiz gəlir', 'xalis gəlir', 'təmiz mənfəət'], b: 'xalis mənfəət' },
    { en: 'force majeure', az: ['fors-major', 'fors major'], wrong: ['qeyri-adi hal', 'qarşısıalınmaz qüvvə'], b: 'fors-major' },
    { en: 'agreement', az: ['müqavilə', 'saziş'], wrong: ['razılaşma'], b: 'Müqavilə' },
    { en: 'confidential information', az: ['məxfi məlumat'], wrong: ['gizli məlumat', 'gizli informasiya'], b: 'Məxfi Məlumat' },
    { en: 'revenue', az: ['gəlir'], wrong: ['mədaxil', 'qazanc'], b: 'gəlir' },
    { en: 'terminate', az: ['xitam', 'ləğv'], wrong: [], b: 'xitam vermək' },
    { en: 'liable', az: ['məsuliyyət'], wrong: ['cavabdeh'], b: 'məsuliyyət daşımaq' }
  ];
  var WEIGHT = { 'Türk forması': 6, 'Rəqəm': 12, 'Termin': 7, 'Məna': 15, 'Orfoqrafiya': 4, 'Üslub': 3, 'Durğu': 2, 'Ad': 6, 'Tarix': 8, 'Söz sırası': 4, 'Ardıcıllıq': 4, 'Boş seqment': 12 };
  var SEV = { 'Türk forması': 'mid', 'Rəqəm': 'high', 'Termin': 'mid', 'Məna': 'high', 'Orfoqrafiya': 'mid', 'Üslub': 'low', 'Durğu': 'low', 'Ad': 'mid', 'Tarix': 'high', 'Ardıcıllıq': 'mid', 'Boş seqment': 'high' };
  var TYPE_NOUN = { 'Türk forması': 'türk forması', 'Rəqəm': 'rəqəm səhvi', 'Termin': 'termin', 'Məna': 'məna riski', 'Orfoqrafiya': 'orfoqrafiya səhvi', 'Üslub': 'üslub qeydi', 'Durğu': 'durğu qeydi', 'Ad': 'ad', 'Tarix': 'tarix', 'Ardıcıllıq': 'ardıcıllıq qeydi', 'Boş seqment': 'boş seqment' };
  function gradeOf(s) { return s >= 90 ? 'Əla' : s >= 80 ? 'Yaxşı' : s >= 70 ? 'Orta' : s >= 60 ? 'Zəif' : 'Yenidən işlənməli'; }
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }
  function findPhrase(text, phrase) {
    var re = new RegExp('(^|[^\\p{L}])(' + reEsc(lower(phrase)) + ')(?=$|[^\\p{L}])', 'u');
    var m = re.exec(lower(text));
    if (!m) return null;
    var idx = m.index + m[1].length;
    return text.substr(idx, m[2].length);
  }
  function matchCase(was, now) { return was && upper(was.charAt(0)) === was.charAt(0) && lower(was.charAt(0)) !== was.charAt(0) ? cap(now) : now; }
  var DEMO_CHECK = {
    src: 'The Supplier shall deliver 250 units to Baku by 15 March 2026. Payment shall be made within thirty (30) days of receipt of a valid invoice.',
    tgt: 'Tedarikçi 15 Mart 2026 tarixinədək Bakıya 205 ədəd məhsul təhvil etməlidir. Ödəniş etibarlı invoys alındıqdan sonra otuz (30) gün içinde həyata keçirilir.'
  };
  function aiCheck(inp) {
    if (typeof inp === 'string') inp = { tgt: inp };
    inp = inp || {};
    var src = String(inp.src || inp.source || '').trim();
    var tgt = String(inp.tgt || inp.target || inp.translation || inp.text || '').trim();
    var demo = false;
    if (!src && !tgt) { src = DEMO_CHECK.src; tgt = DEMO_CHECK.tgt; demo = true; }
    var from = inp.from || (src ? detectLang(src) : 'en');
    var to = inp.to || (tgt ? detectLang(tgt) : 'az');
    if (tgt && to !== 'az' && /[ğışçöü]/i.test(tgt) && from !== 'az') to = 'az';
    var errors = [];
    function add(e) {
      if (errors.some(function (x) { return lower(x.was) === lower(e.was) && x.was !== '—'; })) return;
      e.severity = e.severity || SEV[e.type] || 'mid';
      e.elder = ELDER_BY_TYPE[e.type] || 'Mənaçı Mirzə';
      errors.push(e);
    }
    if (!tgt) {
      add({ was: '—', now: 'Tərcüməni daxil edin', type: 'Məna', why: 'Tərcümə mətni boşdur.', severity: 'high' });
    } else {
      if (to === 'az') {
        TR_FORMS.forEach(function (p) { var w = findPhrase(tgt, p[0]); if (w) add({ was: w, now: matchCase(w, p[1]), type: 'Türk forması', why: '«' + p[0] + '» türk dilinə məxsusdur; Azərbaycan ədəbi dilində «' + p[1] + '» işlənir.' }); });
        RU_FORMS.forEach(function (p) { var w = findPhrase(tgt, p[0]); if (w) add({ was: w, now: matchCase(w, p[1]), type: 'Üslub', why: '«' + p[0] + '» rus mənşəli danışıq formasıdır; yazılı mətndə «' + p[1] + '».' }); });
        PLEO.forEach(function (p) { var w = findPhrase(tgt, p[0]); if (w) add({ was: w, now: matchCase(w, p[1]), type: 'Üslub', why: '«' + p[0] + '» əvəzinə «' + p[1] + '» — daha təbii söz birləşməsi.' }); });
        ORTHO.forEach(function (p) {
          var w = findPhrase(tgt, p[0]);
          if (w && w !== p[1]) add({ was: w, now: p[1].charAt(0) === upper(p[1].charAt(0)) ? p[1] : matchCase(w, p[1]), type: 'Orfoqrafiya', why: p[1].charAt(0) === upper(p[1].charAt(0)) ? 'Xüsusi ad böyük hərflə yazılır.' : 'Düzgün yazılış: «' + p[1] + '».' });
        });
        var mm = /(\d{1,2})\s+(Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avqust|Sentyabr|Oktyabr|Noyabr|Dekabr)(?![\p{L}])/u.exec(tgt);
        if (mm) add({ was: mm[1] + ' ' + mm[2], now: mm[1] + ' ' + lower(mm[2]), type: 'Orfoqrafiya', why: 'Ay adları cümlə ortasında kiçik hərflə yazılır.' });
        if (countWords(tgt) >= 8 && !/[əƏ]/.test(tgt)) add({ was: '«ə» yoxdur', now: '«ə» hərfini bərpa edin', type: 'Orfoqrafiya', why: 'Mətndə bir dəfə də «ə» işlənməyib — klaviatura düzümünü yoxlayın.', severity: 'high' });
        if (/(^|\s)aktual/i.test(tgt) && /\bactual/i.test(src)) add({ was: findPhrase(tgt, 'aktual') || 'aktual', now: 'faktiki', type: 'Termin', why: '«actual» — «faktiki»; «aktual» isə «gündəmdə olan» deməkdir.', severity: 'high' });
        var q = /"([^"]{1,60})"/.exec(tgt);
        if (q) add({ was: q[0], now: '«' + q[1] + '»', type: 'Durğu', why: 'Azərbaycan mətnində «» dırnaqları işlənir.' });
        var sp = /\s([,.;:!?])/.exec(tgt);
        if (sp) add({ was: sp[0], now: sp[1], type: 'Durğu', why: 'Durğu işarəsindən əvvəl boşluq qoyulmur.' });
        var dbl = /(\S+) {2,}(\S+)/.exec(tgt);
        if (dbl) add({ was: dbl[0], now: dbl[1] + ' ' + dbl[2], type: 'Durğu', why: 'Artıq boşluq.' });
        if (src && (detectRegister(src).id === 'huquqi' || detectRegister(src).id === 'resmi')) {
          var inf = findPhrase(tgt, 'sağ ol') || findPhrase(tgt, 'sən') || findPhrase(tgt, 'sənə') || findPhrase(tgt, 'bilərsən');
          if (inf) add({ was: inf, now: inf === 'sağ ol' ? 'təşəkkür edirik' : 'siz', type: 'Üslub', why: 'Mənbə rəsmidir, tərcümədə «sən» müraciəti və danışıq ifadəsi işlənib.' });
        }
      }
      if (src) {
        var srcSt = styleOf(from), seen = {};
        var tn = numsIn(tgt).map(function (n) { return { raw: n.raw, eu: numVal(n.raw, 'eu'), en: numVal(n.raw, 'en') }; });
        numsIn(src).forEach(function (n) {
          var v = numVal(n.raw, srcSt); if (!isFinite(v) || seen[v]) return; seen[v] = 1;
          var ok = tn.some(function (x) { return x.eu === v; });
          if (ok) return;
          var enHit = tn.filter(function (x) { return x.en === v; })[0];
          if (enHit && to === 'az') { add({ was: enHit.raw, now: azNum(v, decimalsOf(n.raw, srcSt)), type: 'Durğu', why: 'Azərbaycan dilində onluq kəsr vergüllə, minliklər boşluqla ayrılır.' }); return; }
          var swap = tn.filter(function (x) { return String(x.raw).replace(/\D/g, '').split('').sort().join('') === String(n.raw).replace(/\D/g, '').split('').sort().join(''); })[0];
          if (swap) add({ was: swap.raw, now: azNum(v, decimalsOf(n.raw, srcSt)), type: 'Rəqəm', why: 'Mənbədə «' + n.raw + '», tərcümədə «' + swap.raw + '» — rəqəmlərin yeri dəyişib.', severity: 'high' });
          else add({ was: '—', now: azNum(v, decimalsOf(n.raw, srcSt)), type: 'Rəqəm', why: 'Mənbədəki «' + n.raw + '» tərcümədə tapılmadı.', severity: 'high' });
        });
        if (from === 'en' && to === 'az') {
          var ls = lower(src), lt = lower(tgt);
          TERM_CHECK.forEach(function (tc) {
            if (!new RegExp('(^|[^\\p{L}])' + reEsc(tc.en), 'u').test(ls)) return;
            if (tc.az.some(function (a) { return lt.indexOf(a) >= 0; })) return;
            var wrong = null;
            tc.wrong.forEach(function (w) { if (!wrong) wrong = findPhrase(tgt, w) || (lt.indexOf(w) >= 0 ? tgt.substr(lt.indexOf(w), w.length) : null); });
            add({ was: wrong || '—', now: tc.b, type: 'Termin', why: 'Layihə lüğətinə görə «' + tc.en + '» → «' + tc.b + '».', severity: wrong ? 'mid' : 'low' });
          });
        }
        var ratio = tgt.length / Math.max(1, src.length);
        if (src.length > 40 && ratio < 0.5) add({ was: '…', now: 'Buraxılan hissəni tərcümə edin', type: 'Məna', why: 'Tərcümə mənbədən xeyli qısadır — cümlə və ya hissə buraxılmış ola bilər.', severity: 'high' });
        else if (src.length > 40 && ratio > 2.3) add({ was: '…', now: 'Artıq əlavələri çıxarın', type: 'Məna', why: 'Tərcümə mənbədən xeyli uzundur — mənbədə olmayan məlumat əlavə edilib.', severity: 'mid' });
      }
    }
    var pen = 0; errors.forEach(function (e) { pen += WEIGHT[e.type] || 4; });
    var score = !tgt ? 0 : clamp(Math.round(100 - pen - (hash(tgt) % 3)), 35, 99);
    if (!errors.length && tgt) score = clamp(96 + (hash(tgt) % 4), 0, 99);
    var order = { high: 0, mid: 1, low: 2 };
    errors.sort(function (a, b) { return order[a.severity] - order[b.severity]; });
    var counts = {}; errors.forEach(function (e) { counts[e.type] = (counts[e.type] || 0) + 1; });
    var summary;
    if (!tgt) summary = 'Tərcümə boşdur — yoxlamaq üçün mətn daxil edin.';
    else if (!errors.length) summary = 'Ciddi səhv tapılmadı. Terminlər, rəqəmlər və ədəbi norma qaydasındadır.';
    else {
      summary = errors.length + ' düzəliş: ' + Object.keys(counts).map(function (k) { return counts[k] + ' ' + TYPE_NOUN[k]; }).join(', ') + '.';
      if (counts['Rəqəm']) summary += ' Rəqəm səhvini mütləq düzəldin — məbləğ və kəmiyyət fərqi hüquqi risk yaradır.';
      else if (counts['Türk forması']) summary += ' Türk formaları mətnə «tərcümə qoxusu» verir — Dilçi Nənə onları qeyd etdi.';
      else if (counts['Termin']) summary += ' Lüğətə uyğunluq müştərinin əsas tələbidir.';
    }
    var fixed = tgt;
    errors.forEach(function (e) { if (e.was && e.was !== '—' && e.was !== '…' && e.was.indexOf('«ə»') < 0 && fixed.indexOf(e.was) >= 0) fixed = fixed.replace(e.was, e.now); });
    var elders = ELDERS.map(function (el) {
      var mine = errors.filter(function (e) { return e.elder === el.name; });
      return { id: el.id, name: el.name, ok: !mine.length, count: mine.length, text: mine.length ? mine.length + ' qeyd: ' + mine.map(function (e) { return '«' + e.was + '» → «' + e.now + '»'; }).slice(0, 2).join('; ') : el.done };
    });
    var g = gradeOf(score);
    return {
      score: score, grade: g, summary: summary, errors: errors, fixed: fixed, src: src, tgt: tgt, from: from, to: to,
      counts: counts, elders: elders, demo: demo,
      verdict: { score: score, text: summary, seal: sealOf(score), grade: g }
    };
  }

  /* 10.7 QA (whole project) */
  var QA_POOL = [
    { type: 'Rəqəm', severity: 'high', seg: 14, src: 'The total contract price shall not exceed AZN 1,250,000.', tgt: 'Müqavilənin ümumi qiyməti 1 205 000 manatdan artıq olmamalıdır.', was: '1 205 000', now: '1 250 000', text: 'Məbləğ mənbə ilə üst-üstə düşmür — rəqəmlərin yeri dəyişib.' },
    { type: 'Termin', severity: 'high', seg: 31, src: 'The Employer shall provide access to the Site.', tgt: 'İşəgötürən Tikinti meydançasına girişi təmin etməlidir.', was: 'İşəgötürən', now: 'Sifarişçi', text: 'Layihə lüğətinə görə «Employer» → «Sifarişçi» (sənəddə 3 yerdə fərqlidir).' },
    { type: 'Tarix', severity: 'mid', seg: 22, src: 'The works shall be completed by 15 March 2026.', tgt: 'İşlər 15.03.2025 tarixinədək başa çatdırılmalıdır.', was: '15.03.2025', now: '15 mart 2026-cı il', text: 'İl səhvdir; müştərinin üslub bələdçisinə görə tarix sözlə yazılır.' },
    { type: 'Türk forması', severity: 'mid', seg: 18, src: 'signed by the authorised representatives of the Parties', tgt: 'Tərəflərin səlahiyyətli nümayəndələri tarafından imzalanır', was: 'tarafından', now: 'tərəfindən', text: '«tarafından» türk formasıdır.' },
    { type: 'Ad', severity: 'mid', seg: 7, src: 'Mr. Rashad Huseynov, Chief Financial Officer', tgt: 'cənab Raşad Guseynov, Maliyyə direktoru', was: 'Raşad Guseynov', now: 'Rəşad Hüseynov', text: 'Ad rus transliterasiyasından keçib — Azərbaycan yazılışına qaytarın.' },
    { type: 'Boş seqment', severity: 'high', seg: 45, src: 'Annex 2 forms an integral part of this Agreement.', tgt: '', was: '—', now: 'Əlavə 2 bu Müqavilənin ayrılmaz hissəsidir.', text: 'Seqment tərcümə edilməyib.' },
    { type: 'Ardıcıllıq', severity: 'mid', seg: 27, src: 'Either Party may terminate this Agreement…', tgt: '…bu Müqaviləni ləğv edə bilər.', was: 'ləğv edə bilər', now: 'xitam verə bilər', text: '«terminate» 9-cu seqmentdə «xitam vermək», burada «ləğv etmək» kimi verilib — birini seçin.' },
    { type: 'Durğu', severity: 'low', seg: 12, src: 'Net profit increased by 12.4%.', tgt: 'Xalis mənfəət 12.4% artıb.', was: '12.4%', now: '12,4%', text: 'Onluq kəsr Azərbaycan dilində vergüllə yazılır.' },
    { type: 'Türk forması', severity: 'low', seg: 40, src: 'all necessary documents', tgt: 'bütün gerekli sənədlər', was: 'gerekli', now: 'lazımi', text: '«gerekli» Azərbaycan ədəbi dilinə aid deyil.' },
    { type: 'Rəqəm', severity: 'mid', seg: 52, src: 'within thirty (30) days', tgt: 'otuz (3) gün ərzində', was: '(3)', now: '(30)', text: 'Mötərizədəki rəqəm sözlə yazılışa uyğun gəlmir.' },
    { type: 'Termin', severity: 'low', seg: 60, src: 'Force majeure', tgt: 'Qeyri-adi hallar', was: 'Qeyri-adi hallar', now: 'Fors-major halları', text: 'Lüğətdə «fors-major» təsdiqlənib.' },
    { type: 'Ad', severity: 'low', seg: 3, src: 'UNESCO', tgt: 'Unesco', was: 'Unesco', now: 'UNESCO', text: 'Abreviatura böyük hərflərlə yazılır.' },
    { type: 'Durğu', severity: 'low', seg: 66, src: 'the "Effective Date"', tgt: '"Qüvvəyəminmə tarixi"', was: '"Qüvvəyəminmə tarixi"', now: '«Qüvvəyəminmə tarixi»', text: 'Azərbaycan mətnində «» dırnaqları işlənir.' },
    { type: 'Ardıcıllıq', severity: 'low', seg: 70, src: 'this Agreement', tgt: 'bu müqavilə', was: 'müqavilə', now: 'Müqavilə', text: 'Müəyyən edilmiş termin bütün sənəddə böyük hərflə yazılır.' }
  ];
  var QA_CHECKS = [
    { key: 'numbers', label: 'Rəqəmlər', types: ['Rəqəm'] }, { key: 'names', label: 'Adlar', types: ['Ad'] },
    { key: 'dates', label: 'Tarixlər', types: ['Tarix'] }, { key: 'terms', label: 'Terminlər', types: ['Termin'] },
    { key: 'turkish', label: 'Türk formaları', types: ['Türk forması', 'Orfoqrafiya'] }, { key: 'consistency', label: 'Ardıcıllıq', types: ['Ardıcıllıq', 'Üslub'] },
    { key: 'punct', label: 'Durğu', types: ['Durğu'] }, { key: 'complete', label: 'Tamlıq', types: ['Boş seqment', 'Məna'] }
  ];
  function projName(p) { if (!p) return 'Nümunə layihə'; if (typeof p === 'string') return p; return p.name || p.title || 'Layihə'; }
  function aiQA(inp) {
    inp = inp || {};
    var issues;
    var proj = inp.project || inp;
    var name = projName(inp.project || (inp.name || inp.title ? inp : null));
    var segTotal = (proj && (proj.segments || proj.segs)) || 214;
    if (typeof segTotal !== 'number') segTotal = Array.isArray(segTotal) ? segTotal.length : 214;
    if (inp.src && inp.tgt) {
      var c = aiCheck({ src: inp.src, tgt: inp.tgt });
      issues = c.errors.map(function (e, i) { return { id: 'q' + (i + 1), type: e.type, severity: e.severity, seg: i + 1, src: inp.src, tgt: inp.tgt, was: e.was, now: e.now, fix: e.now, text: e.why, elder: e.elder }; });
    } else {
      var hsh = hash(name), extra = QA_POOL.slice(4).filter(function (q, i) { return ((hsh >> (i % 16)) & 1) === 1 || i < 2; });
      issues = QA_POOL.slice(0, 4).concat(extra.slice(0, 5)).map(function (q, i) {
        return assign({ id: 'q' + (i + 1), fix: q.now, elder: ELDER_BY_TYPE[q.type] }, q, { seg: Math.min(q.seg, segTotal) });
      });
    }
    var ord = { high: 0, mid: 1, low: 2 };
    issues.sort(function (a, b) { return ord[a.severity] - ord[b.severity] || a.seg - b.seg; });
    var pen = 0; issues.forEach(function (q) { pen += q.severity === 'high' ? 5 : q.severity === 'mid' ? 3 : 1; });
    var score = clamp(100 - pen, 40, 99);
    var counts = {}; issues.forEach(function (q) { counts[q.type] = (counts[q.type] || 0) + 1; });
    var checks = QA_CHECKS.map(function (c2) {
      var n = issues.filter(function (q) { return c2.types.indexOf(q.type) >= 0; }).length;
      return { key: c2.key, label: c2.label, issues: n, ok: n === 0 };
    });
    var high = issues.filter(function (q) { return q.severity === 'high'; }).length;
    var summary = '«' + name + '»: ' + segTotal + ' seqment yoxlandı, ' + issues.length + ' qeyd' + (high ? ', ' + high + ' kritik.' : ', kritik səhv yoxdur.') +
      (high ? ' Təhvildən əvvəl kritik qeydləri bağlayın.' : ' Təhvilə hazırdır.');
    return {
      score: score, grade: gradeOf(score), summary: summary, project: name, segments: segTotal, checked: segTotal,
      issues: issues, counts: counts, checks: checks, verdict: { score: score, text: summary, seal: sealOf(score), grade: gradeOf(score) }
    };
  }

  /* 10.8 terms */
  var DOMAIN_ALIAS = { legal: 'Hüquq', huquq: 'Hüquq', finance: 'Maliyyə', maliyye: 'Maliyyə', oil: 'Neft-qaz', 'neft-qaz': 'Neft-qaz', neft: 'Neft-qaz', tech: 'İnterfeys', ui: 'İnterfeys', interfeys: 'İnterfeys', tourism: 'Turizm', turizm: 'Turizm', medical: 'Tibb', tibb: 'Tibb' };
  function aiTerms(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = String(inp.text || inp.src || '');
    var hits = text ? glossHits(text, 16) : [];
    if (hits.length >= 3) return hits.map(function (g) { return assign({ count: Math.max(1, (lower(text).split(lower(g.a)).length - 1)) }, g); });
    var want = DOMAIN_ALIAS[fold(inp.domain || '')] || (text ? DOMAINS[detectDomain(text)].label : 'Hüquq');
    var list = GLOSSARY.filter(function (g) { return g.d === want; });
    if (list.length < 4) list = GLOSSARY.filter(function (g) { return g.d === 'Hüquq'; });
    return hits.concat(list.filter(function (g) { return !hits.some(function (x) { return x.a === g.a; }); }).slice(0, 8 - hits.length).map(function (g) {
      return { a: g.a, b: g.b, domain: g.d, note: g.note, suggested: true };
    }));
  }

  /* 10.9 lessons, cards, grading */
  var LESSONS = [
    { id: 'false-friends', title: 'Yalançı dostlar: «actual», «eventually», «sympathetic»', topic: 'Leksika', level: 'B1–B2', minutes: 6, xp: 30,
      intro: 'Bəzi ingilis sözləri Azərbaycan dilindəki sözlərə oxşayır, amma mənası başqadır. Tərcüməçilər onlara «yalançı dostlar» deyir.',
      rule: 'Oxşar səslənən sözü görəndə dayanın və mənanı kontekstdən yoxlayın: lüğətə yox, cümləyə baxın.',
      examples: [
        { src: 'Our actual costs were higher than planned.', tgt: 'Faktiki xərclərimiz planlaşdırılandan yüksək olub.', note: '«actual» — «faktiki, həqiqi»; «aktual» isə «gündəmdə olan» deməkdir.' },
        { src: 'The project will eventually succeed.', tgt: 'Layihə sonda uğur qazanacaq.', note: '«eventually» — «sonda, axırda»; «ehtimal ki» deyil.' },
        { src: 'She was very sympathetic to our situation.', tgt: 'O, vəziyyətimizə böyük anlayışla yanaşdı.', note: '«sympathetic» — «anlayışlı, rəğbətli»; «simpatik» (xoşagələn) deyil.' }],
      pitfalls: [{ wrong: 'Aktual xərclər', right: 'Faktiki xərclər', why: '«Aktual» — «hazırda vacib olan».' },
        { wrong: 'Simpatik münasibət', right: 'Anlayışlı münasibət', why: '«Simpatik» xarici görünüşə aiddir.' },
        { wrong: 'Ehtimal ki, layihə bitəcək', right: 'Sonda layihə bitəcək', why: '«Eventually» ehtimal yox, nəticə bildirir.' }],
      quiz: [
        { q: '«The actual figures differ from the forecast.» — «actual» necə tərcümə olunur?', options: ['aktual', 'faktiki', 'müasir', 'ehtimal olunan'], answer: 1, explain: '«Faktiki rəqəmlər proqnozdan fərqlənir.»' },
        { q: '«Eventually, the parties reached an agreement.»', options: ['Ehtimal ki, tərəflər razılığa gəldi.', 'Nəhayət, tərəflər razılığa gəldilər.', 'Təsadüfən tərəflər razılaşdı.'], answer: 1, explain: '«Eventually» — «nəhayət, sonda».' },
        { q: 'Hansı cümlədə «aktual» düzgün işlənib?', options: ['Bu mövzu bu gün çox aktualdır.', 'Aktual xərclər artıb.', 'Aktual tarix 5 maydır.'], answer: 0, explain: '«Aktual» — «hazırda vacib, gündəmdə olan».' }],
      task: { src: 'The actual delivery date was 12 May 2026.', model: 'Faktiki təhvil tarixi 12 may 2026-cı il olub.', hints: ['«actual» — faktiki', 'Ay adı kiçik hərflə: 12 may'] },
      summary: 'Oxşar söz — oxşar məna demək deyil. Hər dəfə kontekstə baxın.' },
    { id: 'turkish-forms', title: 'Türk formalarından qaçmaq', topic: 'Ədəbi norma', level: 'A2–C1', minutes: 5, xp: 25,
      intro: 'Türk dili ilə yaxınlıq tərcüməçiyə həm kömək edir, həm də tələ qurur. «için», «tarafından», «şirket» kimi formalar Azərbaycan ədəbi dilinə aid deyil.',
      rule: 'Türk mənbədən tərcümə edərkən tanış görünən hər sözü yoxlayın: Azərbaycan qarşılığı çox vaxt səs və yazı baxımından fərqlidir.',
      examples: [
        { src: 'Sözleşme taraflar tarafından imzalanmıştır.', tgt: 'Müqavilə tərəflər tərəfindən imzalanmışdır.', note: '«tarafından» → «tərəfindən», «sözleşme» → «müqavilə».' },
        { src: 'Toplantı yarın yapılacak.', tgt: 'İclas sabah keçiriləcək.', note: 'İclas «edilmir», «keçirilir».' },
        { src: 'Bilgi için bize yazın.', tgt: 'Məlumat üçün bizə yazın.', note: '«bilgi» → «məlumat», «için» → «üçün».' }],
      pitfalls: [{ wrong: 'Şirket hesabatı', right: 'Şirkət hesabatı', why: '«ə» hərfi itməməlidir.' },
        { wrong: '30 gün içinde', right: '30 gün ərzində', why: 'Rəsmi mətndə «ərzində».' },
        { wrong: 'Gerekli sənədlər', right: 'Lazımi sənədlər', why: '«gerekli» türk formasıdır.' }],
      quiz: [
        { q: '«Ödeme 30 gün içinde yapılır.» — düzgün tərcümə:', options: ['Ödeme 30 gün içində yapılır.', 'Ödəniş 30 gün ərzində həyata keçirilir.', 'Ödəmə 30 gündə edilir.'], answer: 1, explain: '«ödeme» → «ödəniş», «yapılır» → «həyata keçirilir».' },
        { q: 'Hansı söz türk formasıdır?', options: ['tərəfindən', 'üçün', 'şirket', 'məlumat'], answer: 2, explain: 'Düzgünü: «şirkət».' },
        { q: '«Sayın Müdür» müraciəti necə olmalıdır?', options: ['Sayın Direktor', 'Hörmətli Direktor', 'Dəyərli Müdür'], answer: 1, explain: 'Rəsmi müraciət: «Hörmətli…».' }],
      task: { src: 'Lütfen gerekli belgeleri yarına kadar gönderin.', model: 'Zəhmət olmasa, lazımi sənədləri sabaha qədər göndərin.', hints: ['lütfen → zəhmət olmasa', 'gerekli → lazımi', 'belge → sənəd'] },
      summary: 'Türk forması tutmaq üçün sözün «ə», «x», «q» ilə Azərbaycan variantını xatırlayın.' },
    { id: 'legal-shall', title: 'Müqavilədə «shall»', topic: 'Hüquqi tərcümə', level: 'B2–C1', minutes: 7, xp: 35,
      intro: '«Shall» hüquqi ingilis dilində gələcək zaman yox, öhdəlik bildirir. Azərbaycan dilində bu, adətən «-malı/-məli» şəkilçisi və ya indiki zamanla verilir.',
      rule: 'Öhdəlik → «-malıdır/-məlidir». Tərif, qüvvəyə minmə kimi hüquqi faktlar → indiki zaman («qüvvəyə minir»).',
      examples: [
        { src: 'The Contractor shall notify the Employer within 14 days.', tgt: 'Podratçı 14 gün ərzində Sifarişçini xəbərdar etməlidir.', note: 'Öhdəlik: «etməlidir».' },
        { src: 'This Agreement shall enter into force upon signature.', tgt: 'Bu Müqavilə imzalandığı andan qüvvəyə minir.', note: 'Fakt: indiki zaman, «qüvvəyə minəcək» yox.' },
        { src: 'The Supplier shall not be liable for indirect damages.', tgt: 'Təchizatçı dolayı zərərə görə məsuliyyət daşımır.', note: 'İnkar: «daşımamalıdır» yox, «daşımır».' }],
      pitfalls: [{ wrong: 'Podratçı xəbərdar edəcək', right: 'Podratçı xəbərdar etməlidir', why: '«shall» öhdəlikdir, proqnoz deyil.' },
        { wrong: 'Müqavilə qüvvəyə minəcəkdir', right: 'Müqavilə qüvvəyə minir', why: 'Hüquqi faktlar indiki zamanla verilir.' }],
      quiz: [
        { q: '«The Buyer shall pay the price within 10 days.»', options: ['Alıcı qiyməti 10 gün ərzində ödəyəcək.', 'Alıcı qiyməti 10 gün ərzində ödəməlidir.', 'Alıcı qiyməti 10 günə ödəyə bilər.'], answer: 1, explain: 'Öhdəlik — «ödəməlidir».' },
        { q: '«This Agreement shall be governed by the laws of Azerbaijan.»', options: ['…qanunları ilə tənzimlənəcək.', '…qanunvericiliyi ilə tənzimlənir.', '…qanunlarına tabe olmalıdır.'], answer: 1, explain: 'Fakt — indiki zaman.' }],
      task: { src: 'The Seller shall deliver the goods by 1 June 2026.', model: 'Satıcı malları 1 iyun 2026-cı il tarixinədək təhvil verməlidir.', hints: ['shall deliver → təhvil verməlidir', 'by → tarixinədək'] },
      summary: '«Shall» = öhdəlik. Gələcək zaman yalnız həqiqətən proqnoz olanda.' },
    { id: 'register', title: 'Üslub: Danışıqdan Hüquqiyə', topic: 'Üslub', level: 'A2–B2', minutes: 5, xp: 25,
      intro: 'Eyni fikir dörd üslubda fərqli səslənir. Nuanza üslubu avtomatik tanıyır, amma son qərarı tərcüməçi verir.',
      rule: 'Kim oxuyacaq? Nə üçün? Bu iki sual üslubu müəyyən edir. «Sən/siz» müraciəti üslubun ilk göstəricisidir.',
      examples: [
        { src: 'Can you send the file by tonight?', tgt: 'Danışıq: «Faylı bu axşama qədər göndərə bilərsən?» · Neytral: «Faylı bu axşama qədər göndərə bilərsiniz?» · Rəsmi: «Xahiş edirik, faylı bu axşamadək göndərəsiniz.»', note: 'Üslub artdıqca cümlə uzanır və müraciət formalaşır.' },
        { src: 'Thanks a lot!', tgt: 'Danışıq: «Çox sağ ol!» · Rəsmi: «Çox təşəkkür edirik!»', note: 'Rəsmi mətndə təşəkkür birinci şəxsin cəmi ilə verilir.' }],
      pitfalls: [{ wrong: 'Hörmətli müştəri, sağ ol!', right: 'Hörmətli müştəri, təşəkkür edirik!', why: 'Rəsmi müraciətlə danışıq ifadəsi qarışmamalıdır.' }],
      quiz: [
        { q: 'Bank müştərisinə məktub hansı üslubda olmalıdır?', options: ['Danışıq', 'Neytral', 'Rəsmi', 'Hüquqi'], answer: 2, explain: 'İşgüzar yazışma — rəsmi üslub.' },
        { q: '«Thanks a lot!» — dosta mesajda:', options: ['Çox təşəkkür edirik!', 'Çox sağ ol!', 'Minnətdarlığımızı bildiririk.'], answer: 1, explain: 'Danışıq üslubu: «Çox sağ ol!».' }],
      task: { src: 'We are pleased to inform you that your application has been approved.', model: 'Müraciətinizin təsdiq edildiyini məmnuniyyətlə bildiririk.', hints: ['Rəsmi üslub', '«məmnuniyyətlə bildiririk»'] },
      summary: 'Üslub = oxucu + məqsəd. Bir mətndə üslubu qarışdırmayın.' },
    { id: 'numbers', title: 'Rəqəm, tarix və valyuta', topic: 'Lokallaşdırma', level: 'A2–B1', minutes: 4, xp: 20,
      intro: 'Rəqəm səhvi ən bahalı səhvdir. Azərbaycan dilində onluq kəsr vergüllə, minliklər boşluqla ayrılır.',
      rule: '12.4% → 12,4% · 1,250,000 → 1 250 000 · March 15, 2026 → 15 mart 2026-cı il · AZN 500 → 500 manat.',
      examples: [
        { src: 'Net profit rose by 12.4%.', tgt: 'Xalis mənfəət 12,4% artıb.', note: 'Onluq kəsr — vergül.' },
        { src: 'AZN 1,250,000', tgt: '1 250 000 manat', note: 'Minliklər — boşluq.' },
        { src: 'on March 15, 2026', tgt: '15 mart 2026-cı il tarixində', note: 'Ay adı kiçik hərflə yazılır.' }],
      pitfalls: [{ wrong: '15 Mart', right: '15 mart', why: 'Ay adları kiçik hərflə yazılır.' }, { wrong: '3.8 milyard', right: '3,8 milyard', why: 'Onluq kəsr vergüllə.' }],
      quiz: [
        { q: '«USD 2,500.75» Azərbaycan mətnində:', options: ['2,500.75 dollar', '2 500,75 ABŞ dolları', '2.500,75 $'], answer: 1, explain: 'Minlik — boşluq, onluq — vergül.' },
        { q: '«June 1» düzgün yazılış:', options: ['1 İyun', '1 iyun', '1-ci İyun'], answer: 1, explain: 'Ay adı kiçik hərflə: «1 iyun».' }],
      task: { src: 'Revenue amounted to AZN 3.8 billion in 2025.', model: '2025-ci ildə gəlir 3,8 milyard manat təşkil edib.', hints: ['3.8 → 3,8', 'AZN → manat'] },
      summary: 'Rəqəmi heç vaxt «gözlə» köçürməyin — Möhürdar Mirzə hər birini yoxlayır.' }
  ];
  var CARDS = [
    { front: 'aktual xərclər', back: 'faktiki xərclər', note: '«actual» — faktiki', tag: 'Yalançı dost' },
    { front: 'tarafından', back: 'tərəfindən', note: 'Türk forması', tag: 'Ədəbi norma' },
    { front: '12.4%', back: '12,4%', note: 'Onluq kəsr — vergül', tag: 'Rəqəm' },
    { front: 'İşəgötürən (Employer, FIDIC)', back: 'Sifarişçi', note: 'Tikinti müqavilələrində', tag: 'Termin' },
    { front: 'Podratçı xəbərdar edəcək (shall)', back: 'Podratçı xəbərdar etməlidir', note: '«shall» — öhdəlik', tag: 'Hüquqi' },
    { front: '15 Mart', back: '15 mart', note: 'Ay adı kiçik hərflə', tag: 'Orfoqrafiya' },
    { front: 'gün içinde', back: 'gün ərzində', note: 'Türk forması', tag: 'Ədəbi norma' },
    { front: 'simpatik münasibət (sympathetic)', back: 'anlayışlı münasibət', note: 'Yalançı dost', tag: 'Leksika' },
    { front: 'kompaniya', back: 'şirkət', note: 'Rus mənşəli danışıq forması', tag: 'Üslub' },
    { front: 'təhvil etmək', back: 'təhvil vermək', note: 'Sabit söz birləşməsi', tag: 'Üslub' }
  ];
  function aiLesson(inp) {
    if (typeof inp === 'string') inp = { topic: inp };
    inp = inp || {};
    var key = fold(inp.id || inp.topic || inp.title || '');
    var L = null;
    if (key) LESSONS.forEach(function (l) { if (!L && (fold(l.id) === key || fold(l.title).indexOf(key) >= 0 || fold(l.topic).indexOf(key) >= 0 || key.indexOf(fold(l.id)) >= 0)) L = l; });
    if (!L) { var day = Math.floor(Date.now() / 86400000); L = LESSONS[(inp.index != null ? inp.index : day) % LESSONS.length]; }
    var out = clone(L);
    out.generatedAt = new Date().toISOString();
    out.elderNote = 'Məclis bu dərsi ' + L.topic.toLowerCase() + ' üzrə ən çox rast gəlinən səhvlərdən hazırladı.';
    return out;
  }
  function aiGrade(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = String(inp.text || inp.answer || inp.tgt || '').trim(), model = String(inp.model || '').trim(), src = String(inp.src || '').trim();
    var rub = [{ name: 'Məna dəqiqliyi', max: 40, score: 36 }, { name: 'Terminologiya', max: 20, score: 17 }, { name: 'Üslub və axıcılıq', max: 20, score: 16 }, { name: 'Ədəbi norma', max: 10, score: 8 }, { name: 'Format (rəqəm, tarix, ad)', max: 10, score: 9 }];
    var errors = [];
    if (text) {
      var c = aiCheck({ src: src, tgt: text }); errors = c.errors;
      var sim = model ? dice(tokSet(text), tokSet(model)) : 0.82;
      rub[0].score = Math.round(40 * clamp(sim * 1.2, 0.35, 1));
      rub[1].score = 20; rub[2].score = 20; rub[3].score = 10; rub[4].score = 10;
      errors.forEach(function (e) {
        if (e.type === 'Məna' || e.type === 'Boş seqment') rub[0].score -= 8;
        else if (e.type === 'Termin') rub[1].score -= 5;
        else if (e.type === 'Üslub' || e.type === 'Söz sırası' || e.type === 'Ardıcıllıq') rub[2].score -= 4;
        else if (e.type === 'Türk forması' || e.type === 'Orfoqrafiya' || e.type === 'Durğu') rub[3].score -= 3;
        else rub[4].score -= 4;
      });
      rub.forEach(function (r) { r.score = clamp(r.score, 0, r.max); });
    }
    var score = rub.reduce(function (s, r) { return s + r.score; }, 0);
    var strengths = [], improve = [];
    rub.forEach(function (r) { (r.score / r.max >= 0.85 ? strengths : improve).push(r.name); });
    var feedback = [];
    if (strengths.length) feedback.push({ kind: 'ok', text: 'Güclü tərəflər: ' + strengths.join(', ').toLowerCase() + '.' });
    if (improve.length) feedback.push({ kind: 'warn', text: 'Üzərində işləyin: ' + improve.join(', ').toLowerCase() + '.' });
    errors.slice(0, 3).forEach(function (e) { feedback.push({ kind: 'err', text: '«' + e.was + '» → «' + e.now + '»: ' + e.why }); });
    if (!text) feedback.push({ kind: 'info', text: '«shall» öhdəlik kimi düzgün verilib; bir yerdə «İşəgötürən» əvəzinə «Sifarişçi» olmalı idi.' });
    return {
      score: score, grade: gradeOf(score), passed: score >= 70, xp: Math.round(score / 2), rubric: rub, feedback: feedback, errors: errors,
      verdict: { score: score, text: score >= 70 ? 'İmtahan uğurla verildi. ' + (improve.length ? improve[0] + ' üzərində bir az da çalışın.' : 'Möhtəşəm nəticə!') : 'Bu dəfə alınmadı — səhv kartlarını təkrar edin və yenidən cəhd edin.', seal: score >= 70 ? 'Keçdi' : 'Təkrar', grade: gradeOf(score) }
    };
  }
  function aiAnalyze(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = String(inp.text || inp.src || '') || SAMPLES.legal + ' ' + SAMPLES.report;
    var sents = []; text.split(/\n+/).forEach(function (p) { sents = sents.concat(splitSentences(p)); });
    var words = countWords(text), seen = {}, rep = 0, exact = 0, fuzzy = 0, doms = [];
    var from = detectLang(text);
    sents.forEach(function (s) {
      var n = normS(s); if (seen[n]) rep += countWords(s); seen[n] = 1;
      var hit = lookup(s, from, from === 'az' ? 'en' : 'az');
      if (hit && hit.score >= 0.999) { exact += countWords(s); doms.push(hit.e.dom); } else if (hit && hit.score >= 0.6) { fuzzy += countWords(s); doms.push(hit.e.dom); }
    });
    var fresh = Math.max(0, words - exact - fuzzy - rep);
    var weighted = fresh + fuzzy * 0.6 + exact * 0.25 + rep * 0.1;
    var rate = profile().rate || 0.06;
    var dom = detectDomain(text, doms), reg = detectRegister(text);
    var avgLen = words / Math.max(1, sents.length);
    var risks = [];
    var nums = numsIn(text).length; if (nums) risks.push(nums + ' rəqəm və məbləğ — Möhürdar Mirzə hər birini yoxlayacaq');
    var gh = glossHits(text, 20); if (gh.length) risks.push(gh.length + ' lüğət termini — ardıcıllıq qorunacaq');
    if (/employer/i.test(text)) risks.push('«Employer»: «Sifarişçi» və «İşəgötürən» arasında seçim');
    if (avgLen > 24) risks.push('Uzun cümlələr (orta ' + Math.round(avgLen) + ' söz) — söz sırasına diqqət');
    return {
      words: words, chars: text.length, sentences: sents.length, repetition: words ? Math.round(rep / words * 100) : 0,
      tm: { exact: exact, fuzzy: fuzzy, fresh: fresh, repeats: rep },
      domain: DOMAINS[dom].label, register: reg.label, registerId: reg.id, from: from,
      readability: avgLen > 24 ? 'Mürəkkəb' : avgLen > 14 ? 'Orta' : 'Sadə',
      estimate: { hours: Math.max(0.5, Math.round(weighted / 380 * 2) / 2), price: Math.round(weighted * rate * 100) / 100, currency: 'AZN', weightedWords: Math.round(weighted) },
      terms: gh.slice(0, 8), risks: risks, questions: (QUESTIONS[dom] || QUESTIONS.general).slice(0, 2)
    };
  }
  function aiDeliverables(inp) {
    var name = projName(inp && (inp.project || inp));
    var slug = fold(name).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'layihe';
    var hh = hash(name);
    return [
      { id: 'docx', name: 'Tərcümə', format: 'DOCX', file: slug + '_AZ.docx', size: (1 + (hh % 30) / 10).toFixed(1).replace('.', ',') + ' MB', icon: 'file', desc: 'Orijinal format və üslublar saxlanılıb' },
      { id: 'xlsx', name: 'İkidilli cədvəl', format: 'XLSX', file: slug + '_ikidilli.xlsx', size: (220 + hh % 300) + ' KB', icon: 'grid', desc: 'Mənbə və tərcümə yan-yana, seqment nömrələri ilə' },
      { id: 'tmx', name: 'Tərcümə yaddaşı', format: 'TMX', file: slug + '.tmx', size: (90 + hh % 120) + ' KB', icon: 'database', desc: 'Növbəti layihələr üçün yaddaş' },
      { id: 'tbx', name: 'Lüğət', format: 'TBX', file: slug + '_lugat.tbx', size: (12 + hh % 30) + ' KB', icon: 'book', desc: 'Təsdiqlənmiş terminlər' },
      { id: 'pdf', name: 'QA hesabatı', format: 'PDF', file: slug + '_QA.pdf', size: (300 + hh % 400) + ' KB', icon: 'shield', desc: 'Mirzə Məclisinin rəyi və möhürü' }
    ];
  }
  function aiTM(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    var s = String((inp && (inp.text || inp.src)) || ''), from = detectLang(s), ts = tokSet(s);
    var PROJ = ['Nümunə layihə'];
    return CORPUS.filter(function (e) { return e.lang === from; }).map(function (e) {
      return { src: e.src, tgt: variantFor(e, 'resmi'), pct: Math.round(dice(ts, e._t) * 100), project: PROJ[hash(e.src) % PROJ.length], date: new Date(Date.now() - (hash(e.src) % 90) * 86400000).toISOString() };
    }).filter(function (x) { return x.pct >= 40; }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3);
  }
  var AI = {
    translate: aiTranslate, check: aiCheck, review: aiCheck, qa: aiQA, terms: aiTerms, glossary: aiTerms, lesson: aiLesson,
    cards: function () { return clone(CARDS); }, grade: aiGrade, exam: aiGrade, analyze: aiAnalyze, analysis: aiAnalyze,
    deliverables: aiDeliverables, tm: aiTM,
    detect: function (inp) { var t = typeof inp === 'string' ? inp : (inp && inp.text) || ''; var r = detectRegister(t); r.lang = detectLang(t); r.domain = DOMAINS[detectDomain(t)].label; return r; },
    questions: function (inp) { var t = typeof inp === 'string' ? inp : (inp && inp.text) || ''; return clone(QUESTIONS[detectDomain(t)] || QUESTIONS.general); }
  };
  /* Real engine: when the page is served by the Nuanza Worker (window.NUANZA_LIVE)
     and an adapter exists in window.NuanzaAI.kinds, use Gemini through /api.
     Otherwise (preview, offline) the demo answers below are used. */
  function liveAI() { return !!(W.NUANZA_LIVE && W.NuanzaAI && W.NuanzaAI.kinds); }
  function mockAI(kind, input) { var fn = AI[kind]; return fn ? fn(input) : null; }
  /* Live errors: one toast per message — parallel calls (3 variants, register previews,
     QA batches) that fail for the same reason must not stack identical toasts. */
  var lastErr = { msg: '', t: null };
  function liveErrToast(e, msg) {
    var shown = lastErr.t && lastErr.t.el;
    if (msg === lastErr.msg && shown && shown.isConnected && !shown.classList.contains('out')) return; /* the same toast is still on screen */
    var opts = null;
    if (e && e.code === 'bad_code' && screens.settings) {
      opts = { action: { label: 'Ayarlar', onClick: function () { go('settings', { s: 'account', opt: 'code' }); } } };
    }
    try { lastErr = { msg: msg, t: toast(msg, 'err', opts) }; } catch (x) { /* toast not ready */ }
  }
  function fakeAI(kind, input, ms) {
    if (liveAI() && typeof W.NuanzaAI.kinds[kind] === 'function') {
      return Promise.resolve().then(function () { return W.NuanzaAI.kinds[kind](input || {}); })
        .catch(function (e) {
          /* {code} = an expected Worker answer (limit, bad code…); anything else is a bug in an adapter */
          if (e && e.code && !(e instanceof Error)) { try { console.warn('[Nuanza] ' + kind + ': ' + e.code); } catch (x) { /* ignore */ } }
          else log(e);
          var msg = (W.NuanzaAI.errText && W.NuanzaAI.errText(e)) || 'Mühərrik cavab vermədi. Yenidən cəhd edin.';
          liveErrToast(e, msg);
          return { ok: false, error: msg, code: (e && e.code) || 'server_error' };
        });
    }
    if (liveAI()) {
      /* Live site, but no real adapter for this kind: never show demo data as a real result. */
      var soon = 'Bu funksiya hələ hazırlanır.';
      try { toast(soon, 'info'); } catch (x) { /* toast not ready */ }
      return Promise.resolve({ ok: false, error: soon });
    }
    var delay = typeof ms === 'number' ? ms : Math.round(rand(900, 2200));
    return new Promise(function (resolve) {
      later(function () {
        var fn = AI[kind], out;
        try { out = fn ? fn(input) : { ok: true, kind: kind, note: 'Bu əməliyyat prototipdə nümunə cavab qaytarır.' }; }
        catch (e) { log(e); out = { ok: false, error: 'Mühərrik cavab vermədi. Yenidən cəhd edin.' }; }
        resolve(out);
      }, delay);
    });
  }

  /* ------------------------------------------------------------------
     11. SCREENS REGISTRY + ROUTER
     ------------------------------------------------------------------ */
  var screens = {}, order = [], current = null, curMode = 'pro';
  var els = {};
  function register(id, def) {
    if (!id || !def || typeof def !== 'object') return;
    def.id = id;
    if (!screens[id]) order.push(id);
    def._i = order.indexOf(id);
    screens[id] = def;
    if (started) buildNav();
  }
  function titleOf(d) {
    if (!d) return 'Nuanza';
    if (typeof d.title === 'function') { try { return d.title(curMode); } catch (e) { return d.id; } }
    if (curMode === 'academy' && d.titleAcademy) return d.titleAcademy;
    return d.title || d.id;
  }
  function badgeOf(d) { try { return typeof d.badge === 'function' ? d.badge() : d.badge; } catch (e) { return null; } }
  function isAvail(d, m) {
    if (!d) return false;
    if (d.group === 'Ümumi' || d.group === 'Hesab' || d.mode === 'any') return true;
    /* Tenso (qrammatika) ayrıca məhsuldur: orada yalnız öz ekranları + ümumi ekranlar */
    if (m === 'grammar') return d.mode === 'grammar';
    return !d.mode || d.mode === 'both' || d.mode === m;
  }
  function normMode(m) { return m === 'academy' || m === 'grammar' ? m : 'pro'; }
  /* tərcümə məhsulunda sonuncu rejim (pro/academy) — qrammatikadan qayıdanda bərpa olunur */
  function transMode() { var t = store.get('tmode', 'pro'); return t === 'academy' ? 'academy' : 'pro'; }
  function homeId(m) { return (m || curMode) === 'grammar' && screens.grammar ? 'grammar' : 'home'; }
  function hashId() {
    var hs = String(W.location.hash || '').replace(/^#\/?/, '');
    return decodeURIComponent(hs.split(/[?/]/)[0] || '');
  }
  function hashParams() {
    var hs = String(W.location.hash || ''), q = hs.indexOf('?'), out = {};
    if (q >= 0) hs.slice(q + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    var seg = hs.replace(/^#\/?/, '').split('?')[0].split('/');
    if (seg.length > 1 && seg[1]) out.id = decodeURIComponent(seg[1]);
    return out;
  }
  function go(id, params, opts) {
    id = String(id == null ? 'home' : id).replace(/^#\/?/, '');
    if (id === 'onboarding' || id === 'intro') { onboarding(); return; }
    if (id === 'home' && curMode === 'grammar' && screens.grammar) id = 'grammar';
    if (!screens[id]) id = screens.home ? 'home' : (order[0] || 'home');
    renderScreen(id, params || {}, opts || {});
    var target = '#' + id;
    if (W.location.hash !== target) {
      try { W.history.pushState(null, '', target); }
      catch (e) { try { W.location.hash = target; } catch (e2) { /* sandboxed */ } }
    }
  }
  function onHash() {
    var id = hashId();
    if (id === 'onboarding' || id === 'intro') { onboarding(); return; }
    if (!id) id = homeId();
    if (id === 'home' && curMode === 'grammar' && screens.grammar) id = 'grammar';
    if (!screens[id]) { if (D.getElementById(id)) return; id = homeId(); }
    if (current && current.id === id) return;
    renderScreen(id, hashParams(), {});
  }
  function errorView(id, err) {
    return h('div', { class: 'page' },
      h('div', { class: 'empty' },
        h('div', { class: 'empty-art' }),
        h('h3', { text: 'Bu ekran açılmadı' }),
        h('p', { text: 'Nuanza «' + id + '» ekranını yükləyə bilmədi. Ana səhifəyə qayıdın və ya bir az sonra yenidən cəhd edin.' }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { go('home'); } }, 'Ana səhifə'),
          h('button', { class: 'btn', type: 'button', onclick: function () { go(id); } }, iconEl('refresh'), 'Yenidən cəhd et')),
        err && err.message ? h('p', { class: 'small muted', text: String(err.message).slice(0, 140) }) : null));
  }
  function fallbackHome(sec) {
    var p = profile();
    var tiles = order.filter(function (id) { return id !== 'home' && !screens[id].hidden && screens[id].nav !== false; }).map(function (id) {
      var d = screens[id];
      return h('button', { class: 'tile', type: 'button', onclick: function () { go(id); } }, h('span', { class: 'ic', html: icon(d.icon || 'star') }), h('span', null, h('b', { text: titleOf(d) }), h('small', { text: d.group || '' })));
    });
    sec.appendChild(h('div', { class: 'page shell-fallback' },
      h('div', { class: 'page-h' }, h('div', null, h('span', { class: 'eyebrow', text: curMode === 'academy' ? 'Akademiya' : 'Peşəkar' }), h('h1', { html: p.firstName ? 'Salam, <em>' + esc(p.firstName) + '</em>' : 'Xoş <em>gəldiniz</em>' }), h('p', { text: 'Masanız hazırdır. Haradan başlayaq?' }))),
      tiles.length ? h('div', { class: 'tiles' }, tiles) : h('div', { class: 'empty' }, h('div', { class: 'empty-art' }), h('h3', { text: 'Ekranlar yüklənir' }), h('p', { text: 'Bir neçə saniyəyə hazır olacaq.' }))));
  }
  function renderScreen(id, params, opts) {
    opts = opts || {};
    var def = screens[id];
    if (def && !isAvail(def, curMode)) {
      var nm = def.mode === 'pro' || def.mode === 'academy' || def.mode === 'grammar' ? def.mode : (curMode === 'grammar' ? transMode() : null);
      if (nm && nm !== curMode) {
        curMode = nm; iset('mode', curMode); rememberProduct(); syncModeUI(); buildNav(); renderProfile();
        try { if (W.Nuanza && typeof W.Nuanza.applyConfig === 'function') W.Nuanza.applyConfig(); } catch (e) { log(e); }
        emit('mode', curMode);
      }
    }
    if (current && current.def && typeof current.def.leave === 'function') { try { current.def.leave(); } catch (e) { log(e); } }
    var main = els.main;
    var sec = h('section', { class: 'screen enter', 'data-screen': id, tabindex: '-1', 'aria-label': def ? titleOf(def) : 'Nuanza' });
    main.textContent = '';
    main.appendChild(sec);
    current = { id: id, def: def, el: sec, params: params };
    try {
      if (def && typeof def.render === 'function') def.render(sec, params || {});
      else fallbackHome(sec);
    } catch (e) { log(e); sec.textContent = ''; sec.appendChild(errorView(id, e)); }
    if (!current || current.el !== sec) return;
    later(function () { sec.classList.remove('enter'); }, 650);
    markNav(id);
    if (!opts.keepDrawer) closeDrawer(false);
    if (!opts.keepScroll) { try { W.scrollTo(0, 0); } catch (e) { /* ignore */ } }
    if (started && opts.focus !== false && !opts.keepDrawer && !onb) { try { sec.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    emit('route', { id: id, params: params });
    if (started) hintFor(id);
  }
  function rerender() { if (current) renderScreen(current.id, current.params, { keepScroll: true, keepDrawer: true, focus: false }); }

  /* ------------------------------------------------------------------
     12. SHELL: header, drawer, nav, profile, mode, theme
     ------------------------------------------------------------------ */
  function buildShell() {
    var app = $('.app');
    if (!app) {
      app = h('div', { class: 'app', id: 'app' });
      app.innerHTML =
        '<header class="hdr"><div class="hdr-in">' +
        '<button class="burger" type="button" aria-label="Menyunu aç" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>' +
        '<a class="brand" href="#home" aria-label="Nuanza — ana səhifə">' + logoSvg() + '<b>Nuanza</b><small hidden>Akademiya</small></a>' +
        '<button class="avatar av-firuze" type="button" aria-label="Profil və ayarlar"></button></div><div class="rugband" aria-hidden="true"></div></header>' +
        '<nav class="drawer" id="drawer" aria-label="Əsas menyu"><button class="dr-profile" type="button"><span class="avatar lg av-firuze" aria-hidden="true"></span><span class="who"><b></b><small></small><span class="badge"></span></span></button>' +
        '<div class="dr-mode"><div class="seg block" role="group" aria-label="Rejim"><button type="button" data-mode="pro" aria-pressed="true">Peşəkar</button><button type="button" data-mode="academy" aria-pressed="false">Akademiya</button></div></div>' +
        '<div class="dr-tools"><button class="dr-search" type="button"></button></div><div class="dr-nav"></div>' +
        '<div class="dr-foot"><button class="icon-btn ghost theme-toggle" type="button" aria-label="Rəng rejimini dəyiş"></button><span class="ver">Nuanza ' + VERSION + ' · Bakı</span></div></nav>' +
        '<div class="scrim" aria-hidden="true"></div><main class="main" id="main"></main><div class="companion" aria-label="Nuanza"></div>';
      D.body.insertBefore(app, D.body.firstChild);
    }
    els.app = app;
    els.hdr = $('.hdr', app);
    els.burger = $('.burger', app);
    els.brand = $('.brand', app);
    els.brandSmall = els.brand ? $('small', els.brand) : null;
    if (els.brand && !els.brandSmall) { els.brandSmall = h('small', { hidden: true }, 'Akademiya'); els.brand.appendChild(els.brandSmall); }
    els.brandName = els.brand ? $('b', els.brand) : null;
    els.hdrAvatar = $('.hdr .avatar', app) || $('.hdr-in > .avatar', app);
    els.drawer = $('.drawer', app);
    els.drProfile = $('.dr-profile', app);
    els.modeSeg = $('.dr-mode .seg', app);
    els.modeBox = $('.dr-mode', app);
    if (els.drawer && !$('.dr-prod', app)) {
      var prodBox = h('div', { class: 'dr-prod' },
        h('span', { class: 'dr-prod-l', text: 'Məhsullar' }),
        h('div', { class: 'seg block', role: 'group', 'aria-label': 'Məhsul' },
          h('button', { type: 'button', 'data-prod': 'translate', 'aria-pressed': 'true' }, 'Tərcümə'),
          h('button', { type: 'button', 'data-prod': 'grammar', 'aria-pressed': 'false' }, 'Qrammatika')));
      var anchor = els.modeBox || $('.dr-tools', app) || $('.dr-nav', app);
      if (anchor) els.drawer.insertBefore(prodBox, anchor); else els.drawer.appendChild(prodBox);
    }
    els.prodSeg = $('.dr-prod .seg', app);
    els.nav = $('.dr-nav', app);
    els.scrim = $('.scrim:not(.top)', app);
    els.main = $('.main', app) || $('#main');
    els.companion = $('.companion', app) || $('.companion');
    els.themeToggle = $('.theme-toggle', app);
    els.search = $('.dr-search', app);
    if (!els.companion) { els.companion = h('div', { class: 'companion', 'aria-label': 'Nuanza' }); app.appendChild(els.companion); }
    if (!$('.toasts')) D.body.appendChild(h('div', { class: 'toasts', 'aria-live': 'polite' }));
    if (els.drawer && !els.search) {
      var tools = h('div', { class: 'dr-tools' }, els.search = h('button', { class: 'dr-search', type: 'button' }));
      els.drawer.insertBefore(tools, els.nav);
    }
    if (els.search) {
      els.search.innerHTML = icon('search') + '<span class="lbl">Axtar və keç</span><kbd class="kbd">' + MOD + ' K</kbd>';
      els.search.setAttribute('aria-label', 'Axtar və keç (' + MOD + ' K)');
    }
    if (els.themeToggle) els.themeToggle.innerHTML = icon('moon', 'i-moon') + icon('sun', 'i-sun');
    if (els.brand) {
      var lg = $('.logo', els.brand);
      if (!lg) els.brand.insertBefore(frag(logoSvg()), els.brand.firstChild);
    }
    $$('[data-icon]').forEach(function (n) { n.innerHTML = icon(n.getAttribute('data-icon')); });
  }
  function buildNav(anim) {
    var nav = els.nav; if (!nav) return;
    nav.textContent = '';
    var primary = curMode === 'academy' ? 'Akademiya' : curMode === 'grammar' ? 'Tenso' : 'Peşəkar';
    var groups = {}, gOrder = [];
    order.forEach(function (id) {
      var d = screens[id];
      if (!d || d.hidden || d.nav === false || !isAvail(d, curMode)) return;
      var g = (!d.group || d.group === 'Peşəkar' || d.group === 'Akademiya' || d.group === 'Tenso' || d.group === 'Qrammatika') ? primary : d.group;
      if (!groups[g]) { groups[g] = []; gOrder.push(g); }
      groups[g].push(d);
    });
    var final = [primary].concat(gOrder.filter(function (g) { return g !== primary && g !== 'Ümumi' && g !== 'Hesab'; }), ['Ümumi', 'Hesab']);
    var i = 0;
    final.forEach(function (g) {
      var list = groups[g]; if (!list || !list.length) return;
      list.sort(function (a, b) { var ha = a.id === 'home' || a.id === 'grammar', hb = b.id === 'home' || b.id === 'grammar'; return (ha ? -1 : hb ? 1 : 0) || ((a.order || 0) - (b.order || 0)) || (a._i - b._i); });
      nav.appendChild(h('div', { class: 'dr-grp', style: '--i:' + (i++), text: g }));
      list.forEach(function (d) {
        var bd = badgeOf(d);
        var a = h('a', { class: 'dr-link', href: '#' + d.id, 'data-id': d.id, style: '--i:' + (i++), html: icon(d.icon || 'star') },
          h('span', { text: titleOf(d) }),
          bd !== null && bd !== undefined && bd !== '' && bd !== 0 ? h('span', { class: 'badge ' + (d.badgeKind || 'red'), text: String(bd) }) : null);
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
          e.preventDefault(); go(d.id);
        });
        nav.appendChild(a);
      });
    });
    if (anim && !reducedMotion()) { nav.classList.add('anim'); later(function () { nav.classList.remove('anim'); }, 900); }
    markNav(current && current.id);
  }
  function markNav(id) {
    if (!els.nav) return;
    $$('.dr-link', els.nav).forEach(function (a) {
      if (a.getAttribute('data-id') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function avatarCls(c) { return /^av-(nar|lacquer|zafaran|firuze|benovse|zeytun)$/.test(c || '') ? c : 'av-firuze'; }
  /* Avatar content: initials when there is a name, otherwise a person icon. */
  function fillAvatar(el, p) {
    if (p.initials) el.textContent = p.initials;
    else el.innerHTML = icon('user', 'av-ic');
  }
  function renderProfile() {
    var p = profile(), cls = avatarCls(p.avatarColor), named = !!p.name;
    if (els.hdrAvatar) {
      els.hdrAvatar.className = 'avatar ' + cls;
      fillAvatar(els.hdrAvatar, p);
      els.hdrAvatar.setAttribute('aria-label', named ? 'Profil və ayarlar — ' + p.name : 'Profil və ayarlar');
    }
    if (els.drProfile) {
      var av = $('.avatar', els.drProfile), who = $('.who', els.drProfile);
      if (av) { av.className = 'avatar lg ' + cls; fillAvatar(av, p); }
      els.drProfile.classList.toggle('incomplete', !named);
      if (who) {
        var b = $('b', who), sm = $('small', who), bg = $('.badge', who);
        if (b) b.textContent = named ? p.name : 'Profilinizi tamamlayın';
        if (sm) {
          if (!named) sm.textContent = 'Adınızı əlavə edin';
          else if (curMode === 'academy') sm.textContent = p.rank + ' · ' + fmt.num(p.xp) + ' XP';
          else if (curMode === 'grammar') { var tl = store.get('tenso:level', ''); sm.textContent = 'İngilis dili' + (typeof tl === 'string' && tl ? ' · ' + tl + ' səviyyə' : ' öyrənir'); }
          else sm.textContent = [p.role, p.pairsLabel].filter(Boolean).join(' · ');
        }
        if (bg) { bg.textContent = curMode === 'academy' && p.streak > 0 ? (p.streak + ' günlük seriya') : ''; bg.className = 'badge'; }
      }
      els.drProfile.setAttribute('aria-label', (named ? p.name : 'Profilinizi tamamlayın') + ' — profil və ayarlar');
    }
  }
  function syncModeUI() {
    R.setAttribute('data-mode', curMode);
    if (els.modeSeg) $$('button', els.modeSeg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === curMode)); });
    var gr = curMode === 'grammar';
    var onHub = /^#hub\b/.test(W.location.hash || '');
    if (els.brandName) els.brandName.textContent = onHub ? 'Loquela' : gr ? 'Tenso' : 'Nuanza';
    if (els.brandSmall) { els.brandSmall.hidden = onHub || curMode === 'pro'; els.brandSmall.textContent = gr ? '· Qrammatika' : 'Akademiya'; }
    if (els.brand) {
      els.brand.setAttribute('aria-label', gr ? 'Tenso · Qrammatika — məhsullar' : curMode === 'academy' ? 'Nuanza Akademiya — məhsullar' : 'Nuanza — məhsullar');
      els.brand.setAttribute('href', '#hub');
    }
    if (els.prodSeg) $$('button', els.prodSeg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-prod') === (gr ? 'grammar' : 'translate'))); });
    if (els.modeBox) els.modeBox.hidden = gr;
    if (els.companion) els.companion.setAttribute('aria-label', gr ? 'Tenso' : 'Nuanza');
  }
  function rememberProduct() {
    iset('product', curMode === 'grammar' ? 'grammar' : 'translate');
    if (curMode !== 'grammar') iset('tmode', curMode);
  }
  /* Məhsul seçimi: 'translate' (Nuanza) | 'grammar' (Tenso). Hub, drawer və palitra istifadə edir. */
  function setProduct(prod, opts) {
    opts = opts || {};
    var m = prod === 'grammar' ? 'grammar' : (curMode !== 'grammar' ? curMode : transMode());
    if (m !== curMode) setMode(m, { silent: true, noRoute: true });
    else rememberProduct();
    if (opts.route !== false) go(homeId(m));
    if (!opts.silent) {
      later(function () { chatter('wave', m === 'grammar' ? 'Salam! Mən Tensoyam. Bir cümlə yaz — birlikdə yoxlayaq.' : 'Tərcümə masası hazırdır. Nə tərcümə edirik?'); }, 500);
    }
  }
  function mode() { return curMode; }
  function setMode(m, opts) {
    opts = opts || {};
    m = normMode(m);
    var prev = curMode;
    curMode = m; iset('mode', m); rememberProduct();
    syncModeUI(); renderProfile(); buildNav(prev !== m);
    if (prev === m || !started) return;
    try { if (W.Nuanza && typeof W.Nuanza.applyConfig === 'function') W.Nuanza.applyConfig(); } catch (e) { log(e); }
    var cur = current && current.id, d = cur && screens[cur];
    if (!onb && !opts.noRoute) {
      var hid = homeId(m);
      if (d && isAvail(d, m) && cur !== 'home' && cur !== 'grammar') renderScreen(cur, current.params, { keepDrawer: true, keepScroll: true, focus: false });
      else { renderScreen(hid, {}, { keepDrawer: true, focus: false }); try { if (W.location.hash !== '#' + hid) W.history.replaceState(null, '', '#' + hid); } catch (e) { /* sandboxed */ } }
    }
    emit('mode', m);
    if (opts.silent) return;
    if (m === 'grammar') {
      toast('Tenso · Qrammatika', 'ok', { sub: 'İngilis dili: yaz, yoxla, səhvdən öyrən', icon: 'check' });
    } else if (m === 'academy') {
      toast('Akademiya rejimi', 'ok', { sub: 'Dərslər, missiyalar, səhv kartları və rütbələr', icon: 'cap' });
      chatter('celebrate', 'Akademiyaya xoş gəldiniz! Bu gün ' + (profile().dailyGoal || 30) + ' XP qazanaq?');
    } else {
      toast('Peşəkar rejim', 'ok', { sub: 'Layihələr, lüğət, QA və təhvil', icon: 'folder' });
      chatter('write', 'Peşəkar masa hazırdır. Layihələrə baxaq?');
    }
  }
  /* theme */
  function effectiveTheme() { var t = R.getAttribute('data-theme'); if (t === 'dark' || t === 'light') return t; return mqDark.matches ? 'dark' : 'light'; }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') R.setAttribute('data-theme', t); else R.removeAttribute('data-theme');
    updateThemeToggle();
  }
  function updateThemeToggle() {
    if (!els.themeToggle) return;
    var dark = effectiveTheme() === 'dark';
    els.themeToggle.setAttribute('aria-label', dark ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç');
    els.themeToggle.setAttribute('title', dark ? 'İşıqlı rejim' : 'Qaranlıq rejim');
  }
  function setTheme(t, origin) {
    t = t === 'light' || t === 'dark' ? t : 'system';
    iset('theme', t);
    var apply = function () { applyTheme(t); };
    var canVT = origin && typeof D.startViewTransition === 'function' && !reducedMotion();
    if (canVT) {
      var r0 = origin.getBoundingClientRect ? origin.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      var x = r0.left + r0.width / 2, y = r0.top + r0.height / 2;
      try {
        var vt = D.startViewTransition(apply);
        vt.ready.then(function () {
          var rad = Math.hypot(Math.max(x, W.innerWidth - x), Math.max(y, W.innerHeight - y));
          R.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
        }).catch(function () { /* ignore */ });
      } catch (e) { apply(); }
    } else apply();
    emit('theme', t);
  }
  function toggleTheme(e) {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next, e && e.currentTarget ? e.currentTarget : null);
    if (next === 'dark') chatter('surprised', 'Gecə rejimi — gözlərinizi qoruyaq.', 2200);
  }
  function normMotion(m) {
    if (m === 'reduce' || m === true || (m && typeof m === 'object' && m.reduce)) return 'reduce';
    if (m === 'system') return 'system';
    return 'full';
  }
  function applyMotion() {
    var prev = R.getAttribute('data-motion');
    var m = normMotion(store.get('motion', 'full'));
    R.setAttribute('data-motion', m);
    if (started && prev !== m) emit('motion', m);
  }
  /* setMotion('full'|'system'|'reduce'); booleans kept for old callers (true = reduce). */
  function setMotion(v) {
    var m = v === true ? 'reduce' : v === false ? 'full' : normMotion(v);
    iset('motion', m); applyMotion();
    try { if (W.Nuanza && typeof W.Nuanza.applyConfig === 'function') W.Nuanza.applyConfig(); } catch (e) { log(e); }
    return m;
  }
  /* drawer */
  function syncDrawerInert() {
    if (!els.drawer) return;
    if (isDesktop()) { els.drawer.removeAttribute('inert'); els.drawer.removeAttribute('aria-hidden'); }
    else if (!drawerOpen) { els.drawer.setAttribute('inert', ''); }
  }
  function openDrawer() {
    if (isDesktop() || drawerOpen || !els.drawer) return;
    drawerOpen = true;
    els.drawer.removeAttribute('inert');
    els.drawer.classList.add('on');
    if (els.scrim) els.scrim.classList.add('on');
    if (els.burger) { els.burger.setAttribute('aria-expanded', 'true'); els.burger.setAttribute('aria-label', 'Menyunu bağla'); }
    lockScroll();
    var cur = $('.dr-link[aria-current="page"]', els.drawer) || $('.dr-link', els.drawer) || els.drProfile;
    focusSoon(cur);
  }
  function closeDrawer(returnFocus) {
    if (!drawerOpen) return;
    drawerOpen = false;
    if (els.drawer) { els.drawer.classList.remove('on'); els.drawer.style.transform = ''; }
    if (els.scrim) els.scrim.classList.remove('on');
    if (els.burger) { els.burger.setAttribute('aria-expanded', 'false'); els.burger.setAttribute('aria-label', 'Menyunu aç'); }
    syncDrawerInert(); lockScroll();
    if (returnFocus && els.burger) restoreFocus(els.burger);
  }
  function toggleDrawer() { if (drawerOpen) closeDrawer(true); else openDrawer(); }
  function enableDrawerSwipe() {
    var dr = els.drawer; if (!dr) return;
    var x0 = null, y0 = 0, dx = 0, active = false;
    dr.addEventListener('pointerdown', function (e) { if (isDesktop() || !drawerOpen || e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; dx = 0; active = false; });
    dr.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (!active) { if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.3 && mx < 0) { active = true; dr.classList.add('dragging'); } else if (Math.abs(my) > 12) { x0 = null; return; } else return; }
      dx = Math.min(0, mx); dr.style.transform = 'translateX(' + dx + 'px)';
    });
    function end() {
      if (x0 === null) return; x0 = null;
      if (!active) return; active = false;
      dr.classList.remove('dragging'); dr.style.transform = '';
      if (dx < -70) closeDrawer(false);
    }
    dr.addEventListener('pointerup', end); dr.addEventListener('pointercancel', end);
  }

  /* ------------------------------------------------------------------
     13. COMPANION (Nuanza dock) — guarded proxy
     ------------------------------------------------------------------ */
  var COMPANION_DEFAULTS = { show: true, size: 'dock', chatty: true, motion: true };
  var nzInst = null, menuOpen = false;
  function companionCfg() { var c = store.get('companion', null); return assign({}, COMPANION_DEFAULTS, c && typeof c === 'object' ? c : {}); }
  function fallbackDock(slot) {
    var bubble = null, btimer = null;
    var btn = h('button', { class: 'shell-dock', type: 'button', 'aria-label': 'Nuanza — məsləhətlər', html: logoSvg('logo') });
    btn.addEventListener('click', function () { companionMenu(); });
    slot.appendChild(btn);
    function say(text, ms) {
      if (!text) return;
      if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble);
      bubble = h('div', { class: 'bubble br shell-dock-bubble', role: 'status', text: String(text) });
      slot.appendChild(bubble);
      clearTimeout(btimer); btimer = later(function () { if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble); }, ms || 3400);
    }
    return {
      el: btn,
      set: function (state, o) { o = o || {}; if (o.say) say(o.say, o.ms); if (state && state !== 'idle' && state !== 'sleep') { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); } },
      say: say,
      react: function () { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); },
      destroy: function () { clearTimeout(btimer); slot.textContent = ''; }
    };
  }
  function mountCompanion() {
    var slot = els.companion; if (!slot) return;
    if (nzInst && typeof nzInst.destroy === 'function') { try { nzInst.destroy(); } catch (e) { log(e); } }
    nzInst = null; slot.textContent = '';
    var cfg = companionCfg();
    slot.hidden = !cfg.show;
    if (!cfg.show) return;
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        nzInst = W.Nuanza.mount(slot, { size: cfg.size === 'mini' ? 'mini' : 'dock', motion: cfg.motion !== false, chatty: cfg.chatty !== false, onTap: function () { companionMenu(); } });
      } catch (e) { log(e); nzInst = null; slot.textContent = ''; }
    }
    if (!nzInst) nzInst = fallbackDock(slot);
  }
  var companion = {
    set: function (state, o) {
      var i = nzInst; if (!i) return companion;
      try { if (typeof i.set === 'function') i.set(state || 'idle', o || {}); else if (o && o.say && typeof i.say === 'function') i.say(o.say, o.ms); } catch (e) { log(e); }
      return companion;
    },
    say: function (text, ms) {
      var i = nzInst; if (!i || !text) return companion;
      try { if (typeof i.say === 'function') i.say(String(text), ms); else if (typeof i.set === 'function') i.set('idle', { say: String(text), ms: ms }); } catch (e) { log(e); }
      return companion;
    },
    react: function (kind) { var i = nzInst; try { if (i && typeof i.react === 'function') i.react(kind || 'pet'); else if (i && typeof i.set === 'function') i.set('success', { ms: 900 }); } catch (e) { log(e); } return companion; },
    destroy: function () { var i = nzInst; nzInst = null; try { if (i && typeof i.destroy === 'function') i.destroy(); } catch (e) { log(e); } return companion; },
    remount: function () { mountCompanion(); return companion; },
    menu: function () { companionMenu(); return companion; },
    get instance() { return nzInst; },
    get el() { return nzInst && nzInst.el ? nzInst.el : els.companion; }
  };
  function setCompanion(patch) { var c = companionCfg(); assign(c, patch || {}); iset('companion', c); mountCompanion(); return c; }
  function chatter(state, text, ms) {
    if (!companionCfg().chatty || onb) { if (state) companion.set(state, { ms: ms || 1600 }); return; }
    companion.set(state || 'idle', { say: text, ms: ms || 3200 });
  }
  /* tips */
  var TIPS = {
    general: [
      '«actual» — «faktiki», «aktual» deyil. Bu səhvi Lüğətçi Mirzə dərhal tutur.',
      'Üslubu özüm tanıyıram: Danışıq, Neytral, Rəsmi və ya Hüquqi. İstəsəniz, əl ilə dəyişin.',
      'Sarı xətt «yoxlayın», dalğalı qırmızı xətt «şübhəli» deməkdir. Üzərinə gəlin — səbəbini yazmışam.',
      'Onluq kəsr vergüllə yazılır: 12,4%. Möhürdar Mirzə buna çox həssasdır.',
      '«tarafından», «için», «şirket» — türk formalarıdır. Dilçi Nənə onları qaçırmır.',
      'Böyük işlərdə — bütöv sənədin tərcüməsində, dərin QA-da — Mirzə Məclisi toplanır.',
      MOD + ' + K ilə istənilən ekrana bir anda keçin.',
      'Telegram botumuz da var: mətni göndərin, tərcüməni elə orada alın.',
      'Lüğətə əlavə etdiyiniz termini bütün layihələrdə qoruyuram.'
    ],
    academy: [
      'Hər gün bir dərs seriyanı qoruyur. Bu gün də bir addım ataq!',
      'Səhv kartları: buraxdığınız səhvlər özü kart olur — təkrar edin, unudun getsin.',
      'Rütbələr: Şagird → Katib → Münşi → Mirzə → Dilmanc → Ustad.',
      '«Shall» müqavilədə gələcək zaman deyil — öhdəlikdir: «etməlidir».'
    ],
    grammar: [
      'Mən Tensoyam. «I am agree» yox — «I agree». agree özü feldir!',
      '«married with him» deyil — «married to him» və ya «I married him».',
      '«in the last year» — «keçən il» deməkdir? Onda sadəcə «last year».',
      '«make a photo» yox — «take a photo». Kalkalardan qorunaq.',
      'Rəqəmdən sonra isim cəmdə olur: two books, three children.',
      '«actual» = həqiqi, «aktual» deyil. «magazine» = jurnal, mağaza deyil.',
      'Hər gün bir mövzu yaz — «Gündəlik yazı» səviyyənə uyğun mövzu verir.'
    ],
    translate: ['Mətni yapışdırın — üslubu özüm tanıyacağam. Sarı xətli yerlərə bir də baxın.', 'Situasiya kartını doldurun: kimə, nə üçün? Tərcümə ona uyğunlaşır.'],
    projects: ['Yeni layihə yaradın — QA və təhvil paketi bir kliklə hazır olacaq.', 'Nümunə layihəni açıb redaktora baxa bilərsiniz.'],
    settings: ['Burada məni də fərdiləşdirə bilərsiniz: ölçü, danışıqlıq, hərəkət.', 'Rəng rejimini sistemə də bağlaya bilərsiniz.'],
    home: ['Bu gün nə tərcümə edirik?', 'Son layihənizə qayıtmaq üçün kartına toxunun.']
  };
  var HINT_IDS = { translate: 1, projects: 1, settings: 1, glossary: 1, qa: 1, academy: 1, lessons: 1, practice: 1, cards: 1, review: 1, memory: 1, tm: 1 };
  var HINT_TEXT = {
    translate: 'Mətni yapışdırın — üslubu özüm tanıyacağam.', projects: 'İlk layihənizi buradan yaradın.',
    settings: 'Burada məni də fərdiləşdirə bilərsiniz.', glossary: 'Lüğətdəki terminləri tərcümədə özüm qoruyuram.',
    qa: 'Rəqəm, ad, tarix — hamısını yoxlayacağıq.', review: 'Mirzələr hazırdır. Mətni verin, yoxlayaq.',
    memory: 'Tərcümə yaddaşı hər təhvildən sonra böyüyür.', tm: 'Tərcümə yaddaşı hər təhvildən sonra böyüyür.',
    academy: 'Bu gün 30 XP üçün bir dərs kifayətdir!', lessons: 'Qısa dərs, böyük fayda. Başlayaq?',
    practice: 'Səhv etməkdən qorxmayın — kart olub geri qayıdacaq.', cards: 'Səhvlərinizdən kartlar yaranır — birlikdə təkrar edək.'
  };
  var hinted = {};
  function hintFor(id) {
    if (hinted[id] || !HINT_IDS[id] || onb || !companionCfg().chatty) return;
    hinted[id] = 1;
    later(function () { if (current && current.id === id && !overlays.length) companion.set('point', { say: HINT_TEXT[id], ms: 3400 }); }, 900);
  }
  function tipsFor(id) {
    var list = (TIPS[id] || []).slice();
    if (curMode === 'grammar') return list.concat(TIPS.grammar);
    if (curMode === 'academy') list = list.concat(TIPS.academy);
    return list.concat(TIPS.general);
  }
  function companionMenu() {
    if (menuOpen) return;
    menuOpen = true;
    var tips = tipsFor(current && current.id), ti = 0;
    var bubble = h('div', { class: 'bubble', role: 'status', text: tips[0] });
    var art = h('div', { class: 'sheet-nz-art' });
    var mini = null;
    var rows = [
      { ic: 'sparkle', cls: 'gold', b: 'Növbəti məsləhət', s: 'Hər dəfə yeni bir incəlik', run: function () { ti = (ti + 1) % tips.length; bubble.textContent = tips[ti]; try { if (mini && mini.set) mini.set('point', { ms: 1200 }); } catch (e) { /* ignore */ } return false; } },
      { ic: 'search', b: 'Axtar və keç', s: MOD + ' + K', run: function () { later(palette, 60); } },
      curMode === 'grammar'
        ? { ic: 'grid', cls: 'fir', b: 'Məhsullar', s: 'Tərcümə və ya Qrammatika', run: function () { go('hub'); } }
        : { ic: 'shield', cls: 'fir', b: 'Mirzə Məclisi necə işləyir?', s: 'Beş mirzə, beş yoxlama — nümunəyə baxın', run: function () { later(demoCouncil, 60); } },
      { ic: 'keyboard', b: 'Klaviatura qısayolları', s: 'Tez işləmək üçün', run: function () { later(shortcuts, 60); } },
      { ic: 'eyeoff', b: curMode === 'grammar' ? 'Tensonu gizlət' : 'Nuanzanı gizlət', s: 'Ayarlardan yenə qaytara bilərsiniz', run: function () {
        setCompanion({ show: false });
        toast(curMode === 'grammar' ? 'Tenso gizləndi' : 'Nuanza gizləndi', 'info', { sub: 'İstədiyiniz vaxt qaytarın', action: { label: 'Qaytar', onClick: function () { setCompanion({ show: true }); later(function () { companion.set('wave', { say: 'Yenə buradayam!', ms: 2400 }); }, 200); } } });
      } }
    ];
    if (screens.settings) rows.push({ ic: 'settings', b: 'Ayarlar', s: 'Ölçü, danışıqlıq, hərəkət', run: function () { go('settings'); } });
    var s;
    var list = h('div', { class: 'list' }, rows.map(function (r) {
      return h('button', {
        class: 'list-row', type: 'button',
        onclick: function () { var keep = r.run(); if (keep !== false && s) s.close(); }
      }, h('span', { class: 'ic' + (r.cls ? ' ' + r.cls : ''), html: icon(r.ic) }), h('span', { class: 'tx' }, h('b', { text: r.b }), h('small', { text: r.s })), h('span', { class: 'end', html: icon('chevron') }));
    }));
    var body = h('div', null, h('div', { class: 'sheet-nz' }, art, bubble), list);
    s = sheet({ title: curMode === 'grammar' ? 'Tenso' : 'Nuanza', body: body, onClose: function () { menuOpen = false; try { if (mini && mini.destroy) mini.destroy(); } catch (e) { /* ignore */ } } });
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try { mini = W.Nuanza.mount(art, { size: 'mini' }); if (mini && mini.set) mini.set('wave', {}); } catch (e) { log(e); mini = null; }
    }
    if (!mini) art.appendChild(h('span', { class: 'medal', 'aria-hidden': 'true' }, h('b', { text: 'N' })));
    companion.react('pet');
  }

  /* ------------------------------------------------------------------
     14. BIG JOBS — Mirzə Məclisi (or a progress sheet fallback)
     ------------------------------------------------------------------ */
  function normVerdict(v) {
    v = v && typeof v === 'object' ? v : (typeof v === 'string' ? { text: v } : {});
    var out = assign({}, v);
    if (out.score == null && v.verdict && v.verdict.score != null) assign(out, v.verdict);
    if (out.score != null) out.score = clamp(Math.round(Number(out.score) || 0), 0, 100);
    if (!out.text) out.text = v.summary || (out.score != null ? (out.score >= 85 ? 'Məclis razıdır: mətn təhvilə hazırdır.' : out.score >= 70 ? 'Bir neçə düzəlişdən sonra təhvil verilə bilər.' : 'Məclis yenidən işlənməsini tövsiyə edir.') : 'Məclis işini bitirdi.');
    if (!out.seal) out.seal = out.score != null ? sealOf(out.score) : 'Təsdiq';
    return out;
  }
  function jobFallback(title, v, durations) {
    return new Promise(function (resolve) {
      var closed = false, timers = [];
      var bar = h('div', { class: 'progress gold', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, h('i', { style: 'width:0%' }));
      var rows = ELDERS.map(function (e) {
        var st = h('span', { class: 'seg-st', 'aria-hidden': 'true' }), sm = h('small', { text: e.role });
        var row = h('div', { class: 'list-row' }, h('span', { class: 'avatar sm ' + e.av, 'aria-hidden': 'true', text: e.short }), h('span', { class: 'tx' }, h('b', { text: e.name }), sm), st);
        row._st = st; row._sm = sm; return row;
      });
      var res = h('div', { class: 'sheet-job-res', hidden: true });
      var body = h('div', { class: 'stack' }, h('p', { class: 'muted', text: 'Məclis toplandı. Hər mirzə öz yoxlamasını aparır.' }), bar, h('div', { class: 'list' }, rows), res);
      var s = sheet({ title: title || 'Mirzə Məclisi', body: body, cls: 'sheet-job', onClose: function () { closed = true; timers.forEach(clearTimeout); resolve(v); } });
      var per = (durations && durations.length ? durations : null);
      var t = 200;
      rows.forEach(function (row, i) {
        var d = per ? (Number(per[i]) || 700) : (reducedMotion() ? 120 : 650 + i * 60);
        timers.push(later(function () { if (closed) return; row._st.className = 'seg-st busy'; row._sm.textContent = ELDERS[i].doing; }, t));
        t += d;
        timers.push(later(function () {
          if (closed) return;
          row._st.className = 'seg-st ok'; row._st.innerHTML = icon('check'); row._sm.textContent = ELDERS[i].done;
          var pct = Math.round((i + 1) / rows.length * 100);
          $('i', bar).style.width = pct + '%'; bar.setAttribute('aria-valuenow', String(pct));
        }, t));
      });
      timers.push(later(function () {
        if (closed) return;
        res.hidden = false;
        if (v.score != null) res.appendChild(ring(v.score, 'bal', null, { size: 'sm' }));
        res.appendChild(h('span', { class: 'badge ' + (v.score == null || v.score >= 85 ? 'green dot' : v.score >= 70 ? 'gold' : 'red') }, iconEl('stamp'), v.seal));
        res.appendChild(h('p', { text: v.text }));
        s.setActions([{ label: 'Bağla', kind: 'primary' }]);
      }, t + 250));
    });
  }
  function bigJob(title, verdict, opts) {
    opts = opts || {};
    return Promise.resolve(typeof verdict === 'function' ? verdict() : verdict).then(function (raw) {
      var v = normVerdict(raw);
      companion.set('point', { say: 'Bu böyük işdir — Mirzə Məclisini çağırıram.', ms: 2000 });
      var run = null;
      if (W.Meclis && typeof W.Meclis.run === 'function') {
        try { run = Promise.resolve(W.Meclis.run({ title: title || 'Mirzə Məclisi', durations: opts.durations, verdict: v })); }
        catch (e) { log(e); run = null; }
      }
      if (!run) run = jobFallback(title, v, opts.durations);
      return run.catch(function (e) { log(e); return v; }).then(function () {
        var sc = v.score;
        var st = sc == null || sc >= 85 ? 'celebrate' : sc >= 70 ? 'success' : 'worried';
        var say = sc == null ? 'Məclis işini bitirdi!' : sc >= 85 ? 'Məclis razıdır: ' + sc + ' bal!' : sc >= 70 ? sc + ' bal — bir neçə düzəliş qalıb.' : sc + ' bal. Birlikdə düzəldək.';
        later(function () { companion.set(st, { say: say, ms: 3000 }); }, 250);
        return v;
      });
    });
  }
  function demoCouncil() {
    bigJob('Nümunə: müqavilənin dərin yoxlanışı', { score: 92, text: 'Terminlər lüğətə uyğundur, rəqəmlər və tarixlər möhürləndi. Dilçi Nənə iki türk formasını düzəltdi.', seal: 'Təhvilə hazırdır' });
  }

  /* ------------------------------------------------------------------
     15. COMMAND PALETTE + SHORTCUTS
     ------------------------------------------------------------------ */
  var palOpen = false;
  function paletteItems() {
    var items = [];
    order.forEach(function (id) {
      var d = screens[id]; if (!d || d.hidden || d.nav === false) return;
      var other = !isAvail(d, curMode);
      items.push({ group: 'Ekranlar', label: titleOf(d), sub: other ? (d.mode === 'grammar' ? 'Qrammatika (Tenso)' : d.mode === 'academy' ? 'Akademiya' : curMode === 'grammar' ? 'Tərcümə' : 'Peşəkar') + ' rejiminə keçir' : (d.group || ''), icon: d.icon || 'star', run: function () { go(id); } });
    });
    var cfg = companionCfg();
    items.push(
      { group: 'Əmrlər', label: curMode === 'grammar' ? 'Tərcüməyə keç (Nuanza)' : 'Qrammatikaya keç (Tenso)', sub: 'Məhsulu dəyiş', icon: curMode === 'grammar' ? 'translate' : 'check', run: function () { setProduct(curMode === 'grammar' ? 'translate' : 'grammar'); } },
      { group: 'Əmrlər', label: curMode === 'pro' ? 'Akademiya rejiminə keç' : 'Peşəkar rejimə keç', sub: 'Alt + M', icon: curMode === 'pro' ? 'cap' : 'folder', run: function () { setMode(curMode === 'pro' ? 'academy' : 'pro'); } },
      { group: 'Əmrlər', label: effectiveTheme() === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç', sub: 'Alt + T', icon: effectiveTheme() === 'dark' ? 'sun' : 'moon', run: function () { setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark', els.themeToggle); } },
      { group: 'Əmrlər', label: 'Mirzə Məclisini çağır', sub: 'Nümunə yoxlama', icon: 'shield', run: demoCouncil },
      { group: 'Əmrlər', label: cfg.show ? 'Nuanzanı gizlət' : 'Nuanzanı göstər', sub: 'Yoldaş', icon: cfg.show ? 'eyeoff' : 'eye', run: function () { setCompanion({ show: !cfg.show }); if (!cfg.show) later(function () { companion.set('wave', { say: 'Yenə buradayam!', ms: 2400 }); }, 200); } },
      { group: 'Əmrlər', label: 'Girişi yenidən göstər', sub: 'Tanışlıq ekranı', icon: 'sparkle', run: onboarding },
      { group: 'Əmrlər', label: 'Klaviatura qısayolları', sub: '?', icon: 'keyboard', run: shortcuts }
    );
    return items;
  }
  function palette() {
    if (palOpen) return;
    palOpen = true;
    var all = paletteItems(), shown = [], active = 0, s;
    var input = h('input', { class: 'input', type: 'search', placeholder: 'Ekran və ya əmr axtarın…', 'aria-label': 'Ekran və ya əmr axtarın', autocomplete: 'off', spellcheck: 'false', autofocus: true, role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list' });
    var list = h('div', { class: 'sheet-pal-list', id: 'pal-list', role: 'listbox', 'aria-label': 'Nəticələr' });
    function run(it) { if (!it) return; if (s) s.close(); later(function () { try { it.run(); } catch (e) { log(e); } }, 40); }
    function paint() {
      var q = fold(input.value.trim());
      shown = all.filter(function (it) { return !q || fold(it.label + ' ' + it.sub + ' ' + it.group).indexOf(q) >= 0; });
      active = clamp(active, 0, Math.max(0, shown.length - 1));
      list.textContent = '';
      if (!shown.length) { list.appendChild(h('div', { class: 'sheet-pal-empty' }, 'Heç nə tapılmadı. «tərcümə», «layihə» və ya «rejim» yazın.')); return; }
      var lastG = null;
      shown.forEach(function (it, i) {
        if (it.group !== lastG) { lastG = it.group; list.appendChild(h('div', { class: 'sheet-pal-grp', 'aria-hidden': 'true', text: it.group })); }
        var b = h('button', {
          class: 'sheet-pal-it', type: 'button', role: 'option', id: 'pal-' + i, 'aria-selected': String(i === active), tabindex: '-1',
          onclick: function () { run(it); }, onmousemove: function () { if (active !== i) { active = i; mark(); } }
        }, h('span', { class: 'ic' + (it.group === 'Əmrlər' ? ' gold' : ''), html: icon(it.icon) }), h('span', { class: 'tx' }, it.label, it.sub ? h('small', { text: it.sub }) : null), h('span', { class: 'end', html: icon('arrow') }));
        list.appendChild(b);
      });
      mark();
    }
    function mark() {
      $$('.sheet-pal-it', list).forEach(function (b, i) { b.setAttribute('aria-selected', String(i === active)); });
      var cur = $('#pal-' + active, list);
      if (cur) { input.setAttribute('aria-activedescendant', cur.id); try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } }
    }
    input.addEventListener('input', function () { active = 0; paint(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(shown.length - 1, active + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); mark(); }
      else if (e.key === 'Home' && !input.value) { e.preventDefault(); active = 0; mark(); }
      else if (e.key === 'End' && !input.value) { e.preventDefault(); active = shown.length - 1; mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(shown[active]); }
    });
    var body = h('div', null, h('label', { class: 'input-ic' }, iconEl('search'), input), list);
    s = sheet({ title: 'Axtar və keç', body: body, cls: 'sheet-pal', onClose: function () { palOpen = false; } });
    paint();
  }
  function shortcuts() {
    var rows = [[[MOD, 'K'], 'Axtar və keç'], [['Alt', 'M'], 'Peşəkar ↔ Akademiya'], [['Alt', 'T'], 'İşıqlı ↔ qaranlıq rejim'], [['?'], 'Bu siyahı'], [['Esc'], 'Pəncərəni və ya menyunu bağla']];
    var list = h('div', { class: 'list' }, rows.map(function (r) {
      return h('div', { class: 'list-row' }, h('span', { class: 'tx' }, h('b', { text: r[1] })), h('span', { class: 'end' }, r[0].map(function (k) { return h('kbd', { class: 'kbd', text: k }); })));
    }));
    sheet({ title: 'Klaviatura qısayolları', body: list, cls: 'sheet-keys', actions: [{ label: 'Aydındır', kind: 'primary' }] });
  }

  /* ------------------------------------------------------------------
     16. ONBOARDING (first run splash; replayable)
     ------------------------------------------------------------------ */
  function onboarding() {
    if (onb) return;
    closeDrawer(false);
    var p = profile();
    var st = { step: 0, mode: curMode, pairs: (p.pairs || []).slice(), name: p.name };
    var restore = D.activeElement, done = false, nz = null;
    var el = h('div', { class: 'onb', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Nuanza-ya xoş gəldiniz' });
    var skip = h('button', { class: 'btn btn-ghost btn-sm onb-skip', type: 'button', onclick: function () { finish(true); } }, 'Keç');
    var star = frag('<svg class="onb-star" viewBox="-20 -20 40 40" aria-hidden="true"><path class="l-star" pathLength="1" d="M0 -19 4.22 -14.78 4.22 -11.61 7.39 -11.61 11.61 -7.39 11.61 -4.22 14.78 -4.22 19 0 14.78 4.22 11.61 4.22 11.61 7.39 7.39 11.61 4.22 11.61 4.22 14.78 0 19 -4.22 14.78 -4.22 11.61 -7.39 11.61 -11.61 7.39 -11.61 4.22 -14.78 4.22 -19 0 -14.78 -4.22 -11.61 -4.22 -11.61 -7.39 -7.39 -11.61 -4.22 -11.61 -4.22 -14.78Z"/><polygon class="l-ring" points="0,-10 10,0 0,10 -10,0"/><polygon class="l-dot" points="0,-5 5,0 0,5 -5,0"/></svg>');
    var stage = h('div', { class: 'onb-stage' });
    var rug = h('div', { class: 'onb-rug', 'aria-hidden': 'true' });
    var hero = h('div', { class: 'onb-hero' }, star, stage, rug);
    var host = h('div', { class: 'onb-host' });
    el.appendChild(skip);
    el.appendChild(h('div', { class: 'onb-in' }, hero, host));
    D.body.appendChild(el);
    var ov = { el: el, close: function () { finish(true); } };
    onb = ov; pushOverlay(ov);
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try { nz = W.Nuanza.mount(stage, { size: 'full' }); } catch (e) { log(e); nz = null; stage.textContent = ''; }
    }
    if (!nz) stage.appendChild(h('span', { class: 'medal xl pop', 'aria-hidden': 'true' }, h('b', { text: 'N' })));
    function nzSet(s, o) { if (nz && typeof nz.set === 'function') { try { nz.set(s, o || {}); } catch (e) { log(e); } } }
    later(function () { if (!done && st.step === 0) nzSet('wave', { say: 'Salam! Mən Nuanzayam.', ms: 2800 }); }, reducedMotion() ? 200 : 1300);

    function dots(i) { return h('div', { class: 'onb-dots', 'aria-hidden': 'true' }, [0, 1, 2, 3].map(function (k) { return h('i', { class: k === i ? 'on' : null }); })); }
    function choice(id, ic, icCls, title, sub) {
      return h('button', {
        class: 'choice', type: 'button', 'aria-pressed': String(st.mode === id),
        onclick: function (e) {
          st.mode = id;
          $$('.choice', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); });
          if (id === 'academy') nzSet('celebrate', { say: 'Şagirddən Ustada qədər — birlikdə!', ms: 2400 });
          else nzSet('write', { say: 'Əla! Layihələrinizi səliqəyə salaq.', ms: 2400 });
        }
      }, h('span', { class: 'ic ' + icCls, html: icon(ic) }), h('span', null, h('b', { text: title }), h('small', { text: sub })));
    }
    function step0() {
      return h('div', { class: 'onb-step' },
        h('span', { class: 'eyebrow' }, 'Bakıdan · tərcümə masası'),
        h('h1', { class: 'onb-h', id: 'onb-h', html: 'Salam, mən <em>Nuanza</em>yam' }),
        h('p', { class: 'onb-p', text: 'Tərcümə masanızın yoldaşıyam. Üslubu tanıyıram, terminləri qoruyuram, böyük işlərdə isə Mirzə Məclisini çağırıram.' }),
        h('div', { class: 'onb-actions' }, h('button', { class: 'btn btn-primary btn-lg', type: 'button', 'data-primary': '1', onclick: function () { show(1); } }, 'Tanış olaq', iconEl('arrow'))),
        dots(0));
    }
    function step1() {
      return h('div', { class: 'onb-step' },
        h('h1', { class: 'onb-h', id: 'onb-h', html: 'Necə <em>işləyirsiniz</em>?' }),
        h('p', { class: 'onb-p', text: 'Rejimi istənilən vaxt menyudan dəyişə bilərsiniz.' }),
        h('div', { class: 'onb-choices', role: 'group', 'aria-label': 'Rejim' },
          choice('pro', 'folder', 'fir', 'Peşəkar tərcüməçi', 'Layihələr, lüğət, tərcümə yaddaşı, QA və təhvil paketi'),
          choice('academy', 'cap', 'gold', 'Tələbə — Akademiya', 'Dərslər, missiyalar, səhv kartları, XP və rütbələr')),
        h('div', { class: 'onb-actions' },
          h('button', { class: 'btn btn-ghost btn-lg', type: 'button', onclick: function () { show(0); } }, iconEl('back'), 'Geri'),
          h('button', { class: 'btn btn-primary btn-lg', type: 'button', 'data-primary': '1', onclick: function () { show(2); } }, 'Davam et', iconEl('arrow'))),
        dots(1));
    }
    function step2() {
      var err = h('div', { class: 'onb-err', role: 'alert' });
      var chips = h('div', { class: 'chips onb-pairs', role: 'group', 'aria-label': 'Dil cütləri' }, PAIRS.map(function (pr) {
        return h('button', {
          class: 'chip', type: 'button', 'aria-pressed': String(st.pairs.indexOf(pr.id) >= 0), title: pr.name,
          onclick: function (e) {
            var i = st.pairs.indexOf(pr.id);
            if (i >= 0) st.pairs.splice(i, 1); else st.pairs.push(pr.id);
            e.currentTarget.setAttribute('aria-pressed', String(i < 0));
            err.textContent = '';
            if (i < 0) nzSet('success', { ms: 900 });
          }
        }, pr.label);
      }));
      return h('div', { class: 'onb-step' },
        h('h1', { class: 'onb-h', id: 'onb-h', html: 'Dil <em>cütləriniz</em>' }),
        h('p', { class: 'onb-p', text: 'Azərbaycan dilini ingilis, rus və türk dilləri ilə işləyirəm. Birdən çox cüt seçə bilərsiniz.' }),
        chips, err,
        h('div', { class: 'onb-actions' },
          h('button', { class: 'btn btn-ghost btn-lg', type: 'button', onclick: function () { show(1); } }, iconEl('back'), 'Geri'),
          h('button', {
            class: 'btn btn-primary btn-lg', type: 'button', 'data-primary': '1',
            onclick: function () {
              if (!st.pairs.length) { err.textContent = 'Ən azı bir dil cütü seçin.'; nzSet('worried', { say: 'Bir dil cütü lazımdır.', ms: 2200 }); return; }
              show(3);
            }
          }, 'Davam et', iconEl('arrow'))),
        dots(2));
    }
    /* Optional name step: "Keç" finishes without a name. */
    function step3() {
      var nameIn = h('input', {
        class: 'input', id: 'onb-name', value: st.name, autocomplete: 'name', placeholder: 'Məsələn, Leyla', maxlength: '60',
        oninput: function (e) { st.name = e.target.value; },
        onkeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(false); } }
      });
      return h('div', { class: 'onb-step' },
        h('h1', { class: 'onb-h', id: 'onb-h', html: 'Sizə necə <em>müraciət</em> edək?' }),
        h('p', { class: 'onb-p', text: 'İstəsəniz, adınızı yazın. Sonra ayarlardan dəyişə bilərsiniz.' }),
        h('div', { class: 'field onb-field' }, h('label', { for: 'onb-name' }, 'Adınız (istəyə bağlı)'), nameIn),
        h('div', { class: 'onb-actions' },
          h('button', { class: 'btn btn-ghost btn-lg', type: 'button', onclick: function () { st.name = ''; finish(false); } }, 'Keç'),
          h('button', { class: 'btn btn-primary btn-lg', type: 'button', 'data-primary': '1', onclick: function () { finish(false); } }, 'Başlayaq', iconEl('sparkle'))),
        dots(3));
    }
    function show(i) {
      st.step = i;
      hero.classList.toggle('small', i > 0);
      host.textContent = '';
      host.appendChild([step0, step1, step2, step3][i]());
      el.setAttribute('aria-labelledby', 'onb-h'); el.removeAttribute('aria-label');
      if (i === 1) nzSet('point', { say: 'Əvvəlcə bir sual: necə işləyirsiniz?', ms: 2600 });
      if (i === 2) nzSet('read', { say: 'Hansı dillərlə işləyirik?', ms: 2400 });
      if (i === 3) nzSet('wave', { say: 'Tanış olaq?', ms: 2000 });
      try { el.scrollTop = 0; } catch (e) { /* ignore */ }
      focusSoon(i === 3 ? $('#onb-name', host) : $('[data-primary]', host));
    }
    function finish(skipped) {
      if (done) return; done = true;
      iset('onboarded', true);
      if (!skipped) {
        var patch = { pairs: st.pairs.slice() };
        var nm = String(st.name || '').trim(); if (nm) patch.name = nm.slice(0, 60);
        setProfile(patch);
      }
      if (st.mode !== curMode && !skipped) setMode(st.mode, { silent: true });
      var first = profile().firstName;
      if (!skipped) {
        nzSet('celebrate', { say: first ? 'Hazırıq! Xoş gəldiniz, ' + first + '.' : 'Hazırıq! Xoş gəldiniz.', ms: 1600 });
        if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') { try { W.NuanzaFX.burst(W.innerWidth / 2, W.innerHeight * 0.38, 'confetti'); } catch (e) { log(e); } }
      }
      later(function () {
        el.classList.add('out');
        popOverlay(ov); onb = null;
        later(function () { try { if (nz && nz.destroy) nz.destroy(); } catch (e) { log(e); } if (el.parentNode) el.parentNode.removeChild(el); }, 380);
        go('hub', {}, { focus: false });
        restoreFocus(restore && restore !== D.body ? restore : null);
        if (!skipped) {
          toast(first ? 'Xoş gəldiniz, ' + first + '!' : 'Xoş gəldiniz!', 'ok', { sub: 'Məhsulu seçin: Tərcümə və ya Qrammatika', icon: 'sparkle' });
          later(function () { if (current && current.id === 'hub') return; companion.set('wave', { say: 'Mən buradayam — lazım olsam, toxunun.', ms: 3200 }); }, 700);
        }
      }, skipped ? 0 : 950);
    }
    show(0);
  }

  /* ------------------------------------------------------------------
     17. GLOBAL EVENTS + START
     ------------------------------------------------------------------ */
  var lastAct = Date.now(), sleeping = false;
  function activity() {
    lastAct = Date.now();
    if (sleeping) { sleeping = false; companion.set('surprised', { ms: 900 }); later(function () { companion.set('idle', {}); }, 1000); }
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (overlays.length) { e.preventDefault(); overlays[overlays.length - 1].close(); return; }
      if (drawerOpen) { e.preventDefault(); closeDrawer(true); return; }
    }
    if (e.key === 'Tab') {
      var top = overlays.length ? overlays[overlays.length - 1].el : (drawerOpen && !isDesktop() ? els.drawer : null);
      if (top) trapTab(top, e);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (!onb) palette(); return; }
    if (overlays.length || isTyping(e.target)) return;
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === 'KeyM') { e.preventDefault(); setMode(curMode === 'pro' ? 'academy' : 'pro'); return; }
      if (e.code === 'KeyT') { e.preventDefault(); setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark', els.themeToggle); return; }
    }
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); shortcuts(); }
  }
  var scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = W.requestAnimationFrame(function () { scrollRaf = 0; if (els.hdr) els.hdr.classList.toggle('scrolled', (W.scrollY || W.pageYOffset || 0) > 4); });
  }
  function greet() {
    var p = profile(), hr = new Date().getHours(), g, nm = p.firstName ? ', ' + p.firstName : '';
    if (hr >= 5 && hr < 12) g = 'Sabahınız xeyir' + nm + '!';
    else if (hr >= 12 && hr < 18) g = 'Gününüz xeyir' + nm + '!';
    else if (hr >= 18 && hr < 23) g = 'Axşamınız xeyir' + nm + '!';
    else g = 'Gecə növbəsi? Çay dəmləyin, mən buradayam.';
    var tail = curMode === 'grammar' ? ' Bu gün nə yazırıq? Birlikdə yoxlayaq.' : curMode === 'academy' ? (p.streak > 0 ? ' Seriyanı qoruyaq — bu gün bir dərs?' : ' Bu gün bir dərslə başlayaq?') : ' Bu gün nə tərcümə edirik?';
    chatter('wave', hr >= 23 || hr < 5 ? g : g + tail, 3600);
  }
  function start() {
    if (started) return;
    R.lang = 'az';
    try { W.history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
    css('shell', SHELL_CSS);
    curMode = normMode(store.get('mode', 'pro'));
    if (curMode === 'grammar' && store.get('product', '') === 'translate') curMode = transMode();
    applyTheme(store.get('theme', 'dark'));
    applyMotion();
    buildShell();
    syncModeUI();
    renderProfile();
    buildNav(false);
    syncDrawerInert();
    updateThemeToggle();

    if (els.burger) els.burger.addEventListener('click', toggleDrawer);
    if (els.scrim) els.scrim.addEventListener('click', function () { closeDrawer(true); });
    if (els.brand) els.brand.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(screens.hub ? 'hub' : 'home'); });
    if (els.prodSeg) els.prodSeg.addEventListener('click', function (e) { var b = e.target.closest('button[data-prod]'); if (b) setProduct(b.getAttribute('data-prod')); });
    if (els.hdrAvatar) els.hdrAvatar.addEventListener('click', function () { if (screens.settings) go('settings'); else toast('Ayarlar hələ yüklənməyib', 'info'); });
    if (els.drProfile) els.drProfile.addEventListener('click', function () { if (screens.settings) go('settings'); else toast(profile().name, 'info', { sub: profile().role }); });
    if (els.modeSeg) els.modeSeg.addEventListener('click', function (e) { var b = e.target.closest('button[data-mode]'); if (b) setMode(b.getAttribute('data-mode')); });
    if (els.themeToggle) els.themeToggle.addEventListener('click', toggleTheme);
    if (els.search) els.search.addEventListener('click', function () { closeDrawer(false); palette(); });
    if (els.companion) els.companion.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[class*="bubble"],[data-nz-ignore]')) return;
      var before = overlays.length;
      later(function () { if (!menuOpen && overlays.length === before && !$('.sheet.on')) companionMenu(); }, 80);
    });
    var skipLink = $('.skip-link');
    if (skipLink) skipLink.addEventListener('click', function (e) { e.preventDefault(); var s = current && current.el; if (s) { try { s.focus(); } catch (x) { /* ignore */ } } });
    enableDrawerSwipe();

    D.addEventListener('keydown', onKey);
    D.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-go]') : null;
      if (t && !t.closest('.dr-nav')) { e.preventDefault(); go(t.getAttribute('data-go')); }
    });
    W.addEventListener('hashchange', onHash);
    W.addEventListener('scroll', onScroll, { passive: true });
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { W.addEventListener(ev, activity, { passive: true }); });
    onMq(mqDesk, function () { if (isDesktop()) closeDrawer(false); syncDrawerInert(); lockScroll(); });
    onMq(mqDark, updateThemeToggle);
    onMq(mqReduce, function () {
      if (motionPref() !== 'system') return;
      emit('motion', 'system');
      try { if (W.Nuanza && typeof W.Nuanza.applyConfig === 'function') W.Nuanza.applyConfig(); } catch (e) { log(e); }
    });
    setInterval(function () {
      if (!sleeping && Date.now() - lastAct > 120000 && !overlays.length && companionCfg().show) { sleeping = true; companion.set('sleep', {}); }
    }, 15000);

    mountCompanion();
    started = true;

    var id = hashId();
    if (id === 'home' && curMode === 'grammar' && screens.grammar) id = 'grammar';
    var prod = store.get('product', '');
    var firstId = !store.get('onboarded', false) || !prod ? (screens.hub ? 'hub' : 'home') : homeId();
    var startId = screens[id] ? id : (screens[firstId] ? firstId : (screens.home ? 'home' : (order[0] || 'home')));
    renderScreen(startId, hashParams(), { focus: false });
    if (W.location.hash && id && id !== startId && id !== 'onboarding' && id !== 'intro') { try { W.history.replaceState(null, '', '#' + startId); } catch (e) { /* sandboxed */ } }

    if (!store.get('onboarded', false) || id === 'onboarding' || id === 'intro') later(onboarding, 60);
    else later(greet, 1200);
    onScroll();
    emit('ready', { version: VERSION });
  }

  /* ------------------------------------------------------------------
     17b. HUB — məhsul seçimi: Tərcümə (Nuanza) · Qrammatika (Tenso)
     ------------------------------------------------------------------ */
  var hubMounts = [];
  function hubLeave() { hubMounts.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { log(e); } }); hubMounts = []; syncModeUI(); }
  function renderHub(sec) {
    /* the hub belongs to the umbrella brand, not to one product */
    W.setTimeout(syncModeUI, 0);
    hubLeave();
    var p = profile(), last = store.get('product', '');
    function card(prod, who, cls, eyebrow, title, text, feats, cta) {
      var art = h('span', { class: 'hub-art', 'aria-hidden': 'true' });
      var b = h('button', { class: 'hub-card ' + cls, type: 'button', 'data-prod': prod, 'aria-label': title + ' — ' + text, onclick: function () { setProduct(prod); } },
        h('span', { class: 'hub-top' }, art, last === prod ? h('span', { class: 'badge hub-last', text: 'Son seçim' }) : null),
        h('span', { class: 'hub-tx' },
          h('span', { class: 'hub-eb', text: eyebrow }),
          h('b', { class: 'hub-h', text: title }),
          h('span', { class: 'hub-p', text: text }),
          h('span', { class: 'hub-feats' }, feats.map(function (f) { return h('span', { class: 'hub-f', text: f }); }))),
        h('span', { class: 'hub-go' }, cta, iconEl('arrow')));
      var inst = null;
      if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
        try { inst = W.Nuanza.mount(art, { size: 'mini', who: who }); if (inst && inst.set) inst.set('wave', {}); } catch (e) { log(e); inst = null; }
      }
      if (inst) hubMounts.push(inst);
      else art.appendChild(h('span', { class: 'medal', 'aria-hidden': 'true' }, h('b', { text: who === 'tenso' ? 'T' : 'N' })));
      return b;
    }
    sec.appendChild(h('div', { class: 'page hub' },
      h('div', { class: 'page-h' }, h('div', null,
        h('span', { class: 'eyebrow', text: 'Loquela · məhsullar' }),
        h('h1', { html: p.firstName ? 'Salam, <em>' + esc(p.firstName) + '</em>. Nə edirik?' : 'Bu gün <em>nə</em> edirik?' }),
        h('p', { text: 'Loquela — iki məhsul, bir hesab: Nuanza tərcümə edir, Tenso ingilis dilini öyrədir. Başlıqdakı loqoya toxunub istənilən vaxt buraya qayıdın.' }))),
      h('div', { class: 'hub-grid' },
        card('translate', 'nuanza', 'hub-tr', 'Nuanza', 'Tərcümə', 'Tərcümə masası: layihələr, redaktor, QA və Akademiya.', ['EN/RU/TR ↔ AZ', 'Mirzə Məclisi', 'Akademiya'], 'Tərcüməyə keç'),
        card('grammar', 'tenso', 'hub-gr', 'Tenso', 'Qrammatika · Tenso', 'İngilis dili · yazdığını yoxla, səhvdən öyrən', ['Yoxla və düzəlt', 'A1–C1 kursu', 'Gündəlik yazı'], 'Qrammatikaya keç')),
      h('p', { class: 'small muted hub-note', text: 'Tenso əsasən ingilis dilini öyrənən azərbaycanlılar üçündür; Azərbaycan dilində mətn yoxlaması da var.' })));
  }
  register('hub', { title: 'Məhsullar', icon: 'grid', group: 'Ümumi', mode: 'any', nav: false, render: renderHub, leave: hubLeave });

  /* ------------------------------------------------------------------
     18. PUBLIC API
     ------------------------------------------------------------------ */
  assign(App, {
    version: VERSION,
    start: start,
    register: register,
    go: go,
    back: function () { try { W.history.back(); } catch (e) { go('home'); } },
    current: function () { return current ? current.id : null; },
    params: function () { return current ? current.params : {}; },
    rerender: rerender,
    screens: function () { return order.map(function (id) { return screens[id]; }); },
    refreshNav: function () { buildNav(false); },
    mode: mode,
    setMode: setMode,
    setProduct: setProduct,
    product: function () { return curMode === 'grammar' ? 'grammar' : 'translate'; },
    store: store,
    profile: profile,
    setProfile: setProfile,
    h: h,
    icon: icon,
    iconEl: iconEl,
    icons: Object.keys(ICONS),
    logo: logoSvg,
    toast: toast,
    sheet: sheet,
    confirm: confirmDlg,
    css: css,
    ring: ring,
    fakeAI: fakeAI,
    ai: fakeAI,
    mockAI: mockAI,
    isLive: liveAI,
    say: function (text, ms) { companion.say(text, ms); return companion; },
    companion: companion,
    companionMenu: companionMenu,
    setCompanion: setCompanion,
    companionConfig: companionCfg,
    bigJob: bigJob,
    meclis: bigJob,
    palette: palette,
    shortcuts: shortcuts,
    onboarding: onboarding,
    onboard: onboarding,
    showOnboarding: onboarding,
    replayOnboarding: onboarding,
    intro: onboarding,
    openDrawer: openDrawer,
    closeDrawer: function () { closeDrawer(false); },
    theme: function () { return store.get('theme', 'dark'); },
    effectiveTheme: effectiveTheme,
    setTheme: function (t) { setTheme(t, null); },
    toggleTheme: function () { toggleTheme(null); },
    setMotion: setMotion,
    motion: function () { return normMotion(store.get('motion', 'full')); },
    reducedMotion: reducedMotion,
    isDesktop: isDesktop,
    on: on,
    emit: emit,
    fmt: fmt,
    esc: esc,
    fold: fold,
    initials: initials,
    pairLabel: pairLabel,
    pairsShort: pairsShort,
    rank: rankOf,
    /* An elder's painted face (Meclis.portrait) as an avatar; null when the Məclis art is unavailable. */
    elderFace: function (name, cls) {
      var M = W.Meclis, idx = -1;
      if (!M || !M.elders || typeof M.portrait !== 'function') return null;
      for (var i = 0; i < M.elders.length; i++) { var e = M.elders[i]; if (e.name === name || e.short === name || e.id === name) { idx = i; break; } }
      if (idx < 0) return null;
      var s = D.createElement('span');
      s.className = 'avatar face' + (cls ? ' ' + cls : '');
      s.setAttribute('aria-hidden', 'true');
      try { s.innerHTML = M.portrait(idx); } catch (e2) { return null; }
      return s;
    },
    fx: {
      burst: function (x, y, kind) { if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') { try { W.NuanzaFX.burst(x, y, kind || 'stars'); } catch (e) { log(e); } } },
      burstAt: function (el, kind) {
        if (!el || !el.getBoundingClientRect) return;
        var r = el.getBoundingClientRect();
        App.fx.burst(r.left + r.width / 2, r.top + r.height / 2, kind);
      },
      xp: function (x, y, text) { if (W.NuanzaFX && typeof W.NuanzaFX.xp === 'function') { try { W.NuanzaFX.xp(x, y, text); } catch (e) { log(e); } } },
      medal: function (rank) { if (W.NuanzaFX && typeof W.NuanzaFX.medal === 'function') { try { W.NuanzaFX.medal(rank); } catch (e) { log(e); } } }
    },
    data: {
      PAIRS: PAIRS, LANGS: LANGS, REGISTERS: REGISTERS, RANKS: RANKS, ELDERS: ELDERS,
      GLOSSARY: GLOSSARY, SAMPLES: SAMPLES, LESSONS: LESSONS, CARDS: CARDS, TIPS: TIPS
    },
    detect: { lang: detectLang, register: detectRegister }
  });
  App.PAIRS = PAIRS; App.REGISTERS = REGISTERS; App.RANKS = RANKS; App.ELDERS = ELDERS; App.samples = SAMPLES;
})();
