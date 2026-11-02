/* Original ink-style SVG card art for Scoundrel. All drawings are 100x100. */
(function (root) {
  'use strict';

  var INK = '#ece6d6', MID = '#8a857a', DARK = '#2b2a28', DEEP = '#121110', BONE = '#d8d1bf';
  var STEEL = '#c3c7cc', STEEL_D = '#7d838b', GOLD = '#c9a24a', LEATHER = '#5a3a26';
  var RED = '#c8262c', RED_HI = '#ff7b6e';

  function eyeColor(suit) { return suit === 'clubs' ? '#9be05a' : '#ff3b2f'; }

  // stroke helpers
  function sw(w) { return ' stroke="' + INK + '" stroke-width="' + (w || 1.6) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function glow(cx, cy, r, c) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 2.4) + '" fill="' + c + '" opacity=".22"/>' +
           '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c + '"/>';
  }
  function rays(color, n, op) {
    var s = '';
    n = n || 22;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2, r1 = 30 + (i % 2) * 6, r2 = 49;
      s += '<line x1="' + (50 + Math.cos(a) * r1).toFixed(1) + '" y1="' + (50 + Math.sin(a) * r1).toFixed(1) +
           '" x2="' + (50 + Math.cos(a) * r2).toFixed(1) + '" y2="' + (50 + Math.sin(a) * r2).toFixed(1) +
           '" stroke="' + (color || INK) + '" stroke-width="' + (i % 2 ? 0.7 : 1.3) + '" opacity="' + (op || 0.35) + '"/>';
    }
    return s;
  }
  function shadow(cx, cy, rx) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (rx * 0.18) + '" fill="#000" opacity=".55"/>';
  }

  /* ---------------- monsters ---------------- */
  var monsters = {
    Goblin: function (e) {
      return '' +
        '<path d="M28 100 Q30 78 50 74 Q70 78 72 100 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M44 76 L50 86 L56 76" fill="none"' + sw(1.2) + '/>' +
        '<path d="M31 46 L5 28 Q12 44 27 58 Z" fill="' + MID + '"' + sw() + '/>' +
        '<path d="M69 46 L95 28 Q88 44 73 58 Z" fill="' + MID + '"' + sw() + '/>' +
        '<path d="M14 36 L26 48 M86 36 L74 48" stroke="' + DARK + '" stroke-width="1.4"/>' +
        '<ellipse cx="50" cy="52" rx="22" ry="21" fill="' + MID + '"' + sw() + '/>' +
        '<path d="M33 42 Q41 36 47 44 M67 42 Q59 36 53 44" fill="none" stroke="' + DEEP + '" stroke-width="2.4" stroke-linecap="round"/>' +
        glow(41, 48, 3.2, e) + glow(59, 48, 3.2, e) +
        '<circle cx="41" cy="48" r="1.2" fill="' + DEEP + '"/><circle cx="59" cy="48" r="1.2" fill="' + DEEP + '"/>' +
        '<path d="M49 47 Q58 58 52 64 Q49 63 48 60" fill="' + MID + '"' + sw(1.3) + '/>' +
        '<path d="M36 64 Q50 77 64 64 Q50 70 36 64 Z" fill="' + DEEP + '"' + sw(1.3) + '/>' +
        '<path d="M40 66 L42 70 L44 67 L46 71 L48 68 L50 72 L52 68 L54 71 L56 67 L58 70 L60 66" fill="none" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<path d="M38 32 Q44 28 50 31 M55 30 Q60 28 63 31" fill="none" stroke="' + DARK + '" stroke-width="1"/>';
    },
    Wolf: function (e) {
      return '' +
        '<path d="M30 40 L24 10 L46 30 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M70 40 L76 10 L54 30 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M29 32 L27 18 L38 29 M71 32 L73 18 L62 29" fill="none" stroke="' + MID + '" stroke-width="1.2"/>' +
        '<path d="M24 38 Q50 20 76 38 L82 56 L74 54 L76 62 L66 64 Q60 74 58 82 L50 92 L42 82 Q40 74 34 64 L24 62 L26 54 L18 56 Z" fill="#55524c"' + sw() + '/>' +
        '<path d="M50 30 L50 52 M44 34 L46 48 M56 34 L54 48" stroke="' + DARK + '" stroke-width="1.2"/>' +
        '<path d="M40 58 Q50 52 60 58 L57 78 L50 86 L43 78 Z" fill="' + MID + '"' + sw(1.3) + '/>' +
        '<ellipse cx="50" cy="62" rx="5.5" ry="3.6" fill="' + DEEP + '"' + sw(1) + '/>' +
        '<path d="M33 46 L44 44 L41 50 Z" fill="' + DEEP + '"/><path d="M67 46 L56 44 L59 50 Z" fill="' + DEEP + '"/>' +
        glow(40, 47, 2.2, e) + glow(60, 47, 2.2, e) +
        '<path d="M43 79 Q50 84 57 79" fill="none" stroke="' + DEEP + '" stroke-width="1.6"/>' +
        '<path d="M45 79 L46.5 86 L48 80 M55 79 L53.5 86 L52 80" fill="' + INK + '" stroke="' + INK + '" stroke-width=".8"/>';
    },
    Skeleton: function (e) {
      var ribs = '';
      for (var i = 0; i < 4; i++) {
        var y = 74 + i * 6.5, w = 20 - i * 2;
        ribs += '<path d="M50 ' + y + ' Q' + (50 - w) + ' ' + (y - 2) + ' ' + (50 - w + 3) + ' ' + (y + 5) +
                ' M50 ' + y + ' Q' + (50 + w) + ' ' + (y - 2) + ' ' + (50 + w - 3) + ' ' + (y + 5) + '" fill="none" stroke="' + BONE + '" stroke-width="2.2" stroke-linecap="round"/>';
      }
      return '' +
        '<path d="M50 66 L50 100" stroke="' + BONE + '" stroke-width="3" stroke-dasharray="3 1.5"/>' + ribs +
        '<path d="M32 42 Q31 16 50 16 Q69 16 68 42 Q68 52 62 56 L61 64 L39 64 L38 56 Q32 52 32 42 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1.4"/>' +
        '<path d="M36 28 Q40 22 46 21" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/>' +
        '<ellipse cx="42" cy="41" rx="6.5" ry="7" fill="' + DEEP + '"/><ellipse cx="58" cy="41" rx="6.5" ry="7" fill="' + DEEP + '"/>' +
        glow(42, 42, 1.8, e) + glow(58, 42, 1.8, e) +
        '<path d="M50 48 L46.5 54 L53.5 54 Z" fill="' + DEEP + '"/>' +
        '<path d="M40 58 L60 58 M43 56 L43 63 M47 56 L47 64 M51 56 L51 64 M55 56 L55 63 M58 57 L58 62" stroke="' + DEEP + '" stroke-width="1.2"/>' +
        '<path d="M60 22 L56 30 L59 34" fill="none" stroke="' + DEEP + '" stroke-width="1"/>';
    },
    Orc: function (e) {
      return '' +
        '<path d="M22 100 Q24 82 50 80 Q76 82 78 100 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M30 84 L34 92 M70 84 L66 92" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M26 50 L12 44 L24 58 Z M74 50 L88 44 L76 58 Z" fill="#5f6b52"' + sw(1.3) + '/>' +
        '<path d="M26 42 Q28 22 50 22 Q72 22 74 42 L78 62 Q72 84 50 86 Q28 84 22 62 Z" fill="#5f6b52"' + sw() + '/>' +
        '<path d="M26 36 Q30 14 50 13 Q70 14 74 36 Q50 30 26 36 Z" fill="' + STEEL_D + '"' + sw(1.4) + '/>' +
        '<circle cx="36" cy="30" r="1.4" fill="' + INK + '"/><circle cx="50" cy="25" r="1.4" fill="' + INK + '"/><circle cx="64" cy="30" r="1.4" fill="' + INK + '"/>' +
        '<path d="M30 44 Q40 38 48 46 L30 48 Z M70 44 Q60 38 52 46 L70 48 Z" fill="' + DEEP + '"/>' +
        glow(39, 47, 2.2, e) + glow(61, 47, 2.2, e) +
        '<path d="M46 52 Q50 50 54 52 L56 60 Q50 63 44 60 Z" fill="#4c5642"' + sw(1.1) + '/>' +
        '<circle cx="47.5" cy="59" r="1.2" fill="' + DEEP + '"/><circle cx="52.5" cy="59" r="1.2" fill="' + DEEP + '"/>' +
        '<path d="M34 70 Q50 80 66 70 Q50 74 34 70 Z" fill="' + DEEP + '"' + sw(1.2) + '/>' +
        '<path d="M38 72 Q34 62 37 56 Q40 64 42 73 Z M62 72 Q66 62 63 56 Q60 64 58 73 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<path d="M40 78 L44 76 M56 76 L60 78" stroke="' + DARK + '" stroke-width="1"/>';
    },
    Beast: function (e) {
      var mane = '';
      for (var i = 0; i < 9; i++) {
        var x = 22 + i * 7;
        mane += '<path d="M' + x + ' 84 Q' + (x + 2) + ' 94 ' + (x - 2) + ' 100" fill="none" stroke="' + MID + '" stroke-width="1.3"/>';
      }
      return '' +
        '<path d="M14 100 Q16 74 50 70 Q84 74 86 100 Z" fill="' + DEEP + '"' + sw() + '/>' + mane +
        '<path d="M34 34 Q12 32 6 8 Q20 24 40 24 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1.3"/>' +
        '<path d="M66 34 Q88 32 94 8 Q80 24 60 24 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1.3"/>' +
        '<path d="M14 24 L18 22 M10 16 L14 15 M86 24 L82 22 M90 16 L86 15" stroke="' + DEEP + '" stroke-width="1.2"/>' +
        '<path d="M28 30 Q50 16 72 30 L74 54 Q66 78 50 86 Q34 78 26 54 Z" fill="#3a3836"' + sw() + '/>' +
        '<path d="M30 40 L46 46 L32 48 Z M70 40 L54 46 L68 48 Z" fill="' + DEEP + '"/>' +
        glow(38, 45, 2.4, e) + glow(62, 45, 2.4, e) +
        '<path d="M40 60 Q50 56 60 60 L58 72 Q50 76 42 72 Z" fill="' + MID + '"' + sw(1.2) + '/>' +
        '<ellipse cx="45.5" cy="64" rx="2" ry="1.4" fill="' + DEEP + '"/><ellipse cx="54.5" cy="64" rx="2" ry="1.4" fill="' + DEEP + '"/>' +
        '<path d="M44 70 Q50 74 56 70" fill="none" stroke="' + GOLD + '" stroke-width="1.8"/>' +
        '<path d="M36 76 L39 84 L41 77 M64 76 L61 84 L59 77" fill="' + INK + '" stroke="' + INK + '" stroke-width=".8"/>' +
        '<path d="M44 30 L46 38 M56 30 L54 38 M50 26 L50 36" stroke="' + DEEP + '" stroke-width="1.2"/>';
    },
    Jack: function (e) {
      return '' +
        '<path d="M18 100 Q16 48 50 14 Q84 48 82 100 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M50 14 Q60 30 64 52 M50 14 Q40 30 36 52" fill="none" stroke="' + MID + '" stroke-width="1.1"/>' +
        '<path d="M32 60 Q32 34 50 30 Q68 34 68 60 Q64 76 50 78 Q36 76 32 60 Z" fill="' + DEEP + '"' + sw(1.3) + '/>' +
        glow(43, 52, 2.6, e) + glow(57, 52, 2.6, e) +
        '<path d="M43 66 Q50 70 57 66" fill="none" stroke="' + MID + '" stroke-width="1.2"/>' +
        '<path d="M36 34 L40 24 L45 30 L50 20 L55 30 L60 24 L64 34 Z" fill="' + GOLD + '" stroke="' + DEEP + '" stroke-width="1" opacity=".9"/>' +
        '<path d="M68 100 L74 70 L78 72 L72 100 Z" fill="' + STEEL + '" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<path d="M70 72 L82 75" stroke="' + GOLD + '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    Queen: function (e) {
      var hair = '';
      for (var i = 0; i < 7; i++) {
        var dx = i * 4;
        hair += '<path d="M' + (34 - dx * 0.4) + ' 40 Q' + (20 - dx) + ' 70 ' + (14 + dx * 0.6) + ' 100" fill="none" stroke="' + INK + '" stroke-width="1.1" opacity=".75"/>' +
                '<path d="M' + (66 + dx * 0.4) + ' 40 Q' + (80 + dx) + ' 70 ' + (86 - dx * 0.6) + ' 100" fill="none" stroke="' + INK + '" stroke-width="1.1" opacity=".75"/>';
      }
      return '' +
        '<path d="M26 100 Q30 76 50 74 Q70 76 74 100 Z" fill="' + DARK + '"' + sw() + '/>' +
        '<path d="M26 100 Q14 60 30 34 Q50 14 70 34 Q86 60 74 100 Z" fill="' + DEEP + '" opacity=".9"/>' + hair +
        '<path d="M36 46 Q36 28 50 28 Q64 28 64 46 Q64 64 50 72 Q36 64 36 46 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1.3"/>' +
        '<ellipse cx="44" cy="46" rx="4" ry="5" fill="' + DEEP + '"/><ellipse cx="56" cy="46" rx="4" ry="5" fill="' + DEEP + '"/>' +
        glow(44, 47, 1.5, e) + glow(56, 47, 1.5, e) +
        '<ellipse cx="50" cy="62" rx="3.5" ry="5" fill="' + DEEP + '"/>' +
        '<path d="M40 34 L38 22 L44 28 L50 16 L56 28 L62 22 L60 34 Z" fill="' + GOLD + '" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<circle cx="50" cy="27" r="2" fill="' + e + '"/>' +
        '<path d="M42 54 L42 58 M58 54 L58 58" stroke="' + DEEP + '" stroke-width=".9" opacity=".6"/>';
    },
    King: function (e) {
      var beard = '';
      for (var i = 0; i < 8; i++) {
        var x = 37 + i * 3.7;
        beard += '<path d="M' + x + ' 62 Q' + (x + (i % 2 ? 3 : -3)) + ' 80 ' + (x + (i - 3.5) * 1.2) + ' 96" fill="none" stroke="' + INK + '" stroke-width="1.3" opacity=".8"/>';
      }
      return '' +
        '<path d="M14 100 Q18 70 50 66 Q82 70 86 100 Z" fill="#3b1416"' + sw() + '/>' +
        '<path d="M14 100 Q18 70 50 66" fill="none" stroke="' + GOLD + '" stroke-width="1.4"/>' +
        '<path d="M34 46 Q33 26 50 26 Q67 26 66 46 Q66 56 60 60 L58 66 L42 66 L40 60 Q34 56 34 46 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1.3"/>' +
        '<ellipse cx="43" cy="45" rx="5" ry="5.5" fill="' + DEEP + '"/><ellipse cx="57" cy="45" rx="5" ry="5.5" fill="' + DEEP + '"/>' +
        glow(43, 46, 1.8, e) + glow(57, 46, 1.8, e) +
        '<path d="M50 50 L47.5 55 L52.5 55 Z" fill="' + DEEP + '"/>' + beard +
        '<path d="M30 32 L28 12 L38 22 L44 6 L50 18 L56 6 L62 22 L72 12 L70 32 Z" fill="' + GOLD + '" stroke="' + DEEP + '" stroke-width="1.2"/>' +
        '<path d="M30 30 L70 30" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<circle cx="50" cy="25" r="2.6" fill="' + e + '" stroke="' + DEEP + '" stroke-width=".8"/>' +
        '<circle cx="38" cy="27" r="1.4" fill="' + INK + '"/><circle cx="62" cy="27" r="1.4" fill="' + INK + '"/>';
    },
    Ace: function (e) {
      return '' +
        '<path d="M60 100 Q58 70 72 58 Q86 46 84 26" fill="none" stroke="' + MID + '" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M60 100 Q58 70 72 58 Q86 46 84 26" fill="none" stroke="' + DARK + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M62 92 L54 90 M64 80 L56 76 M70 66 L64 60" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M86 24 Q92 10 84 4 Q86 14 78 20 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<path d="M78 22 Q78 8 68 4 Q72 14 70 22 Z" fill="' + BONE + '" stroke="' + DEEP + '" stroke-width="1"/>' +
        '<path d="M88 30 Q86 18 72 18 Q56 18 40 26 L12 34 Q6 38 10 42 L34 42 L14 50 Q10 54 16 56 L44 50 Q60 48 72 44 Q86 40 88 30 Z" fill="#45423e"' + sw() + '/>' +
        '<path d="M14 42 L34 42" stroke="' + DEEP + '" stroke-width="2"/>' +
        '<path d="M18 42 L20 47 L22 42 M26 42 L28 47 L30 42 M20 36 L21 41 M28 34 L29 40" fill="' + INK + '" stroke="' + INK + '" stroke-width=".9"/>' +
        '<path d="M58 26 L70 24 L66 30 Z" fill="' + DEEP + '"/>' + glow(65, 27, 2, e) +
        '<ellipse cx="14" cy="37" rx="1.4" ry="1" fill="' + DEEP + '"/>' +
        '<path d="M44 30 L50 22 L52 30 M52 28 L60 20 L60 28" fill="' + MID + '" stroke="' + INK + '" stroke-width="1"/>' +
        '<path d="M6 40 Q-2 44 4 50 M8 52 Q2 58 8 62" fill="none" stroke="#ff8a3d" stroke-width="1.6" opacity=".8"/>';
    }
  };

  /* ---------------- weapons ---------------- */
  function sword(len, width, guard, grip, gem) {
    // vertical sword, tip at top, centred on x=50; later rotated
    var tipY = 50 - len / 2 - grip / 2, guardY = tipY + len, w = width / 2;
    var s = '';
    s += '<path d="M50 ' + tipY + ' L' + (50 + w) + ' ' + (tipY + width * 1.4) + ' L' + (50 + w) + ' ' + guardY +
         ' L' + (50 - w) + ' ' + guardY + ' L' + (50 - w) + ' ' + (tipY + width * 1.4) + ' Z" fill="' + STEEL + '"' + sw(1.4) + '/>';
    s += '<path d="M50 ' + (tipY + 3) + ' L50 ' + (guardY - 2) + '" stroke="' + STEEL_D + '" stroke-width="1.2"/>';
    s += '<path d="M' + (50 - w + 0.8) + ' ' + (tipY + width * 1.6) + ' L' + (50 - w + 0.8) + ' ' + (guardY - 1) + '" stroke="#fff" stroke-width=".9" opacity=".7"/>';
    s += '<rect x="' + (50 - guard / 2) + '" y="' + guardY + '" width="' + guard + '" height="4" rx="2" fill="' + GOLD + '"' + sw(1.2) + '/>';
    s += '<rect x="47.5" y="' + (guardY + 4) + '" width="5" height="' + grip + '" fill="' + LEATHER + '"' + sw(1.2) + '/>';
    for (var y = guardY + 6; y < guardY + 4 + grip - 1; y += 3) {
      s += '<path d="M47.5 ' + y + ' L52.5 ' + (y + 2) + '" stroke="' + DEEP + '" stroke-width=".8"/>';
    }
    s += '<circle cx="50" cy="' + (guardY + 6 + grip) + '" r="3.4" fill="' + GOLD + '"' + sw(1.2) + '/>';
    if (gem) s += '<circle cx="50" cy="' + (guardY + 2) + '" r="1.8" fill="#4fb3ff" stroke="' + DEEP + '" stroke-width=".6"/>';
    return '<g transform="rotate(40 50 50)">' + s + '</g>';
  }

  var weapons = {
    Dagger: function (v) { return rays(INK, 18, 0.18) + shadow(50, 88, 20) + sword(30 + v * 2, 7, 18, 12, false); },
    Shortsword: function (v) { return rays(INK, 20, 0.2) + shadow(50, 90, 24) + sword(44 + (v - 4) * 3, 8, 24, 13, false); },
    Longsword: function (v) { return rays(GOLD, 22, 0.22) + shadow(50, 92, 28) + sword(54 + (v - 6) * 3, 8.5, 30, 15, v >= 8); },
    Greatsword: function (v) { return rays(GOLD, 26, 0.3) + shadow(50, 94, 32) + sword(62 + (v - 9) * 3, 11, 36, 16, true); }
  };

  /* ---------------- potions ---------------- */
  function liquid(clipId, shape, level) {
    return '<clipPath id="' + clipId + '">' + shape + '</clipPath>' +
      '<g clip-path="url(#' + clipId + ')"><rect x="0" y="' + level + '" width="100" height="100" fill="' + RED + '"/>' +
      '<path d="M0 ' + level + ' Q25 ' + (level - 2) + ' 50 ' + level + ' T100 ' + level + '" fill="none" stroke="' + RED_HI + '" stroke-width="1.4"/></g>';
  }
  var pid = 0;
  var potions = {
    small: function (v) {
      var id = 'pv' + (pid++);
      var shape = '<path d="M43 30 L57 30 L57 78 Q57 86 50 86 Q43 86 43 78 Z"/>';
      return rays(RED_HI, 20, 0.22) + shadow(50, 90, 14) + liquid(id, shape, 72 - v * 6) +
        '<path d="M43 30 L57 30 L57 78 Q57 86 50 86 Q43 86 43 78 Z" fill="rgba(255,255,255,.06)"' + sw(1.6) + '/>' +
        '<path d="M46 36 L46 76" stroke="#fff" stroke-width="1.4" opacity=".5"/>' +
        '<rect x="41" y="22" width="18" height="9" rx="2" fill="' + MID + '"' + sw(1.2) + '/>' +
        '<path d="M41 26 L59 26" stroke="' + DARK + '" stroke-width="1"/>';
    },
    medium: function (v) {
      var id = 'pv' + (pid++);
      var shape = '<path d="M44 30 L56 30 L56 44 Q74 52 72 70 Q70 88 50 88 Q30 88 28 70 Q26 52 44 44 Z"/>';
      return rays(RED_HI, 24, 0.24) + shadow(50, 91, 22) + liquid(id, shape, 84 - v * 4.2) +
        '<path d="M44 30 L56 30 L56 44 Q74 52 72 70 Q70 88 50 88 Q30 88 28 70 Q26 52 44 44 Z" fill="rgba(255,255,255,.05)"' + sw(1.7) + '/>' +
        '<path d="M34 60 Q36 52 42 50" fill="none" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>' +
        '<rect x="42" y="20" width="16" height="11" rx="2.5" fill="' + MID + '"' + sw(1.2) + '/>' +
        '<path d="M43 36 L57 40 M43 40 L57 36 M43 33 L57 33" stroke="' + BONE + '" stroke-width="1.1"/>';
    },
    large: function (v) {
      var id = 'pv' + (pid++);
      var shape = '<circle cx="50" cy="58" r="26"/><rect x="43" y="22" width="14" height="14"/>';
      return rays(RED_HI, 28, 0.3) + shadow(50, 92, 26) + liquid(id, shape, 60 - (v - 9) * 10) +
        '<circle cx="50" cy="58" r="26" fill="rgba(255,255,255,.05)"' + sw(1.8) + '/>' +
        '<path d="M43 22 L43 33 M57 22 L57 33" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<path d="M34 50 Q38 40 46 38" fill="none" stroke="#fff" stroke-width="2.6" opacity=".6" stroke-linecap="round"/>' +
        '<circle cx="62" cy="68" r="2" fill="#fff" opacity=".35"/>' +
        '<path d="M28 74 Q50 82 72 74 M30 46 Q50 38 70 46" fill="none" stroke="' + BONE + '" stroke-width="1.4"/>' +
        '<path d="M36 82 L32 92 M64 82 L68 92 M50 84 L50 94" stroke="' + BONE + '" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="40" y="12" width="20" height="11" rx="2.5" fill="' + MID + '"' + sw(1.2) + '/>' +
        '<path d="M40 17 L60 17 M44 12 L48 23 M52 12 L56 23" stroke="' + DARK + '" stroke-width="1"/>';
    }
  };

  /* ---------------- icons ---------------- */
  var icons = {
    skull: '<path d="M12 4 Q4 4 4 12 Q4 16 7 18 L7 21 L17 21 L17 18 Q20 16 20 12 Q20 4 12 4 Z" fill="currentColor"/>' +
           '<circle cx="9" cy="12" r="2.3" fill="#000"/><circle cx="15" cy="12" r="2.3" fill="#000"/>' +
           '<path d="M12 14.5 L11 17 L13 17 Z" fill="#000"/><path d="M10 19 L10 21 M12 19 L12 21 M14 19 L14 21" stroke="#000" stroke-width=".9"/>',
    heart: '<path d="M12 21 L3.5 12.5 Q0 8.5 3.5 5 Q7.5 2 12 7 Q16.5 2 20.5 5 Q24 8.5 20.5 12.5 Z" fill="currentColor"/>',
    sword: '<path d="M19 3 L21 3 L21 5 L10 16 L8 14 Z" fill="currentColor"/><path d="M5 13 L11 19 M7 17 L3.5 20.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    fist: '<path d="M5.5 9 Q5.5 5 8.5 5 L16 5 Q19 5 19 8.5 L19 15 Q19 21 13.5 21 L10.5 21 Q5.5 21 5.5 16 Z" fill="currentColor"/>' +
          '<path d="M9.2 5.3 L9.2 10.5 M12.4 5.3 L12.4 10.5 M15.6 5.3 L15.6 10.5 M5.6 10.5 L19 10.5" stroke="#000" stroke-width="1.1"/>' +
          '<path d="M5.6 13.5 Q10 12.5 12.5 15.5" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round"/>',
    flee: '<path d="M4 21 L4 4 L14 4 L14 21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 12.5 L21 12.5 M17 8.5 L21 12.5 L17 16.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    menu: '<path d="M4 7 L20 7 M4 12 L20 12 M4 17 L20 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    cards: '<rect x="7" y="3" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="6" width="12" height="16" rx="2" fill="currentColor"/>',
    door: '<path d="M6 21 L6 6 Q6 3 12 3 Q18 3 18 6 L18 21 Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="13" r="1.3" fill="currentColor"/>',
    book: '<path d="M4 5 Q8 3 12 6 Q16 3 20 5 L20 19 Q16 17 12 20 Q8 17 4 19 Z M12 6 L12 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5 L12 5.5 M12 18.5 L12 21.5 M2.5 12 L5.5 12 M18.5 12 L21.5 12 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M5.3 18.7 L7.4 16.6 M16.6 7.4 L18.7 5.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>';
  }

  // Painted illustrations (assets/cards/*.webp); SVG drawings remain as a fallback.
  var PAINTED = {
    Goblin: 'goblin', Wolf: 'wolf', Skeleton: 'skeleton', Orc: 'orc', Beast: 'beast',
    Jack: 'jack', Queen: 'queen', King: 'king', Ace: 'ace',
    Dagger: 'dagger', Shortsword: 'shortsword', Longsword: 'longsword', Greatsword: 'greatsword',
    small: 'potion_small', medium: 'potion_medium', large: 'potion_large'
  };
  function paintedKey(card) {
    if (card.type === 'monster') return root.Scoundrel.monsterName(card);
    if (card.type === 'weapon') return root.Scoundrel.weaponName(card);
    return card.value <= 3 ? 'small' : card.value <= 8 ? 'medium' : 'large';
  }

  function cardArt(card) {
    var key = PAINTED[paintedKey(card)];
    if (key) {
      return '<img class="art photo' + (card.suit === 'clubs' ? ' clubs' : '') + '" src="assets/cards/' + key + '.webp" alt="" draggable="false">';
    }
    var inner;
    if (card.type === 'monster') {
      var name = root.Scoundrel.monsterName(card);
      inner = rays(eyeColor(card.suit), 16, card.value >= 11 ? 0.16 : 0.07) + monsters[name](eyeColor(card.suit));
    } else if (card.type === 'weapon') {
      inner = weapons[root.Scoundrel.weaponName(card)](card.value);
    } else {
      inner = card.value <= 3 ? potions.small(card.value) : card.value <= 8 ? potions.medium(card.value) : potions.large(card.value);
    }
    return '<svg class="art" viewBox="0 0 100 100" aria-hidden="true"><g filter="url(#ink)">' + inner + '</g></svg>';
  }

  root.ScoundrelArt = { cardArt: cardArt, icon: icon };
})(window);
