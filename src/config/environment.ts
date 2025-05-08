
/**
 * Environment configuration for the application
 * 
 * In development mode:
 * - API calls are proxied to the backend server running on port 5000
 * 
 * In production mode:
 * - API calls are made to the same host as the frontend (usually deployed together)
 */

interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  appName: string;
  version: string;
}

const development: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we use the proxy in development
  isDevelopment: true,
  isProduction: false,
  appName: 'LingoAIO (Development)',
  version: '1.0.0-dev',
};

const production: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we expect the backend to be on the same domain in production
  isDevelopment: false,
  isProduction: true,
  appName: 'LingoAIO',
  version: '1.0.0',
};

// Determine the current environment
const isProduction = import.meta.env.MODE === 'production';

// Export the appropriate configuration
const config: EnvironmentConfig = isProduction ? production : development;

export default config;
