// Kinnect — seed data. Classic script, no imports. Sets window.seed.
// Load order in index.html: data.js, store.js, then the features.

(function () {
  // Sessions are anchored to page load so "on stage right now" is visible in a
  // demo at any time of day.
  function at(minutesFromNow) {
    return new Date(Date.now() + minutesFromNow * 60000).toISOString();
  }

  window.seed = {
    me: 'a1',

    attendees: [
      { id: 'a1', name: 'Justin', role: 'Organiser', expertise: ['claude', 'homelab', 'automation'], credits: 0, spaceId: 's1' },
      { id: 'a2', name: 'Thandi', role: 'ML engineer', expertise: ['prompting', 'evals', 'finetuning'], credits: 0, spaceId: 's2' },
      { id: 'a3', name: 'Pieter', role: 'Frontend dev', expertise: ['react', 'css', 'animation'], credits: 0, spaceId: 's1' },
      { id: 'a4', name: 'Nomsa', role: 'Data scientist', expertise: ['python', 'pandas', 'charts'], credits: 0, spaceId: 's3' },
      { id: 'a5', name: 'Riaan', role: 'Platform engineer', expertise: ['docker', 'kubernetes', 'deployment'], credits: 0, spaceId: 's2' },
      { id: 'a6', name: 'Aisha', role: 'Designer', expertise: ['design', 'figma', 'accessibility'], credits: 0, spaceId: 's3' },
      { id: 'a7', name: 'Sipho', role: 'Backend dev', expertise: ['postgres', 'api', 'rust'], credits: 0, spaceId: 's1' },
      { id: 'a8', name: 'Lerato', role: 'Product', expertise: ['demos', 'storytelling', 'pitching'], credits: 0, spaceId: 's2' }
    ],

    sessions: [
      { id: 'ses1', title: "What's new in Fable 5.1", speakerId: 'a2', startsAt: at(-10), endsAt: at(20), spaceId: 's1' },
      { id: 'ses2', title: 'Tracks and team formation', speakerId: 'a8', startsAt: at(20), endsAt: at(35), spaceId: 's1' },
      { id: 'ses3', title: 'Two-minute demos', speakerId: 'a1', startsAt: at(75), endsAt: at(120), spaceId: 's1' }
    ],

    spaces: [
      { id: 's1', name: 'Main floor', floor: 2, x: 0.5, y: 0.35 },
      { id: 's2', name: 'Breakout room', floor: 2, x: 0.18, y: 0.7 },
      { id: 's3', name: 'Coffee bar', floor: 2, x: 0.82, y: 0.72 }
    ]
  };
})();
