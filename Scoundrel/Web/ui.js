/* Scoundrel UI */
(function () {
  'use strict';
  var S = window.Scoundrel, A = window.ScoundrelArt;
  var $ = function (id) { return document.getElementById(id); };
  var STORE_KEY = 'scoundrel.v1';
  var ROOM_BGS = []; for (var r = 1; r <= 10; r++) ROOM_BGS.push('assets/bg/room' + r + '.webp');
  var EXIT_BG = 'assets/bg/exit.webp';
  var WIN_BGS = ['assets/bg/survived1.webp', 'assets/bg/survived2.webp'];
  var DIE_BGS = ['assets/bg/died1.webp', 'assets/bg/died2.webp'];

  var state, settings = { maxHp: S.DEFAULT_HP, haptics: true }, seenRules = false;
  var busy = false, currentBg = null, bgFront = 'A';

  /* ---------- persistence (localStorage + native bridge fallback) ---------- */
  function save() {
    var data = JSON.stringify({ state: state, settings: settings, seenRules: seenRules });
    try { localStorage.setItem(STORE_KEY, data); } catch (e) {}
    try { window.webkit.messageHandlers.store.postMessage(data); } catch (e) {}
  }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (!raw && typeof window.__NATIVE_SAVE__ === 'string') raw = window.__NATIVE_SAVE__;
    if (!raw) return false;
    try {
      var d = JSON.parse(raw);
      if (d.settings) {
        settings.maxHp = d.settings.maxHp || S.DEFAULT_HP;
        settings.haptics = d.settings.haptics !== false;
      }
      seenRules = !!d.seenRules;
      if (d.state && d.state.room && !d.state.over) { state = d.state; return true; }
    } catch (e) {}
    return false;
  }

  /* ---------- haptics ---------- */
  function haptic(kind, amount) {
    if (!settings.haptics) return;
    try { window.webkit.messageHandlers.haptic.postMessage({ kind: kind, amount: amount || 0 }); return; } catch (e) {}
    try {
      var pattern = { tap: 8, hit: [20, 30, 40], kill: 25, equip: 15, heal: [10, 40, 10], warning: [30, 50, 30], flee: 20, death: [60, 40, 120], win: [20, 40, 20, 40, 60] }[kind];
      if (pattern && navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function cardHTML(card, extraCls) {
    var cls = 'card ' + card.type + (card.type === 'monster' && card.value >= 11 ? ' royal' : '') + (extraCls ? ' ' + extraCls : '');
    var corner = card.type === 'monster' ? 'skull' : card.type === 'weapon' ? 'sword' : 'heart';
    return '<div class="' + cls + '" data-id="' + card.id + '">' +
      '<div class="corner">' + A.icon(corner) + '</div>' +
      '<div class="val' + (isNaN(card.rank) ? ' face' : '') + '">' + card.rank + '</div>' +
      A.cardArt(card) +
      '<div class="name">' + S.cardName(card) + '</div></div>';
  }

  var HERO_SVG =
    '<svg viewBox="0 0 100 100" aria-hidden="true"><defs>' +
    '<radialGradient id="hGlow" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".38"/><stop offset=".55" stop-color="#b8461c" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="hCloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3430"/><stop offset=".6" stop-color="#1c1917"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>' +
    '<radialGradient id="hFace" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#050404"/><stop offset="1" stop-color="#1a1513"/></radialGradient>' +
    '<radialGradient id="hEye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<circle cx="50" cy="50" r="48" fill="url(#hGlow)"/>' +
    '<g filter="url(#ink)">' +
    '<path d="M6 100 Q10 76 28 67 Q38 62 50 62 Q62 62 72 67 Q90 76 94 100 Z" fill="url(#hCloak)" stroke="#ece6d6" stroke-width="1.1" stroke-opacity=".75"/>' +
    '<path d="M30 74 Q34 88 30 100 M70 74 Q66 88 70 100 M50 80 L50 100" fill="none" stroke="#5a524b" stroke-width="1"/>' +
    '<path d="M22 66 Q17 44 26 30 Q36 15 50 15 Q64 15 74 30 Q83 44 78 66 Q66 75 50 75 Q34 75 22 66 Z" fill="url(#hCloak)" stroke="#ece6d6" stroke-width="1.3" stroke-opacity=".85"/>' +
    '<path d="M30 28 Q40 20 50 20 M27 40 Q30 32 36 27" fill="none" stroke="#6d645b" stroke-width="1"/>' +
    '<path d="M74 34 Q80 46 76 62" fill="none" stroke="#ff9a4a" stroke-width="1.2" stroke-opacity=".45"/>' +
    '<path d="M32 60 Q30 38 50 33 Q70 38 68 60 Q62 69 50 70 Q38 69 32 60 Z" fill="url(#hFace)"/>' +
    '</g>' +
    '<ellipse cx="42.5" cy="50" rx="5" ry="3" fill="url(#hEye)"/><ellipse cx="57.5" cy="50" rx="5" ry="3" fill="url(#hEye)"/>' +
    '<ellipse cx="42.5" cy="50" rx="1.8" ry=".8" fill="#ffe2b0"/><ellipse cx="57.5" cy="50" rx="1.8" ry=".8" fill="#ffe2b0"/>' +
    '<g filter="url(#ink)">' +
    '<path d="M28 70 Q50 82 72 70 Q74 76 70 80 Q50 89 30 80 Q26 76 28 70 Z" fill="#5e1513" stroke="#ece6d6" stroke-width="1" stroke-opacity=".6"/>' +
    '<path d="M62 80 Q66 90 62 99 L57 98 Q60 90 58 82 Z" fill="#4a100f" stroke="#ece6d6" stroke-width=".8" stroke-opacity=".5"/>' +
    '<circle cx="50" cy="82" r="2.2" fill="#c9a24a" stroke="#120c09" stroke-width=".6"/>' +
    '</g>' +
    '<path d="M4 96 Q24 88 44 95 T96 92" fill="none" stroke="#b7ae9b" stroke-width="3" stroke-opacity=".08"/>' +
    '<path d="M0 90 Q30 84 52 90 T100 86" fill="none" stroke="#b7ae9b" stroke-width="2" stroke-opacity=".06"/>' +
    '</svg>';

  /* ---------- background ---------- */
  // fog: one random start for the whole session
  function randomFog() {
    var f = $('fog'); if (!f) return;
    f.style.setProperty('--fog1', (0.24 + Math.random() * 0.04).toFixed(2));
    f.style.setProperty('--fog2', (0.16 + Math.random() * 0.04).toFixed(2));
    f.style.setProperty('--fogd1', (-Math.random() * 30).toFixed(1) + 's');
    f.style.setProperty('--fogd2', (-Math.random() * 22).toFixed(1) + 's');
  }

  function setBg(url) {
    if (url === currentBg) return;
    currentBg = url;
    var front = $('bg' + bgFront), back = $('bg' + (bgFront === 'A' ? 'B' : 'A'));
    bgFront = bgFront === 'A' ? 'B' : 'A';
    // swap only once the picture is loaded, then let the fog in
    var img = new Image();
    img.onload = img.onerror = function () {
      if (currentBg !== url) return;
      back.style.backgroundImage = 'url(' + url + ')';
      back.style.opacity = 1; front.style.opacity = 0;
      var f = $('fog'); if (f) f.classList.add('on');
    };
    img.src = url;
  }
  function bgForState() {
    if (state.deck.length === 0) return EXIT_BG;
    return ROOM_BGS[(state.roomNo - 1) % ROOM_BGS.length];
  }

  /* ---------- rendering ---------- */
  function renderTop() {
    var cardsLeft = state.deck.length + state.room.length;
    var monsLeft = state.deck.concat(state.room).filter(function (c) { return c.type === 'monster'; }).length;
    $('deckinfo').innerHTML = A.icon('cards') + cardsLeft + '<span class="mons">' + A.icon('skull') + monsLeft + '</span>';
    $('roomtitle').textContent = state.deck.length === 0 ? 'Final room' : 'Room ' + state.roomNo;
  }

  function chipsFor(card) {
    if (card.type === 'monster') {
      var p = S.damagePreview(state, card);
      var bestFist = p.weapon === null || p.fist <= p.weapon;
      return '<div class="chips">' +
        '<button class="chip' + (bestFist ? ' best' : '') + '" data-mode="fist" aria-label="Fight bare-handed">' + A.icon('fist') + p.fist + '</button>' +
        '<button class="chip' + (p.weapon === null ? ' off' : (!bestFist ? ' best' : '')) + '" data-mode="weapon" aria-label="Fight with weapon">' +
          A.icon('sword') + (p.weapon === null ? '–' : p.weapon) + '</button></div>';
    }
    if (card.type === 'potion') {
      if (state.potionUsed) return '<div class="chips"><button class="chip warn" data-mode="auto" aria-label="Discard potion">wasted</button></div>';
      var heal = Math.min(state.maxHp, state.hp + card.value) - state.hp;
      return '<div class="chips"><button class="chip good" data-mode="auto" aria-label="Drink potion">' + A.icon('heart') + '+' + heal + '</button></div>';
    }
    return '<div class="chips"><button class="chip equip" data-mode="auto" aria-label="Equip weapon">' + A.icon('sword') + (state.weapon ? 'swap' : 'equip') + '</button></div>';
  }

  // keep each card in the slot it was dealt into
  var slots = [null, null, null, null];
  function assignSlots() {
    var ids = {}; state.room.forEach(function (c) { ids[c.id] = c; });
    slots = slots.map(function (id) { return id !== null && ids[id] ? id : null; });
    state.room.forEach(function (c) {
      if (slots.indexOf(c.id) === -1) { var k = slots.indexOf(null); if (k !== -1) slots[k] = c.id; }
    });
  }

  // equipped weapon: random lean of 1.5°–3.5° to either side, stable per weapon
  function weaponTilt(id) {
    var t = parseFloat(tiltFor(id + 97)) / 1.2;           // -1..1
    var mag = 1.5 + Math.abs(t) * 2;
    return ((t < 0 ? -1 : 1) * mag).toFixed(2);
  }

  // subtle, random-looking but stable tilt per card (-1.2° to 1.2°)
  var tiltSeed = Math.floor(Math.random() * 1000);
  function tiltFor(id) {
    var x = Math.sin((id + 1) * 12.9898 + tiltSeed * 78.233) * 43758.5453;
    return ((x - Math.floor(x)) * 2.4 - 1.2).toFixed(2);
  }

  function renderRoom(newIds) {
    var room = $('room');
    room.innerHTML = '';
    assignSlots();
    slots.forEach(function (id) {
      var i = -1;
      state.room.forEach(function (c, k) { if (c.id === id) i = k; });
      if (i === -1) { room.appendChild(el('<div class="cell"><div class="card empty" style="visibility:hidden"></div></div>')); return; }
      var card = state.room[i];
      var isNew = newIds && newIds[card.id] !== undefined;
      var cell = el('<div class="cell" data-id="' + card.id + '">' + cardHTML(card, isNew ? 'deal' : '') + chipsFor(card) + '</div>');
      var c = cell.querySelector('.card');
      c.style.setProperty('--tilt', tiltFor(card.id) + 'deg');
      if (isNew) c.style.animationDelay = (newIds[card.id] * 90) + 'ms';
      c.addEventListener('click', function () { if (dragJustEnded) return; actId(card.id, 'auto'); });
      attachDrag(c, card);
      cell.querySelectorAll('[data-mode]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); actId(card.id, b.getAttribute('data-mode')); });
      });
      room.appendChild(cell);
    });
  }
  /* ---------- drag & drop ---------- */
  var dragJustEnded = false;
  function roomIndex(id) { var i = -1; state.room.forEach(function (x, k) { if (x.id === id) i = k; }); return i; }
  function hit(el, x, y, pad) {
    var r = el.getBoundingClientRect();
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }
  // zones a room card can be dropped on
  function roomCardZones(card) {
    var z = [], hero = $('hero'), weap = $('weaponSlot');
    if (card.type === 'monster') {
      var p = S.damagePreview(state, card);
      if (hero) z.push({ el: hero, mode: 'fist', lethal: p.fist >= state.hp });
      if (weap && state.weapon) z.push({ el: weap, mode: 'weapon', ok: S.weaponCanHit(state, card), lethal: p.weapon !== null && p.weapon >= state.hp });
    } else if (card.type === 'weapon') {
      if (weap) z.push({ el: weap, mode: 'auto' });
    } else if (hero) z.push({ el: hero, mode: 'auto' });
    return z;
  }
  // zones the equipped weapon can be dropped on: monsters in the room
  function weaponZones() {
    var z = [];
    state.room.forEach(function (c) {
      if (c.type !== 'monster') return;
      var cell = $('room').querySelector('.cell[data-id="' + c.id + '"] .card');
      var p = S.damagePreview(state, c);
      if (cell) z.push({ el: cell, id: c.id, mode: 'weapon', ok: S.weaponCanHit(state, c), card: c, lethal: p.weapon !== null && p.weapon >= state.hp });
    });
    return z;
  }
  function dullMsg(card) {
    state.message = 'Your weapon is too dull for the ' + S.monsterName(card) + '.';
    renderMessage(true); haptic('warning');
  }

  // generic drag: el = the card element, getZones() -> [{el, ok}], onDrop(zone, ghost) -> true if handled
  function makeDraggable(el, getZones, onDrop) {
    el.addEventListener('pointerdown', function (e) {
      if (busy || state.over || (e.button && e.button !== 0)) return;
      var pid = e.pointerId, sx = e.clientX, sy = e.clientY, px = sx, py = sy;
      var r0 = el.getBoundingClientRect(), offX = sx - r0.left, offY = sy - r0.top;
      var ghost = null, zones = null, over = null, raf = 0, noGo = [];
      function frame() {
        raf = 0;
        ghost.style.transform = 'translate3d(' + (px - offX) + 'px,' + (py - offY) + 'px,0) rotate(' + Math.max(-8, Math.min(8, (px - sx) / 40)).toFixed(1) + 'deg) scale(1.12)';
        var z = null;
        for (var k = 0; k < zones.length; k++) if (hit(zones[k].el, px, py, 16)) { z = zones[k]; break; }
        if (z !== over) {
          if (over) over.el.classList.remove('drop-hover', 'drop-bad');
          over = z;
          if (over) { over.el.classList.add(over.ok === false ? 'drop-bad' : 'drop-hover'); haptic('tap'); }
        }
      }
      function move(ev) {
        if (ev.pointerId !== pid) return;
        px = ev.clientX; py = ev.clientY;
        if (!ghost) {
          if (Math.abs(px - sx) + Math.abs(py - sy) < 10) return;
          ghost = el.cloneNode(true);
          ghost.classList.remove('deal', 'slain'); ghost.classList.add('drag');
          ghost.removeAttribute('style');
          ghost.style.width = r0.width + 'px'; ghost.style.height = r0.height + 'px';
          ghost.style.transformOrigin = offX + 'px ' + offY + 'px';
          ghost.style.transform = 'translate3d(' + r0.left + 'px,' + r0.top + 'px,0)';
          document.body.appendChild(ghost);
          el.style.visibility = 'hidden';
          zones = getZones();
          zones.forEach(function (z) { z.el.classList.add(z.ok === false ? 'drop-off' : 'drop-target'); if (z.lethal && z.ok !== false) z.el.classList.add('drop-lethal'); });
          noGo = allSpots().filter(function (s) { return s !== el && !zones.some(function (z) { return z.el === s; }); });
          noGo.forEach(function (s) { s.classList.add('drop-no'); });
          frame();
          haptic('tap');
        }
        if (ev.cancelable) ev.preventDefault();
        if (!raf) raf = requestAnimationFrame(frame);
      }
      function end(ev) {
        if (ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (!ghost) return;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        dragJustEnded = true; setTimeout(function () { dragJustEnded = false; }, 60);
        var z = null;
        if (ev.type === 'pointerup') for (var k = 0; k < zones.length; k++) if (hit(zones[k].el, ev.clientX, ev.clientY, 16)) { z = zones[k]; break; }
        zones.forEach(function (q) { q.el.classList.remove('drop-target', 'drop-off', 'drop-hover', 'drop-bad', 'drop-lethal'); });
        noGo.forEach(function (s) { s.classList.remove('drop-no'); });
        if (z && z.ok !== false && onDrop(z, ghost)) return;
        if (z && z.ok === false && z.card) dullMsg(z.card);
        // snap back
        ghost.style.setProperty('transition', 'transform .22s ease', 'important');
        ghost.style.transform = 'translate3d(' + r0.left + 'px,' + r0.top + 'px,0)';
        setTimeout(function () { ghost.remove(); el.style.visibility = ''; }, 240);
      }
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  }

  // every place a card could land, used to dim the ones that aren't allowed
  function allSpots() {
    var s = [];
    if ($('hero')) s.push($('hero'));
    if ($('weaponSlot')) s.push($('weaponSlot'));
    Array.prototype.forEach.call($('room').querySelectorAll('.cell[data-id] .card'), function (c) { s.push(c); });
    return s;
  }

  function attachDrag(c, card) {
    makeDraggable(c, function () {
      var z = roomCardZones(card);
      z.forEach(function (q) { if (q.ok === false) q.card = card; });
      return z;
    }, function (z, ghost) {
      var i = roomIndex(card.id);
      if (i === -1) return false;
      act(i, z.mode, ghost);
      return true;
    });
  }

  function attachWeaponDrag() {
    var wc = state.weapon && $('wstack') && $('wstack').querySelector('.card:not(.slain)');
    if (!wc) return;
    wc.classList.add('grab');
    makeDraggable(wc, weaponZones, function (z, ghost) {
      var i = roomIndex(z.id);
      if (i === -1) return false;
      act(i, 'weapon', null, ghost);
      return true;
    });
  }

  function actId(id, mode) {
    var i = -1; state.room.forEach(function (c, k) { if (c.id === id) i = k; });
    if (i !== -1) act(i, mode);
  }

  function renderDeck() {
    var n = state.deck.length, html = '<div class="pile" id="pile">';
    if (n === 0) html += '<div class="card empty">' + A.icon('door') + '<br>Deck empty</div>';
    for (var i = 0; i < Math.min(n, 4); i++) html += '<div class="card back" style="transform:translate(' + (i * 2) + 'px,' + (-i * 2) + 'px)"></div>';
    if (n) html += '<div class="count">' + n + '</div>';
    html += '</div><div class="label">Deck</div>';
    $('deckSlot').innerHTML = html;
  }

  function renderHero() {
    var pct = Math.max(0, state.hp) / state.maxHp * 100;
    $('heroSlot').innerHTML = '<div class="hero' + (state.hp <= Math.max(5, state.maxHp * 0.25) ? ' low' : '') + '" id="hero"><div class="portrait"></div><div class="hmist"><i></i></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="hp">' + Math.max(0, state.hp) + '<small>/' + state.maxHp + '</small></div></div>' +
      '<div class="label">Health</div>';
  }

  function renderWeapon() {
    var w = state.weapon, html = '<div class="wstack" id="wstack">';
    if (!w) {
      html += '<div class="card empty">' + A.icon('fist') + '<br>No weapon</div>';
    } else {
      html += cardHTML(w.card).replace('class="card', 'style="--wtilt:' + weaponTilt(w.card.id) + 'deg" class="card');
      var n = w.slain.length, step = n > 1 ? Math.min(7, 30 / (n - 1)) : 0;
      w.slain.forEach(function (m, i) {
        html += cardHTML(m, 'slain').replace('class="card', 'style="left:' + (24 + i * step) + 'px;top:' + (i * 2 - 6) + 'px;transform:rotate(' + (6 + i * 2) + 'deg) scale(.66)" class="card');
      });
    }
    html += '</div>' + (w && w.last !== null ? '<div class="label hits">Hits ≤ ' + w.last + '</div>' : '<div class="label">Weapon</div>');
    $('weaponSlot').innerHTML = html;
    attachWeaponDrag();
  }

  function renderMessage(flash) {
    var m = $('message');
    if (state.message) { m.textContent = state.message; m.classList.remove('title'); }
    else { m.textContent = 'Scoundrel'; m.classList.add('title'); }
    if (flash) { m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }
  }

  function renderButtons() {
    var nb = $('newBtn'), fb = $('fleeBtn');
    nb.innerHTML = A.icon('door') + 'New dungeon';
    nb.hidden = state.started;
    fb.innerHTML = A.icon('flee') + (state.fledLast ? 'Fled last room' : 'Flee room');
    fb.disabled = !S.canFlee(state) || busy;
  }

  function sizeBg() {
    var t = document.querySelector('.table');
    if (t) document.documentElement.style.setProperty('--bgh', Math.round(t.getBoundingClientRect().bottom) + 'px');
  }
  window.addEventListener('resize', sizeBg);

  function renderAll(newIds, flash) {
    setBg(bgForState());
    renderTop(); renderRoom(newIds); renderDeck(); renderHero(); renderWeapon(); renderMessage(flash); renderButtons(); sizeBg();
  }

  /* ---------- effects ---------- */
  function rectOf(node) { return node.getBoundingClientRect(); }
  function flyCard(fromEl, toRect, opts) {
    return new Promise(function (resolve) {
      var r = rectOf(fromEl);
      var c = fromEl.cloneNode(true);
      c.classList.remove('deal', 'drag'); c.style.animation = 'none'; c.style.transform = 'none'; c.style.transition = '';
      c.classList.add('fly');
      c.style.left = r.left + 'px'; c.style.top = r.top + 'px'; c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; c.style.margin = 0;
      document.body.appendChild(c);
      fromEl.style.visibility = 'hidden';
      var dx = toRect.left + toRect.width / 2 - (r.left + r.width / 2);
      var dy = toRect.top + toRect.height / 2 - (r.top + r.height / 2);
      var sc = opts.scale != null ? opts.scale : toRect.width / r.width;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ') rotate(' + (opts.rot || 0) + 'deg)';
          if (opts.fade) c.style.opacity = 0;
        });
      });
      setTimeout(function () { c.remove(); resolve(); }, 440);
    });
  }
  function floater(text, cls) {
    var h = $('hero'); if (!h) return;
    var r = rectOf(h);
    var f = el('<div class="floater ' + cls + '">' + text + '</div>');
    f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height * 0.25) + 'px';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1050);
  }
  function hurtFlash(heal) {
    var h = $('hurt'); h.classList.toggle('heal', !!heal);
    h.classList.remove('on'); void h.offsetWidth; h.classList.add('on');
  }
  function shake() { var a = $('app'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); }
  function bumpHero() { var h = $('hero'); if (h) { h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); } }

  /* ---------- actions ---------- */
  function idsIn(list) { var m = {}; list.forEach(function (c) { m[c.id] = true; }); return m; }
  function newIdsMap(prevRoom, nextRoom) {
    var prev = idsIn(prevRoom), m = {}, k = 0;
    nextRoom.forEach(function (c) { if (!prev[c.id]) m[c.id] = k++; });
    return m;
  }

  function act(i, mode, srcEl, strikeGhost) {
    if (busy || state.over) return;
    var prev = state;
    var res = S.resolve(state, i, mode);
    var ev = res.event; if (!ev) return;
    busy = true; renderButtons();

    var cardEl = srcEl || $('room').querySelector('.cell[data-id="' + state.room[i].id + '"] .card');

    if (ev.kind === 'kill-fist' || ev.kind === 'kill-weapon') haptic(ev.damage ? 'hit' : 'kill', ev.damage);
    else if (ev.kind === 'equip') haptic('equip');
    else if (ev.kind === 'potion') haptic('heal');
    else haptic('warning');

    function finish() {
      if (srcEl && srcEl.parentNode) srcEl.remove();
      state = res.state;
      renderAll(newIdsMap(prev.room, state.room), true);
      if (ev.kind === 'kill-weapon') {
        var sl = $('wstack').querySelectorAll('.slain');
        if (sl.length) sl[sl.length - 1].classList.add('pop-in');
      }
      if (ev.damage) {
        floater('−' + ev.damage, 'dmg'); hurtFlash(false); bumpHero();
        if (ev.damage >= 5) shake();
      } else if (ev.heal) {
        floater('+' + ev.heal, 'heal'); hurtFlash(true); bumpHero();
      }
      save();
      if (state.over) {
        setTimeout(function () { haptic(state.won ? 'win' : 'death'); showEnd(); busy = false; }, ev.damage ? 900 : 600);
      } else { busy = false; renderButtons(); }
    }

    if (strikeGhost && ev.kind === 'kill-weapon') {
      // weapon lunges into the monster, slash, weapon returns, monster vanishes and reappears on the stack
      var mr = rectOf(cardEl), g = strikeGhost, gw = parseFloat(g.style.width), gh = parseFloat(g.style.height);
      var tx = mr.left + (mr.width - gw) / 2, ty = mr.top + (mr.height - gh) / 2;
      g.style.transformOrigin = '50% 50%';
      g.style.setProperty('transition', 'transform .13s cubic-bezier(.5,0,.9,.4)', 'important');
      g.style.transform = 'translate3d(' + (tx + 10) + 'px,' + (ty + 14) + 'px,0) rotate(-18deg) scale(1.04)';
      setTimeout(function () {
        cardEl.classList.add('struck');
        var s = el('<div class="slash"></div>');
        s.style.left = (mr.left + mr.width / 2) + 'px'; s.style.top = (mr.top + mr.height / 2) + 'px';
        s.style.width = (mr.width * 1.5) + 'px';
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 450);
      }, 120);
      setTimeout(function () {
        var home = $('wstack').querySelector('.card:not(.slain)') || $('wstack');
        var hr = rectOf(home);
        g.style.setProperty('transition', 'transform .34s cubic-bezier(.3,.7,.3,1)', 'important');
        g.style.transform = 'translate3d(' + hr.left + 'px,' + hr.top + 'px,0) rotate(0deg) scale(1)';
        cardEl.classList.add('vanish');
      }, 430);
      setTimeout(function () { g.remove(); finish(); }, 800);
      return;
    }

    var target, opts = {};
    if (ev.kind === 'kill-weapon' || ev.kind === 'equip') { target = rectOf($('wstack')); opts.rot = 6; }
    else if (ev.kind === 'kill-fist') { target = rectOf($('hero')); opts.scale = 0.5; opts.fade = true; opts.rot = -12; }
    else if (ev.kind === 'potion') { target = rectOf($('hero')); opts.scale = 0.4; opts.fade = true; }
    else { var r = rectOf(cardEl); target = { left: r.left, top: r.top + 140, width: r.width, height: r.height }; opts.fade = true; opts.scale = 0.8; opts.rot = 20; }
    flyCard(cardEl, target, opts).then(finish);
  }


  function doFlee() {
    if (busy) return;
    if (!S.canFlee(state)) { state = S.flee(state).state; renderMessage(true); haptic('warning'); return; }
    var prev = state, res = S.flee(state);
    busy = true; renderButtons(); haptic('flee');
    var pileRect = rectOf($('pile'));
    var cards = Array.prototype.slice.call($('room').querySelectorAll('.card:not(.empty)'));
    Promise.all(cards.map(function (c, k) {
      return new Promise(function (ok) { setTimeout(function () { flyCard(c, pileRect, { rot: -10 }).then(ok); }, k * 60); });
    })).then(function () {
      state = res.state;
      renderAll(newIdsMap(prev.room, state.room), true);
      save(); busy = false; renderButtons();
    });
  }

  function newDungeon() {
    state = S.newGame(settings.maxHp);
    currentBg = null; slots = [null, null, null, null];
    renderAll(newIdsMap([], state.room), false);
    save(); haptic('tap');
  }

  /* ---------- overlays ---------- */
  function open(id) { $(id).hidden = false; }
  function close(id) { $(id).hidden = true; }

  function showEnd() {
    var won = state.won;
    $('endbg').style.backgroundImage = 'url(' + pick(won ? WIN_BGS : DIE_BGS) + ')';
    $('endTitle').textContent = won ? 'You Survived!' : 'You Died!';
    $('endScore').textContent = state.score;
    var card = document.querySelector('#gameover .endcard');
    card.classList.toggle('dead', !won);
    var note = '';
    if (won) {
      if (state.score > state.hp) note = state.hp + ' HP + ' + (state.score - state.hp) + ' bonus for ending on a potion at full health.';
      else note = 'You escaped with ' + state.hp + ' HP.';
    } else {
      var left = state.deck.concat(state.room).filter(function (c) { return c.type === 'monster'; }).length;
      note = left + ' monster' + (left === 1 ? '' : 's') + ' still lurk in the dungeon.';
    }
    $('endNote').textContent = note;
    open('gameover');
  }

  function wire() {
    $('menuBtn').innerHTML = A.icon('menu');
    $('menuBtn').addEventListener('click', function () { haptic('tap'); open('menu'); });
    $('fleeBtn').addEventListener('click', doFlee);
    $('newBtn').addEventListener('click', function () { if (!busy) newDungeon(); });

    var menu = $('menu');
    menu.querySelector('[data-act="new"]').innerHTML = A.icon('door') + 'New dungeon';
    menu.querySelector('[data-act="rules"]').innerHTML = A.icon('book') + 'How to play';
    menu.querySelector('[data-act="settings"]').innerHTML = A.icon('gear') + 'Settings';
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b && e.target !== menu) return;
      var a = b ? b.getAttribute('data-act') : 'close';
      close('menu');
      if (a === 'new') { if (state.started && !state.over) open('confirm'); else newDungeon(); }
      if (a === 'rules') open('rules');
      if (a === 'settings') openSettings();
    });

    $('rules').addEventListener('click', function (e) {
      if (e.target.closest('[data-act="close"]') || e.target === $('rules')) { close('rules'); if (!seenRules) { seenRules = true; save(); } }
    });
    document.querySelectorAll('#rules .rule-row .chip').forEach(function (c) {
      var n = c.classList.contains('skull') ? 'skull' : c.classList.contains('sword') ? 'sword' : 'heart';
      c.innerHTML = A.icon(n);
    });

    $('confirm').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (b && b.getAttribute('data-act') === 'yes') { close('confirm'); newDungeon(); }
      else if (b || e.target === $('confirm')) close('confirm');
    });

    var pendingHp = settings.maxHp;
    function openSettings() {
      pendingHp = settings.maxHp; $('hpOut').textContent = pendingHp;
      $('hapticsToggle').checked = settings.haptics;
      open('settings');
    }
    $('settings').addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) { pendingHp = Math.max(5, Math.min(50, pendingHp + parseInt(step.getAttribute('data-step'), 10))); $('hpOut').textContent = pendingHp; return; }
      var b = e.target.closest('[data-act]');
      if (b && b.getAttribute('data-act') === 'save') {
        settings.haptics = $('hapticsToggle').checked;
        var changed = pendingHp !== settings.maxHp;
        settings.maxHp = pendingHp;
        close('settings');
        if (changed) newDungeon(); else save();
      } else if (b || e.target === $('settings')) close('settings');
    });

    $('gameover').addEventListener('click', function (e) {
      if (e.target.closest('[data-act="again"]')) { close('gameover'); newDungeon(); }
    });
  }

  /* ---------- ember sparks (sparse, dim) ---------- */
  function startSparks() {
    var box = $('sparks');
    if (!box) return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    function r(a, b) { return a + Math.random() * (b - a); }
    function one() {
      if (!document.hidden && box.childElementCount < 8) {
        var s = document.createElement('i');
        s.className = 'spark';
        var h = box.clientHeight || 300;
        s.style.left = r(4, 96).toFixed(1) + '%';
        s.style.top = (h * r(.35, .9)).toFixed(0) + 'px';
        s.style.setProperty('--s', r(1.4, 2.8).toFixed(1) + 'px');
        s.style.setProperty('--o', r(.25, .55).toFixed(2));
        s.style.setProperty('--t', r(4, 8).toFixed(1) + 's');
        s.style.setProperty('--rise', r(70, 170).toFixed(0) + 'px');
        s.style.setProperty('--dx1', r(-16, 16).toFixed(0) + 'px');
        s.style.setProperty('--dx2', r(-26, 26).toFixed(0) + 'px');
        s.addEventListener('animationend', function () { s.remove(); });
        box.appendChild(s);
      }
      setTimeout(one, r(650, 2300));
    }
    setTimeout(one, 1500);
  }

  /* ---------- boot ---------- */
  function preloadImages() {
    WIN_BGS.concat(DIE_BGS, ROOM_BGS, [EXIT_BG]).forEach(function (src) { var i = new Image(); i.src = src; });
  }

  function boot() {
    wire();
    preloadImages();
    randomFog();
    startSparks();
    var resumed = load();
    if (!resumed) state = S.newGame(settings.maxHp);
    renderAll(newIdsMap([], state.room), false);
    save();
    if (!seenRules) open('rules');
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  }
  // offline cache for the browser / home-screen version (skipped in the iOS app)
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  } catch (e) {}
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
  // Hidden test hook for automated screenshots
  window.__scoundrelDebug = { get state() { return state; }, set state(s) { state = s; renderAll(null, false); }, showEnd: showEnd, act: act };
})();
