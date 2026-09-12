// Kinnect — Ask. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.

(function () {
  var STYLE = [
    '.ask-form{display:flex;gap:.5rem;margin-bottom:1.5rem}',
    '.ask-form input{flex:1;font:inherit;font-size:1.25rem;padding:.75rem 1rem;border-radius:.5rem;',
    'border:1px solid var(--line,#3a3a44);background:var(--surface,#1b1b22);color:inherit}',
    '.ask-form button{font:inherit;font-size:1.15rem;padding:.75rem 1.5rem;border:0;border-radius:.5rem;',
    'background:var(--accent,#7c5cff);color:#fff;cursor:pointer}',
    '.ask-q{background:var(--surface,#1b1b22);border:1px solid var(--line,#3a3a44);border-radius:.75rem;',
    'padding:1.25rem;margin-bottom:1rem}',
    '.ask-q-text{font-size:1.35rem;margin:0 0 .75rem}',
    '.ask-routed{display:inline-flex;align-items:center;gap:.5rem;font-size:1.1rem;',
    'background:rgba(124,92,255,.15);border:1px solid var(--accent,#7c5cff);color:var(--accent,#7c5cff);',
    'padding:.4rem .9rem;border-radius:2rem;cursor:pointer}',
    '.ask-tag{opacity:.75;font-size:.95rem}',
    '.ask-none{font-size:1.1rem;opacity:.6}',
    '.ask-answer{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line,#3a3a44);font-size:1.2rem}',
    '.ask-answer strong{color:var(--accent,#7c5cff)}',
    '.ask-reply{margin-top:1rem;display:flex;gap:.5rem}',
    '.ask-reply input{flex:1;font:inherit;font-size:1.1rem;padding:.6rem .9rem;border-radius:.5rem;',
    'border:1px solid var(--line,#3a3a44);background:var(--bg,#131318);color:inherit}',
    '.ask-reply button{font:inherit;padding:.6rem 1.1rem;border:0;border-radius:.5rem;',
    'background:var(--line,#3a3a44);color:inherit;cursor:pointer}',
    '.ask-empty{opacity:.5;font-size:1.15rem}'
  ].join('');

  var CREDITS_PER_ANSWER = 50;

  function injectStyle() {
    if (document.getElementById('ask-style')) return;
    var s = document.createElement('style');
    s.id = 'ask-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function name(store, id) {
    var a = store.attendee && store.attendee(id);
    return a ? a.name : 'someone';
  }

  window.features = window.features || {};
  window.features.ask = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<form class="ask-form">' +
      '<input type="text" placeholder="Ask the room something…" autocomplete="off">' +
      '<button type="submit">Ask</button>' +
      '</form><div class="ask-list"></div>';

    var form = el.querySelector('.ask-form');
    var input = el.querySelector('.ask-form input');
    var list = el.querySelector('.ask-list');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      store.ask(text);
      input.value = '';
    });

    // One delegated listener — survives every re-render.
    list.addEventListener('click', function (e) {
      var chip = e.target.closest('.ask-routed');
      if (chip) { store.setTarget(chip.getAttribute('data-attendee')); return; }

      var btn = e.target.closest('.ask-reply button');
      if (btn) {
        var wrap = btn.closest('.ask-reply');
        var field = wrap.querySelector('input');
        var text = field.value.trim();
        if (!text) return;
        var qid = wrap.getAttribute('data-question');
        var expert = wrap.getAttribute('data-expert');
        store.answer(qid, text);
        store.award(expert, CREDITS_PER_ANSWER);
      }
    });

    function render(state) {
      if (!state.questions.length) {
        list.innerHTML = '<p class="ask-empty">Nothing asked yet. The room is full of people who know things.</p>';
        return;
      }

      list.innerHTML = state.questions.slice().reverse().map(function (q) {
        var head = '<p class="ask-q-text">' + esc(q.text) + '</p>';
        var routed;

        if (!q.routedToId) {
          routed = '<span class="ask-none">No one in the room matched this one yet</span>';
        } else {
          routed =
            '<span class="ask-routed" data-attendee="' + esc(q.routedToId) + '">' +
            'Routed to ' + esc(name(store, q.routedToId)) +
            '<span class="ask-tag">' + esc(q.matchedTag) + '</span></span>';
        }

        var tail = '';
        if (q.answer) {
          tail = '<div class="ask-answer"><strong>' + esc(name(store, q.routedToId)) +
                 '</strong> — ' + esc(q.answer) + '</div>';
        } else if (q.routedToId) {
          // One browser on a projector, so we fake the identity switch.
          tail = '<div class="ask-reply" data-question="' + esc(q.id) + '" data-expert="' + esc(q.routedToId) + '">' +
                 '<input type="text" placeholder="Answer as ' + esc(name(store, q.routedToId)) + '…" autocomplete="off">' +
                 '<button type="button">Send</button></div>';
        }

        return '<div class="ask-q">' + head + routed + tail + '</div>';
      }).join('');
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
