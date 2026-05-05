-- live-demo-anthologies.sql
--
-- Demo pilots and interpretive links for the "live" profile (Brookes
-- community content from the 2026-04-12 VSP dump). Wipes existing
-- demo state and reseeds in a single transaction.
--
-- Apply with:
--   docker exec -i DB psql -U postgres -d vsat_live -f - \
--     < contrib/live-demo-anthologies.sql
-- or:
--   psql -h <host> -U postgres -d vsat_live \
--     -f contrib/live-demo-anthologies.sql
--
-- Author: 1001 (dev@localhost) is the seed creator. If your
-- deployment doesn't have that author yet, the dev-auth-bypass
-- middleware will create it on first authed request; otherwise
-- create it manually before running this file.

BEGIN;

-- Wipe previous demo state. CASCADE is safe because pilot_story,
-- link_vote and interpretive_note all hang off pilot/story_link.
TRUNCATE TABLE link_vote, story_link, pilot_story, pilot RESTART IDENTITY CASCADE;

-- Anthology A — Cities & Public Space
-- Anthology B — Lived Experience
INSERT INTO pilot (title, question, partner, status, start_at, end_at) VALUES
  ('Cities & Public Space',
   'How does community storytelling reframe contested urban places?',
   'Brookes / Oxford', 'active',
   '2026-05-01'::timestamp, '2026-06-30'::timestamp),
  ('Lived Experience',
   'How do paired and contrasted personal narratives illuminate identity and memory?',
   'Brookes / SP', 'active',
   '2026-05-01'::timestamp, '2026-06-30'::timestamp);

-- Pilot membership.
INSERT INTO pilot_story (pilot_id, story_id) VALUES
  -- Anthology A
  ((SELECT id FROM pilot WHERE title = 'Cities & Public Space'), 109),
  ((SELECT id FROM pilot WHERE title = 'Cities & Public Space'), 196),
  ((SELECT id FROM pilot WHERE title = 'Cities & Public Space'), 398),
  ((SELECT id FROM pilot WHERE title = 'Cities & Public Space'), 1070),
  ((SELECT id FROM pilot WHERE title = 'Cities & Public Space'), 411),
  -- Anthology B
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 134),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 165),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 188),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 379),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 407),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 409),
  ((SELECT id FROM pilot WHERE title = 'Lived Experience'), 154);

-- Interpretive links. Eleven total: eight accepted (preseeded with
-- one accept vote each so the audit trail is honest), three left as
-- proposed so they can be demoed live. Cities is intentionally
-- denser (7 links) than Lived Experience (4) so the talk has both
-- a "well-populated" example and a "sparse" example side by side.
INSERT INTO story_link (from_story_id, to_story_id, link_type, rationale, status, created_by) VALUES
  -- Anthology A (Cities & Public Space) — densely linked
  (109,  196, 'adjacency', 'Both ground community storytelling in Oxford streets and public space; Building Bridges as civic project, Street Art as situated knowledge claim.', 'accepted', 1001),
  (1070, 196, 'thematic',  'Mobility risk and street life; commuting violence and street-art readings of urban marginalisation share an epistemics-of-the-street register.', 'accepted', 1001),
  (411,  398, 'thematic',  'Nature-culture entanglement; the dichotomy reconstruction reframes the sinking city as more-than-human predicament.', 'accepted', 1001),
  (411,  196, 'thematic',  'Nature-culture dichotomy and street art''s epistemic claim share a critique of who gets to author urban knowledge; both refuse a clean inside/outside divide between expertise and lived practice.', 'accepted', 1001),
  (398,  1070,'causal',    'Sinking City to Dangerous Commutes: collapsing infrastructure (and the political failure to maintain it) becomes the daily-mobility risk that commuters absorb; environmental decline is metabolised as personal hazard.', 'accepted', 1001),
  (109,  1070,'adjacency', 'Oxford civic storytelling adjacent to the dangerous-commute project; both treat embodied movement through built environment as data.', 'proposed', 1001),
  (109,  398, 'contrast',  'Building Bridges Oxford reaches for civic mending through community storytelling; Sinking City inhabits the opposite register — what remains when the civic fabric is unmaintained, ironic and apocalyptic against the constructive frame.', 'proposed', 1001),

  -- Anthology B (Lived Experience) — sparser, paired
  (134,  165, 'causal',    'Endless Night Part 1 → Part 2: an explicit narrative continuation, same author, same protagonist arc.', 'accepted', 1001),
  (407,  409, 'thematic',  'Love In Motion / Amor em Movimento: the same story rendered in English and Portuguese — paired translations.', 'accepted', 1001),
  (188,  379, 'thematic',  'Both inhabit lived-experience accounts of education and neurodivergence; Autism reframes classroom return through a different sensory map.', 'accepted', 1001),
  (154,  134, 'contrast',  'Going down vs. Endless Night: descent imagery in opposite registers — comic everyday vs. existential nocturne.', 'proposed', 1001);

-- Anchor the accepted ones with one accept vote each.
INSERT INTO link_vote (link_id, user_id, vote, comment)
SELECT id, 1001, 'accept', 'Seed: dev acceptance to anchor the demo'
FROM story_link
WHERE status = 'accepted';

COMMIT;

-- Sanity output (psql will print these).
SELECT 'pilots' AS what, count(*) FROM pilot
UNION ALL SELECT 'pilot_story', count(*) FROM pilot_story
UNION ALL SELECT 'story_link (accepted)', count(*) FROM story_link WHERE status = 'accepted'
UNION ALL SELECT 'story_link (proposed)', count(*) FROM story_link WHERE status = 'proposed';
