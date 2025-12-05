const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Alla routes kräver admin-behörighet
router.use(authenticateToken, requireAdmin);

// ============================================
// GET /api/users - Hämta alla användare
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        (SELECT COUNT(*) FROM bookings WHERE user_id = users.id AND status = 'confirmed') as booking_count
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        bookingCount: parseInt(user.booking_count) || 0
      }))
    });
  } catch (error) {
    console.error('Fel vid hämtning av användare:', error);
    res.status(500).json({ error: 'Kunde inte hämta användare.' });
  }
});

// ============================================
// GET /api/users/:id - Hämta en specifik användare
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        id,
        email,
        first_name,
        last_name,
        role,
        created_at
      FROM users
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren hittades inte.' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Fel vid hämtning av användare:', error);
    res.status(500).json({ error: 'Kunde inte hämta användare.' });
  }
});

// ============================================
// PUT /api/users/:id - Uppdatera användare
// ============================================
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Ogiltig e-postadress'),
  body('firstName').optional().trim().notEmpty().withMessage('Förnamn krävs'),
  body('lastName').optional().trim().notEmpty().withMessage('Efternamn krävs'),
  body('role').optional().isIn(['user', 'admin', 'superuser']).withMessage('Ogiltig roll'),
  body('password').optional().isLength({ min: 6 }).withMessage('Lösenord måste vara minst 6 tecken'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, password } = req.body;

    // Kontrollera att användaren finns
    const existingUser = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren hittades inte.' });
    }

    // Förhindra att man tar bort sin egen admin-behörighet
    if (existingUser.rows[0].id === req.user.id && role === 'user') {
      return res.status(400).json({
        error: 'Du kan inte ta bort din egen admin-behörighet.'
      });
    }

    // Kontrollera om e-post redan används av annan användare
    if (email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'E-postadressen används redan.' });
      }
    }

    // Bygg uppdateringsquery dynamiskt
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (firstName) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Inga fält att uppdatera.' });
    }

    values.push(id);
    const result = await db.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, created_at
    `, values);

    const user = result.rows[0];
    res.json({
      message: 'Användaren har uppdaterats.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Fel vid uppdatering av användare:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera användare.' });
  }
});

// ============================================
// DELETE /api/users/:id - Ta bort användare
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Förhindra att man tar bort sig själv
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: 'Du kan inte ta bort ditt eget konto.'
      });
    }

    // Kontrollera att användaren finns
    const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren hittades inte.' });
    }

    // Ta bort användarens bokningar först (foreign key constraint)
    await db.query('DELETE FROM bookings WHERE user_id = $1', [id]);

    // Ta bort användaren
    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Användaren har tagits bort.' });
  } catch (error) {
    console.error('Fel vid borttagning av användare:', error);
    res.status(500).json({ error: 'Kunde inte ta bort användare.' });
  }
});

// ============================================
// POST /api/users - Skapa ny användare (admin)
// ============================================
router.post('/', [
  body('email').isEmail().withMessage('Ogiltig e-postadress'),
  body('password').isLength({ min: 6 }).withMessage('Lösenord måste vara minst 6 tecken'),
  body('firstName').trim().notEmpty().withMessage('Förnamn krävs'),
  body('lastName').trim().notEmpty().withMessage('Efternamn krävs'),
  body('role').optional().isIn(['user', 'admin', 'superuser']).withMessage('Ogiltig roll'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Kontrollera om e-post redan används
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'E-postadressen används redan.' });
    }

    // Hasha lösenord
    const hashedPassword = await bcrypt.hash(password, 10);

    // Skapa användare
    const result = await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `, [email.toLowerCase(), hashedPassword, firstName, lastName, role]);

    const user = result.rows[0];
    res.status(201).json({
      message: 'Användaren har skapats.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Fel vid skapande av användare:', error);
    res.status(500).json({ error: 'Kunde inte skapa användare.' });
  }
});

module.exports = router;
