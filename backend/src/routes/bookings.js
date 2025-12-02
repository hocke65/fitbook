const express = require('express');
const { param, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/bookings - Hämta användarens bokningar
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        b.id as booking_id,
        b.booked_at,
        b.status,
        c.id as class_id,
        c.title,
        c.description,
        c.scheduled_at,
        c.duration_minutes,
        c.instructor
      FROM bookings b
      JOIN classes c ON b.class_id = c.id
      WHERE b.user_id = $1
      ORDER BY c.scheduled_at ASC
    `, [req.user.id]);

    const bookings = result.rows.map(row => ({
      bookingId: row.booking_id,
      bookedAt: row.booked_at,
      status: row.status,
      class: {
        id: row.class_id,
        title: row.title,
        description: row.description,
        scheduledAt: row.scheduled_at,
        durationMinutes: row.duration_minutes,
        instructor: row.instructor,
      },
    }));

    res.json({ bookings });
  } catch (error) {
    console.error('Fel vid hämtning av bokningar:', error);
    res.status(500).json({ error: 'Serverfel vid hämtning av bokningar.' });
  }
});

// ============================================
// POST /api/bookings/:classId - Boka ett pass
// ============================================
router.post(
  '/:classId',
  authenticateToken,
  param('classId').isInt(),
  async (req, res) => {
    const client = await db.pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;
      const userId = req.user.id;

      await client.query('BEGIN');

      // Lås raden för att undvika race conditions
      const classResult = await client.query(`
        SELECT id, title, max_capacity, scheduled_at
        FROM classes
        WHERE id = $1
        FOR UPDATE
      `, [classId]);

      if (classResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Passet hittades inte.' });
      }

      // Hämta antal bokningar separat
      const bookingCountResult = await client.query(`
        SELECT COUNT(*) as booked_count
        FROM bookings
        WHERE class_id = $1 AND status = 'confirmed'
      `, [classId]);

      const classData = {
        ...classResult.rows[0],
        booked_count: bookingCountResult.rows[0].booked_count
      };

      // Kontrollera om passet redan har passerat
      if (new Date(classData.scheduled_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Kan inte boka pass som redan har varit.' });
      }

      // Kontrollera om det finns lediga platser
      const bookedCount = parseInt(classData.booked_count) || 0;
      if (bookedCount >= classData.max_capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Passet är fullbokat.' });
      }

      // Kontrollera om användaren redan har bokat detta pass
      const existingBooking = await client.query(
        `SELECT id, status FROM bookings WHERE user_id = $1 AND class_id = $2`,
        [userId, classId]
      );

      if (existingBooking.rows.length > 0) {
        const booking = existingBooking.rows[0];
        if (booking.status === 'confirmed') {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Du har redan bokat detta pass.' });
        }

        // Återaktivera avbokad bokning
        await client.query(
          `UPDATE bookings SET status = 'confirmed', booked_at = NOW() WHERE id = $1`,
          [booking.id]
        );
      } else {
        // Skapa ny bokning
        await client.query(
          `INSERT INTO bookings (user_id, class_id, status) VALUES ($1, $2, 'confirmed')`,
          [userId, classId]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: `Du har bokat "${classData.title}"!`,
        booking: {
          classId: parseInt(classId),
          title: classData.title,
          scheduledAt: classData.scheduled_at,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fel vid bokning:', error);
      res.status(500).json({ error: 'Serverfel vid bokning.' });
    } finally {
      client.release();
    }
  }
);

// ============================================
// DELETE /api/bookings/:classId - Avboka ett pass
// ============================================
router.delete(
  '/:classId',
  authenticateToken,
  param('classId').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;
      const userId = req.user.id;

      // Kontrollera att bokningen finns
      const booking = await db.query(
        `SELECT b.id, c.title, c.scheduled_at
         FROM bookings b
         JOIN classes c ON b.class_id = c.id
         WHERE b.user_id = $1 AND b.class_id = $2 AND b.status = 'confirmed'`,
        [userId, classId]
      );

      if (booking.rows.length === 0) {
        return res.status(404).json({ error: 'Bokningen hittades inte.' });
      }

      // Uppdatera bokning till avbokad
      await db.query(
        `UPDATE bookings SET status = 'cancelled' WHERE user_id = $1 AND class_id = $2`,
        [userId, classId]
      );

      res.json({
        message: `Du har avbokat "${booking.rows[0].title}".`,
      });
    } catch (error) {
      console.error('Fel vid avbokning:', error);
      res.status(500).json({ error: 'Serverfel vid avbokning.' });
    }
  }
);

// ============================================
// GET /api/bookings/class/:classId - Hämta alla bokningar för ett pass
// ============================================
router.get(
  '/class/:classId',
  authenticateToken,
  param('classId').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.params;

      // Hämta passinformation
      const classResult = await db.query('SELECT title FROM classes WHERE id = $1', [classId]);
      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Passet hittades inte.' });
      }

      // Hämta alla bokningar för passet
      const result = await db.query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          b.booked_at
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.class_id = $1 AND b.status = 'confirmed'
        ORDER BY b.booked_at ASC
      `, [classId]);

      res.json({
        className: classResult.rows[0].title,
        participants: result.rows.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          bookedAt: p.booked_at,
        })),
      });
    } catch (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      res.status(500).json({ error: 'Serverfel vid hämtning av bokningar.' });
    }
  }
);

module.exports = router;
