
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
  backendPort: number;
  frontendPort: number;
}

const development: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we use the proxy in development
  isDevelopment: true,
  isProduction: false,
  appName: 'LingoAIO (Development)',
  version: '1.0.0-dev',
  backendPort: 5000,
  frontendPort: 8080
};

const production: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we expect the backend to be on the same domain in production
  isDevelopment: false,
  isProduction: true,
  appName: 'LingoAIO',
  version: '1.0.0',
  backendPort: 5000, // In production, this should match your deployment setup
  frontendPort: 80    // Standard HTTP port for production
};

// Determine the current environment
const isProduction = import.meta.env.MODE === 'production';

// Export the appropriate configuration
const config: EnvironmentConfig = isProduction ? production : development;

export default config;
