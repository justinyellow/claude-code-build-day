// Kinnect — Events. Registers on window.features. Classic script, no imports.
// Owns: this file only. Reads sessions/attendees from the store for the live
// event; the upcoming list is sample content and lives here.
//
// Layout borrows from lu.ma: a date-grouped timeline with hairline cards, one
// accent, and type doing the work. No cover images (nothing loads off the
// network), so each series gets a monogram tile instead.

(function () {
  var STYLE = [
    /* section headings */
    '.ev-eyebrow{display:flex;align-items:center;gap:.5rem;margin:0 0 .6rem;font-size:.75rem;font-weight:600;',
    'letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9a9aa3)}',
    '.ev-eyebrow .dot{width:.5rem;height:.5rem;border-radius:50%;background:var(--accent,#e0472f);',
    'box-shadow:0 0 0 0 var(--accent-soft,rgba(224,71,47,.12));animation:ev-pulse 2s ease-out infinite}',
    '@keyframes ev-pulse{0%{box-shadow:0 0 0 0 rgba(224,71,47,.45)}100%{box-shadow:0 0 0 .55rem rgba(224,71,47,0)}}',
    '.ev-h{margin:0 0 1.25rem;font-size:1.35rem;font-weight:700;letter-spacing:-.02em}',

    /* hero: the event you are at */
    '.ev-hero{display:grid;grid-template-columns:5.5rem 1fr;gap:1.5rem;padding:1.5rem;margin-bottom:1rem;',
    'background:var(--surface,#17171a);border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px)}',
    '.ev-date{display:flex;flex-direction:column;align-items:center;justify-content:center;height:5.5rem;',
    'border:1px solid var(--line-strong,#3a3a41);border-radius:var(--radius-sm,8px);background:var(--bg,#101012)}',
    '.ev-date .m{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#e0472f)}',
    '.ev-date .d{font-size:2rem;font-weight:700;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}',
    '.ev-date .w{font-size:.7rem;color:var(--muted,#9a9aa3);margin-top:.15rem}',
    '.ev-title{margin:0 0 .5rem;font-size:1.75rem;font-weight:700;letter-spacing:-.025em;line-height:1.15}',
    '.ev-meta{display:flex;flex-wrap:wrap;gap:.35rem 1.25rem;margin:0;padding:0;list-style:none;color:var(--muted,#9a9aa3);font-size:.95rem}',
    '.ev-meta li{display:flex;align-items:center;gap:.4rem}',
    '.ev-meta svg{width:1em;height:1em;flex:none;opacity:.8}',
    '.ev-now{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1.25rem}',
    '.ev-slot{padding:.85rem 1rem;border-radius:var(--radius-sm,8px);background:var(--bg,#101012);border:1px solid var(--line,#2a2a2f)}',
    '.ev-slot.live{border-color:var(--accent,#e0472f)}',
    '.ev-slot .k{display:block;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9a9aa3);margin-bottom:.3rem}',
    '.ev-slot.live .k{color:var(--accent,#e0472f)}',
    '.ev-slot .t{display:block;font-weight:600;font-size:1rem;line-height:1.3}',
    '.ev-slot .s{display:block;color:var(--muted,#9a9aa3);font-size:.9rem;margin-top:.2rem}',
    '.ev-people{display:flex;align-items:center;gap:.75rem;margin-top:1.25rem;font-size:.9rem;color:var(--muted,#9a9aa3)}',
    '.ev-people strong{color:var(--text,#f4f3f0);font-weight:600}',
    '.ev-stack{display:flex}',
    '.ev-av{width:1.9rem;height:1.9rem;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;',
    'font-size:.7rem;font-weight:700;letter-spacing:.02em;border:2px solid var(--surface,#17171a);margin-left:-.45rem}',
    '.ev-av:first-child{margin-left:0}',
    '.ev-stack.sm .ev-av{width:1.5rem;height:1.5rem;font-size:.6rem;border-width:1.5px;border-color:var(--surface,#17171a)}',

    /* today's schedule */
    '.ev-sched{margin:0 0 2.75rem;padding:0;list-style:none;border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px);overflow:hidden}',
    '.ev-sched li{display:grid;grid-template-columns:7rem 1fr auto;gap:1rem;align-items:baseline;padding:.8rem 1.25rem;',
    'border-top:1px solid var(--line,#2a2a2f);font-size:.95rem}',
    '.ev-sched li:first-child{border-top:0}',
    '.ev-sched .time{font-variant-numeric:tabular-nums;color:var(--muted,#9a9aa3)}',
    '.ev-sched .who{color:var(--muted,#9a9aa3)}',
    '.ev-sched li.done{color:var(--faint,#6b6b74)}',
    '.ev-sched li.done .time,.ev-sched li.done .who{color:var(--faint,#6b6b74)}',
    '.ev-sched li.live{background:var(--accent-soft,rgba(224,71,47,.12))}',
    '.ev-pill{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.15rem .5rem;border-radius:1rem;',
    'border:1px solid var(--line-strong,#3a3a41);color:var(--muted,#9a9aa3)}',
    '.ev-pill.live{border-color:var(--accent,#e0472f);color:var(--accent,#e0472f)}',
    '.ev-pill.next{border-color:var(--line-strong,#3a3a41);color:var(--text,#f4f3f0)}',

    /* timeline */
    '.ev-tl{position:relative;margin:0;padding:0;list-style:none}',
    /* line and dots share one x: 8rem column + half the 1.5rem gap */
    '.ev-tl::before{content:"";position:absolute;left:8.75rem;top:.6rem;bottom:.6rem;width:1px;background:var(--line,#2a2a2f);transform:translateX(-50%)}',
    '.ev-day{position:relative;display:grid;grid-template-columns:8rem 1fr;gap:1.5rem;padding:0 0 1.75rem}',
    '.ev-day:last-child{padding-bottom:0}',
    '.ev-day::before{content:"";position:absolute;left:8.75rem;top:.5rem;width:.55rem;height:.55rem;border-radius:50%;',
    'background:var(--bg,#101012);border:2px solid var(--line-strong,#3a3a41);transform:translateX(-50%)}',
    '.ev-day.today::before{border-color:var(--accent,#e0472f);background:var(--accent,#e0472f)}',
    '.ev-when{padding-top:.15rem}',
    '.ev-when .dl{display:block;font-weight:600;font-size:.95rem}',
    '.ev-when .rel{display:block;color:var(--muted,#9a9aa3);font-size:.85rem}',
    '.ev-cards{display:flex;flex-direction:column;gap:.75rem}',

    /* card */
    '.ev-card{display:grid;grid-template-columns:1fr auto;gap:1.25rem;padding:1.1rem 1.25rem;',
    'background:var(--surface,#17171a);border:1px solid var(--line,#2a2a2f);border-radius:var(--radius,12px)}',
    '.ev-card:hover{border-color:var(--line-strong,#3a3a41)}',
    '.ev-card .time{font-size:.85rem;color:var(--muted,#9a9aa3);font-variant-numeric:tabular-nums;margin:0 0 .25rem}',
    '.ev-card .time .online{margin-left:.5rem;color:var(--ok,#4cc38a);font-weight:600}',
    '.ev-card h3{margin:0 0 .35rem;font-size:1.15rem;font-weight:700;letter-spacing:-.015em;line-height:1.25}',
    '.ev-card .by{margin:0 0 .5rem;font-size:.9rem;color:var(--muted,#9a9aa3)}',
    '.ev-card .by b{font-weight:600;color:var(--text,#f4f3f0)}',
    '.ev-card .loc{display:flex;align-items:center;gap:.4rem;margin:0 0 .75rem;font-size:.9rem;color:var(--muted,#9a9aa3)}',
    '.ev-card .loc svg{width:1em;height:1em;flex:none;opacity:.8}',
    '.ev-foot{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}',
    '.ev-tags{display:flex;gap:.35rem;flex-wrap:wrap}',
    '.ev-tag{font-size:.75rem;padding:.15rem .55rem;border-radius:1rem;background:var(--surface-2,#1e1e22);color:var(--muted,#9a9aa3)}',
    '.ev-going{margin-left:auto;display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--muted,#9a9aa3)}',
    '.ev-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:.75rem}',
    '.ev-mono{width:3.25rem;height:3.25rem;border-radius:var(--radius-sm,8px);display:flex;align-items:center;justify-content:center;',
    'font-size:.9rem;font-weight:700;letter-spacing:.02em}',
    '.ev-btn{font-size:.85rem;font-weight:600;padding:.5rem .9rem;border-radius:var(--radius-sm,8px);',
    'border:1px solid var(--line-strong,#3a3a41);background:transparent;color:var(--text,#f4f3f0);white-space:nowrap}',
    '.ev-btn:hover{border-color:var(--text,#f4f3f0)}',
    '.ev-btn.on{border-color:var(--ok,#4cc38a);background:var(--ok-soft,rgba(76,195,138,.14));color:var(--ok,#4cc38a)}',
    '.ev-btn.here{border-color:var(--ok,#4cc38a);color:var(--ok,#4cc38a);cursor:default}',

    '@media(max-width:44rem){',
    '.ev-hero{grid-template-columns:1fr}.ev-date{width:5.5rem}.ev-now{grid-template-columns:1fr}',
    '.ev-tl::before{display:none}.ev-day{grid-template-columns:1fr;gap:.5rem}.ev-day::before{display:none}',
    '.ev-sched li{grid-template-columns:5rem 1fr auto}.ev-card{grid-template-columns:1fr}.ev-side{flex-direction:row;align-items:center}',
    '}'
  ].join('');

  // The event everyone is at. Details from 2026-09-12/README.md.
  var HERE = {
    series: 'Claude Cape Town Community',
    title: 'Claude Fable 5.1 Build Day',
    date: '2026-09-12',
    start: '09:30',
    end: '13:00',
    venue: 'Roamwork Harrington, 2nd floor',
    area: '50 Harrington St, District Six',
    registered: 48
  };

  // Sample content. Real venues, plausible dates, the sort of thing this
  // community actually runs. Swap freely — nothing else depends on it.
  var UPCOMING = [
    { id: 'e1', series: 'Claude Cape Town Community', title: 'Show & tell: what we shipped at Build Day',
      date: '2026-09-24', start: '18:00', end: '20:30', venue: 'Workshop17, Watershed', area: 'V&A Waterfront',
      tags: ['demos', 'drinks'], going: 31, hosts: ['Lena Fischer', 'Priya Natarajan'] },
    { id: 'e2', series: 'Agents in Production', title: 'Three teams on what broke when their agents met real users',
      date: '2026-10-07', start: '18:30', end: '20:30', venue: 'Roamwork Harrington', area: 'District Six',
      tags: ['talks', 'agents', 'ops'], going: 54, hosts: ['Mei-Ling Chen', 'Aisha Bello'] },
    { id: 'e3', series: 'Claude for Everyone', title: 'Prompting for people who don\u2019t code \u2014 a Saturday workshop',
      date: '2026-10-10', start: '10:00', end: '12:30', venue: 'Woodstock Exchange', area: '66 Albert Rd, Woodstock',
      tags: ['beginners', 'hands-on'], going: 22, hosts: ['Kwame Mensah'] },
    { id: 'e4', series: 'Claude Joburg Community', title: 'First Johannesburg meet-up',
      date: '2026-10-15', start: '18:00', end: '20:00', venue: 'Tshimologong Precinct', area: 'Braamfontein, Johannesburg',
      tags: ['launch', 'networking'], going: 67, hosts: ['Marcus Oyelaran'] },
    { id: 'e5', series: 'Claude Cape Town Community', title: 'Office hours: getting an MCP server running',
      date: '2026-10-20', start: '17:00', end: '18:00', online: true, venue: 'Discord voice', area: '',
      tags: ['q&a', 'mcp'], going: 40, hosts: ['Jonas Lindqvist'] },
    { id: 'e6', series: 'Data & Claude', title: 'Postgres, pipelines and a lot of SQL \u2014 lightning talks',
      date: '2026-10-22', start: '18:30', end: '20:30', venue: 'Ideas Cartel, The Old Foundry', area: 'Green Point',
      tags: ['data', 'talks'], going: 28, hosts: ['David Achterberg', 'Priya Natarajan'] },
    { id: 'e7', series: 'Student Builders', title: 'Friday build night',
      date: '2026-10-30', start: '17:30', end: '21:00', venue: 'LaunchLab', area: 'Stellenbosch',
      tags: ['students', 'build'], going: 19, hosts: ['Hana Sato', 'Alex Kim'] }
  ];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Restrained palette for monograms and avatars: low saturation, mid light.
  var HUES = [
    ['#2b3a4e', '#b7c9e2'], ['#3a4a3c', '#b9d3bb'], ['#4a3c2e', '#e2c9a8'],
    ['#4b2f34', '#e5b7bf'], ['#3f3550', '#cfc1e6'], ['#2f4547', '#a9d3d3']
  ];

  var ICON = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>'
  };

  function injectStyle() {
    if (document.getElementById('events-style')) return;
    var s = document.createElement('style');
    s.id = 'events-style';
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

  function hue(str) { return HUES[hash(String(str)) % HUES.length]; }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var a = parts[0].charAt(0), b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  function avatar(name) {
    var c = hue(name);
    return '<span class="ev-av" style="background:' + c[0] + ';color:' + c[1] + '" title="' + esc(name) + '">' + esc(initials(name)) + '</span>';
  }

  function monogram(series) {
    var c = hue(series);
    var words = String(series).split(/\s+/).filter(function (w) { return /^[A-Za-z0-9]/.test(w); });
    var mono = words.slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
    return '<span class="ev-mono" style="background:' + c[0] + ';color:' + c[1] + '" aria-hidden="true">' + esc(mono) + '</span>';
  }

  // 'YYYY-MM-DD' -> local Date at midnight. Avoids timezone drift on parse.
  function localDate(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function hhmm(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function dayLabel(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  function daysFromToday(d) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((d - today) / 86400000);
  }

  function relative(d) {
    var n = daysFromToday(d);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n < 0) return Math.abs(n) + (n === -1 ? ' day ago' : ' days ago');
    if (n < 7) return 'This ' + DAYS[d.getDay()];
    if (n < 14) return 'Next week';
    var w = Math.round(n / 7);
    return 'In ' + w + ' week' + (w === 1 ? '' : 's');
  }

  function stack(names, max) {
    return '<span class="ev-stack sm">' + names.slice(0, max).map(avatar).join('') + '</span>';
  }

  // ---- the event you're at ------------------------------------------------

  function liveSlots(state, store) {
    var now = Date.now();
    var live = null, next = null;
    (state.sessions || []).forEach(function (s) {
      var a = Date.parse(s.startsAt), b = Date.parse(s.endsAt);
      if (isNaN(a) || isNaN(b)) return;
      if (a <= now && now <= b) live = s;
      else if (a > now && (!next || a < Date.parse(next.startsAt))) next = s;
    });

    function who(s) {
      var p = store.attendee ? store.attendee(s.speakerId) : null;
      var room = (state.spaces || []).filter(function (sp) { return sp.id === s.spaceId; })[0];
      return (p ? p.name : 'TBC') + (room ? ' \u00b7 ' + room.name : '');
    }

    var a = live
      ? '<div class="ev-slot live"><span class="k">On stage now</span><span class="t">' + esc(live.title) + '</span><span class="s">' + esc(who(live)) + '</span></div>'
      : '<div class="ev-slot"><span class="k">On stage</span><span class="t">Between sessions</span><span class="s">Good time to find someone</span></div>';

    var b = next
      ? '<div class="ev-slot"><span class="k">Up next \u00b7 ' + esc(hhmm(next.startsAt)) + '</span><span class="t">' + esc(next.title) + '</span><span class="s">' + esc(who(next)) + '</span></div>'
      : '<div class="ev-slot"><span class="k">Up next</span><span class="t">That\u2019s the programme</span><span class="s">Thanks for coming</span></div>';

    return a + b;
  }

  function hero(state, store) {
    var d = localDate(HERE.date);
    var people = (state.attendees || []).map(function (a) { return a.name; });
    var checkedIn = people.length;

    return '<p class="ev-eyebrow"><span class="dot"></span>Happening now \u00b7 ' + esc(HERE.series) + '</p>' +
      '<article class="ev-hero">' +
      '<div class="ev-date"><span class="m">' + MONTHS[d.getMonth()] + '</span><span class="d">' + d.getDate() + '</span><span class="w">' + DAYS[d.getDay()] + '</span></div>' +
      '<div>' +
      '<h2 class="ev-title">' + esc(HERE.title) + '</h2>' +
      '<ul class="ev-meta">' +
      '<li>' + ICON.clock + esc(HERE.start) + ' \u2013 ' + esc(HERE.end) + '</li>' +
      '<li>' + ICON.pin + esc(HERE.venue) + ', ' + esc(HERE.area) + '</li>' +
      '</ul>' +
      '<div class="ev-now">' + liveSlots(state, store) + '</div>' +
      (checkedIn
        ? '<div class="ev-people"><span class="ev-stack">' + people.slice(0, 6).map(avatar).join('') + '</span>' +
          '<span><strong>' + checkedIn + ' checked in</strong> \u00b7 ' + HERE.registered + ' registered</span>' +
          '<button type="button" class="ev-btn here" style="margin-left:auto">You\u2019re checked in</button></div>'
        : '') +
      '</div>' +
      '</article>';
  }

  function schedule(state, store) {
    var sessions = (state.sessions || []).slice().sort(function (a, b) {
      return Date.parse(a.startsAt) - Date.parse(b.startsAt);
    });
    if (!sessions.length) return '';
    var now = Date.now();
    var nextMarked = false;

    return '<ul class="ev-sched">' + sessions.map(function (s) {
      var a = Date.parse(s.startsAt), b = Date.parse(s.endsAt);
      var cls = '', pill = '';
      if (b < now) cls = 'done';
      else if (a <= now) { cls = 'live'; pill = '<span class="ev-pill live">Now</span>'; }
      else if (!nextMarked) { nextMarked = true; pill = '<span class="ev-pill next">Next</span>'; }
      var p = store.attendee ? store.attendee(s.speakerId) : null;
      var room = (state.spaces || []).filter(function (sp) { return sp.id === s.spaceId; })[0];
      return '<li class="' + cls + '">' +
        '<span class="time">' + hhmm(a) + ' \u2013 ' + hhmm(b) + '</span>' +
        '<span><span class="t">' + esc(s.title) + '</span> <span class="who">\u00b7 ' + esc(p ? p.name : 'TBC') + (room ? ', ' + esc(room.name) : '') + '</span></span>' +
        '<span>' + pill + '</span>' +
        '</li>';
    }).join('') + '</ul>';
  }

  // ---- upcoming -----------------------------------------------------------

  function card(e, going) {
    var isOn = !!going[e.id];
    var count = e.going + (isOn ? 1 : 0);
    var where = e.online
      ? ICON.video + '<span>Online \u00b7 ' + esc(e.venue) + '</span>'
      : ICON.pin + '<span>' + esc(e.venue) + (e.area ? ', ' + esc(e.area) : '') + '</span>';

    return '<article class="ev-card" data-event="' + esc(e.id) + '">' +
      '<div>' +
      '<p class="time">' + esc(e.start) + ' \u2013 ' + esc(e.end) + (e.online ? '<span class="online">Online</span>' : '') + '</p>' +
      '<h3>' + esc(e.title) + '</h3>' +
      '<p class="by">By <b>' + esc(e.series) + '</b> \u00b7 hosted by ' + esc(e.hosts.join(' and ')) + '</p>' +
      '<p class="loc">' + where + '</p>' +
      '<div class="ev-foot">' +
      '<div class="ev-tags">' + e.tags.map(function (t) { return '<span class="ev-tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="ev-going">' + stack(e.hosts, 3) + '<span>' + count + ' going</span></div>' +
      '</div>' +
      '</div>' +
      '<div class="ev-side">' + monogram(e.series) +
      '<button type="button" class="ev-btn' + (isOn ? ' on' : '') + '" data-going="' + esc(e.id) + '" aria-pressed="' + (isOn ? 'true' : 'false') + '">' +
      (isOn ? 'Going' : 'Register') + '</button>' +
      '</div>' +
      '</article>';
  }

  function timeline(going) {
    var byDate = {};
    var order = [];
    UPCOMING.slice().sort(function (a, b) {
      return (a.date + a.start) < (b.date + b.start) ? -1 : 1;
    }).forEach(function (e) {
      if (!byDate[e.date]) { byDate[e.date] = []; order.push(e.date); }
      byDate[e.date].push(e);
    });

    return '<ol class="ev-tl">' + order.map(function (date) {
      var d = localDate(date);
      var today = daysFromToday(d) === 0;
      return '<li class="ev-day' + (today ? ' today' : '') + '">' +
        '<div class="ev-when"><span class="dl">' + dayLabel(d) + '</span><span class="rel">' + relative(d) + '</span></div>' +
        '<div class="ev-cards">' + byDate[date].map(function (e) { return card(e, going); }).join('') + '</div>' +
        '</li>';
    }).join('') + '</ol>';
  }

  window.features = window.features || {};
  window.features.events = function (el, store) {
    injectStyle();

    // Which sample events you've said you're going to. View state only.
    var going = {};

    el.innerHTML = '<div class="ev-here"></div><p class="ev-eyebrow">Upcoming</p><h2 class="ev-h">Claude community meet-ups</h2><div class="ev-list"></div>';
    var here = el.querySelector('.ev-here');
    var list = el.querySelector('.ev-list');

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-going]');
      if (!btn) return;
      var id = btn.getAttribute('data-going');
      going[id] = !going[id];
      renderList();
      var again = el.querySelector('[data-going="' + id + '"]');
      if (again) again.focus();
    });

    function renderHere(state) {
      here.innerHTML = hero(state, store) + schedule(state, store);
    }
    function renderList() {
      list.innerHTML = timeline(going);
    }

    renderHere(store.getState());
    renderList();
    store.subscribe(renderHere);

    // The live/next slots depend on the clock, not the store. Tick once a
    // minute so "On stage now" moves without a reload.
    setInterval(function () { renderHere(store.getState()); }, 60000);
  };
})();
