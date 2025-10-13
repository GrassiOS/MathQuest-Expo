// Supabase Configuration
// Replace these with your actual Supabase project credentials

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE',
};

// Example configuration:
// export const SUPABASE_CONFIG = {
//   url: 'https://your-project-id.supabase.co',
//   anonKey: 'your-anon-key-here',
// };
