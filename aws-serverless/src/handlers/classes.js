import { v4 as uuidv4 } from 'uuid';
import {
  getItem,
  putItem,
  deleteItem,
  queryGSI1,
  queryGSI1GreaterThan,
  response,
} from '../lib/dynamodb.js';
import { withClassManager } from '../middleware/auth.js';

// Helper to count confirmed bookings for a class
const getBookingCount = async (classId) => {
  const bookings = await queryGSI1(`CLASS#${classId}`, 'BOOKING#');
  return bookings.filter(b => b.status === 'confirmed').length;
};

// Format class for API response
const formatClassResponse = (cls, bookingCount = 0) => ({
  id: cls.id,
  title: cls.title,
  description: cls.description,
  maxCapacity: cls.maxCapacity,
  scheduledAt: cls.scheduledAt,
  durationMinutes: cls.durationMinutes,
  instructor: cls.instructor,
  createdBy: cls.createdBy,
  createdAt: cls.createdAt,
  updatedAt: cls.updatedAt,
  confirmedBookings: bookingCount,
  availableSpots: cls.maxCapacity - bookingCount,
});

// GET /api/classes - List all future classes
export const getClasses = async (event) => {
  try {
    const now = new Date().toISOString();

    // Query GSI1 for all classes scheduled after now
    const classes = await queryGSI1GreaterThan('CLASSES', now);

    // Get booking counts for all classes
    const classesWithBookings = await Promise.all(
      classes.map(async (cls) => {
        const bookingCount = await getBookingCount(cls.id);
        return formatClassResponse(cls, bookingCount);
      })
    );

    // Sort by scheduled time
    classesWithBookings.sort((a, b) =>
      new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );

    return response(200, { classes: classesWithBookings });
  } catch (error) {
    console.error('Get classes error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

// GET /api/classes/:id - Get single class with participants
export const getClass = async (event) => {
  try {
    const classId = event.pathParameters?.id;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    const cls = await getItem(`CLASS#${classId}`, `CLASS#${classId}`);

    if (!cls) {
      return response(404, { error: 'Class not found' });
    }

    // Get bookings for this class
    const bookings = await queryGSI1(`CLASS#${classId}`, 'BOOKING#');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    // Get user details for participants
    const participants = await Promise.all(
      confirmedBookings.map(async (booking) => {
        const user = await getItem(`USER#${booking.userId}`, `USER#${booking.userId}`);
        return user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          bookedAt: booking.bookedAt,
        } : null;
      })
    );

    return response(200, {
      ...formatClassResponse(cls, confirmedBookings.length),
      participants: participants.filter(Boolean),
    });
  } catch (error) {
    console.error('Get class error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

// POST /api/classes - Create new class (admin/superuser only)
export const createClass = withClassManager(async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, maxCapacity, scheduledAt, durationMinutes, instructor } = body;

    // Validation
    if (!title || !maxCapacity || !scheduledAt) {
      return response(400, { error: 'Title, maxCapacity, and scheduledAt are required' });
    }

    if (maxCapacity <= 0) {
      return response(400, { error: 'Max capacity must be greater than 0' });
    }

    const classId = uuidv4();
    const now = new Date().toISOString();
    const scheduledAtISO = new Date(scheduledAt).toISOString();

    const newClass = {
      PK: `CLASS#${classId}`,
      SK: `CLASS#${classId}`,
      GSI1PK: 'CLASSES',
      GSI1SK: `${scheduledAtISO}#${classId}`,
      entityType: 'CLASS',
      id: classId,
      title,
      description: description || '',
      maxCapacity,
      scheduledAt: scheduledAtISO,
      durationMinutes: durationMinutes || 60,
      instructor: instructor || '',
      createdBy: event.user.id,
      createdAt: now,
      updatedAt: now,
    };

    await putItem(newClass);

    return response(201, formatClassResponse(newClass, 0));
  } catch (error) {
    console.error('Create class error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// PUT /api/classes/:id - Update class (admin/superuser only)
export const updateClass = withClassManager(async (event) => {
  try {
    const classId = event.pathParameters?.id;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    const cls = await getItem(`CLASS#${classId}`, `CLASS#${classId}`);

    if (!cls) {
      return response(404, { error: 'Class not found' });
    }

    const body = JSON.parse(event.body || '{}');
    const { title, description, maxCapacity, scheduledAt, durationMinutes, instructor } = body;

    // Update fields
    if (title !== undefined) cls.title = title;
    if (description !== undefined) cls.description = description;
    if (maxCapacity !== undefined) {
      if (maxCapacity <= 0) {
        return response(400, { error: 'Max capacity must be greater than 0' });
      }
      cls.maxCapacity = maxCapacity;
    }
    if (scheduledAt !== undefined) {
      const scheduledAtISO = new Date(scheduledAt).toISOString();
      cls.scheduledAt = scheduledAtISO;
      cls.GSI1SK = `${scheduledAtISO}#${classId}`;
    }
    if (durationMinutes !== undefined) cls.durationMinutes = durationMinutes;
    if (instructor !== undefined) cls.instructor = instructor;

    cls.updatedAt = new Date().toISOString();

    await putItem(cls);

    const bookingCount = await getBookingCount(classId);
    return response(200, formatClassResponse(cls, bookingCount));
  } catch (error) {
    console.error('Update class error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// DELETE /api/classes/:id - Delete class (admin/superuser only)
export const deleteClass = withClassManager(async (event) => {
  try {
    const classId = event.pathParameters?.id;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    const cls = await getItem(`CLASS#${classId}`, `CLASS#${classId}`);

    if (!cls) {
      return response(404, { error: 'Class not found' });
    }

    // Delete the class (bookings will be orphaned but that's acceptable for this use case)
    await deleteItem(`CLASS#${classId}`, `CLASS#${classId}`);

    return response(200, { message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    return response(500, { error: 'Internal server error' });
  }
});
