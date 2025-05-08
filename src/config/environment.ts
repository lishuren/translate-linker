
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
  apiProxyEnabled: boolean;
}

// Development environment configuration
const development: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we use the proxy in development
  isDevelopment: true,
  isProduction: false,
  appName: 'LingoAIO (Development)',
  version: '1.0.0-dev',
  backendPort: 5000,
  frontendPort: 8080,
  apiProxyEnabled: true
};

// Production environment configuration
const production: EnvironmentConfig = {
  apiBaseUrl: '', // Empty because we expect the backend to be on the same domain in production
  isDevelopment: false,
  isProduction: true,
  appName: 'LingoAIO',
  version: '1.0.0',
  backendPort: 5000, // In production, this should match your deployment setup
  frontendPort: 80,  // Standard HTTP port for production
  apiProxyEnabled: false
};

// Testing environment configuration
const testing: EnvironmentConfig = {
  ...development,
  appName: 'LingoAIO (Testing)',
  version: '1.0.0-test'
};

// Stage environment configuration
const staging: EnvironmentConfig = {
  ...production,
  appName: 'LingoAIO (Staging)',
  version: '1.0.0-staging'
};

// Determine the current environment
const isProduction = import.meta.env.MODE === 'production';
const mode = import.meta.env.MODE;

// Export the appropriate configuration based on the environment
let config: EnvironmentConfig;

switch(mode) {
  case 'production':
    config = production;
    break;
  case 'test':
    config = testing;
    break;
  case 'staging':
    config = staging;
    break;
  default:
    config = development;
}

export default config;
