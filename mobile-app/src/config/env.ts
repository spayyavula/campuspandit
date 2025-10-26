/**
 * Environment Configuration
 * Update these values based on your environment
 */

// Check if running in development mode
const __DEV__ = process.env.NODE_ENV !== 'production';

export const ENV = {
  // Backend API URL
  // IMPORTANT: Replace YOUR_COMPUTER_IP with your actual IP address
  // Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
  API_URL: __DEV__
    ? 'http://192.168.1.47:8000/api/v1'  // Your computer's IP address
    : 'https://api.campuspandit.com/api/v1', // For production

  // Supabase Configuration
  // Get these from: https://app.supabase.com/project/_/settings/api
  SUPABASE_URL: 'https://ecnrvbyzbfhrorxwxkms.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnJ2Ynl6YmZocm9yeHd4a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDUwMzQsImV4cCI6MjA2NjE4MTAzNH0.hknG5yowBpViyiTN_ftY_WQ8RL8SJfrGClGdBEvx98U',
};

/**
 * DEVELOPMENT SETUP INSTRUCTIONS:
 *
 * 1. Find your computer's IP address:
 *    Windows: Run 'ipconfig' → Look for "IPv4 Address" under WiFi adapter
 *    Mac/Linux: Run 'ifconfig' → Look for "inet" under en0
 *
 * 2. Update API_URL above:
 *    Example: 'http://192.168.1.100:8000/api/v1'
 *
 * 3. Make sure:
 *    - Your FastAPI backend is running on port 8000
 *    - Your phone and computer are on the same WiFi network
 *
 * 4. For Supabase:
 *    - Sign up at https://supabase.com
 *    - Create a new project
 *    - Copy URL and anon key from Settings → API
 */
