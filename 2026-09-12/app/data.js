// Kinnect — seed data. Classic script, no imports. Sets window.seed.
// Load order in index.html: data.js, store.js, then the features.
// Shapes: https://github.com/justinyellow/claude-code-build-day/issues/2
//
// `me` is an attendee id (store.js compares `a.id === state.me`).
// Session times are local ISO strings with no timezone suffix so Date.parse
// treats them as local time on whatever machine runs the demo.

(function () {
  var attendees = [
    { id: 'a1',  name: 'Alex Kim',          expertise: ['react', 'typescript', 'community'],             credits: 120, spaceId: 's3' },
    { id: 'a2',  name: 'Priya Natarajan',   expertise: ['postgres', 'sql', 'data-modeling'],            credits: 640, spaceId: 's1' },
    { id: 'a3',  name: 'Marcus Oyelaran',   expertise: ['react-native', 'ios', 'android'],              credits: 310, spaceId: 's4' },
    { id: 'a4',  name: 'Lena Fischer',      expertise: ['fundraising', 'pitching', 'angel-investing'],  credits: 880, spaceId: 's3' },
    { id: 'a5',  name: 'Tomás Herrera',     expertise: ['design-systems', 'figma', 'accessibility'],    credits: 450, spaceId: 's2' },
    { id: 'a6',  name: 'Aisha Bello',       expertise: ['kubernetes', 'devops', 'aws'],                 credits: 270, spaceId: 's5' },
    { id: 'a7',  name: 'Jonas Lindqvist',   expertise: ['security', 'auth', 'oauth'],                   credits: 530, spaceId: 's1' },
    { id: 'a8',  name: 'Mei-Ling Chen',     expertise: ['prompt-engineering', 'claude', 'agents'],      credits: 720, spaceId: 's4' },
    { id: 'a9',  name: 'David Achterberg',  expertise: ['python', 'postgres', 'data-science'],          credits: 190, spaceId: 's1' },
    { id: 'a10', name: 'Sofia Moreau',      expertise: ['legal', 'contracts', 'gdpr'],                  credits: 60,  spaceId: 's6' },
    { id: 'a11', name: 'Kwame Mensah',      expertise: ['hiring', 'management', 'remote-work'],         credits: 340, spaceId: 's3' },
    { id: 'a12', name: 'Hana Sato',         expertise: ['rust', 'embedded', 'hardware'],                credits: 410, spaceId: 's2' }
  ];

  // Two people know postgres on purpose: David is on stage 11:45–12:30, so a
  // postgres question asked during the demo routes to Priya instead.
  var sessions = [
    { id: 'sess1', title: 'Welcome: what we are building today',           speakerId: 'a4', spaceId: 's1', startsAt: '2026-09-12T09:00:00', endsAt: '2026-09-12T09:30:00' },
    { id: 'sess2', title: 'Hands-on: building agents with Claude',          speakerId: 'a8', spaceId: 's2', startsAt: '2026-09-12T09:45:00', endsAt: '2026-09-12T10:45:00' },
    { id: 'sess3', title: 'Design systems that survive contact with engineers', speakerId: 'a5', spaceId: 's1', startsAt: '2026-09-12T11:00:00', endsAt: '2026-09-12T11:45:00' },
    { id: 'sess4', title: 'Lightning talks: data pipelines in Python',      speakerId: 'a9', spaceId: 's1', startsAt: '2026-09-12T11:45:00', endsAt: '2026-09-12T12:30:00' },
    { id: 'sess5', title: 'Demos and closing',                              speakerId: 'a2', spaceId: 's1', startsAt: '2026-09-12T13:00:00', endsAt: '2026-09-12T14:00:00' }
  ];

  // A 12 x 8 grid. Units are arbitrary; Find scales them to the viewport.
  //
  //   +-------------------+-------------------+
  //   |    Main Stage     |   Workshop Room   |
  //   +------------+------+------+------------+
  //   |   Lounge   |    Café     | Quiet Room |
  //   |            |             +------------+
  //   |            |             |  Entrance  |
  //   +------------+-------------+------------+
  var spaces = [
    { id: 's1', name: 'Main Stage',    x: 0, y: 0, w: 6, h: 4 },
    { id: 's2', name: 'Workshop Room', x: 6, y: 0, w: 6, h: 4 },
    { id: 's3', name: 'Lounge',        x: 0, y: 4, w: 4, h: 4 },
    { id: 's4', name: 'Café',          x: 4, y: 4, w: 4, h: 4 },
    { id: 's5', name: 'Quiet Room',    x: 8, y: 4, w: 4, h: 2 },
    { id: 's6', name: 'Entrance',      x: 8, y: 6, w: 4, h: 2 }
  ];

  window.seed = {
    me: 'a1',
    attendees: attendees,
    sessions: sessions,
    spaces: spaces
  };
})();
