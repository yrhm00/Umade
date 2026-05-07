-- Seed des badges pour le système de gamification Umade
-- À exécuter via le Dashboard Supabase (SQL Editor)

INSERT INTO badges (code, name, description, icon, category, points, is_secret) VALUES
  ('first_booking',        'Première réservation',  'Vous avez effectué votre première réservation !',        '🎯', 'booking',     100, false),
  ('five_bookings',        '5 réservations',        'Vous avez effectué 5 réservations. Bravo !',             '⭐', 'booking',     250, false),
  ('ten_bookings',         'Expert réservation',    '10 réservations ! Vous êtes un expert.',                 '🏆', 'booking',     500, false),
  ('first_review',         'Premier avis',          'Vous avez laissé votre premier avis.',                   '✍️', 'review',      100, false),
  ('five_reviews',         'Critique averti',       '5 avis partagés. Votre opinion compte !',                '📝', 'review',      250, false),
  ('first_event',          'Premier événement',     'Vous avez créé votre premier événement.',                '🎉', 'event',       100, false),
  ('profile_complete',     'Profil complet',        'Votre profil est complètement rempli.',                  '👤', 'profile',      50, false),
  ('first_referral',       'Premier parrainage',    'Vous avez parrainé votre premier ami !',                 '🤝', 'referral',    200, false),
  ('five_referrals',       'Ambassadeur',           '5 parrainages réussis. Vous êtes un ambassadeur !',      '🌟', 'referral',    500, false),
  ('social_butterfly',     'Papillon social',       'Vous avez partagé 3 moments sur le feed.',               '🦋', 'social',      150, false),
  ('first_inspiration_fav','Coup de cœur',          'Vous avez ajouté votre première inspiration en favori.', '💕', 'inspiration',  50, false),
  ('budget_master',        'Maître du budget',      'Vous avez payé 5 éléments de votre budget.',             '💰', 'event',       150, false),
  ('early_bird',           'Lève-tôt',              'Réservation effectuée avant 8h du matin.',               '🐦', 'booking',     100, true),
  ('night_owl',            'Oiseau de nuit',        'Réservation effectuée après 22h.',                       '🦉', 'booking',     100, true),
  ('super_planner',        'Super organisateur',    'Événement avec checklist, budget, timeline et invités.', '🗓️', 'event',       300, false)
ON CONFLICT (code) DO NOTHING;
