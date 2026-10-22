-- =========================================================
-- RESTAURANT RESERVATION & MANAGEMENT SYSTEM
-- PostgreSQL schema
-- =========================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',

    CONSTRAINT chk_users_full_name
        CHECK (CHAR_LENGTH(TRIM(full_name)) >= 2),

    CONSTRAINT chk_users_email
        CHECK (POSITION('@' IN email) > 1),

    CONSTRAINT chk_users_role
        CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,

    CONSTRAINT chk_category_name
        CHECK (CHAR_LENGTH(TRIM(name)) >= 2)
);

CREATE TABLE restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    location VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_table_number
        CHECK (table_number > 0),

    CONSTRAINT chk_table_capacity
        CHECK (capacity > 0),

    CONSTRAINT chk_table_location
        CHECK (location IN ('Indoor', 'Outdoor'))
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_menu_item_category
        FOREIGN KEY (category_id)
        REFERENCES menu_categories(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_menu_item_category_name
        UNIQUE (category_id, name),

    CONSTRAINT chk_menu_item_name
        CHECK (CHAR_LENGTH(TRIM(name)) >= 2),

    CONSTRAINT chk_menu_item_price
        CHECK (price > 0)
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    special_request TEXT,

    CONSTRAINT fk_reservation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservation_table
        FOREIGN KEY (table_id)
        REFERENCES restaurant_tables(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_reservation_guests
        CHECK (guest_count > 0),

    CONSTRAINT chk_reservation_status
        CHECK (
            status IN (
                'Pending',
                'Confirmed',
                'Completed',
                'Cancelled',
                'Rejected'
            )
        )
);

CREATE UNIQUE INDEX uq_active_table_booking
ON reservations (
    table_id,
    reservation_date,
    reservation_time
)
WHERE status IN ('Pending', 'Confirmed');
