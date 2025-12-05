import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  getItem,
  putItem,
  queryGSI1,
  queryGSI2,
  response,
} from '../lib/dynamodb.js';
import { generateToken, formatUserResponse, verifyToken } from '../middleware/auth.js';

// POST /api/auth/login - Local email/password login
export const login = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return response(400, { error: 'Email and password are required' });
    }

    // Find user by email using GSI1
    const users = await queryGSI1(`EMAIL#${email.toLowerCase()}`);

    if (users.length === 0) {
      return response(401, { error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user has a password (local auth)
    if (!user.passwordHash) {
      return response(401, { error: 'This account uses Entra ID login' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return response(401, { error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = generateToken(user.id);

    return response(200, {
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

// POST /api/auth/entra-login - Microsoft Entra ID login
export const entraLogin = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { accessToken, account } = body;

    if (!accessToken || !account) {
      return response(400, { error: 'Access token and account info required' });
    }

    const { username, name, localAccountId } = account;

    if (!username || !localAccountId) {
      return response(400, { error: 'Invalid account information' });
    }

    const email = username.toLowerCase();

    // Check if user exists by Entra ID
    let users = await queryGSI2(`ENTRA#${localAccountId}`);
    let user = users[0];

    if (!user) {
      // Check if user exists by email (may have been created as local user)
      users = await queryGSI1(`EMAIL#${email}`);
      user = users[0];

      if (user) {
        // Update existing user with Entra ID info
        user.entraId = localAccountId;
        user.authProvider = 'entra';
        user.GSI2PK = `ENTRA#${localAccountId}`;
        user.GSI2SK = `USER#${user.id}`;
        user.updatedAt = new Date().toISOString();
        await putItem(user);
      } else {
        // Create new user from Entra ID
        const userId = uuidv4();
        const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ');
        const lastName = lastNameParts.join(' ') || '';
        const now = new Date().toISOString();

        user = {
          PK: `USER#${userId}`,
          SK: `USER#${userId}`,
          GSI1PK: `EMAIL#${email}`,
          GSI1SK: `USER#${userId}`,
          GSI2PK: `ENTRA#${localAccountId}`,
          GSI2SK: `USER#${userId}`,
          entityType: 'USER',
          id: userId,
          email,
          firstName,
          lastName,
          role: 'user',
          entraId: localAccountId,
          authProvider: 'entra',
          createdAt: now,
          updatedAt: now,
        };

        await putItem(user);
      }
    }

    // Generate JWT
    const token = generateToken(user.id);

    return response(200, {
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Entra login error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

// GET /api/auth/me - Get current user
export const getMe = async (event) => {
  try {
    const { user, error } = await verifyToken(event);
    if (error) return error;

    return response(200, { user });
  } catch (error) {
    console.error('Get me error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
