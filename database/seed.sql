-- =========================================================
-- SAMPLE DATA
-- Safe to re-run: categories/tables/users/menu items use
-- conflict handling; sample reservations avoid duplicates.
-- =========================================================

INSERT INTO menu_categories (name)
VALUES
    ('Starters'),
    ('Main Dishes'),
    ('Desserts'),
    ('Drinks')
ON CONFLICT (name) DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, location, is_active)
VALUES
    (1, 2, 'Indoor', TRUE),
    (2, 2, 'Indoor', TRUE),
    (3, 4, 'Indoor', TRUE),
    (4, 4, 'Indoor', TRUE),
    (5, 4, 'Outdoor', TRUE),
    (6, 6, 'Indoor', TRUE),
    (7, 8, 'Outdoor', TRUE)
ON CONFLICT (table_number) DO NOTHING;

-- These hashes are placeholders only. Real bcrypt hashes will be
-- created by the authentication API in the next development phase.
INSERT INTO users (full_name, email, phone, password_hash, role)
VALUES
    ('Restaurant Admin', 'admin@delish.com', '0790000001', 'TEMP_HASH_REPLACE_LATER', 'admin'),
    ('Ahmad Ali', 'ahmad@email.com', '0790000002', 'TEMP_HASH_REPLACE_LATER', 'customer'),
    ('Sara Ahmad', 'sara@email.com', '0790000003', 'TEMP_HASH_REPLACE_LATER', 'customer'),
    ('Abdalwhab Qudah', 'customer@delish.com', '0790000004', 'TEMP_HASH_REPLACE_LATER', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, image_url, is_available)
VALUES
(
    (SELECT id FROM menu_categories WHERE name = 'Starters'),
    'Caesar Salad',
    'Fresh lettuce, parmesan cheese, croutons and Caesar dressing.',
    4.50,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Starters'),
    'Garlic Bread',
    'Toasted bread with garlic butter and herbs.',
    3.00,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Main Dishes'),
    'Chicken Pasta',
    'Creamy pasta with grilled chicken and herbs.',
    7.50,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Main Dishes'),
    'Beef Burger',
    'Classic beef burger with cheese and vegetables.',
    6.00,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Main Dishes'),
    'Margherita Pizza',
    'Tomato sauce, mozzarella cheese and fresh basil.',
    8.00,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Main Dishes'),
    'Grilled Salmon',
    'Grilled salmon served with vegetables and lemon.',
    12.00,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Desserts'),
    'Chocolate Cake',
    'Rich chocolate cake served with ice cream.',
    3.00,
    NULL,
    TRUE
),
(
    (SELECT id FROM menu_categories WHERE name = 'Drinks'),
    'Lemon Juice',
    'Fresh lemon juice with mint.',
    2.00,
    NULL,
    TRUE
)
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO reservations (
    user_id, table_id, reservation_date, reservation_time,
    guest_count, status, special_request
)
SELECT
    u.id, rt.id, DATE '2026-09-05', TIME '19:30', 4,
    'Confirmed', 'Window seat if possible'
FROM users u
JOIN restaurant_tables rt ON rt.table_number = 3
WHERE u.email = 'ahmad@email.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.user_id = u.id
        AND r.table_id = rt.id
        AND r.reservation_date = DATE '2026-09-05'
        AND r.reservation_time = TIME '19:30'
  );

INSERT INTO reservations (
    user_id, table_id, reservation_date, reservation_time,
    guest_count, status, special_request
)
SELECT
    u.id, rt.id, DATE '2026-09-05', TIME '20:00', 2,
    'Rejected', NULL
FROM users u
JOIN restaurant_tables rt ON rt.table_number = 2
WHERE u.email = 'sara@email.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.user_id = u.id
        AND r.table_id = rt.id
        AND r.reservation_date = DATE '2026-09-05'
        AND r.reservation_time = TIME '20:00'
  );

INSERT INTO reservations (
    user_id, table_id, reservation_date, reservation_time,
    guest_count, status, special_request
)
SELECT
    u.id, rt.id, DATE '2026-09-18', TIME '17:00', 3,
    'Confirmed', 'Birthday celebration'
FROM users u
JOIN restaurant_tables rt ON rt.table_number = 3
WHERE u.email = 'customer@delish.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.user_id = u.id
        AND r.table_id = rt.id
        AND r.reservation_date = DATE '2026-09-18'
        AND r.reservation_time = TIME '17:00'
  );

INSERT INTO reservations (
    user_id, table_id, reservation_date, reservation_time,
    guest_count, status, special_request
)
SELECT
    u.id, rt.id, DATE '2026-08-20', TIME '20:00', 2,
    'Completed', NULL
FROM users u
JOIN restaurant_tables rt ON rt.table_number = 1
WHERE u.email = 'ahmad@email.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.user_id = u.id
        AND r.table_id = rt.id
        AND r.reservation_date = DATE '2026-08-20'
        AND r.reservation_time = TIME '20:00'
  );
