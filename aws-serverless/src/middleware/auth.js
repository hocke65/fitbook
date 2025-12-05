import jwt from 'jsonwebtoken';
import { getItem, response } from '../lib/dynamodb.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Extract and verify JWT token from Authorization header
export const verifyToken = async (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: response(401, { error: 'No token provided' }) };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from database to ensure they still exist
    const user = await getItem(`USER#${decoded.userId}`, `USER#${decoded.userId}`);

    if (!user) {
      return { error: response(401, { error: 'User not found' }) };
    }

    return { user: formatUserResponse(user) };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: response(401, { error: 'Token expired' }) };
    }
    return { error: response(401, { error: 'Invalid token' }) };
  }
};

// Middleware wrapper for authenticated routes
export const withAuth = (handler) => async (event) => {
  const { user, error } = await verifyToken(event);
  if (error) return error;
  event.user = user;
  return handler(event);
};

// Middleware wrapper for admin-only routes
export const withAdmin = (handler) => async (event) => {
  const { user, error } = await verifyToken(event);
  if (error) return error;

  if (user.role !== 'admin') {
    return response(403, { error: 'Admin access required' });
  }

  event.user = user;
  return handler(event);
};

// Middleware wrapper for class manager routes (admin or superuser)
export const withClassManager = (handler) => async (event) => {
  const { user, error } = await verifyToken(event);
  if (error) return error;

  if (user.role !== 'admin' && user.role !== 'superuser') {
    return response(403, { error: 'Admin or superuser access required' });
  }

  event.user = user;
  return handler(event);
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Format user object for API response (remove sensitive fields)
export const formatUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
