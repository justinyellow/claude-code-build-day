// Kinnect — Thank. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.
//
// Credits are compute, not money. Ask calls store.award() when a question is
// answered; this view shows the balance move and lets you gift credits on.

(function () {
  // The one line that makes the number mean something on a projector.
  var CREDIT_NOTE = '500 credits = 1 hour of Claude Opus';
  var DELTA_MS = 3000; // how long a +50 / -50 chip stays on screen

  var STYLE = [
    '.thank-me{background:var(--surface,#1b1b22);border:1px solid var(--line,#3a3a44);border-radius:.75rem;',
    'padding:1.5rem 1.75rem;margin-bottom:1.5rem}',
    '.thank-label{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;opacity:.55}',
    '.thank-balance{display:flex;align-items:baseline;gap:.75rem;margin:.25rem 0}',
    '.thank-num{font-size:3.5rem;font-weight:700;letter-spacing:-.03em;line-height:1}',
    '.thank-unit{font-size:1.25rem;opacity:.6}',
    '.thank-note{font-size:1.1rem;opacity:.7;margin-top:.5rem}',
    '.thank-note strong{color:var(--accent,#7c5cff);font-weight:600}',
    '.thank-delta{font-size:1.25rem;font-weight:700;padding:.15rem .6rem;border-radius:2rem;',
    'animation:thank-pop .35s ease-out,thank-fade .6s ease-in ' + ((DELTA_MS - 600) / 1000) + 's forwards}',
    '.thank-delta.up{color:#3ddc97;background:rgba(61,220,151,.15)}',
    '.thank-delta.down{color:#ff7a7a;background:rgba(255,122,122,.15)}',
    '.thank-list .thank-delta{font-size:.95rem;padding:.05rem .5rem}',
    '@keyframes thank-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}',
    '@keyframes thank-fade{to{opacity:0}}',
    '.thank-gift{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;font-size:1.15rem;',
    'padding:1rem 1.25rem;margin-bottom:1.5rem;border:1px dashed var(--line,#3a3a44);border-radius:.75rem}',
    '.thank-gift input,.thank-gift select{font:inherit;font-size:1.1rem;padding:.5rem .75rem;border-radius:.5rem;',
    'border:1px solid var(--line,#3a3a44);background:var(--surface,#1b1b22);color:inherit}',
    '.thank-gift input{width:6rem}',
    '.thank-gift button{font:inherit;font-size:1.1rem;padding:.55rem 1.25rem;border:0;border-radius:.5rem;',
    'background:var(--accent,#7c5cff);color:#fff;cursor:pointer}',
    '.thank-msg{flex-basis:100%;font-size:1rem;min-height:1.5rem}',
    '.thank-msg.err{color:#ff7a7a}',
    '.thank-msg.ok{color:#3ddc97}',
    '.thank-h{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin:0 0 .5rem}',
    '.thank-row{display:flex;align-items:center;gap:.75rem;padding:.55rem .75rem;border-radius:.5rem;font-size:1.1rem}',
    '.thank-row:nth-child(even){background:rgba(255,255,255,.03)}',
    '.thank-row .nm{font-weight:600;flex:1}',
    '.thank-row .cr{color:var(--accent,#7c5cff);font-variant-numeric:tabular-nums;min-width:4.5rem;text-align:right}',
    '.thank-row button{font:inherit;font-size:.9rem;padding:.3rem .8rem;border:1px solid var(--line,#3a3a44);',
    'border-radius:2rem;background:transparent;color:inherit;cursor:pointer;opacity:.7}',
    '.thank-row button:hover{opacity:1;border-color:var(--accent,#7c5cff)}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('thank-style')) return;
    var s = document.createElement('style');
    s.id = 'thank-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString();
  }

  function byId(state, id) {
    return state.attendees.filter(function (a) { return a.id === id; })[0] || null;
  }

  function deltaChip(d) {
    if (!d) return '';
    var cls = d > 0 ? 'up' : 'down';
    var sign = d > 0 ? '+' : '−';
    return '<span class="thank-delta ' + cls + '">' + sign + fmt(Math.abs(d)) + '</span>';
  }

  window.features = window.features || {};
  window.features.thank = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<div class="thank-me">' +
      '<div class="thank-label">Your credits</div>' +
      '<div class="thank-balance"><span class="thank-num">0</span><span class="thank-unit">credits</span><span class="thank-me-delta"></span></div>' +
      '<div class="thank-note">Earned by answering. <strong>' + esc(CREDIT_NOTE) + '</strong></div>' +
      '</div>' +
      '<form class="thank-gift">' +
      '<span>Gift</span><input type="number" min="1" step="1" value="50" aria-label="credits to gift">' +
      '<span>credits to</span><select aria-label="recipient"></select>' +
      '<button type="submit">Send</button>' +
      '<span class="thank-msg"></span>' +
      '</form>' +
      '<p class="thank-h">Everyone else</p>' +
      '<div class="thank-list"></div>';

    var num = el.querySelector('.thank-num');
    var meDelta = el.querySelector('.thank-me-delta');
    var form = el.querySelector('.thank-gift');
    var amount = form.querySelector('input');
    var select = form.querySelector('select');
    var msg = form.querySelector('.thank-msg');
    var list = el.querySelector('.thank-list');

    var prev = {};    // id -> credits at last render
    var recent = {};  // id -> { delta, at } for the chip
    var clearTimer = null;

    function say(text, cls) {
      msg.textContent = text;
      msg.className = 'thank-msg' + (cls ? ' ' + cls : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var state = store.getState();
      var me = byId(state, state.me);
      var to = select.value;
      var n = Math.floor(Number(amount.value));

      if (!me || !to) return;
      if (!(n > 0)) { say('Pick a number of credits to gift.', 'err'); return; }
      if (n > (me.credits || 0)) { say('You only have ' + fmt(me.credits) + ' credits.', 'err'); return; }

      store.award(me.id, -n);
      store.award(to, n);
      say('Sent ' + fmt(n) + ' credits to ' + (byId(store.getState(), to) || {}).name + '.', 'ok');
    });

    // "Gift" buttons in the list just pick the recipient.
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-to]');
      if (!btn) return;
      select.value = btn.getAttribute('data-to');
      amount.focus();
      amount.select();
    });

    function render(state) {
      var me = byId(state, state.me);
      var now = Date.now();

      // Work out who moved since last time, so the change is visible.
      state.attendees.forEach(function (a) {
        var was = prev[a.id];
        if (was !== undefined && was !== a.credits) {
          recent[a.id] = { delta: a.credits - was, at: now };
        }
        prev[a.id] = a.credits;
      });
      Object.keys(recent).forEach(function (id) {
        if (now - recent[id].at > DELTA_MS) delete recent[id];
      });
      // Re-render once the chips have faded so they don't linger.
      if (Object.keys(recent).length && !clearTimer) {
        clearTimer = setTimeout(function () {
          clearTimer = null;
          render(store.getState());
        }, DELTA_MS + 50);
      }

      num.textContent = fmt(me ? me.credits : 0);
      meDelta.innerHTML = me && recent[me.id] ? deltaChip(recent[me.id].delta) : '';

      var others = state.attendees.filter(function (a) { return a.id !== state.me; });

      var chosen = select.value;
      select.innerHTML = others.map(function (a) {
        return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>';
      }).join('');
      if (chosen) select.value = chosen;

      list.innerHTML = others.slice().sort(function (a, b) {
        return (b.credits || 0) - (a.credits || 0);
      }).map(function (a) {
        return '<div class="thank-row">' +
          '<span class="nm">' + esc(a.name) + '</span>' +
          (recent[a.id] ? deltaChip(recent[a.id].delta) : '') +
          '<span class="cr">' + fmt(a.credits) + '</span>' +
          '<button type="button" data-to="' + esc(a.id) + '">Gift</button>' +
          '</div>';
      }).join('');
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
