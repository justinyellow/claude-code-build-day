// Kinnect — Meet. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.
//
// Two things on screen: three people worth talking to (each with a plain
// sentence saying why), and everyone in the room underneath as the fallback.
// Tapping a person calls store.setTarget(id) so Find can route to them.

(function () {
  var STYLE = [
    '.meet-h{font-size:1.5rem;margin:0 0 .25rem}',
    '.meet-sub{margin:0 0 1.25rem;color:var(--muted,#a3a3b0);font-size:1.05rem}',
    '.meet-picks{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2.5rem}',
    '@media(max-width:52rem){.meet-picks{grid-template-columns:1fr}}',
    '.meet-card{background:var(--surface,#1b1b22);border:1px solid var(--line,#3a3a44);border-radius:.75rem;',
    'padding:1.25rem;cursor:pointer;display:flex;flex-direction:column;gap:.6rem;text-align:left;color:inherit}',
    '.meet-card:hover{border-color:var(--accent,#7c5cff)}',
    '.meet-card.is-target{border-color:var(--accent,#7c5cff);box-shadow:0 0 0 2px var(--accent,#7c5cff) inset}',
    '.meet-name{font-size:1.35rem;font-weight:700;margin:0}',
    '.meet-reason{font-size:1.1rem;margin:0;line-height:1.35}',
    '.meet-where{font-size:.95rem;color:var(--muted,#a3a3b0);margin:0}',
    '.meet-tags{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:auto}',
    '.meet-tag{font-size:.9rem;padding:.2rem .6rem;border-radius:2rem;',
    'background:var(--accent-soft,rgba(124,92,255,.15));color:var(--accent,#7c5cff)}',
    '.meet-tag.shared{background:var(--accent,#7c5cff);color:#fff}',
    '.meet-cta{font-size:.95rem;color:var(--accent,#7c5cff);font-weight:600}',
    '.meet-card.is-target .meet-cta{color:var(--ok,#3ddc84)}',
    '.meet-list{display:flex;flex-direction:column;gap:.5rem}',
    '.meet-row{display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;border-radius:.6rem;',
    'border:1px solid var(--line,#3a3a44);background:var(--surface,#1b1b22);cursor:pointer;color:inherit;text-align:left}',
    '.meet-row:hover{border-color:var(--accent,#7c5cff)}',
    '.meet-row.is-target{border-color:var(--accent,#7c5cff)}',
    '.meet-row.is-me{cursor:default;opacity:.7}',
    '.meet-row .meet-name{font-size:1.1rem;min-width:11rem}',
    '.meet-row .meet-tags{margin:0}',
    '.meet-you{font-size:.85rem;color:var(--muted,#a3a3b0);font-weight:500;margin-left:.4rem}',
    '.meet-empty{opacity:.6;font-size:1.15rem}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('meet-style')) return;
    var s = document.createElement('style');
    s.id = 'meet-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function firstName(a) {
    return a && a.name ? String(a.name).split(' ')[0] : 'them';
  }

  function spaceName(state, id) {
    var s = state.spaces.filter(function (sp) { return sp.id === id; })[0];
    return s ? s.name : null;
  }

  function overlap(a, b) {
    var mine = (a && a.expertise) || [];
    return ((b && b.expertise) || []).filter(function (t) { return mine.indexOf(t) !== -1; });
  }

  // How many people in the room know this tag?
  function knowers(state, tag) {
    return state.attendees.filter(function (a) {
      return (a.expertise || []).indexOf(tag) !== -1;
    }).length;
  }

  // Join a list as a sentence: "postgres and react-native", "a, b and c".
  function list(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  // Pick three people for `me` and say why in a sentence a non-technical
  // attendee would understand. No scores on screen — score is only for order.
  function suggest(state) {
    var me = state.attendees.filter(function (a) { return a.id === state.me; })[0] || null;
    var myQuestions = state.questions.filter(function (q) { return q.askerId === state.me; });

    return state.attendees
      .filter(function (a) { return a.id !== state.me; })
      .map(function (a) {
        var shared = overlap(me, a);
        var answered = myQuestions.filter(function (q) { return q.routedToId === a.id && q.answer; })[0];
        var routed = myQuestions.filter(function (q) { return q.routedToId === a.id && !q.answer; })[0];
        var sameRoom = me && me.spaceId && a.spaceId === me.spaceId;

        var score = 0;
        var reason;

        if (answered) {
          score = 100;
          reason = firstName(a) + ' answered your question about ' + answered.matchedTag + '. Go say thanks in person.';
        } else if (routed) {
          score = 80;
          reason = 'Your question about ' + routed.matchedTag + ' went to ' + firstName(a) + '. Find them and ask directly.';
        } else if (shared.length >= 2) {
          score = 40 + shared.length;
          reason = 'You both know ' + list(shared) + ' — you have plenty to compare notes on.';
        } else if (shared.length === 1) {
          score = 40;
          reason = 'You both know ' + shared[0] + ', and hardly anyone else here does.';
          if (knowers(state, shared[0]) > 2) reason = 'You both know ' + shared[0] + '. Compare how you use it.';
        } else {
          // Nothing in common: the interesting person is the one who knows
          // something nobody else here does.
          var rare = (a.expertise || []).slice().sort(function (x, y) {
            return knowers(state, x) - knowers(state, y);
          })[0];
          if (rare) {
            var n = knowers(state, rare);
            score = n === 1 ? 25 : 10;
            reason = n === 1
              ? firstName(a) + ' is the only person here who knows ' + rare + '.'
              : firstName(a) + ' knows ' + rare + ' — something you don\u2019t yet.';
          } else {
            score = 1;
            reason = 'New face. Nobody has asked ' + firstName(a) + ' anything yet.';
          }
        }

        if (sameRoom) score += 5;

        var where = a.spaceId ? spaceName(state, a.spaceId) : null;
        return { attendee: a, score: score, reason: reason, shared: shared, where: where, sameRoom: sameRoom };
      })
      .sort(function (x, y) { return y.score - x.score; })
      .slice(0, 3);
  }

  function tags(a, shared) {
    return '<div class="meet-tags">' + (a.expertise || []).map(function (t) {
      var cls = shared && shared.indexOf(t) !== -1 ? 'meet-tag shared' : 'meet-tag';
      return '<span class="' + cls + '">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }

  window.features = window.features || {};
  window.features.meet = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<h2 class="meet-h">Three people worth talking to</h2>' +
      '<p class="meet-sub">Picked from who\u2019s in the room right now. Tap one and Find will get you there.</p>' +
      '<div class="meet-picks"></div>' +
      '<h2 class="meet-h">Everyone here</h2>' +
      '<p class="meet-sub">What people in this room know.</p>' +
      '<div class="meet-list"></div>';

    var picks = el.querySelector('.meet-picks');
    var everyone = el.querySelector('.meet-list');

    // One delegated listener — survives every re-render.
    el.addEventListener('click', function (e) {
      var hit = e.target.closest('[data-attendee]');
      if (!hit || hit.classList.contains('is-me')) return;
      store.setTarget(hit.getAttribute('data-attendee'));
    });

    function render(state) {
      if (!state.attendees.length) {
        picks.innerHTML = '<p class="meet-empty">No one has arrived yet \u2014 waiting on seed data.</p>';
        everyone.innerHTML = '';
        return;
      }

      picks.innerHTML = suggest(state).map(function (s) {
        var a = s.attendee;
        var isTarget = state.target === a.id;
        var where = s.sameRoom ? 'In the same room as you'
          : s.where ? 'In ' + esc(s.where) : '';
        return '<button type="button" class="meet-card' + (isTarget ? ' is-target' : '') +
          '" data-attendee="' + esc(a.id) + '">' +
          '<p class="meet-name">' + esc(a.name) + '</p>' +
          '<p class="meet-reason">' + esc(s.reason) + '</p>' +
          (where ? '<p class="meet-where">' + where + '</p>' : '') +
          tags(a, s.shared) +
          '<span class="meet-cta">' + (isTarget ? 'Routing you there \u2192' : 'Take me to them \u2192') + '</span>' +
          '</button>';
      }).join('');

      everyone.innerHTML = state.attendees.map(function (a) {
        var isMe = a.id === state.me;
        var isTarget = state.target === a.id;
        var cls = 'meet-row' + (isMe ? ' is-me' : '') + (isTarget ? ' is-target' : '');
        return '<button type="button" class="' + cls + '" data-attendee="' + esc(a.id) + '">' +
          '<span class="meet-name">' + esc(a.name) + (isMe ? '<span class="meet-you">you</span>' : '') + '</span>' +
          tags(a) +
          '</button>';
      }).join('');
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
