// Kinnect — Compute. Registers on window.features. Classic script, no imports.
// Owns: this file only. Talks to other features through the store.
//
// Buy-me-a-coffee, with compute as the gift. Pick a person, pick a provider,
// pick an amount; the button hands you to that provider's console. Money and
// credits stay with the provider — nothing is tracked in-app, and this never
// calls store.award (that's Thank's in-app credits, a different thing).
//
// The recipient defaults to whoever the store says you're heading to
// (state.target, set by Meet or Ask), or to the last person who answered you.

(function () {
  var STYLE = [
    '.cp-eyebrow{margin:0 0 .6rem;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9a9aa3)}',
    '.cp-h{margin:0 0 .35rem;font-size:1.35rem;font-weight:700;letter-spacing:-.02em}',
    '.cp-sub{margin:0 0 1.25rem;color:var(--muted,#9a9aa3);font-size:.95rem;max-width:40rem}',

    /* recipient picker */
    '.cp-who{display:flex;gap:.5rem;overflow-x:auto;padding:.15rem .15rem .6rem;margin:0 0 .5rem;scrollbar-width:thin}',
    '.cp-chip{display:inline-flex;align-items:center;gap:.5rem;flex:none;padding:.35rem .8rem .35rem .35rem;border-radius:2rem;',
    'border:1px solid var(--line,#2a2a2f);background:var(--surface,#17171a);color:inherit;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer}',
    '.cp-chip:hover{border-color:var(--line-strong,#3a3a41)}',
    '.cp-chip.on{border-color:var(--accent,#e0472f);background:var(--accent-soft,rgba(224,71,47,.12))}',
    '.cp-av{width:1.7rem;height:1.7rem;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;',
    'font-size:.65rem;font-weight:700;letter-spacing:.02em}',
    '.cp-av.lg{width:2.6rem;height:2.6rem;font-size:.9rem}',
    '.cp-for{display:flex;align-items:center;gap:.85rem;margin:0 0 1.75rem;padding:1rem 1.15rem;',
    'background:var(--surface,#17171a);border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px)}',
    '.cp-for .name{margin:0;font-weight:700;font-size:1.05rem;letter-spacing:-.01em}',
    '.cp-for .why{margin:.1rem 0 0;color:var(--muted,#9a9aa3);font-size:.9rem}',

    /* provider widgets */
    '.cp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.85rem;margin-bottom:2.75rem}',
    '@media(max-width:44rem){.cp-grid{grid-template-columns:1fr}}',
    '.cp-card{display:flex;flex-direction:column;gap:.85rem;padding:1.15rem 1.2rem;background:var(--surface,#17171a);',
    'border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px)}',
    '.cp-card:hover{border-color:var(--line-strong,#3a3a41)}',
    '.cp-head{display:flex;align-items:center;gap:.85rem}',
    '.cp-mono{width:2.75rem;height:2.75rem;border-radius:var(--radius-sm,8px);flex:none;display:flex;align-items:center;justify-content:center;',
    'font-size:1rem;font-weight:700;letter-spacing:.02em}',
    '.cp-name{margin:0;font-size:1.1rem;font-weight:700;letter-spacing:-.01em;line-height:1.2}',
    '.cp-models{margin:.1rem 0 0;color:var(--muted,#9a9aa3);font-size:.85rem}',
    '.cp-amts{display:flex;gap:.35rem}',
    '.cp-amt{flex:1;padding:.5rem 0;border-radius:var(--radius-sm,8px);border:1px solid var(--line,#2a2a2f);background:var(--bg,#101012);',
    'color:var(--muted,#9a9aa3);font:inherit;font-size:.95rem;font-weight:600;font-variant-numeric:tabular-nums;cursor:pointer}',
    '.cp-amt:hover{border-color:var(--line-strong,#3a3a41);color:var(--text,#f4f3f0)}',
    '.cp-amt.on{border-color:var(--text,#f4f3f0);color:var(--text,#f4f3f0);background:var(--surface-2,#1e1e22)}',
    '.cp-buy{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.65rem 1rem;border-radius:var(--radius-sm,8px);',
    'background:var(--accent,#e0472f);color:#fff;text-decoration:none;font-weight:600;font-size:.95rem;text-align:center}',
    '.cp-buy:hover{filter:brightness(1.08)}',
    '.cp-buy small{font-weight:500;opacity:.85}',
    '.cp-host{margin:0;font-size:.8rem;color:var(--faint,#6b6b74)}',
    '.cp-host.off{color:var(--accent,#e0472f)}',

    /* recent */
    '.cp-recent{margin:0;padding:0;list-style:none;border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px);overflow:hidden}',
    '.cp-recent li{display:flex;align-items:center;gap:.75rem;padding:.7rem 1rem;border-top:1px solid var(--line,#2a2a2f);font-size:.95rem}',
    '.cp-recent li:first-child{border-top:0}',
    '.cp-recent li.mine{background:var(--accent-soft,rgba(224,71,47,.12))}',
    '.cp-recent .pair{display:flex;align-items:center;gap:.25rem}',
    '.cp-recent .arrow{color:var(--faint,#6b6b74);margin:0 .15rem}',
    '.cp-recent .what{flex:1}',
    '.cp-recent .what b{font-weight:600}',
    '.cp-recent .when{color:var(--muted,#9a9aa3);font-size:.85rem;white-space:nowrap}',
    '.cp-total{display:flex;align-items:baseline;gap:.5rem;margin:0 0 1rem}',
    '.cp-total .n{font-size:1.75rem;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}',
    '.cp-total .l{color:var(--muted,#9a9aa3);font-size:.95rem}',
    '.cp-empty{margin:0;padding:2rem 0;color:var(--muted,#9a9aa3);font-size:1rem}'
  ].join('');

  // Consoles bill in dollars, so the presets are dollars. Nothing here quotes
  // token prices — those move; the console is the source of truth.
  var AMOUNTS = [5, 10, 25];

  var PROVIDERS = [
    { id: 'anthropic', name: 'Anthropic', models: 'Claude', mono: 'A', host: 'console.anthropic.com', url: 'https://console.anthropic.com/', c: ['#4a3c2e', '#e2c9a8'] },
    { id: 'openai',    name: 'OpenAI',    models: 'GPT',    mono: 'O', host: 'platform.openai.com',   url: 'https://platform.openai.com/',   c: ['#3a4a3c', '#b9d3bb'] },
    { id: 'google',    name: 'Google',    models: 'Gemini', mono: 'G', host: 'aistudio.google.com',   url: 'https://aistudio.google.com/',   c: ['#2b3a4e', '#b7c9e2'] },
    { id: 'mistral',   name: 'Mistral',   models: 'Mistral', mono: 'M', host: 'console.mistral.ai',   url: 'https://console.mistral.ai/',    c: ['#4b3a2a', '#e8c39e'] }
  ];

  // Sample activity so the room doesn't look empty. Resolved against the
  // seed by id at render time; anything that doesn't resolve is skipped.
  var SAMPLE = [
    { from: 'a4',  to: 'a8', provider: 'anthropic', amount: 10, ago: 14 },
    { from: 'a11', to: 'a2', provider: 'google',    amount: 5,  ago: 32 },
    { from: 'a5',  to: 'a7', provider: 'openai',    amount: 25, ago: 61 }
  ];

  var HUES = [
    ['#2b3a4e', '#b7c9e2'], ['#3a4a3c', '#b9d3bb'], ['#4a3c2e', '#e2c9a8'],
    ['#4b2f34', '#e5b7bf'], ['#3f3550', '#cfc1e6'], ['#2f4547', '#a9d3d3']
  ];

  function injectStyle() {
    if (document.getElementById('compute-style')) return;
    var s = document.createElement('style');
    s.id = 'compute-style';
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

  function nameOf(a) { return a && a.name ? String(a.name) : 'Someone'; }
  function firstName(a) { return nameOf(a).split(/\s+/)[0]; }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    var a = parts[0] ? parts[0].charAt(0) : '?';
    var b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  function avatar(a, cls) {
    var name = nameOf(a);
    var c = HUES[hash(name) % HUES.length];
    return '<span class="cp-av' + (cls ? ' ' + cls : '') + '" style="background:' + c[0] + ';color:' + c[1] + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }

  function byId(state, id) {
    return state.attendees.filter(function (a) { return String(a.id) === String(id); })[0] || null;
  }

  function spaceName(state, id) {
    var s = (state.spaces || []).filter(function (sp) { return sp.id === id; })[0];
    return s ? s.name : null;
  }

  function provider(id) {
    return PROVIDERS.filter(function (p) { return p.id === id; })[0] || PROVIDERS[0];
  }

  function ago(min) {
    if (min < 1) return 'just now';
    if (min < 60) return min + ' min ago';
    var h = Math.round(min / 60);
    return h + (h === 1 ? ' hr ago' : ' hrs ago');
  }

  // Who should the gift default to, and why (in words)?
  function defaultRecipient(state) {
    var mine = (state.questions || []).filter(function (q) { return q.askerId === state.me; });
    var answered = mine.filter(function (q) { return q.answer && q.routedToId; }).slice(-1)[0];
    var routed = mine.filter(function (q) { return !q.answer && q.routedToId; }).slice(-1)[0];

    if (state.target && byId(state, state.target) && String(state.target) !== String(state.me)) {
      var t = byId(state, state.target);
      var hit = mine.filter(function (q) { return q.routedToId === t.id; }).slice(-1)[0];
      return { a: t, why: hit
        ? (hit.answer ? 'Answered your question about ' + hit.matchedTag : 'Your question about ' + hit.matchedTag + ' went to them')
        : 'You\u2019re heading their way' };
    }
    if (answered) return { a: byId(state, answered.routedToId), why: 'Answered your question about ' + answered.matchedTag };
    if (routed) return { a: byId(state, routed.routedToId), why: 'Your question about ' + routed.matchedTag + ' went to them' };
    var first = state.attendees.filter(function (a) { return a.id !== state.me; })[0] || null;
    return { a: first, why: first && first.spaceId && spaceName(state, first.spaceId) ? 'In the ' + spaceName(state, first.spaceId) : 'Pick someone above' };
  }

  window.features = window.features || {};
  window.features.compute = function (el, store) {
    injectStyle();

    el.innerHTML =
      '<p class="cp-eyebrow">Compute</p>' +
      '<h2 class="cp-h">Buy someone some compute</h2>' +
      '<p class="cp-sub">Say thanks with the thing everyone in this room actually uses. Pick who, pick a lab, pick an amount \u2014 the button takes you to their console and you pay them directly.</p>' +
      '<div class="cp-who" role="listbox" aria-label="Who is this for"></div>' +
      '<div class="cp-for"></div>' +
      '<div class="cp-grid"></div>' +
      '<p class="cp-eyebrow">In this room</p>' +
      '<div class="cp-total"></div>' +
      '<ol class="cp-recent"></ol>';

    var who = el.querySelector('.cp-who');
    var forEl = el.querySelector('.cp-for');
    var grid = el.querySelector('.cp-grid');
    var total = el.querySelector('.cp-total');
    var recentEl = el.querySelector('.cp-recent');

    // View state. `picked` is a manual choice and beats the store default;
    // `amounts` remembers the chip per provider; `gifts` is what you've done
    // this session; `offline` is which card to warn on.
    var picked = null;
    var amounts = {};
    var gifts = [];
    var offline = null;
    var focusSel = null;

    el.addEventListener('click', function (e) {
      var chip = e.target.closest('.cp-chip');
      if (chip) {
        picked = chip.getAttribute('data-attendee');
        focusSel = '.cp-chip[data-attendee="' + picked + '"]';
        render(store.getState());
        return;
      }

      var amt = e.target.closest('.cp-amt');
      if (amt) {
        var pid = amt.getAttribute('data-provider');
        amounts[pid] = +amt.getAttribute('data-amount');
        focusSel = '.cp-amt.on[data-provider="' + pid + '"]';
        render(store.getState());
        return;
      }

      var buy = e.target.closest('.cp-buy');
      if (buy) {
        var state = store.getState();
        var p = provider(buy.getAttribute('data-provider'));
        var to = byId(state, buy.getAttribute('data-attendee'));
        var amount = +buy.getAttribute('data-amount');
        // The gesture counts in-app either way; the purchase happens in the console.
        if (to) gifts.unshift({ from: state.me, to: to.id, provider: p.id, amount: amount, at: Date.now() });
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          e.preventDefault(); // wifi is off on the demo machine — no dead tab
          offline = p.id;
        } else {
          offline = null;
        }
        focusSel = '.cp-buy[data-provider="' + p.id + '"]';
        render(state);
      }
    });

    function render(state) {
      if (!state.attendees.length) {
        who.innerHTML = '';
        forEl.innerHTML = '<p class="cp-empty">No one has arrived yet \u2014 waiting on seed data.</p>';
        grid.innerHTML = total.innerHTML = recentEl.innerHTML = '';
        return;
      }

      var def = defaultRecipient(state);
      var to = (picked && byId(state, picked)) || def.a;
      var why = picked && to && (!def.a || to.id !== def.a.id) ? (to.spaceId && spaceName(state, to.spaceId) ? 'In the ' + spaceName(state, to.spaceId) : '') : def.why;

      who.innerHTML = state.attendees.filter(function (a) { return a.id !== state.me; }).map(function (a) {
        var on = to && a.id === to.id;
        return '<button type="button" role="option" class="cp-chip' + (on ? ' on' : '') + '" data-attendee="' + esc(a.id) + '" aria-selected="' + (on ? 'true' : 'false') + '">' +
          avatar(a) + esc(firstName(a)) + '</button>';
      }).join('');

      forEl.innerHTML = to
        ? avatar(to, 'lg') + '<div><p class="name">For ' + esc(nameOf(to)) + '</p>' + (why ? '<p class="why">' + esc(why) + '</p>' : '') + '</div>'
        : '<p class="cp-empty">Pick someone above.</p>';

      grid.innerHTML = PROVIDERS.map(function (p) {
        var amount = amounts[p.id] || AMOUNTS[1];
        return '<article class="cp-card" data-provider="' + p.id + '">' +
          '<div class="cp-head"><span class="cp-mono" style="background:' + p.c[0] + ';color:' + p.c[1] + '" aria-hidden="true">' + p.mono + '</span>' +
          '<div><h3 class="cp-name">' + esc(p.name) + '</h3><p class="cp-models">' + esc(p.models) + ' \u00b7 API credits</p></div></div>' +
          '<div class="cp-amts" role="radiogroup" aria-label="Amount for ' + esc(p.name) + '">' +
          AMOUNTS.map(function (n) {
            return '<button type="button" role="radio" class="cp-amt' + (n === amount ? ' on' : '') + '" data-provider="' + p.id + '" data-amount="' + n + '" aria-checked="' + (n === amount ? 'true' : 'false') + '">$' + n + '</button>';
          }).join('') +
          '</div>' +
          (to
            ? '<a class="cp-buy" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer" data-provider="' + p.id + '" data-attendee="' + esc(to.id) + '" data-amount="' + amount + '">' +
              'Buy ' + esc(firstName(to)) + ' $' + amount + ' of ' + esc(p.models) + '</a>'
            : '<span class="cp-buy" aria-disabled="true" style="opacity:.5">Pick someone first</span>') +
          '<p class="cp-host' + (offline === p.id ? ' off' : '') + '">' +
          (offline === p.id ? 'You\u2019re offline \u2014 ' + esc(p.host) + ' opens once you\u2019re back on wifi.' : 'Opens ' + esc(p.host) + ' in a new tab. Nothing is charged here.') +
          '</p>' +
          '</article>';
      }).join('');

      // Recent: yours first, then the sample activity.
      var now = Date.now();
      var rows = gifts.map(function (g) {
        return { from: byId(state, g.from), to: byId(state, g.to), p: provider(g.provider), amount: g.amount, min: Math.round((now - g.at) / 60000), mine: true };
      }).concat(SAMPLE.map(function (s) {
        return { from: byId(state, s.from), to: byId(state, s.to), p: provider(s.provider), amount: s.amount, min: s.ago, mine: false };
      })).filter(function (r) { return r.to; });

      var sum = rows.reduce(function (n, r) { return n + r.amount; }, 0);
      total.innerHTML = '<span class="n">$' + sum + '</span><span class="l">of compute gifted today \u00b7 ' + rows.length + (rows.length === 1 ? ' gift' : ' gifts') + '</span>';

      recentEl.innerHTML = rows.length ? rows.map(function (r) {
        var fromName = r.mine ? 'You' : firstName(r.from);
        return '<li' + (r.mine ? ' class="mine"' : '') + '>' +
          '<span class="pair">' + (r.from ? avatar(r.from) : '') + '<span class="arrow" aria-hidden="true">\u2192</span>' + avatar(r.to) + '</span>' +
          '<span class="what">' + esc(fromName) + ' bought <b>' + esc(firstName(r.to)) + '</b> $' + r.amount + ' of ' + esc(r.p.models) + '</span>' +
          '<span class="when">' + ago(r.min) + '</span>' +
          '</li>';
      }).join('') : '<li class="cp-empty">Nobody has bought anyone compute yet. Be first.</li>';

      if (focusSel) {
        var f = el.querySelector(focusSel);
        if (f) f.focus();
        focusSel = null;
      }
    }

    render(store.getState());
    store.subscribe(render);
  };
})();
