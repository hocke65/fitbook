-- Migration: Lägg till booking_deadline_hours kolumn
-- Kör detta för att lägga till den nya kolumnen i en befintlig databas:
ALTER TABLE classes ADD COLUMN IF NOT EXISTS booking_deadline_hours INTEGER DEFAULT 0;
