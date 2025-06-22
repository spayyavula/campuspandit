// Environment configuration with type safety and validation

interface AppConfig {
  app: {
    title: string;
    version: string;
    environment: 'development' | 'production' | 'local';
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    gaming: boolean;
    offlineMode: boolean;
    pwaPrompts: boolean;
    competitiveExams: boolean;
    debugMode?: boolean;
    performanceMetrics?: boolean;
  };
  platform: {
    supportedBoards: string[];
    defaultBoard: string;
    defaultSubject: string;
    maxLessonDuration: number;
  };
  external: {
    analyticsId?: string;
    sentryDsn?: string;
  };
  development?: {
    useMockData?: boolean;
    mockUserId?: string;
  };
}

// Helper function to parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper function to parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to parse array environment variables
const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

// Validate environment
const validateEnvironment = (): void => {
  const requiredVars = [
    'VITE_APP_TITLE',
    'VITE_API_BASE_URL'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
  }

  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl && !apiUrl.startsWith('http')) {
    console.warn('VITE_API_BASE_URL should start with http:// or https://');
  }
};

// Create configuration object
export const config: AppConfig = {
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'CampusPandit',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.VITE_APP_ENVIRONMENT as AppConfig['app']['environment']) || 'development'
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 10000)
  },
  features: {
    gaming: parseBoolean(import.meta.env.VITE_ENABLE_GAMING, true),
    offlineMode: parseBoolean(import.meta.env.VITE_ENABLE_OFFLINE_MODE, true),
    pwaPrompts: parseBoolean(import.meta.env.VITE_ENABLE_PWA_PROMPTS, true),
    competitiveExams: parseBoolean(import.meta.env.VITE_ENABLE_COMPETITIVE_EXAMS, true),
    debugMode: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG_MODE),
    performanceMetrics: parseBoolean(import.meta.env.VITE_SHOW_PERFORMANCE_METRICS)
  },
  platform: {
    supportedBoards: parseArray(import.meta.env.VITE_SUPPORTED_BOARDS, ['cbse', 'cambridge', 'ib', 'isc']),
    defaultBoard: import.meta.env.VITE_DEFAULT_BOARD || 'cbse',
    defaultSubject: import.meta.env.VITE_DEFAULT_SUBJECT || 'physics',
    maxLessonDuration: parseNumber(import.meta.env.VITE_MAX_LESSON_DURATION, 60)
  },
  external: {
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN
  },
  development: {
    useMockData: parseBoolean(import.meta.env.VITE_USE_MOCK_DATA),
    mockUserId: import.meta.env.VITE_MOCK_USER_ID
  }
};

// Validate configuration on module load
validateEnvironment();

// Export individual config sections for convenience
export const { app, api, features, platform, external, development } = config;

// Helper functions for common use cases
export const isProduction = () => config.app.environment === 'production';
export const isDevelopment = () => config.app.environment === 'development';
export const isLocal = () => config.app.environment === 'local';

// API URL builder
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = config.api.baseUrl.endsWith('/') 
    ? config.api.baseUrl.slice(0, -1) 
    : config.api.baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Feature flag checker
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature] === true;
};

// Debug logger that only works in development
export const debugLog = (...args: any[]): void => {
  if (config.features.debugMode || isDevelopment()) {
    console.log('[CampusPandit Debug]', ...args);
  }
};

// Performance measurement helper
export const measurePerformance = (name: string, fn: () => void): void => {
  if (config.features.performanceMetrics) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${end - start}ms`);
  } else {
    fn();
  }
};

export default config;