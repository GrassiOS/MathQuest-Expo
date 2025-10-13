# MathQuest Authentication Setup Guide

This guide will help you set up authentication for your MathQuest app using Supabase.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Expo CLI installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose your organization and project name
3. Set a database password (save this securely)
4. Choose a region close to your users
5. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. These will be used to configure the app

## Step 3: Configure Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **General**, configure:
   - **Site URL**: `exp://localhost:8081` (for development)
   - **Redirect URLs**: Add your app's redirect URLs
3. Under **Auth Providers**, ensure **Email** is enabled
4. Configure any additional settings as needed

## Step 4: Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace `your-project-id` and `your-anon-key-here` with your actual values from Step 2.

## Step 5: Update the Configuration

1. Open `Core/Services/AuthService/config.ts`
2. Replace the placeholder values with your actual Supabase credentials:

```typescript
export const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here',
};
```

## Step 6: Database Setup (Optional)

If you want to store additional user data:

1. Go to **Table Editor** in your Supabase dashboard
2. Create a `profiles` table with columns:
   - `id` (UUID, primary key, references auth.users)
   - `username` (text)
   - `avatar_url` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. Enable Row Level Security (RLS) and create policies as needed

## Step 7: Test the Authentication

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Open your app and test:
   - User registration
   - User login
   - Password reset
   - Logout

## Features Included

✅ **Login Screen** - Email and password authentication
✅ **Sign Up Screen** - User registration with username
✅ **Forgot Password** - Password reset functionality
✅ **Auth Guard** - Automatic route protection
✅ **User Profile** - Display user information and logout
✅ **Responsive Design** - Works on all screen sizes
✅ **Haptic Feedback** - Enhanced user experience
✅ **Form Validation** - Client-side validation
✅ **Error Handling** - User-friendly error messages

## Customization

### Styling
- All screens use the MathQuest design system
- Colors, fonts, and spacing can be customized in the component files
- The MQ logo is automatically displayed on all auth screens

### Additional Features
You can extend the authentication system by:
- Adding social login providers (Google, Apple, etc.)
- Implementing email verification
- Adding user profile management
- Creating admin roles and permissions

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your Supabase URL and anon key are correct
   - Ensure you're using the `anon` key, not the `service_role` key

2. **"Email not confirmed" error**
   - Check your Supabase email settings
   - Ensure email confirmation is properly configured

3. **Navigation issues**
   - Make sure all routes are properly defined in `app/_layout.tsx`
   - Check that the AuthGuard is properly configured

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Expo Router documentation](https://expo.github.io/router)
- Check the console for detailed error messages

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys
- Enable RLS (Row Level Security) on your database tables
- Use HTTPS in production

## Next Steps

After setting up authentication, you can:
1. Add user profile management
2. Implement social login
3. Add role-based access control
4. Create user onboarding flows
5. Add analytics and user tracking

Happy coding! 🚀
