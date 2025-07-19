# Google OAuth Setup for Replit

## Fixing iframe Restrictions & Redirect URI Issues

When using Google OAuth with Supabase on Replit, you may encounter two main issues:
1. **iframe Restrictions**: Google blocks authentication inside iframes for security
2. **Redirect URI Mismatch**: URIs in Google Console don't match your Replit domain

This guide addresses both issues with popup-based authentication.

### Required Redirect URIs

Add these URIs to your Google Cloud Console OAuth2 client credentials:

#### For Supabase OAuth (Primary) - REQUIRED
```
https://valkgbmvpbcxlrunffpu.supabase.co/auth/v1/callback
```

**This is the ONLY redirect URI you need for this project's Google OAuth to work.**

#### For Replit Development (Secondary)
```
https://[your-replit-username].[your-replit-project-name].repl.co/auth/callback
https://[your-replit-username].[your-replit-project-name].repl.co/__auth/handler
https://[your-replit-username].[your-replit-project-name].repl.co/dashboard
```

#### Current Replit URL Format
For this project, your URL should be:
```
https://[your-username].i-love-making-pdf.repl.co/auth/callback
https://[your-username].i-love-making-pdf.repl.co/__auth/handler
https://[your-username].i-love-making-pdf.repl.co/dashboard
```

#### For Local Development (Optional)
```
http://localhost:3000/auth/callback
http://localhost:5000/auth/callback
```

### Step-by-Step Setup

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project or create a new one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: Web application

4. **Configure Authorized Redirect URIs**
   - Add the Supabase callback URL (most important)
   - Add your Replit domain callback URLs
   - Save the configuration

5. **Copy Client Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your Supabase project settings

### Finding Your URLs

#### Supabase Project Reference
- Go to your Supabase dashboard
- Project Settings > General
- Your URL will be: `https://[project-ref].supabase.co`

#### Replit Domain
- Your Replit domain format: `https://[username].[project-name].repl.co`
- Replace spaces with hyphens in project names
- Use lowercase only

### Example Configuration

If your Supabase project ref is `abcdefghij` and your Replit URL is `https://myusername.my-pdf-app.repl.co`, add these URIs:

```
https://abcdefghij.supabase.co/auth/v1/callback
https://myusername.my-pdf-app.repl.co/auth/callback
https://myusername.my-pdf-app.repl.co/__auth/handler
```

### Testing

After configuration:
1. Clear browser cache and cookies
2. Try the OAuth login
3. Check browser console for any remaining errors
4. Verify the redirect works properly

### Common Issues & Solutions

- **Access token in URL not processed**: User sees tokens in URL but isn't logged in
  - Solution: App now automatically processes URL hash parameters and sets session
  - The auth hook checks for #access_token= and #refresh_token= on page load

- **redirect_uri_mismatch**: URI not added to Google Console  
  - Solution: Add all required URIs to Google Cloud Console
  - Make sure to include your Replit domain without any callback path

- **Session not persisting**: User gets logged out on page refresh
  - Solution: App now saves session to localStorage with 24-hour expiration
  - Session is restored automatically when user returns

- **iframe blocking**: "accounts.google.com refused to connect"
  - Solution: App uses redirect-based authentication instead of popup
  - OAuth opens in same window and redirects back after authentication

- **invalid_client**: Wrong Client ID or Secret
  - Solution: Verify credentials in Supabase settings

- **access_denied**: User cancelled or permissions issue
  - Solution: Ensure proper OAuth scopes are configured

### Environment Variables

Make sure these are set in your Replit secrets:
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```