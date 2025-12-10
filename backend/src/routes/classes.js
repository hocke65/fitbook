const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireClassManager } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/classes - Hämta alla träningspass
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.max_capacity,
        c.scheduled_at,
        c.duration_minutes,
        c.instructor,
        c.created_at,
        COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as booked_count
      FROM classes c
      LEFT JOIN bookings b ON c.id = b.class_id
      WHERE c.scheduled_at > NOW()
      GROUP BY c.id
      ORDER BY c.scheduled_at ASC
    `);

    const classes = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      maxCapacity: row.max_capacity,
      scheduledAt: row.scheduled_at,
      durationMinutes: row.duration_minutes,
      instructor: row.instructor,
      createdAt: row.created_at,
      bookedCount: parseInt(row.booked_count) || 0,
      availableSpots: row.max_capacity - (parseInt(row.booked_count) || 0),
    }));

    res.json({ classes });
  } catch (error) {
    console.error('Fel vid hämtning av pass:', error);
    res.status(500).json({ error: 'Serverfel vid hämtning av pass.' });
  }
});

// ============================================
// GET /api/classes/:id - Hämta ett specifikt pass
// ============================================
router.get('/:id', param('id').isInt(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Hämta pass
    const classResult = await db.query(`
      SELECT
        c.*,
        COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as booked_count
      FROM classes c
      LEFT JOIN bookings b ON c.id = b.class_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Passet hittades inte.' });
    }

    const classData = classResult.rows[0];

    // Hämta bokade användare
    const bookingsResult = await db.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        b.booked_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.class_id = $1 AND b.status = 'confirmed'
      ORDER BY b.booked_at ASC
    `, [id]);

    res.json({
      class: {
        id: classData.id,
        title: classData.title,
        description: classData.description,
        maxCapacity: classData.max_capacity,
        scheduledAt: classData.scheduled_at,
        durationMinutes: classData.duration_minutes,
        instructor: classData.instructor,
        createdAt: classData.created_at,
        bookedCount: parseInt(classData.booked_count) || 0,
        availableSpots: classData.max_capacity - (parseInt(classData.booked_count) || 0),
      },
      participants: bookingsResult.rows.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        bookedAt: p.booked_at,
      })),
    });
  } catch (error) {
    console.error('Fel vid hämtning av pass:', error);
    res.status(500).json({ error: 'Serverfel vid hämtning av pass.' });
  }
});

// ============================================
// POST /api/classes - Skapa nytt pass (Admin/Superuser)
// Stödjer även skapande av flera pass på olika dagar via additionalDates
// ============================================
router.post(
  '/',
  authenticateToken,
  requireClassManager,
  [
    body('title').trim().notEmpty().withMessage('Titel krävs'),
    body('description').trim().optional(),
    body('maxCapacity')
      .isInt({ min: 1 })
      .withMessage('Antal platser måste vara minst 1'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Ogiltigt datumformat'),
    body('durationMinutes')
      .optional()
      .isInt({ min: 15 })
      .withMessage('Längd måste vara minst 15 minuter'),
    body('instructor').trim().optional(),
    body('additionalDates')
      .optional()
      .isArray()
      .withMessage('additionalDates måste vara en array'),
    body('additionalDates.*')
      .optional()
      .isISO8601()
      .withMessage('Ogiltigt datumformat i additionalDates'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        maxCapacity,
        scheduledAt,
        durationMinutes = 60,
        instructor,
        additionalDates = []
      } = req.body;

      // Samla alla datum (primärt + extra)
      const allDates = [scheduledAt, ...additionalDates];
      const createdClasses = [];

      // Skapa ett pass för varje datum
      for (const date of allDates) {
        const result = await db.query(
          `INSERT INTO classes (title, description, max_capacity, scheduled_at, duration_minutes, instructor, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [title, description, maxCapacity, date, durationMinutes, instructor, req.user.id]
        );

        const newClass = result.rows[0];
        createdClasses.push({
          id: newClass.id,
          title: newClass.title,
          description: newClass.description,
          maxCapacity: newClass.max_capacity,
          scheduledAt: newClass.scheduled_at,
          durationMinutes: newClass.duration_minutes,
          instructor: newClass.instructor,
          createdAt: newClass.created_at,
          bookedCount: 0,
          availableSpots: newClass.max_capacity,
        });
      }

      // Returnera svar baserat på antal skapade pass
      if (createdClasses.length === 1) {
        res.status(201).json({
          message: 'Pass skapat!',
          class: createdClasses[0],
        });
      } else {
        res.status(201).json({
          message: `${createdClasses.length} pass skapade!`,
          classes: createdClasses,
        });
      }
    } catch (error) {
      console.error('Fel vid skapande av pass:', error);
      res.status(500).json({ error: 'Serverfel vid skapande av pass.' });
    }
  }
);

// ============================================
// PUT /api/classes/:id - Uppdatera pass (Admin/Superuser)
// ============================================
router.put(
  '/:id',
  authenticateToken,
  requireClassManager,
  [
    param('id').isInt(),
    body('title').trim().optional(),
    body('description').trim().optional(),
    body('maxCapacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Antal platser måste vara minst 1'),
    body('scheduledAt')
      .optional()
      .isISO8601()
      .withMessage('Ogiltigt datumformat'),
    body('durationMinutes')
      .optional()
      .isInt({ min: 15 })
      .withMessage('Längd måste vara minst 15 minuter'),
    body('instructor').trim().optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, maxCapacity, scheduledAt, durationMinutes, instructor } = req.body;

      // Kontrollera att passet finns
      const existingClass = await db.query('SELECT * FROM classes WHERE id = $1', [id]);
      if (existingClass.rows.length === 0) {
        return res.status(404).json({ error: 'Passet hittades inte.' });
      }

      // Om maxCapacity ändras, kontrollera att det inte understiger nuvarande bokningar
      if (maxCapacity) {
        const bookingCount = await db.query(
          `SELECT COUNT(*) FROM bookings WHERE class_id = $1 AND status = 'confirmed'`,
          [id]
        );
        if (parseInt(bookingCount.rows[0].count) > maxCapacity) {
          return res.status(400).json({
            error: `Kan inte minska till ${maxCapacity} platser. Det finns ${bookingCount.rows[0].count} bokningar.`
          });
        }
      }

      const result = await db.query(
        `UPDATE classes SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          max_capacity = COALESCE($3, max_capacity),
          scheduled_at = COALESCE($4, scheduled_at),
          duration_minutes = COALESCE($5, duration_minutes),
          instructor = COALESCE($6, instructor)
         WHERE id = $7
         RETURNING *`,
        [title, description, maxCapacity, scheduledAt, durationMinutes, instructor, id]
      );

      const updatedClass = result.rows[0];

      res.json({
        message: 'Pass uppdaterat!',
        class: {
          id: updatedClass.id,
          title: updatedClass.title,
          description: updatedClass.description,
          maxCapacity: updatedClass.max_capacity,
          scheduledAt: updatedClass.scheduled_at,
          durationMinutes: updatedClass.duration_minutes,
          instructor: updatedClass.instructor,
        },
      });
    } catch (error) {
      console.error('Fel vid uppdatering av pass:', error);
      res.status(500).json({ error: 'Serverfel vid uppdatering av pass.' });
    }
  }
);

// ============================================
// DELETE /api/classes/:id - Ta bort pass (Admin/Superuser)
// ============================================
router.delete(
  '/:id',
  authenticateToken,
  requireClassManager,
  param('id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM classes WHERE id = $1 RETURNING id, title',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Passet hittades inte.' });
      }

      res.json({
        message: `Passet "${result.rows[0].title}" har tagits bort.`,
      });
    } catch (error) {
      console.error('Fel vid borttagning av pass:', error);
      res.status(500).json({ error: 'Serverfel vid borttagning av pass.' });
    }
  }
);

module.exports = router;
