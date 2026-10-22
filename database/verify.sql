-- Verify tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify reservations with readable relationships
SELECT
    r.id AS reservation_id,
    u.full_name AS customer,
    rt.table_number,
    r.reservation_date,
    r.reservation_time,
    r.guest_count,
    r.status,
    r.special_request
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN restaurant_tables rt ON r.table_id = rt.id
ORDER BY r.reservation_date, r.reservation_time;

-- Verify menu/category relationship
SELECT
    mi.id,
    mi.name AS menu_item,
    mc.name AS category,
    mi.price,
    mi.is_available
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
ORDER BY mc.name, mi.name;
