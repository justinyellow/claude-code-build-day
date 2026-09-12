// Kinnect — Find. Registers on window.features. Classic script, no imports.
// Owns: features/find.js and features/find-map-data.js. Talks to other
// features through the store.
//
// Two views:
//   Area  — a Life360-style map of the streets around the venue. Real
//           OpenStreetMap geometry baked into find-map-data.js (no network),
//           drawn as SVG with pan, pinch and wheel zoom. Shows people, nearby
//           events and named places, with search and a detail sheet.
//   Venue — the flat floorplan drawn from `spaces` (x, y, w, h on a grid).
//
// Either way, when Ask or Meet sets `store.getState().target` the person or
// room lights up and a route is drawn from you to it. Straight line; nobody
// is checking whether it goes through a wall.

(function () {
  var U = 100;     // floorplan grid unit -> SVG user units
  var PAD = 40;    // margin around the floorplan, in SVG units
  var WALK = 80;   // metres per minute, for "8 min walk"

  // The map data sits beside this file. Resolve it from our own script tag so
  // it works wherever index.html lives, including over file://.
  var SELF = (document.currentScript && document.currentScript.src) || 'features/find.js';
  var DATA_SRC = SELF.replace(/find\.js(\?.*)?$/, 'find-map-data.js');

  // Nearby events, anchored to real places from the map data by name.
  // Times are minutes from page load so something is always "starting soon".
  var EVENTS = [
    { id: 'e1', title: 'Build day demos & pizza',        at: 'Roamwork',                        icon: '🍕', startsIn: 45 },
    { id: 'e2', title: 'Picnic in the Company’s Garden', at: 'South African National Gallery', icon: '🧺', startsIn: 70 },
    { id: 'e3', title: 'Castle of Good Hope tour',       at: 'Castle Military Museum',          icon: '🏰', startsIn: 100 },
    { id: 'e4', title: 'Claude Code office hours',       at: 'Workshop17 Kloof Street',         icon: '💻', startsIn: 130 },
    { id: 'e5', title: 'Greenmarket Square makers',      at: 'Greenmarket Square',              icon: '🛍️', startsIn: 160 },
    { id: 'e6', title: 'Fable community drinks',         at: 'Perseverance Tavern',             icon: '🍻', startsIn: 330 }
  ];

  // A few people have stepped out. Life360 is only interesting if not
  // everyone is in the same building.
  var AWAY = { a10: 'Cape Town Station', a6: 'RAW Espresso Bar', a12: 'Trafalgar Place Flower Market' };

  var POI_ICON = {
    cafe: '☕', pub: '🍺', bar: '🍸', restaurant: '🍽️', theatre: '🎭',
    cinema: '🎬', library: '📚', museum: '🏛️', gallery: '🖼️',
    station: '🚆', coworking: '💻', university: '🎓', attraction: '📸',
    viewpoint: '🔭', marketplace: '🛒', arts_centre: '🎨', community_centre: '🏠'
  };
  // Which places show at which zoom (px per metre). Landmarks first, food last.
  var POI_TIER = {
    station: 0.3, museum: 0.5, university: 0.5, attraction: 0.5, theatre: 0.7, coworking: 0.7, library: 0.9,
    gallery: 1.0, cinema: 1.0, arts_centre: 1.0, marketplace: 1.0, community_centre: 1.2, viewpoint: 1.0,
    cafe: 1.6, pub: 1.6, bar: 1.9, restaurant: 2.6
  };

  var STYLE = [
    '.find-head{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:.75rem;font-size:1.15rem}',
    '.find-modes{display:inline-flex;border:1px solid var(--line,#3a3a44);border-radius:2rem;overflow:hidden}',
    '.find-modes button{font:inherit;font-size:.95rem;padding:.35rem 1rem;border:0;background:transparent;color:inherit;opacity:.6;cursor:pointer}',
    '.find-modes button[aria-selected="true"]{opacity:1;background:rgba(124,92,255,.2);color:#fff}',
    '.find-where{flex:1;min-width:12rem}',
    '.find-where strong{color:var(--accent,#7c5cff)}',
    '.find-where .dim{opacity:.55}',
    '.find-clear,.find-iso{font:inherit;font-size:.95rem;padding:.35rem .9rem;border:1px solid var(--line,#3a3a44);',
    'border-radius:2rem;background:transparent;color:inherit;cursor:pointer;opacity:.75}',
    '.find-clear:hover,.find-iso:hover{opacity:1;border-color:var(--accent,#7c5cff)}',
    '.find-iso[aria-pressed="true"]{opacity:1;border-color:var(--accent,#7c5cff);background:rgba(124,92,255,.15)}',
    // Venue floorplan
    '.find-stage{perspective:1400px;padding:.5rem 0}',
    '.find-plan{display:block;width:100%;max-height:62vh;transition:transform .6s ease;transform-origin:50% 50%}',
    '.find-stage.iso .find-plan{transform:rotateX(55deg) rotateZ(-45deg) scale(.9)}',
    '.find-room{fill:var(--surface,#1b1b22);stroke:var(--line,#3a3a44);stroke-width:4;cursor:pointer;transition:fill .25s}',
    '.find-room:hover{fill:#23232c}',
    '.find-room.is-me{stroke:#3ddc97}',
    '.find-room.is-target{fill:rgba(124,92,255,.22);stroke:var(--accent,#7c5cff);stroke-width:6}',
    '.find-name{fill:#eceaf5;font:600 40px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none}',
    '.find-count{fill:#eceaf5;opacity:.5;font:30px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none}',
    '.find-dot{fill:#5d5d6b;pointer-events:none}',
    '.find-dot.is-me{fill:#3ddc97}',
    '.find-dot.is-target{fill:var(--accent,#7c5cff)}',
    '.find-route{fill:none;stroke:var(--accent,#7c5cff);stroke-width:8;stroke-linecap:round;stroke-dasharray:24 20;',
    'animation:find-march 1.2s linear infinite;pointer-events:none}',
    '.find-route-glow{fill:none;stroke:var(--accent,#7c5cff);stroke-width:22;opacity:.18;stroke-linecap:round;pointer-events:none}',
    '.find-pin{fill:var(--accent,#7c5cff);stroke:#eceaf5;stroke-width:5;pointer-events:none}',
    '.find-you{fill:#3ddc97;stroke:#eceaf5;stroke-width:5;pointer-events:none}',
    '@keyframes find-march{to{stroke-dashoffset:-44}}',
    '.find-legend{display:flex;gap:1.5rem;font-size:.95rem;opacity:.65;margin-top:.5rem;flex-wrap:wrap}',
    '.find-legend i{display:inline-block;width:.75rem;height:.75rem;border-radius:50%;margin-right:.4rem;vertical-align:middle}',
    '.find-empty{opacity:.6;font-size:1.1rem}',
    // Area map
    '.find-map{position:relative;height:62vh;min-height:420px;border-radius:.75rem;overflow:hidden;background:#12141b;',
    'border:1px solid var(--line,#3a3a44);touch-action:none;user-select:none;-webkit-user-select:none}',
    '.find-map svg{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;transition:transform .5s ease;transform-origin:50% 60%}',
    '.find-map.dragging svg{cursor:grabbing;transition:none}',
    '.find-map.iso svg{transform:perspective(900px) rotateX(48deg) scale(1.4)}',
    '.find-map text{pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;paint-order:stroke;',
    'stroke:#12141b;stroke-width:3px;stroke-linejoin:round}',
    '.m-green{fill:#1a2a23;stroke:none}',
    '.m-water{fill:#14283d;stroke:none}',
    '.m-pier{fill:#252a36;stroke:none}',
    '.m-rail{fill:none;stroke:#3a3e4c;stroke-width:2.5;stroke-dasharray:14 10}',
    '.m-case{fill:none;stroke:#0b0c11;stroke-linecap:round;stroke-linejoin:round}',
    '.m-road{fill:none;stroke-linecap:round;stroke-linejoin:round}',
    '.m-road.c-m{stroke:#4c526a}.m-road.c-p{stroke:#40465b}.m-road.c-s{stroke:#373c4e}',
    '.m-road.c-t{stroke:#303545}.m-road.c-r{stroke:#292d3a}.m-road.c-w{stroke:#262a35;stroke-dasharray:6 4}',
    '.m-lbl{fill:#aab0c4;font-size:11px;font-weight:500}',
    '.m-poi circle{fill:#8b90a5;stroke:#12141b;stroke-width:1.5}',
    '.m-poi text{fill:#c7cbd9;font-size:11px}',
    '.m-poi.is-sel circle{fill:#fff;stroke:var(--accent,#7c5cff);stroke-width:3}',
    '.m-ev{cursor:pointer}',
    '.m-ev circle{fill:#ff9f43;stroke:#fff;stroke-width:2}',
    '.m-ev .ic{font-size:14px;stroke:none;text-anchor:middle;dominant-baseline:central}',
    '.m-ev .nm{fill:#ffd6a8;font-size:12px;font-weight:600}',
    '.m-ev.is-sel circle{stroke:var(--accent,#7c5cff);stroke-width:4}',
    '.m-p{cursor:pointer}',
    '.m-p circle{stroke:#12141b;stroke-width:2}',
    '.m-p text{fill:#fff;font-size:11px;font-weight:700;text-anchor:middle;dominant-baseline:central;stroke:none}',
    '.m-p .nm{font-size:11px;font-weight:600;fill:#e6e8f2;text-anchor:start;dominant-baseline:auto;stroke:#12141b;stroke-width:3px}',
    '.m-p.is-me circle{stroke:#3ddc97;stroke-width:3}',
    '.m-p.is-target circle{stroke:var(--accent,#7c5cff);stroke-width:4}',
    '.m-p.is-sel circle{stroke:#fff;stroke-width:3}',
    '.m-cluster{cursor:pointer}',
    '.m-cluster circle{fill:var(--accent,#7c5cff);stroke:#fff;stroke-width:3}',
    '.m-cluster text{fill:#fff;font-size:15px;font-weight:700;text-anchor:middle;dominant-baseline:central;stroke:none}',
    '.m-venue rect{fill:#7c5cff;stroke:#fff;stroke-width:2}',
    '.m-venue text{fill:#d9d0ff;font-size:12px;font-weight:600}',
    '.m-you{pointer-events:none}',
    '.m-you .core{fill:#3ddc97;stroke:#fff;stroke-width:3}',
    '.m-you .ring{fill:#3ddc97;opacity:.35;transform-box:fill-box;transform-origin:center;animation:find-pulse 1.8s ease-out infinite}',
    '@keyframes find-pulse{from{transform:scale(.4);opacity:.6}to{transform:scale(2.4);opacity:0}}',
    '.m-route{fill:none;stroke:var(--accent,#7c5cff);stroke-width:5;stroke-linecap:round;stroke-dasharray:12 10;animation:find-march 1s linear infinite;pointer-events:none}',
    '.m-route-glow{fill:none;stroke:var(--accent,#7c5cff);stroke-width:14;opacity:.2;stroke-linecap:round;pointer-events:none}',
    '.m-route-lbl{fill:#fff;font-size:12px;font-weight:600;text-anchor:middle}',
    '.find-search{position:absolute;top:.75rem;left:.75rem;right:4.25rem;z-index:6}',
    '.find-search input{width:100%;font:inherit;font-size:1.05rem;padding:.65rem 1rem .65rem 2.4rem;border-radius:2rem;',
    'border:1px solid var(--line,#3a3a44);background:rgba(27,27,34,.95);color:inherit;outline:none}',
    '.find-search input:focus{border-color:var(--accent,#7c5cff)}',
    '.find-search .mag{position:absolute;left:.9rem;top:.62rem;opacity:.6;font-size:1.05rem;pointer-events:none}',
    '.find-results{position:absolute;top:3.5rem;left:0;right:0;z-index:7;background:rgba(27,27,34,.98);',
    'border:1px solid var(--line,#3a3a44);border-radius:.75rem;overflow:hidden;max-height:17rem;overflow-y:auto}',
    '.find-results button{display:flex;width:100%;align-items:center;gap:.7rem;text-align:left;font:inherit;font-size:1rem;',
    'padding:.6rem .9rem;border:0;border-bottom:1px solid rgba(255,255,255,.05);background:transparent;color:inherit;cursor:pointer}',
    '.find-results button:hover,.find-results button.is-active{background:rgba(124,92,255,.15)}',
    '.find-results .k{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;opacity:.5;min-width:3.6rem}',
    '.find-results .s{opacity:.55;font-size:.9rem;margin-left:auto;white-space:nowrap}',
    '.find-ctl{position:absolute;right:.75rem;top:.75rem;display:flex;flex-direction:column;gap:.4rem;z-index:5}',
    '.find-ctl button{width:2.6rem;height:2.6rem;font:inherit;font-size:1.15rem;border-radius:50%;border:1px solid var(--line,#3a3a44);',
    'background:rgba(27,27,34,.95);color:inherit;cursor:pointer;display:grid;place-items:center}',
    '.find-ctl button:hover{border-color:var(--accent,#7c5cff)}',
    '.find-ctl button[aria-pressed="true"]{border-color:var(--accent,#7c5cff);background:rgba(124,92,255,.25)}',
    '.find-ctl button.txt{font-size:.8rem;font-weight:700}',
    '.find-sheet{position:absolute;left:.75rem;right:.75rem;bottom:.75rem;z-index:6;background:rgba(27,27,34,.97);',
    'border:1px solid var(--line,#3a3a44);border-radius:.9rem;padding:.9rem 1.1rem;display:flex;gap:.9rem;align-items:flex-start;',
    'box-shadow:0 10px 30px rgba(0,0,0,.45)}',
    '.find-sheet .av{width:2.8rem;height:2.8rem;border-radius:50%;display:grid;place-items:center;font-size:1.3rem;font-weight:700;flex:none}',
    '.find-sheet .body{flex:1;min-width:0}',
    '.find-sheet h3{margin:0;font-size:1.2rem;line-height:1.25}',
    '.find-sheet .sub{opacity:.65;font-size:.95rem;margin-top:.15rem}',
    '.find-sheet .acts{display:flex;gap:.5rem;margin-top:.7rem;flex-wrap:wrap}',
    '.find-sheet .acts button{font:inherit;font-size:.95rem;padding:.45rem 1rem;border-radius:2rem;border:1px solid var(--line,#3a3a44);',
    'background:transparent;color:inherit;cursor:pointer}',
    '.find-sheet .acts button.pri{background:var(--accent,#7c5cff);border-color:var(--accent,#7c5cff);color:#fff}',
    '.find-sheet .x{font:inherit;font-size:1.2rem;border:0;background:transparent;color:inherit;opacity:.5;cursor:pointer;padding:0 .2rem}',
    '.find-sheet .x:hover{opacity:1}',
    '.find-sheet[hidden],.find-map[hidden],.find-stage[hidden]{display:none}',
    '.find-attrib{position:absolute;right:.5rem;bottom:.3rem;font-size:.7rem;opacity:.4;z-index:2;pointer-events:none}',
    '.find-loading{position:absolute;inset:0;display:grid;place-items:center;opacity:.6;font-size:1.1rem}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('find-style')) return;
    var s = document.createElement('style');
    s.id = 'find-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function find(list, id) {
    return (list || []).filter(function (x) { return x.id === id; })[0] || null;
  }

  function initials(name) {
    return String(name).split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase();
  }

  // Stable colour per id, so avatars are distinguishable.
  function hue(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return 'hsl(' + h + ',55%,48%)';
  }

  function fmtDist(m) {
    return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km';
  }

  function walkText(m) {
    return fmtDist(m) + ' · ' + Math.max(1, Math.round(m / WALK)) + ' min walk';
  }

  function startsText(min) {
    if (min <= 0) return 'Happening now';
    if (min < 60) return 'Starts in ' + min + ' min';
    var h = Math.floor(min / 60), r = min % 60;
    return 'Starts in ' + h + ' h' + (r ? ' ' + r + ' min' : '');
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------------------------------------------------------------------
  // Venue floorplan helpers
  // ---------------------------------------------------------------------

  function centre(space) {
    return { x: (space.x + space.w / 2) * U, y: (space.y + space.h / 2) * U };
  }

  function bounds(spaces) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    spaces.forEach(function (s) {
      b.x0 = Math.min(b.x0, s.x); b.y0 = Math.min(b.y0, s.y);
      b.x1 = Math.max(b.x1, s.x + s.w); b.y1 = Math.max(b.y1, s.y + s.h);
    });
    if (!spaces.length) b = { x0: 0, y0: 0, x1: 1, y1: 1 };
    return b;
  }

  // Resolve `target` (attendee id or space id) to { space, attendee }.
  function resolveTarget(state) {
    if (!state.target) return null;
    var a = find(state.attendees, state.target);
    if (a) return { space: find(state.spaces, a.spaceId), attendee: a };
    var s = find(state.spaces, state.target);
    if (s) return { space: s, attendee: null };
    return null;
  }

  // ---------------------------------------------------------------------
  // Map geometry (built once from KINNECT_MAP)
  // ---------------------------------------------------------------------

  function pathOf(flat, close) {
    var d = '';
    for (var i = 0; i < flat.length; i += 2) d += (i ? 'L' : 'M') + flat[i] + ' ' + flat[i + 1];
    return d + (close ? 'Z' : '');
  }

  var ROAD_W = { m: 16, p: 12, s: 9, t: 7, r: 5.5, w: 3.5 };
  var ROAD_ORDER = ['w', 'r', 't', 's', 'p', 'm'];

  function buildGeometry(D) {
    var out = '';
    function polys(arr, cls) {
      if (!arr.length) return '';
      return '<path class="' + cls + '" d="' + arr.map(function (p) { return pathOf(p, true); }).join('') + '"/>';
    }
    out += polys(D.green, 'm-green') + polys(D.water, 'm-water') + polys(D.pier, 'm-pier');
    if (D.rail.length) out += '<path class="m-rail" d="' + D.rail.map(function (p) { return pathOf(p); }).join('') + '"/>';

    // One path per road class keeps the DOM tiny: ~15 elements for 2,000 ways.
    var byClass = {};
    D.roads.forEach(function (r) { byClass[r.c] = (byClass[r.c] || '') + pathOf(r.p); });
    ROAD_ORDER.forEach(function (c) {
      if (byClass[c] && c !== 'w') out += '<path class="m-case" stroke-width="' + (ROAD_W[c] + 3.5) + '" d="' + byClass[c] + '"/>';
    });
    ROAD_ORDER.forEach(function (c) {
      if (byClass[c]) out += '<path class="m-road c-' + c + '" stroke-width="' + ROAD_W[c] + '" d="' + byClass[c] + '"/>';
    });
    return out;
  }

  function poiByName(D, name) {
    var n = String(name).toLowerCase();
    var exact = D.pois.filter(function (p) { return p.n.toLowerCase() === n; })[0];
    if (exact) return exact;
    return D.pois.filter(function (p) { return p.n.toLowerCase().indexOf(n) !== -1; })[0] || null;
  }

  // ---------------------------------------------------------------------
  // The feature
  // ---------------------------------------------------------------------

  window.features = window.features || {};
  window.features.find = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<div class="find-head">' +
      '<div class="find-modes" role="tablist">' +
      '<button type="button" data-mode="area" aria-selected="true">Area</button>' +
      '<button type="button" data-mode="venue" aria-selected="false">Venue</button>' +
      '</div>' +
      '<div class="find-where"></div>' +
      '<button type="button" class="find-clear" hidden>Clear</button>' +
      '<button type="button" class="find-iso" aria-pressed="false" hidden>3D</button>' +
      '</div>' +
      '<div class="find-map">' +
      '<div class="find-loading">Loading map…</div>' +
      '</div>' +
      '<div class="find-stage" hidden></div>' +
      '<div class="find-legend">' +
      '<span><i style="background:#3ddc97"></i>You</span>' +
      '<span><i style="background:var(--accent,#7c5cff)"></i>Target / people</span>' +
      '<span><i style="background:#ff9f43"></i>Event</span>' +
      '<span><i style="background:#8b90a5"></i>Place</span>' +
      '</div>';

    var where = el.querySelector('.find-where');
    var clearBtn = el.querySelector('.find-clear');
    var isoBtn = el.querySelector('.find-iso');
    var stage = el.querySelector('.find-stage');
    var mapEl = el.querySelector('.find-map');
    var modes = el.querySelector('.find-modes');

    var mode = 'area';
    var state = store.getState();

    clearBtn.addEventListener('click', function () {
      map.sel = null; map.routeTo = null;
      if (map.ready) renderSheet();
      store.setTarget(null);
    });

    isoBtn.addEventListener('click', function () {
      var on = isoBtn.getAttribute('aria-pressed') !== 'true';
      isoBtn.setAttribute('aria-pressed', String(on));
      stage.classList.toggle('iso', on);
    });

    modes.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-mode]');
      if (b) setMode(b.getAttribute('data-mode'));
    });

    function setMode(m) {
      mode = m;
      modes.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m));
      });
      mapEl.hidden = m !== 'area';
      stage.hidden = m !== 'venue';
      isoBtn.hidden = m !== 'venue';
      render(state);
    }

    // Tapping a room targets it. One delegated listener survives re-renders.
    stage.addEventListener('click', function (e) {
      var room = e.target.closest('[data-space]');
      if (room) store.setTarget(room.getAttribute('data-space'));
    });

    // ------------------------------------------------------------------
    // Venue render
    // ------------------------------------------------------------------

    function renderVenue(st) {
      var spaces = st.spaces || [];
      if (!spaces.length) {
        stage.innerHTML = '<p class="find-empty">No venue in the seed data.</p>';
        return;
      }
      var me = find(st.attendees, st.me);
      var mySpace = me ? find(spaces, me.spaceId) : null;
      var t = resolveTarget(st);
      var targetSpace = t ? t.space : null;

      if (!t || !targetSpace) {
        where.innerHTML = '<span class="dim">Tap a room, or pick someone in Ask or Meet, to get directions.</span>';
        clearBtn.hidden = true;
      } else if (mySpace && targetSpace.id === mySpace.id) {
        where.innerHTML = '<strong>' + esc(t.attendee ? t.attendee.name : targetSpace.name) + '</strong> is in your room. <span class="dim">Look up.</span>';
        clearBtn.hidden = false;
      } else {
        where.innerHTML = (t.attendee ? '<strong>' + esc(t.attendee.name) + '</strong> is in ' : 'Head to ') +
          '<strong>' + esc(targetSpace.name) + '</strong>' +
          (mySpace ? ' <span class="dim">from ' + esc(mySpace.name) + '</span>' : '');
        clearBtn.hidden = false;
      }

      var b = bounds(spaces);
      var vb = [b.x0 * U - PAD, b.y0 * U - PAD, (b.x1 - b.x0) * U + PAD * 2, (b.y1 - b.y0) * U + PAD * 2].join(' ');

      var rooms = spaces.map(function (s) {
        var people = st.attendees.filter(function (a) { return a.spaceId === s.id; });
        var cls = 'find-room' +
          (targetSpace && targetSpace.id === s.id ? ' is-target' : '') +
          (mySpace && mySpace.id === s.id ? ' is-me' : '');
        var x = s.x * U, y = s.y * U, w = s.w * U, h = s.h * U;
        var dots = people.map(function (a, i) {
          var dcls = 'find-dot' + (a.id === st.me ? ' is-me' : '') +
            (t && t.attendee && t.attendee.id === a.id ? ' is-target' : '');
          return '<circle class="' + dcls + '" cx="' + (x + 36 + i * 34) + '" cy="' + (y + h - 36) + '" r="12"><title>' + esc(a.name) + '</title></circle>';
        }).join('');
        return '<g data-space="' + esc(s.id) + '">' +
          '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14"/>' +
          '<text class="find-name" x="' + (x + 30) + '" y="' + (y + 62) + '">' + esc(s.name) + '</text>' +
          (people.length ? '<text class="find-count" x="' + (x + 30) + '" y="' + (y + 104) + '">' +
            people.length + (people.length === 1 ? ' person' : ' people') + '</text>' : '') +
          dots + '</g>';
      }).join('');

      var route = '';
      if (mySpace && targetSpace && targetSpace.id !== mySpace.id) {
        var a = centre(mySpace), z = centre(targetSpace);
        route =
          '<line class="find-route-glow" x1="' + a.x + '" y1="' + a.y + '" x2="' + z.x + '" y2="' + z.y + '"/>' +
          '<line class="find-route" x1="' + a.x + '" y1="' + a.y + '" x2="' + z.x + '" y2="' + z.y + '"/>' +
          '<circle class="find-you" cx="' + a.x + '" cy="' + a.y + '" r="16"/>' +
          '<circle class="find-pin" cx="' + z.x + '" cy="' + z.y + '" r="20"/>';
      } else if (mySpace) {
        var c = centre(mySpace);
        route = '<circle class="find-you" cx="' + c.x + '" cy="' + c.y + '" r="16"/>';
      }

      stage.innerHTML = '<svg class="find-plan" viewBox="' + vb + '" role="img" aria-label="Venue floorplan">' + rooms + route + '</svg>';
    }

    // ------------------------------------------------------------------
    // Area map
    // ------------------------------------------------------------------

    var map = {
      D: null, ready: false, failed: false,
      cx: 0, cy: 0, z: 0.6,            // centre in metres from the venue, px per metre
      sel: null, routeTo: null,        // { type, id } and { x, y, name }
      raf: 0,
      schedule: function () {
        if (!map.ready || mapEl.hidden || map.raf) return;
        map.raf = requestAnimationFrame(function () { map.raf = 0; drawMap(); });
      }
    };

    var svg, geomG, markG, searchInput, results, sheet, ctl;
    var searchIndex = [];
    var events = [];

    function loadMapData(cb) {
      if (window.KINNECT_MAP) return cb(true);
      var s = document.createElement('script');
      s.src = DATA_SRC;
      s.onload = function () { cb(!!window.KINNECT_MAP); };
      s.onerror = function () { cb(false); };
      document.head.appendChild(s);
    }

    // Where is everyone, in metres from the venue?
    function positions(st) {
      var D = map.D, out = {};
      var perRoom = {};
      st.attendees.forEach(function (a) {
        var away = AWAY[a.id] && poiByName(D, AWAY[a.id]);
        if (away) { out[a.id] = { x: away.x, y: away.y, at: away.n, away: true }; return; }
        var sp = find(st.spaces, a.spaceId);
        var i = perRoom[a.spaceId] = (perRoom[a.spaceId] || 0) + 1;
        // Rooms sit inside a ~110 x 70 m footprint around the venue point.
        var rx = sp ? ((sp.x + sp.w / 2) - 6) * 9 : 0;
        var ry = sp ? ((sp.y + sp.h / 2) - 4) * 9 : 0;
        out[a.id] = { x: rx + ((i - 1) % 3 - 1) * 10, y: ry + Math.floor((i - 1) / 3) * 10, at: sp ? sp.name : D.venue.n, away: false };
      });
      return out;
    }

    function buildEvents() {
      var D = map.D;
      events = EVENTS.map(function (e) {
        var p = poiByName(D, e.at) || D.venue;
        return { id: e.id, title: e.title, icon: e.icon, x: p.x, y: p.y, place: p.n, startsIn: e.startsIn };
      });
    }

    function buildSearchIndex(st) {
      var D = map.D, pos = positions(st);
      searchIndex = [];
      st.attendees.forEach(function (a) {
        var p = pos[a.id];
        searchIndex.push({ type: 'person', id: a.id, name: a.name + (a.id === st.me ? ' (you)' : ''), sub: (a.expertise || []).join(', '), x: p.x, y: p.y });
      });
      events.forEach(function (e) {
        searchIndex.push({ type: 'event', id: e.id, name: e.title, sub: e.place, x: e.x, y: e.y });
      });
      D.pois.forEach(function (p, i) {
        searchIndex.push({ type: 'place', id: String(i), name: p.n, sub: p.k.replace('_', ' '), x: p.x, y: p.y });
      });
      var streets = {};
      D.roads.forEach(function (r) {
        if (!r.n) return;
        var len = 0;
        for (var i = 2; i < r.p.length; i += 2) len += Math.hypot(r.p[i] - r.p[i - 2], r.p[i + 1] - r.p[i - 1]);
        var s = streets[r.n] || (streets[r.n] = { len: 0 });
        var mi = Math.floor(r.p.length / 4) * 2;
        if (len > s.len) { s.len = len; s.x = r.p[mi]; s.y = r.p[mi + 1]; }
      });
      Object.keys(streets).forEach(function (n) {
        searchIndex.push({ type: 'street', id: n, name: n, sub: 'street', x: streets[n].x, y: streets[n].y });
      });
    }

    function setupMap() {
      mapEl.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of the area around the venue">' +
        '<g class="geom"></g><g class="marks"></g></svg>' +
        '<div class="find-search"><span class="mag">🔍</span>' +
        '<input type="search" placeholder="Search people, events, places, streets" autocomplete="off" aria-label="Search the map">' +
        '<div class="find-results" hidden></div></div>' +
        '<div class="find-ctl">' +
        '<button type="button" data-act="in" title="Zoom in">+</button>' +
        '<button type="button" data-act="out" title="Zoom out">−</button>' +
        '<button type="button" data-act="me" title="Centre on you">◎</button>' +
        '<button type="button" data-act="iso" class="txt" aria-pressed="false" title="Tilt">3D</button>' +
        '</div>' +
        '<div class="find-sheet" hidden></div>' +
        '<div class="find-attrib">© OpenStreetMap contributors</div>';

      svg = mapEl.querySelector('svg');
      geomG = svg.querySelector('.geom');
      markG = svg.querySelector('.marks');
      searchInput = mapEl.querySelector('input');
      results = mapEl.querySelector('.find-results');
      sheet = mapEl.querySelector('.find-sheet');
      ctl = mapEl.querySelector('.find-ctl');

      geomG.innerHTML = buildGeometry(map.D);

      // Pan and pinch. Pointer capture means click targets get lost, so we
      // remember what was under the finger on pointerdown and act on release.
      var pts = {}, downOn = null, moved = false, lastMid = null, lastDist = 0;
      svg.addEventListener('pointerdown', function (e) {
        svg.setPointerCapture(e.pointerId);
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pts);
        if (ids.length === 1) { downOn = e.target.closest('[data-sel]'); moved = false; }
        if (ids.length === 2) { lastDist = dist2(pts); lastMid = mid2(pts); }
        mapEl.classList.add('dragging');
      });
      svg.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return;
        var prev = pts[e.pointerId];
        var ids = Object.keys(pts);
        if (ids.length === 1) {
          var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
          map.cx -= dx / map.z; map.cy -= dy / map.z;
        }
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (ids.length === 2) {
          var d = dist2(pts), m = mid2(pts);
          var r = svg.getBoundingClientRect();
          if (lastDist) zoomAt(m.x - r.left, m.y - r.top, d / lastDist);
          map.cx -= (m.x - lastMid.x) / map.z; map.cy -= (m.y - lastMid.y) / map.z;
          lastDist = d; lastMid = m; moved = true;
        }
        map.schedule();
      });
      function up(e) {
        if (!pts[e.pointerId]) return;
        delete pts[e.pointerId];
        if (!Object.keys(pts).length) {
          mapEl.classList.remove('dragging');
          if (!moved) {
            if (downOn) select(downOn.getAttribute('data-sel'));
            else if (map.sel) { map.sel = null; renderSheet(); map.schedule(); }
          }
          downOn = null;
        }
        lastDist = 0;
      }
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
      svg.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = svg.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
        map.schedule();
      }, { passive: false });
      svg.addEventListener('dblclick', function (e) {
        var r = svg.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, 1.8);
        map.schedule();
      });

      ctl.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        var W = svg.clientWidth, H = svg.clientHeight;
        if (act === 'in') zoomAt(W / 2, H / 2, 1.6);
        if (act === 'out') zoomAt(W / 2, H / 2, 1 / 1.6);
        if (act === 'me') { var me = mePos(); map.cx = me.x; map.cy = me.y; map.z = Math.max(map.z, 1.4); }
        if (act === 'iso') {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          mapEl.classList.toggle('iso', on);
        }
        map.schedule();
      });

      sheet.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        var item = selected();
        if (act === 'close') { map.sel = null; map.routeTo = null; renderSheet(); map.schedule(); }
        if (act === 'route' && item) { map.routeTo = { x: item.x, y: item.y, name: item.name }; fitRoute(); }
        if (act === 'target' && item && item.type === 'person') store.setTarget(item.id);
        if (act === 'venue') setMode('venue');
      });

      // Search
      var active = -1, hits = [];
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim().toLowerCase();
        active = -1;
        if (!q) { results.hidden = true; return; }
        var me = mePos();
        hits = searchIndex.filter(function (it) {
          return it.name.toLowerCase().indexOf(q) !== -1 || (it.sub && it.sub.toLowerCase().indexOf(q) !== -1);
        }).map(function (it) {
          var starts = it.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
          var rank = { person: 0, event: 1, place: 2, street: 3 }[it.type];
          return { it: it, key: starts * 10 + rank, d: Math.hypot(it.x - me.x, it.y - me.y) };
        }).sort(function (a, b) { return a.key - b.key || a.d - b.d; }).slice(0, 8);
        results.innerHTML = hits.map(function (h, i) {
          return '<button type="button" data-i="' + i + '"><span class="k">' + h.it.type + '</span>' +
            '<span>' + esc(h.it.name) + (h.it.sub ? ' <span style="opacity:.5">· ' + esc(h.it.sub) + '</span>' : '') + '</span>' +
            '<span class="s">' + fmtDist(h.d) + '</span></button>';
        }).join('') || '<button type="button" disabled><span class="k"></span>No matches nearby</button>';
        results.hidden = false;
      });
      searchInput.addEventListener('keydown', function (e) {
        if (results.hidden) return;
        if (e.key === 'ArrowDown') { active = Math.min(active + 1, hits.length - 1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0); e.preventDefault(); }
        else if (e.key === 'Enter') { if (hits.length) pick((hits[active] || hits[0]).it); e.preventDefault(); return; }
        else if (e.key === 'Escape') { results.hidden = true; searchInput.blur(); return; }
        results.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('is-active', i === active); });
      });
      results.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus
      results.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-i]');
        if (b) pick(hits[Number(b.getAttribute('data-i'))].it);
      });
      searchInput.addEventListener('blur', function () { setTimeout(function () { results.hidden = true; }, 150); });

      function pick(it) {
        results.hidden = true;
        searchInput.value = it.name;
        searchInput.blur();
        map.cx = it.x; map.cy = it.y; map.z = Math.max(map.z, it.type === 'street' ? 1.2 : 2.4);
        select(it.type + ':' + it.id, true);
      }

      // Re-draw once the section becomes visible or the window resizes.
      if (window.ResizeObserver) new ResizeObserver(function () { map.schedule(); }).observe(svg);
      else window.addEventListener('resize', map.schedule);
    }

    function dist2(pts) { var k = Object.keys(pts); return Math.hypot(pts[k[0]].x - pts[k[1]].x, pts[k[0]].y - pts[k[1]].y); }
    function mid2(pts) { var k = Object.keys(pts); return { x: (pts[k[0]].x + pts[k[1]].x) / 2, y: (pts[k[0]].y + pts[k[1]].y) / 2 }; }

    function zoomAt(px, py, factor) {
      var W = svg.clientWidth, H = svg.clientHeight;
      var wx = map.cx + (px - W / 2) / map.z, wy = map.cy + (py - H / 2) / map.z;
      map.z = clamp(map.z * factor, 0.1, 9);
      map.cx = wx - (px - W / 2) / map.z; map.cy = wy - (py - H / 2) / map.z;
    }

    function mePos() {
      var p = positions(state)[state.me];
      return p || { x: 0, y: 0 };
    }

    function selected() {
      if (!map.sel) return null;
      var pos = positions(state);
      if (map.sel.type === 'person') {
        var a = find(state.attendees, map.sel.id); if (!a) return null;
        var p = pos[a.id];
        return { type: 'person', id: a.id, name: a.name, x: p.x, y: p.y, at: p.at, away: p.away, a: a };
      }
      if (map.sel.type === 'event') {
        var e = find(events, map.sel.id); if (!e) return null;
        return { type: 'event', id: e.id, name: e.title, x: e.x, y: e.y, e: e };
      }
      if (map.sel.type === 'place') {
        var q = map.D.pois[Number(map.sel.id)]; if (!q) return null;
        return { type: 'place', id: map.sel.id, name: q.n, x: q.x, y: q.y, kind: q.k };
      }
      if (map.sel.type === 'street') {
        var s = searchIndex.filter(function (it) { return it.type === 'street' && it.id === map.sel.id; })[0]; if (!s) return null;
        return { type: 'street', id: s.id, name: s.name, x: s.x, y: s.y };
      }
      if (map.sel.type === 'venue') return { type: 'venue', id: 'venue', name: map.D.venue.n, x: 0, y: 0 };
      return null;
    }

    function select(key, fromSearch) {
      var i = key.indexOf(':');
      var type = i === -1 ? key : key.slice(0, i), id = i === -1 ? key : key.slice(i + 1);
      if (type === 'cluster') { map.z = Math.max(map.z, 2.2); map.cx = 0; map.cy = 0; map.schedule(); return; }
      map.sel = { type: type, id: id };
      if (!fromSearch && type === 'person') map.routeTo = null;
      renderSheet();
      map.schedule();
    }

    function fitRoute() {
      if (!map.routeTo) return;
      var me = mePos(), t = map.routeTo;
      var W = svg.clientWidth || 600, H = svg.clientHeight || 400;
      var d = Math.hypot(t.x - me.x, t.y - me.y) || 1;
      map.z = clamp(Math.min(W, H) * 0.5 / d, 0.15, 3);
      // Bias upward so the sheet along the bottom doesn't cover the route.
      map.cx = (me.x + t.x) / 2; map.cy = (me.y + t.y) / 2 + 90 / map.z;
      map.schedule();
    }

    function renderSheet() {
      var item = selected();
      if (!item) { sheet.hidden = true; return; }
      var me = mePos();
      var d = Math.hypot(item.x - me.x, item.y - me.y);
      var av, title = esc(item.name), sub = '', acts = '';
      var routeBtn = '<button type="button" class="pri" data-act="route">Directions</button>';

      if (item.type === 'person') {
        av = '<div class="av" style="background:' + hue(item.id) + '">' + esc(initials(item.name)) + '</div>';
        sub = (item.away ? 'Stepped out · at ' + esc(item.at) : 'In the venue · ' + esc(item.at)) + '<br>' +
          esc((item.a.expertise || []).join(', ')) + (item.a.credits ? ' · ' + item.a.credits + ' credits' : '');
        if (item.id !== state.me) {
          acts = routeBtn + (state.target === item.id ? '' : '<button type="button" data-act="target">Set as target</button>');
          sub += '<br>' + walkText(d);
        } else { sub = 'That’s you. ' + sub; }
      } else if (item.type === 'event') {
        av = '<div class="av" style="background:#ff9f43;color:#1a1a1a">' + item.e.icon + '</div>';
        sub = startsText(item.e.startsIn) + ' · ' + esc(item.e.place) + '<br>' + walkText(d);
        acts = routeBtn;
      } else if (item.type === 'place') {
        av = '<div class="av" style="background:#2b2f3d">' + (POI_ICON[item.kind] || '📍') + '</div>';
        sub = esc(item.kind.replace('_', ' ')) + ' · ' + walkText(d);
        acts = routeBtn;
      } else if (item.type === 'street') {
        av = '<div class="av" style="background:#2b2f3d">🛣️</div>';
        sub = 'Street · ' + walkText(d);
        acts = routeBtn;
      } else {
        av = '<div class="av" style="background:var(--accent,#7c5cff)">🏢</div>';
        sub = 'The venue · ' + state.attendees.length + ' people here today';
        acts = '<button type="button" class="pri" data-act="venue">Open venue plan</button>';
      }

      sheet.innerHTML = av + '<div class="body"><h3>' + title + '</h3><div class="sub">' + sub + '</div>' +
        (acts ? '<div class="acts">' + acts + '</div>' : '') + '</div>' +
        '<button type="button" class="x" data-act="close" aria-label="Close">✕</button>';
      sheet.hidden = false;
    }

    function drawMap() {
      var D = map.D, W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      var z = map.z, cx = map.cx, cy = map.cy;
      var tx = W / 2 - cx * z, ty = H / 2 - cy * z;
      geomG.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + z + ')');

      function sx(x) { return x * z + tx; }
      function sy(y) { return y * z + ty; }
      function onScreen(x, y, m) { m = m === undefined ? 40 : m; var X = sx(x), Y = sy(y); return X > -m && X < W + m && Y > -m && Y < H + m; }

      var out = '';
      var selKey = map.sel ? map.sel.type + ':' + map.sel.id : '';

      // Street names: one label per name, on the longest visible segment.
      if (z >= 0.55) {
        var best = {};
        D.roads.forEach(function (r) {
          if (!r.n) return;
          if (r.c === 'r' && z < 2.2) return;
          if (r.c === 'w' && z < 3) return;
          if (r.c === 't' && z < 0.9) return;
          // Total on-screen length of the way, then the segment at its midpoint.
          var L = 0, segs = [];
          for (var i = 2; i < r.p.length; i += 2) {
            var x1 = r.p[i - 2], y1 = r.p[i - 1], x2 = r.p[i], y2 = r.p[i + 1];
            if (!onScreen((x1 + x2) / 2, (y1 + y2) / 2, 0)) continue;
            var l = Math.hypot(x2 - x1, y2 - y1) * z;
            segs.push({ l: l, s: [x1, y1, x2, y2] });
            L += l;
          }
          if (L < r.n.length * 6.5 + 8 || (best[r.n] && best[r.n].L >= L)) return;
          var acc = 0, seg = segs[0].s;
          for (var k = 0; k < segs.length; k++) { acc += segs[k].l; if (acc >= L / 2) { seg = segs[k].s; break; } }
          best[r.n] = { L: L, seg: seg };
        });
        Object.keys(best).slice(0, 60).forEach(function (n) {
          var s = best[n].seg;
          var ang = Math.atan2(s[3] - s[1], s[2] - s[0]) * 180 / Math.PI;
          if (ang > 90 || ang < -90) ang += 180;
          out += '<text class="m-lbl" text-anchor="middle" transform="translate(' + sx((s[0] + s[2]) / 2) + ' ' + (sy((s[1] + s[3]) / 2) - 3) +
            ') rotate(' + ang.toFixed(1) + ')">' + esc(n) + '</text>';
        });
      }

      // Places, thinned by zoom.
      var shown = 0;
      D.pois.forEach(function (p, i) {
        var tier = POI_TIER[p.k] || 2.6;
        var isSel = selKey === 'place:' + i;
        if ((z < tier && !isSel) || !onScreen(p.x, p.y) || shown > 70) return;
        shown++;
        out += '<g class="m-poi' + (isSel ? ' is-sel' : '') + '" data-sel="place:' + i + '">' +
          '<circle cx="' + sx(p.x) + '" cy="' + sy(p.y) + '" r="' + (isSel ? 6 : 3.5) + '"/>' +
          (z >= tier + 0.3 || isSel ? '<text x="' + (sx(p.x) + 7) + '" y="' + (sy(p.y) + 4) + '">' + esc(p.n) + '</text>' : '') +
          '</g>';
      });

      // Venue marker.
      if (onScreen(0, 0)) {
        out += '<g class="m-venue" data-sel="venue"><rect x="' + (sx(0) - 7) + '" y="' + (sy(0) - 7) + '" width="14" height="14" rx="3"/>' +
          (z >= 0.35 ? '<text x="' + (sx(0) + (z < 1.6 ? 26 : 11)) + '" y="' + (sy(0) - (z < 1.6 ? 14 : 8)) + '">' + esc(D.venue.n) + '</text>' : '') + '</g>';
      }

      // Events.
      events.forEach(function (e) {
        if (!onScreen(e.x, e.y)) return;
        var isSel = selKey === 'event:' + e.id;
        out += '<g class="m-ev' + (isSel ? ' is-sel' : '') + '" data-sel="event:' + e.id + '">' +
          '<circle cx="' + sx(e.x) + '" cy="' + sy(e.y) + '" r="13"/>' +
          '<text class="ic" x="' + sx(e.x) + '" y="' + sy(e.y) + '">' + e.icon + '</text>' +
          '<text class="nm" x="' + (sx(e.x) + 17) + '" y="' + (sy(e.y) + 4) + '">' + esc(e.title) + '</text>' +
          '</g>';
      });

      // People. Everyone in the venue collapses to one bubble when zoomed out.
      var pos = positions(state);
      var inVenue = state.attendees.filter(function (a) { return !pos[a.id].away; });
      var me = pos[state.me] || { x: 0, y: 0 };

      function person(a) {
        var p = pos[a.id];
        if (!p || !onScreen(p.x, p.y)) return '';
        var cls = 'm-p' + (a.id === state.me ? ' is-me' : '') + (state.target === a.id ? ' is-target' : '') +
          (selKey === 'person:' + a.id ? ' is-sel' : '');
        return '<g class="' + cls + '" data-sel="person:' + a.id + '">' +
          '<circle cx="' + sx(p.x) + '" cy="' + sy(p.y) + '" r="13" fill="' + hue(a.id) + '"/>' +
          '<text x="' + sx(p.x) + '" y="' + sy(p.y) + '">' + esc(initials(a.name)) + '</text>' +
          ((z >= 2.6 || p.away || state.target === a.id || a.id === state.me) ? '<text class="nm" x="' + (sx(p.x) + 17) + '" y="' + (sy(p.y) + 4) + '">' +
            esc(a.name.split(' ')[0]) + (a.id === state.me ? ' (you)' : '') + '</text>' : '') +
          '</g>';
      }

      state.attendees.forEach(function (a) { if (pos[a.id].away) out += person(a); });
      if (z < 1.6) {
        if (onScreen(0, 0)) {
          out += '<g class="m-cluster" data-sel="cluster"><circle cx="' + sx(0) + '" cy="' + (sy(0) - 2) + '" r="19"/>' +
            '<text x="' + sx(0) + '" y="' + (sy(0) - 2) + '">' + inVenue.length + '</text></g>';
        }
      } else {
        inVenue.forEach(function (a) { if (a.id !== state.me) out += person(a); });
      }

      // You, with a pulse.
      if (onScreen(me.x, me.y)) {
        out += '<g class="m-you"><circle class="ring" cx="' + sx(me.x) + '" cy="' + sy(me.y) + '" r="14"/>' +
          '<circle class="core" cx="' + sx(me.x) + '" cy="' + sy(me.y) + '" r="7"/></g>';
        if (z >= 1.6) { var meA = find(state.attendees, state.me); if (meA) out += person(meA); }
      }

      // Route.
      if (map.routeTo) {
        var t = map.routeTo, d = Math.hypot(t.x - me.x, t.y - me.y);
        out += '<line class="m-route-glow" x1="' + sx(me.x) + '" y1="' + sy(me.y) + '" x2="' + sx(t.x) + '" y2="' + sy(t.y) + '"/>' +
          '<line class="m-route" x1="' + sx(me.x) + '" y1="' + sy(me.y) + '" x2="' + sx(t.x) + '" y2="' + sy(t.y) + '"/>' +
          '<text class="m-route-lbl" x="' + sx((me.x + t.x) / 2) + '" y="' + (sy((me.y + t.y) / 2) - 8) + '">' + esc(walkText(d)) + '</text>';
      }

      markG.innerHTML = out;
    }

    function renderArea(st) {
      if (map.failed) {
        where.innerHTML = '<span class="dim">Map data didn’t load. Showing the venue plan instead.</span>';
        return;
      }
      var pos = map.ready ? positions(st) : {};
      var away = Object.keys(pos).filter(function (id) { return pos[id].away; }).length;
      var t = st.target && find(st.attendees, st.target);
      if (t && map.ready) {
        var p = pos[t.id], me = pos[st.me] || { x: 0, y: 0 };
        where.innerHTML = '<strong>' + esc(t.name) + '</strong> is ' + (p.away ? 'at ' : 'in ') + '<strong>' + esc(p.at) + '</strong>' +
          ' <span class="dim">' + walkText(Math.hypot(p.x - me.x, p.y - me.y)) + '</span>';
        clearBtn.hidden = false;
      } else {
        where.innerHTML = 'Around <strong>' + esc(map.D ? map.D.venue.n : 'the venue') + '</strong> <span class="dim">· ' +
          (st.attendees.length - away) + ' here, ' + away + ' nearby · ' + events.length + ' events</span>';
        clearBtn.hidden = true;
      }
      map.schedule();
    }

    function render(st) {
      state = st;
      if (mode === 'venue') renderVenue(st); else renderArea(st);
    }

    // When Ask or Meet sets a target, show the way there in whichever view.
    var lastTarget = state.target;
    store.subscribe(function (st) {
      state = st;
      if (st.target !== lastTarget) {
        lastTarget = st.target;
        if (st.target && find(st.spaces, st.target) && mode === 'area') setMode('venue');
        else if (st.target && map.ready && find(st.attendees, st.target)) {
          var p = positions(st)[st.target];
          map.sel = { type: 'person', id: st.target };
          map.routeTo = { x: p.x, y: p.y, name: st.target };
          renderSheet();
          if (mode === 'area') fitRoute();
        } else if (!st.target && map.ready) {
          map.sel = null; map.routeTo = null; renderSheet();
        }
      }
      render(st);
    });

    render(state);
    loadMapData(function (ok) {
      if (!ok) {
        map.failed = true;
        mapEl.innerHTML = '<div class="find-loading">Map data missing (features/find-map-data.js)</div>';
        setMode('venue');
        return;
      }
      map.D = window.KINNECT_MAP;
      buildEvents();
      buildSearchIndex(state);
      setupMap();
      map.ready = true;
      if (state.target && find(state.attendees, state.target)) {
        var p = positions(state)[state.target];
        map.sel = { type: 'person', id: state.target };
        map.routeTo = { x: p.x, y: p.y, name: state.target };
        renderSheet();
        fitRoute();
      }
      render(state);
    });
  };
})();
