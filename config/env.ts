import {
  OPENAI_API_KEY,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  NODE_ENV,
} from '@env';

// Environment configuration
export const ENV_CONFIG = {
  // API Keys
  OPENAI_API_KEY: OPENAI_API_KEY || '',
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: FIREBASE_API_KEY || '',
    AUTH_DOMAIN: FIREBASE_AUTH_DOMAIN || '',
    PROJECT_ID: FIREBASE_PROJECT_ID || '',
    STORAGE_BUCKET: FIREBASE_STORAGE_BUCKET || '',
    MESSAGING_SENDER_ID: FIREBASE_MESSAGING_SENDER_ID || '',
    APP_ID: FIREBASE_APP_ID || '',
    MEASUREMENT_ID: FIREBASE_MEASUREMENT_ID || '',
  },
  
  // Environment
  NODE_ENV: NODE_ENV || 'development',
  
  // Helper functions
  isDevelopment: () => NODE_ENV === 'development',
  isProduction: () => NODE_ENV === 'production',
  
  // Validation
  validateApiKeys: () => {
    const missingKeys = [];
    
    if (!OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY');
    if (!FIREBASE_API_KEY) missingKeys.push('FIREBASE_API_KEY');
    if (!FIREBASE_PROJECT_ID) missingKeys.push('FIREBASE_PROJECT_ID');
    
    if (missingKeys.length > 0) {
      console.warn(`Missing environment variables: ${missingKeys.join(', ')}`);
      return false;
    }
    
    return true;
  },
};

// Export individual values for convenience
export const OPENAI_API_KEY_CONFIG = ENV_CONFIG.OPENAI_API_KEY;
export const FIREBASE_CONFIG = ENV_CONFIG.FIREBASE; 