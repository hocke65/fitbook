import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../config/msalConfig';

// Shared MSAL instance for use outside React components
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
let msalInitialized = false;
export const initializeMsal = async () => {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;

    // Set active account if available
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }
  return msalInstance;
};

// Get access token for API calls
export const getAccessToken = async () => {
  await initializeMsal();

  let account = msalInstance.getActiveAccount();

  // If no active account, try to get the first available account
  if (!account) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      account = accounts[0];
      msalInstance.setActiveAccount(account);
    }
  }

  if (!account) {
    console.log('No MSAL account found');
    return null;
  }

  try {
    // Request token with the client ID as audience (for API Gateway validation)
    const response = await msalInstance.acquireTokenSilent({
      scopes: ['openid', 'profile', 'email'],
      account,
    });

    console.log('Got ID token, aud:', parseJwt(response.idToken)?.aud);
    // Return the ID token (has client ID as audience)
    return response.idToken;
  } catch (error) {
    console.error('Failed to acquire token silently:', error);
    return null;
  }
};

// Helper to decode JWT for debugging
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
}
