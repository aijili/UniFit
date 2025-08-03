import { ENV_CONFIG, OPENAI_API_KEY_CONFIG } from '../config/env';

// Example: Using the API key in your application
export const useOpenAI = () => {
  const apiKey = OPENAI_API_KEY_CONFIG;
  
  if (!apiKey) {
    console.error('OpenAI API key is not configured');
    return null;
  }
  
  // Example API call
  const makeApiCall = async (prompt: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };
  
  return { makeApiCall };
};

// Example: Validating environment on app startup
export const validateEnvironment = () => {
  const isValid = ENV_CONFIG.validateApiKeys();
  
  if (!isValid) {
    console.warn('Some API keys are missing. Check your .env file.');
  }
  
  return isValid;
};

// Example: Using environment-specific configuration
export const getApiEndpoint = () => {
  if (ENV_CONFIG.isDevelopment()) {
    return 'https://api.openai.com/v1/chat/completions';
  } else {
    return 'https://api.openai.com/v1/chat/completions'; // Production endpoint
  }
}; 