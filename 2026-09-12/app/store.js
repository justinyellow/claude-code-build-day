// Kinnect — shared state. Classic script, no imports. Sets window.store.
// Load order in index.html: data.js, store.js, then the features.
// Contract: https://github.com/justinyellow/claude-code-build-day/issues/2

(function () {
  var seed = window.seed || {};

  var state = {
    me: seed.me || null,
    attendees: seed.attendees || [],
    sessions: seed.sessions || [],
    spaces: seed.spaces || [],
    questions: [],
    target: null
  };

  var listeners = [];
  var nextId = 1;

  function notify() {
    var snapshot = getState();
    listeners.forEach(function (fn) { fn(snapshot); });
  }

  function getState() {
    return state;
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  function attendee(id) {
    return state.attendees.filter(function (a) { return a.id === id; })[0] || null;
  }

  // Is this person on stage right now? We'd rather not interrupt them.
  function isPresenting(attendeeId, now) {
    return state.sessions.some(function (s) {
      if (s.speakerId !== attendeeId) return false;
      var start = Date.parse(s.startsAt);
      var end = Date.parse(s.endsAt);
      if (isNaN(start) || isNaN(end)) return false;
      return now >= start && now <= end;
    });
  }

  // Match question text against expertise tags. Deliberately simple — it has
  // to be visibly right on a projector, not clever.
  function route(text) {
    var words = String(text).toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
    var now = Date.now();
    var best = null;

    state.attendees.forEach(function (a) {
      if (a.id === state.me) return;

      var hit = null;
      (a.expertise || []).forEach(function (tag) {
        var t = String(tag).toLowerCase();
        var matched = words.some(function (w) {
          return w === t || (w.length > 3 && t.indexOf(w) !== -1) || (t.length > 3 && w.indexOf(t) !== -1);
        });
        if (matched && !hit) hit = tag;
      });
      if (!hit) return;

      var score = 1;
      if (isPresenting(a.id, now)) score = 0.4;       // on stage — last resort
      score -= questionsRoutedTo(a.id) * 0.1;          // spread the load

      if (!best || score > best.score) {
        best = { id: a.id, tag: hit, score: score };
      }
    });

    return best;
  }

  function questionsRoutedTo(id) {
    return state.questions.filter(function (q) { return q.routedToId === id; }).length;
  }

  function ask(text) {
    var match = route(text);
    var question = {
      id: 'q' + nextId++,
      text: text,
      askerId: state.me,
      routedToId: match ? match.id : null,
      matchedTag: match ? match.tag : null,
      answer: null,
      askedAt: Date.now()
    };
    state.questions = state.questions.concat([question]);
    notify();
    return question;
  }

  function answer(questionId, text) {
    state.questions = state.questions.map(function (q) {
      if (q.id !== questionId) return q;
      return Object.assign({}, q, { answer: text, answeredAt: Date.now() });
    });
    notify();
  }

  function award(attendeeId, n) {
    state.attendees = state.attendees.map(function (a) {
      if (a.id !== attendeeId) return a;
      return Object.assign({}, a, { credits: (a.credits || 0) + n });
    });
    notify();
  }

  // Accepts an attendee id or a space id. Find listens to this.
  function setTarget(id) {
    state.target = id;
    notify();
  }

  window.store = {
    getState: getState,
    subscribe: subscribe,
    ask: ask,
    answer: answer,
    award: award,
    setTarget: setTarget,
    attendee: attendee
  };
})();
