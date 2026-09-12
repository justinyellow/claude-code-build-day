// Kinnect — Find. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.
//
// A flat SVG floorplan drawn from `spaces` (x, y, w, h on a grid). When Ask or
// Meet sets `store.getState().target` (an attendee or space id) the room lights
// up and a route is drawn from your room to it. Straight line; nobody is
// checking whether it goes through a wall.

(function () {
  var U = 100;     // grid unit -> SVG user units
  var PAD = 40;    // margin around the plan, in SVG units

  var STYLE = [
    '.find-head{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;font-size:1.2rem}',
    '.find-where{flex:1;min-width:14rem}',
    '.find-where strong{color:var(--accent,#7c5cff)}',
    '.find-where .dim{opacity:.55}',
    '.find-clear,.find-iso{font:inherit;font-size:.95rem;padding:.35rem .9rem;border:1px solid var(--line,#3a3a44);',
    'border-radius:2rem;background:transparent;color:inherit;cursor:pointer;opacity:.75}',
    '.find-clear:hover,.find-iso:hover{opacity:1;border-color:var(--accent,#7c5cff)}',
    '.find-iso[aria-pressed="true"]{opacity:1;border-color:var(--accent,#7c5cff);background:rgba(124,92,255,.15)}',
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
    '.find-legend{display:flex;gap:1.5rem;font-size:.95rem;opacity:.65;margin-top:.5rem}',
    '.find-legend i{display:inline-block;width:.75rem;height:.75rem;border-radius:50%;margin-right:.4rem;vertical-align:middle}',
    '.find-empty{opacity:.6;font-size:1.1rem}'
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

  function centre(space) {
    return { x: (space.x + space.w / 2) * U, y: (space.y + space.h / 2) * U };
  }

  // Bounding box of the grid so any layout fits the viewBox.
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

  window.features = window.features || {};
  window.features.find = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<div class="find-head">' +
      '<div class="find-where"></div>' +
      '<button type="button" class="find-clear" hidden>Clear</button>' +
      '<button type="button" class="find-iso" aria-pressed="false">3D</button>' +
      '</div>' +
      '<div class="find-stage"></div>' +
      '<div class="find-legend">' +
      '<span><i style="background:#3ddc97"></i>You</span>' +
      '<span><i style="background:var(--accent,#7c5cff)"></i>Target</span>' +
      '<span><i style="background:#5d5d6b"></i>Someone</span>' +
      '</div>';

    var where = el.querySelector('.find-where');
    var clearBtn = el.querySelector('.find-clear');
    var isoBtn = el.querySelector('.find-iso');
    var stage = el.querySelector('.find-stage');

    clearBtn.addEventListener('click', function () { store.setTarget(null); });

    isoBtn.addEventListener('click', function () {
      var on = isoBtn.getAttribute('aria-pressed') !== 'true';
      isoBtn.setAttribute('aria-pressed', String(on));
      stage.classList.toggle('iso', on);
    });

    // Tapping a room targets it. One delegated listener survives re-renders.
    stage.addEventListener('click', function (e) {
      var room = e.target.closest('[data-space]');
      if (room) store.setTarget(room.getAttribute('data-space'));
    });

    function render(state) {
      var spaces = state.spaces || [];
      if (!spaces.length) {
        stage.innerHTML = '<p class="find-empty">No venue in the seed data.</p>';
        return;
      }

      var me = find(state.attendees, state.me);
      var mySpace = me ? find(spaces, me.spaceId) : null;
      var t = resolveTarget(state);
      var targetSpace = t ? t.space : null;

      // Header line.
      if (!t || !targetSpace) {
        where.innerHTML = '<span class="dim">Tap a room, or pick someone in Ask or Meet, to get directions.</span>';
        clearBtn.hidden = true;
      } else if (mySpace && targetSpace.id === mySpace.id) {
        where.innerHTML = (t.attendee ? '<strong>' + esc(t.attendee.name) + '</strong> is' : '<strong>' + esc(targetSpace.name) + '</strong> is') +
          ' in your room. <span class="dim">Look up.</span>';
        clearBtn.hidden = false;
      } else {
        where.innerHTML = (t.attendee ? '<strong>' + esc(t.attendee.name) + '</strong> is in ' : 'Head to ') +
          '<strong>' + esc(targetSpace.name) + '</strong>' +
          (mySpace ? ' <span class="dim">from ' + esc(mySpace.name) + '</span>' : '');
        clearBtn.hidden = false;
      }

      var b = bounds(spaces);
      var vb = [
        b.x0 * U - PAD, b.y0 * U - PAD,
        (b.x1 - b.x0) * U + PAD * 2, (b.y1 - b.y0) * U + PAD * 2
      ].join(' ');

      var rooms = spaces.map(function (s) {
        var people = state.attendees.filter(function (a) { return a.spaceId === s.id; });
        var cls = 'find-room' +
          (targetSpace && targetSpace.id === s.id ? ' is-target' : '') +
          (mySpace && mySpace.id === s.id ? ' is-me' : '');
        var x = s.x * U, y = s.y * U, w = s.w * U, h = s.h * U;

        // One dot per person along the bottom edge of the room.
        var dots = people.map(function (a, i) {
          var dcls = 'find-dot' +
            (a.id === state.me ? ' is-me' : '') +
            (t && t.attendee && t.attendee.id === a.id ? ' is-target' : '');
          return '<circle class="' + dcls + '" cx="' + (x + 36 + i * 34) + '" cy="' + (y + h - 36) + '" r="12">' +
            '<title>' + esc(a.name) + '</title></circle>';
        }).join('');

        return '<g data-space="' + esc(s.id) + '">' +
          '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14"/>' +
          '<text class="find-name" x="' + (x + 30) + '" y="' + (y + 62) + '">' + esc(s.name) + '</text>' +
          (people.length ? '<text class="find-count" x="' + (x + 30) + '" y="' + (y + 104) + '">' +
            people.length + (people.length === 1 ? ' person' : ' people') + '</text>' : '') +
          dots +
          '</g>';
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

      stage.innerHTML =
        '<svg class="find-plan" viewBox="' + vb + '" role="img" aria-label="Venue floorplan">' +
        rooms + route +
        '</svg>';
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
