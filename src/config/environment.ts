
export interface EnvironmentConfig {
  apiBaseUrl: string;
  apiProxyEnabled: boolean;
  applicationEnv: string;
  defaultLanguage: string;
  debug: boolean;
}

const getEnvironment = (): EnvironmentConfig => {
  // Access environment variables through import.meta.env in Vite
  const isProd = import.meta.env.PROD;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  // Debug mode - default to true in non-prod environments
  const debug = import.meta.env.VITE_DEBUG === 'true' || !isProd;
  
  return {
    apiBaseUrl,
    apiProxyEnabled: true, // Use API proxy in all environments
    applicationEnv: isProd ? 'production' : 'development',
    defaultLanguage: 'en',
    debug
  };
};

const config = getEnvironment();

export default config;
