-- ============================================
-- MIGRATION: Lägg till 'superuser' roll
-- ============================================
-- Superuser kan hantera pass (skapa, ändra, ta bort)
-- men kan INTE hantera användare (det är endast för admin)
-- ============================================

-- Uppdatera CHECK constraint för role-kolumnen
-- PostgreSQL kräver att vi tar bort och återskapar constraint

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'superuser'));

-- Verifiera att ändringen fungerade
-- SELECT DISTINCT role FROM users;
