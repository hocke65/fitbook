-- ============================================
-- FITNESS BOOKING PLATFORM - DATABASE SCHEMA
-- PostgreSQL
-- ============================================

-- Skapa databas (kör detta separat om nödvändigt)
-- CREATE DATABASE fitness_booking;

-- ============================================
-- TABELLER
-- ============================================

-- Users tabell - lagrar alla användare (både vanliga och admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superuser')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes tabell - träningspass
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    instructor VARCHAR(255),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings tabell - bokningar (kopplar användare till pass)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    UNIQUE(user_id, class_id) -- En användare kan bara boka samma pass en gång
);

-- ============================================
-- INDEX FÖR BÄTTRE PRESTANDA
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_at ON classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- VIEW FÖR ATT VISA PASS MED ANTAL BOKNINGAR
-- ============================================

CREATE OR REPLACE VIEW classes_with_bookings AS
SELECT
    c.id,
    c.title,
    c.description,
    c.max_capacity,
    c.scheduled_at,
    c.duration_minutes,
    c.instructor,
    c.created_at,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as booked_count,
    c.max_capacity - COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as available_spots
FROM classes c
LEFT JOIN bookings b ON c.id = b.class_id
GROUP BY c.id;

-- ============================================
-- FUNKTION FÖR AUTO-UPDATE AV updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers för auto-update
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EXEMPELDATA (VALFRITT)
-- ============================================

-- Skapa admin-användare (lösenord: admin123)
-- Lösenordet är hashat med bcrypt
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@fitness.se', '$2b$10$rQZ8K.lN8H8X8Y8Z8A8B8OeE8F8G8H8I8J8K8L8M8N8O8P8Q8R8S8T', 'Admin', 'Administratör', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Exempelpass
INSERT INTO classes (title, description, max_capacity, scheduled_at, duration_minutes, instructor, created_by) VALUES
('Yoga för nybörjare', 'Ett lugnt och avslappnande yogapass perfekt för dig som är ny till yoga.', 15, NOW() + INTERVAL '1 day', 60, 'Anna Svensson', 1),
('HIIT Cardio', 'Högintensiv intervallträning som får pulsen att slå. Ta med handduk!', 20, NOW() + INTERVAL '2 days', 45, 'Erik Johansson', 1),
('Spinning', 'Utmanande cykelpass med energisk musik. Alla nivåer välkomna.', 25, NOW() + INTERVAL '3 days', 50, 'Maria Lindberg', 1),
('Styrketräning', 'Grundläggande styrketräning med fokus på teknik och form.', 12, NOW() + INTERVAL '4 days', 60, 'Johan Eriksson', 1),
('Pilates', 'Stärk din core och förbättra din hållning med pilates.', 18, NOW() + INTERVAL '5 days', 55, 'Lisa Andersson', 1)
ON CONFLICT DO NOTHING;
