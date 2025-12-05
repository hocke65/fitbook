import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  getItem,
  putItem,
  deleteItem,
  queryByPK,
  queryGSI1,
  scanByType,
  response,
} from '../lib/dynamodb.js';
import { withAdmin, formatUserResponse } from '../middleware/auth.js';

// GET /api/users - List all users (admin only)
export const getUsers = withAdmin(async (event) => {
  try {
    // Scan all users (acceptable for admin dashboard, small dataset)
    const users = await scanByType('USER');

    // Get booking counts for each user
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const bookings = await queryByPK(`USER#${user.id}`, 'BOOKING#');
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        return {
          ...formatUserResponse(user),
          bookingCount: confirmedBookings.length,
        };
      })
    );

    // Sort by created date (newest first)
    usersWithBookings.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return response(200, { users: usersWithBookings });
  } catch (error) {
    console.error('Get users error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// GET /api/users/:id - Get single user (admin only)
export const getUser = withAdmin(async (event) => {
  try {
    const userId = event.pathParameters?.id;

    if (!userId) {
      return response(400, { error: 'User ID is required' });
    }

    const user = await getItem(`USER#${userId}`, `USER#${userId}`);

    if (!user) {
      return response(404, { error: 'User not found' });
    }

    // Get booking count
    const bookings = await queryByPK(`USER#${userId}`, 'BOOKING#');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    return response(200, {
      ...formatUserResponse(user),
      bookingCount: confirmedBookings.length,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// POST /api/users - Create new user (admin only)
export const createUser = withAdmin(async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, firstName, lastName, role } = body;

    // Validation
    if (!email || !firstName || !lastName) {
      return response(400, { error: 'Email, firstName, and lastName are required' });
    }

    const validRoles = ['user', 'admin', 'superuser'];
    if (role && !validRoles.includes(role)) {
      return response(400, { error: 'Invalid role. Must be: user, admin, or superuser' });
    }

    const emailLower = email.toLowerCase();

    // Check if email already exists
    const existingUsers = await queryGSI1(`EMAIL#${emailLower}`);
    if (existingUsers.length > 0) {
      return response(400, { error: 'Email already exists' });
    }

    const userId = uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
      GSI1PK: `EMAIL#${emailLower}`,
      GSI1SK: `USER#${userId}`,
      entityType: 'USER',
      id: userId,
      email: emailLower,
      firstName,
      lastName,
      role: role || 'user',
      authProvider: 'local',
      createdAt: now,
      updatedAt: now,
    };

    // Hash password if provided
    if (password) {
      newUser.passwordHash = await bcrypt.hash(password, 10);
    }

    await putItem(newUser);

    return response(201, formatUserResponse(newUser));
  } catch (error) {
    console.error('Create user error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (admin only)
export const updateUser = withAdmin(async (event) => {
  try {
    const userId = event.pathParameters?.id;

    if (!userId) {
      return response(400, { error: 'User ID is required' });
    }

    const user = await getItem(`USER#${userId}`, `USER#${userId}`);

    if (!user) {
      return response(404, { error: 'User not found' });
    }

    const body = JSON.parse(event.body || '{}');
    const { email, password, firstName, lastName, role } = body;

    // Prevent self-demotion
    if (userId === event.user.id && role && role !== 'admin') {
      return response(400, { error: 'Cannot change your own admin role' });
    }

    // Validate role
    const validRoles = ['user', 'admin', 'superuser'];
    if (role && !validRoles.includes(role)) {
      return response(400, { error: 'Invalid role. Must be: user, admin, or superuser' });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role !== undefined) user.role = role;

    // Update email (need to update GSI1 as well)
    if (email !== undefined && email.toLowerCase() !== user.email) {
      const emailLower = email.toLowerCase();

      // Check if new email already exists
      const existingUsers = await queryGSI1(`EMAIL#${emailLower}`);
      if (existingUsers.length > 0) {
        return response(400, { error: 'Email already exists' });
      }

      user.email = emailLower;
      user.GSI1PK = `EMAIL#${emailLower}`;
    }

    // Update password if provided
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    user.updatedAt = new Date().toISOString();

    await putItem(user);

    return response(200, formatUserResponse(user));
  } catch (error) {
    console.error('Update user error:', error);
    return response(500, { error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
export const deleteUser = withAdmin(async (event) => {
  try {
    const userId = event.pathParameters?.id;

    if (!userId) {
      return response(400, { error: 'User ID is required' });
    }

    // Prevent self-deletion
    if (userId === event.user.id) {
      return response(400, { error: 'Cannot delete your own account' });
    }

    const user = await getItem(`USER#${userId}`, `USER#${userId}`);

    if (!user) {
      return response(404, { error: 'User not found' });
    }

    // Delete the user (bookings will be orphaned)
    await deleteItem(`USER#${userId}`, `USER#${userId}`);

    // Optionally delete user's bookings
    const bookings = await queryByPK(`USER#${userId}`, 'BOOKING#');
    await Promise.all(
      bookings.map(booking =>
        deleteItem(`USER#${userId}`, `BOOKING#${booking.classId}`)
      )
    );

    return response(200, { message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return response(500, { error: 'Internal server error' });
  }
});
