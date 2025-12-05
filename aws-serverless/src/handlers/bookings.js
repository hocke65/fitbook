import {
  getItem,
  putItem,
  queryByPK,
  queryGSI1,
  transactWrite,
  response,
} from '../lib/dynamodb.js';
import { withAuth, verifyToken } from '../middleware/auth.js';

// Helper to count confirmed bookings for a class
const getBookingCount = async (classId) => {
  const bookings = await queryGSI1(`CLASS#${classId}`, 'BOOKING#');
  return bookings.filter(b => b.status === 'confirmed').length;
};

// GET /api/bookings - Get current user's bookings
export const getBookings = withAuth(async (event) => {
  try {
    const userId = event.user.id;

    // Query all bookings for this user
    const bookings = await queryByPK(`USER#${userId}`, 'BOOKING#');

    // Get class details for each booking
    const bookingsWithClasses = await Promise.all(
      bookings.map(async (booking) => {
        const cls = await getItem(`CLASS#${booking.classId}`, `CLASS#${booking.classId}`);
        return {
          id: booking.id,
          classId: booking.classId,
          bookedAt: booking.bookedAt,
          status: booking.status,
          class: cls ? {
            id: cls.id,
            title: cls.title,
            description: cls.description,
            scheduledAt: cls.scheduledAt,
            durationMinutes: cls.durationMinutes,
            instructor: cls.instructor,
          } : null,
        };
      })
    );

    // Filter out bookings with deleted classes and sort by class date
    const validBookings = bookingsWithClasses
      .filter(b => b.class !== null)
      .sort((a, b) => new Date(a.class.scheduledAt) - new Date(b.class.scheduledAt));

    return response(200, { bookings: validBookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// POST /api/bookings/:classId - Book a class
export const createBooking = withAuth(async (event) => {
  try {
    const classId = event.pathParameters?.classId;
    const userId = event.user.id;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    // Get the class
    const cls = await getItem(`CLASS#${classId}`, `CLASS#${classId}`);

    if (!cls) {
      return response(404, { error: 'Class not found' });
    }

    // Check if class is in the past
    if (new Date(cls.scheduledAt) < new Date()) {
      return response(400, { error: 'Cannot book a class that has already started' });
    }

    // Check for existing booking
    const existingBooking = await getItem(`USER#${userId}`, `BOOKING#${classId}`);

    if (existingBooking) {
      if (existingBooking.status === 'confirmed') {
        return response(400, { error: 'You have already booked this class' });
      }

      // Reactivate cancelled booking
      const currentCount = await getBookingCount(classId);

      if (currentCount >= cls.maxCapacity) {
        return response(400, { error: 'Class is full' });
      }

      existingBooking.status = 'confirmed';
      existingBooking.bookedAt = new Date().toISOString();
      await putItem(existingBooking);

      return response(200, {
        message: 'Booking reactivated',
        booking: {
          id: existingBooking.id,
          classId,
          bookedAt: existingBooking.bookedAt,
          status: existingBooking.status,
        },
      });
    }

    // Check capacity
    const currentCount = await getBookingCount(classId);

    if (currentCount >= cls.maxCapacity) {
      return response(400, { error: 'Class is full' });
    }

    // Create new booking
    const now = new Date().toISOString();
    const bookingId = `${userId}-${classId}`;

    const newBooking = {
      PK: `USER#${userId}`,
      SK: `BOOKING#${classId}`,
      GSI1PK: `CLASS#${classId}`,
      GSI1SK: `BOOKING#${userId}`,
      entityType: 'BOOKING',
      id: bookingId,
      userId,
      classId,
      bookedAt: now,
      status: 'confirmed',
    };

    await putItem(newBooking);

    return response(201, {
      message: 'Booking successful',
      booking: {
        id: bookingId,
        classId,
        bookedAt: now,
        status: 'confirmed',
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// DELETE /api/bookings/:classId - Cancel booking
export const cancelBooking = withAuth(async (event) => {
  try {
    const classId = event.pathParameters?.classId;
    const userId = event.user.id;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    // Get existing booking
    const booking = await getItem(`USER#${userId}`, `BOOKING#${classId}`);

    if (!booking) {
      return response(404, { error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return response(400, { error: 'Booking is already cancelled' });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    await putItem(booking);

    return response(200, { message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// GET /api/bookings/class/:classId - Get participants for a class
export const getClassParticipants = async (event) => {
  try {
    // Verify token (optional auth for this endpoint)
    const { user, error } = await verifyToken(event);
    if (error) return error;

    const classId = event.pathParameters?.classId;

    if (!classId) {
      return response(400, { error: 'Class ID is required' });
    }

    // Get the class
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
        const participant = await getItem(`USER#${booking.userId}`, `USER#${booking.userId}`);
        return participant ? {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          bookedAt: booking.bookedAt,
        } : null;
      })
    );

    return response(200, {
      classId,
      title: cls.title,
      scheduledAt: cls.scheduledAt,
      maxCapacity: cls.maxCapacity,
      confirmedCount: confirmedBookings.length,
      participants: participants.filter(Boolean),
    });
  } catch (error) {
    console.error('Get class participants error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
