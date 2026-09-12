// Kinnect — Meet. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.
//
// Two things on screen: three people worth talking to (each with a plain
// sentence saying why), and everyone in the room underneath as the fallback.
// "Take me to them" calls store.setTarget(id) so Find can route to them.
// "Buy <name> some compute" is buy-me-a-coffee with compute as the gift: it
// hands you to a lab console. Nothing is tracked in-app.

(function () {
  var STYLE = [
    '.meet-eyebrow{margin:0 0 .6rem;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9a9aa3)}',
    '.meet-h{margin:0 0 .35rem;font-size:1.35rem;font-weight:700;letter-spacing:-.02em}',
    '.meet-sub{margin:0 0 1.25rem;color:var(--muted,#9a9aa3);font-size:.95rem}',
    '.meet-picks{display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem;align-items:start;margin-bottom:2.75rem}',
    '@media(max-width:52rem){.meet-picks{grid-template-columns:1fr}}',

    /* avatar */
    '.meet-av{width:2.4rem;height:2.4rem;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;',
    'font-size:.8rem;font-weight:700;letter-spacing:.02em}',
    '.meet-av.sm{width:1.9rem;height:1.9rem;font-size:.7rem}',

    /* suggestion card */
    '.meet-card{display:flex;flex-direction:column;gap:.75rem;padding:1.1rem 1.15rem;background:var(--surface,#17171a);',
    'border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px)}',
    '.meet-card:hover{border-color:var(--line-strong,#3a3a41)}',
    '.meet-card.is-target{border-color:var(--ok,#4cc38a)}',
    '.meet-head{display:flex;align-items:center;gap:.75rem;min-width:0}',
    '.meet-name{margin:0;font-size:1.05rem;font-weight:700;letter-spacing:-.01em;line-height:1.2}',
    '.meet-where{margin:.1rem 0 0;font-size:.85rem;color:var(--muted,#9a9aa3)}',
    '.meet-reason{margin:0;font-size:1rem;line-height:1.4}',
    '.meet-tags{display:flex;flex-wrap:wrap;gap:.3rem}',
    '.meet-tag{font-size:.75rem;padding:.15rem .55rem;border-radius:1rem;background:var(--surface-2,#1e1e22);color:var(--muted,#9a9aa3);',
    'border:1px solid transparent}',
    '.meet-tag.shared{color:var(--text,#f4f3f0);border-color:var(--accent,#e0472f);background:var(--accent-soft,rgba(224,71,47,.12))}',
    '.meet-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.15rem}',
    '.meet-go,.meet-buy{font:inherit;font-size:.85rem;font-weight:600;padding:.5rem .85rem;border-radius:var(--radius-sm,8px);cursor:pointer;white-space:nowrap}',
    '.meet-go{border:1px solid var(--accent,#e0472f);background:var(--accent,#e0472f);color:#fff}',
    '.meet-go:hover{filter:brightness(1.08)}',
    '.meet-card.is-target .meet-go{border-color:var(--ok,#4cc38a);background:var(--ok-soft,rgba(76,195,138,.14));color:var(--ok,#4cc38a)}',
    '.meet-buy{border:1px solid var(--line-strong,#3a3a41);background:transparent;color:var(--text,#f4f3f0)}',
    '.meet-buy:hover,.meet-buy.is-open{border-color:var(--text,#f4f3f0)}',

    /* buy-compute panel */
    '.meet-links{flex-basis:100%;display:flex;flex-direction:column;gap:.35rem;padding:.75rem;border-radius:var(--radius-sm,8px);',
    'background:var(--bg,#101012);border:1px solid var(--line,#2a2a2f)}',
    '.meet-links p{margin:0 0 .25rem;font-size:.85rem;color:var(--muted,#9a9aa3)}',
    '.meet-links p.off{color:var(--accent,#e0472f)}',
    '.meet-link{display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:6px;',
    'background:var(--surface,#17171a);color:inherit;text-decoration:none;font-size:.9rem;font-weight:600}',
    '.meet-link:hover{background:var(--surface-2,#1e1e22)}',
    '.meet-link small{color:var(--muted,#9a9aa3);font-size:.75rem;font-weight:500}',

    /* everyone list */
    '.meet-list{display:flex;flex-direction:column;border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px);overflow:hidden}',
    '.meet-row{display:flex;align-items:center;gap:.85rem;width:100%;padding:.7rem 1rem;border:0;border-top:1px solid var(--line,#2a2a2f);',
    'background:var(--surface,#17171a);color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.meet-row:first-child{border-top:0}',
    '.meet-row:hover{background:var(--surface-2,#1e1e22)}',
    '.meet-row.is-target{box-shadow:inset 3px 0 0 var(--ok,#4cc38a)}',
    '.meet-row:disabled{cursor:default;background:var(--surface,#17171a)}',
    '.meet-row:disabled .meet-rname{color:var(--muted,#9a9aa3)}',
    '.meet-rname{font-weight:600;min-width:11rem;font-size:.95rem}',
    '.meet-you{font-size:.8rem;color:var(--muted,#9a9aa3);font-weight:500}',
    '.meet-row .meet-tags{flex:1}',
    '.meet-row .meet-tag{font-size:.72rem}',
    '.meet-chev{color:var(--faint,#6b6b74);font-size:1rem}',
    '.meet-row:disabled .meet-chev{visibility:hidden}',
    '.meet-empty{margin:0;padding:2rem 0;color:var(--muted,#9a9aa3);font-size:1rem}'
  ].join('');

  // Buy-me-a-coffee, compute edition. Links to lab consoles where credits can
  // be bought. Nothing is tracked in-app.
  var LABS = [
    { name: 'Anthropic', note: 'Claude', url: 'https://console.anthropic.com/' },
    { name: 'OpenAI', note: 'GPT', url: 'https://platform.openai.com/' },
    { name: 'Google', note: 'Gemini', url: 'https://aistudio.google.com/' },
    { name: 'Mistral', note: 'Mistral', url: 'https://console.mistral.ai/' }
  ];

  // Same restrained palette Events uses for avatars. Duplicated on purpose —
  // features don't share code.
  var HUES = [
    ['#2b3a4e', '#b7c9e2'], ['#3a4a3c', '#b9d3bb'], ['#4a3c2e', '#e2c9a8'],
    ['#4b2f34', '#e5b7bf'], ['#3f3550', '#cfc1e6'], ['#2f4547', '#a9d3d3']
  ];

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

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function displayName(a) {
    return a && a.name ? String(a.name) : 'Someone';
  }

  function firstName(a) {
    return displayName(a).split(/\s+/)[0];
  }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    var a = parts[0] ? parts[0].charAt(0) : '?';
    var b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  function avatar(a, small) {
    var name = displayName(a);
    var c = HUES[hash(name) % HUES.length];
    return '<span class="meet-av' + (small ? ' sm' : '') + '" style="background:' + c[0] + ';color:' + c[1] + '" aria-hidden="true">' +
      esc(initials(name)) + '</span>';
  }

  // Seed says expertise is an array, but a string or nothing shouldn't take
  // the page down. Lowercased and de-duplicated so matching is forgiving.
  function tagsOf(a) {
    var raw = a && Array.isArray(a.expertise) ? a.expertise : [];
    var seen = {};
    return raw.map(function (t) { return String(t).toLowerCase().trim(); }).filter(function (t) {
      if (!t || seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  function spaceName(state, id) {
    var s = (state.spaces || []).filter(function (sp) { return sp.id === id; })[0];
    return s ? s.name : null;
  }

  function overlap(a, b) {
    var mine = tagsOf(a);
    return tagsOf(b).filter(function (t) { return mine.indexOf(t) !== -1; });
  }

  // How many people in the room know this tag?
  function knowers(state, tag) {
    return state.attendees.filter(function (a) { return tagsOf(a).indexOf(tag) !== -1; }).length;
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
    var myQuestions = (state.questions || []).filter(function (q) { return q.askerId === state.me; });

    return state.attendees
      .filter(function (a) { return a.id !== state.me; })
      .map(function (a) {
        var shared = overlap(me, a);
        var answered = myQuestions.filter(function (q) { return q.routedToId === a.id && q.answer; })[0];
        var routed = myQuestions.filter(function (q) { return q.routedToId === a.id && !q.answer; })[0];
        var sameRoom = !!(me && me.spaceId && a.spaceId === me.spaceId);
        var first = firstName(a);

        var score = 0;
        var reason;
        var kind = null;
        var rare = null;

        if (answered) {
          score = 100;
          reason = first + ' answered your question about ' + answered.matchedTag + '. Go say thanks in person.';
        } else if (routed) {
          score = 80;
          reason = 'Your question about ' + routed.matchedTag + ' went to ' + first + '. Find them and ask directly.';
        } else if (shared.length >= 2) {
          score = 40 + shared.length;
          reason = 'You both know ' + list(shared) + ' \u2014 you have plenty to compare notes on.';
        } else if (shared.length === 1) {
          score = 40;
          reason = knowers(state, shared[0]) > 2
            ? 'You both know ' + shared[0] + '. Compare how you use it.'
            : 'You both know ' + shared[0] + ', and nobody else here does.';
        } else {
          // Nothing in common: the interesting person is the one who knows
          // something nobody else here does.
          rare = tagsOf(a).sort(function (x, y) { return knowers(state, x) - knowers(state, y); })[0];
          if (rare) {
            var n = knowers(state, rare);
            score = n === 1 ? 25 : 10;
            if (n === 1) {
              // Three of these in a row shouldn't read like a template, so
              // the wording is chosen by position after ranking (see below).
              kind = 'unique';
              reason = first + ' is the only person here who knows ' + rare + '.';
            } else {
              reason = first + ' knows ' + rare + ' \u2014 something you don\u2019t yet.';
            }
          } else {
            score = 1;
            reason = first + ' hasn\u2019t said what they know yet. Go find out.';
          }
        }

        if (sameRoom) score += 0.5; // tiebreaker, not a tier jump

        var where = a.spaceId ? spaceName(state, a.spaceId) : null;
        return { attendee: a, score: score, reason: reason, kind: kind, rare: rare, shared: shared, where: where, sameRoom: sameRoom };
      })
      .sort(function (x, y) { return y.score - x.score; })
      .slice(0, 3)
      .map(function (s, i) {
        if (s.kind !== 'unique') return s;
        var first = firstName(s.attendee);
        s.reason = [
          first + ' is the only person here who knows ' + s.rare + '.',
          'Nobody else in the room knows ' + s.rare + '. ' + first + ' does.',
          'If ' + s.rare + ' comes up today, ' + first + ' is the one to find.'
        ][i % 3];
        return s;
      });
  }

  function tags(a, shared) {
    return '<span class="meet-tags">' + tagsOf(a).map(function (t) {
      var cls = shared && shared.indexOf(t) !== -1 ? 'meet-tag shared' : 'meet-tag';
      return '<span class="' + cls + '">' + esc(t) + '</span>';
    }).join('') + '</span>';
  }

  function labLinks(a, offline) {
    var note = offline
      ? '<p class="off">You\u2019re offline \u2014 these open once you\u2019re back on wifi.</p>'
      : '<p>Pick a lab. Their credits, your thanks to ' + esc(firstName(a)) + '. Opens in a new tab.</p>';
    return '<div class="meet-links">' + note +
      LABS.map(function (l) {
        return '<a class="meet-link" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span>' + esc(l.name) + '</span><small>' + esc(l.note) + ' <span aria-hidden="true">\u2197</span></small></a>';
      }).join('') +
      '</div>';
  }

  window.features = window.features || {};
  window.features.meet = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<p class="meet-eyebrow">Meet</p>' +
      '<h2 class="meet-h">Three people worth talking to</h2>' +
      '<p class="meet-sub">Picked from who\u2019s in the room right now. Take me to them hands you to the map.</p>' +
      '<div class="meet-picks"></div>' +
      '<p class="meet-eyebrow">Everyone here</p>' +
      '<h2 class="meet-h">What people in this room know</h2>' +
      '<p class="meet-sub">Tap anyone to head their way.</p>' +
      '<div class="meet-list"></div>';

    var picks = el.querySelector('.meet-picks');
    var everyone = el.querySelector('.meet-list');

    // View state, not store state: which card has its buy panel open, and
    // whether we've told the user the links won't work offline. Survives
    // store-driven re-renders.
    var openBuy = null;
    var offlineNote = false;

    // One delegated listener — survives every re-render.
    el.addEventListener('click', function (e) {
      var link = e.target.closest('.meet-link');
      if (link) {
        // Wifi is off on the demo machine. Don't open a dead tab on stage.
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          e.preventDefault();
          offlineNote = true;
          render(store.getState());
        }
        return;
      }
      if (e.target.closest('.meet-links')) return;

      var card = e.target.closest('[data-attendee]');
      if (!card || card.disabled) return;
      var id = card.getAttribute('data-attendee');

      if (e.target.closest('.meet-buy')) {
        openBuy = openBuy === id ? null : id;
        offlineNote = false;
        render(store.getState());
        // Safari doesn't focus buttons on click, so put focus back explicitly.
        var again = el.querySelector('[data-attendee="' + id + '"] .meet-buy');
        if (again) again.focus();
        return;
      }

      store.setTarget(id);
    });

    function render(state) {
      // innerHTML replacement destroys focus; remember where it was.
      var focused = document.activeElement;
      var keep = focused && el.contains(focused) ? focused.closest('[data-attendee]') : null;
      var keepId = keep ? keep.getAttribute('data-attendee') : null;
      var keepCls = keep ? (focused.className || '').split(' ')[0] : null;

      if (!state.attendees.length) {
        picks.innerHTML = '<p class="meet-empty">No one has arrived yet \u2014 waiting on seed data.</p>';
        everyone.innerHTML = '';
        return;
      }

      var picked = suggest(state);
      if (openBuy && !picked.some(function (s) { return String(s.attendee.id) === openBuy; })) openBuy = null;

      picks.innerHTML = picked.length ? picked.map(function (s) {
        var a = s.attendee;
        var id = String(a.id);
        var isTarget = String(state.target) === id;
        var isOpen = openBuy === id;
        // Room names vary ("Lounge", "Main Stage"), so no preposition.
        var where = s.sameRoom
          ? (s.where ? s.where + ' \u00b7 same room as you' : 'Same room as you')
          : (s.where || '');
        return '<article class="meet-card' + (isTarget ? ' is-target' : '') + '" data-attendee="' + esc(id) + '">' +
          '<div class="meet-head">' + avatar(a) +
          '<div><h3 class="meet-name">' + esc(displayName(a)) + '</h3>' +
          (where ? '<p class="meet-where">' + esc(where) + '</p>' : '') + '</div></div>' +
          '<p class="meet-reason">' + esc(s.reason) + '</p>' +
          tags(a, s.shared) +
          '<div class="meet-actions">' +
          '<button type="button" class="meet-go">' + (isTarget ? 'Routing you there' : 'Take me to them') + '</button>' +
          '<button type="button" class="meet-buy' + (isOpen ? ' is-open' : '') + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
          'Buy ' + esc(firstName(a)) + ' some compute</button>' +
          (isOpen ? labLinks(a, offlineNote) : '') +
          '</div>' +
          '</article>';
      }).join('') : '<p class="meet-empty">Just you so far. Suggestions appear as people check in.</p>';

      everyone.innerHTML = state.attendees.map(function (a) {
        var id = String(a.id);
        var isMe = a.id === state.me;
        var isTarget = String(state.target) === id;
        var cls = 'meet-row' + (isMe ? ' is-me' : '') + (isTarget ? ' is-target' : '');
        return '<button type="button" class="' + cls + '" data-attendee="' + esc(id) + '"' +
          (isMe ? ' disabled' : ' aria-pressed="' + (isTarget ? 'true' : 'false') + '"') + '>' +
          avatar(a, true) +
          '<span class="meet-rname">' + esc(displayName(a)) + (isMe ? ' <span class="meet-you">(you)</span>' : '') + '</span>' +
          tags(a) +
          '<span class="meet-chev" aria-hidden="true">\u2192</span>' +
          '</button>';
      }).join('');

      if (keepId) {
        var again = el.querySelector('[data-attendee="' + keepId + '"]');
        var inner = again && keepCls ? again.querySelector('.' + keepCls) : null;
        if (inner) inner.focus(); else if (again && !again.disabled) again.focus();
      }
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
