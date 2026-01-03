# OTPless Authentication Integration

This document explains how OTPless authentication has been integrated into the Pet Visit application.

## Overview

OTPless provides passwordless authentication through multiple channels including:
- SMS OTP
- WhatsApp OTP
- Email OTP
- Social OAuth (Google, Facebook, etc.)

## Configuration

### Environment Variables

The following environment variables have been configured in `.env`:

```env
VITE_OTPLESS_APP_ID=UII0ZUAOTF602N9LX2IF
VITE_OTPLESS_CLIENT_ID=TE3OPBSYQUO82S936F0RT1OE6IAOYOSC
VITE_OTPLESS_CLIENT_SECRET=ye6snbu3a48fux2bp69mlz4t3tev4r5f
```

### SDK Integration

The OTPless SDK script has been added to `index.html`:

```html
<script
    id="otpless-sdk"
    type="text/javascript"
    src="https://otpless.com/v4/auth.js"
    data-appid="UII0ZUAOTF602N9LX2IF"
></script>
```

## Implementation

### LoginWithOTP Component

The `pages/LoginWithOTP.tsx` component has been updated to use OTPless pre-built UI:

1. **OTPless Container**: A div with id `otpless-login-page` renders the authentication widget
2. **Callback Handler**: The `window.otpless` callback function processes authentication responses
3. **User Storage**: Authenticated user data is stored in localStorage
4. **Loading State**: Shows a loading spinner while the SDK initializes

### Type Definitions

TypeScript types for OTPless are defined in `types/otpless.d.ts`:

```typescript
interface OTPlessUser {
  token: string;
  userId: string;
  timestamp: string;
  mobile?: {
    name?: string;
    number: string;
    verified: boolean;
  };
  email?: {
    email: string;
    name?: string;
    verified: boolean;
  };
  waName?: string;
  waNumber?: string;
}
```

### Utility Functions

Helper functions are available in `utils/otpless.ts`:

- `getStoredOTPlessUser()`: Retrieve stored user data
- `clearOTPlessUser()`: Clear user data (logout)
- `getUserDisplayName(user)`: Get user's display name
- `getUserIdentifier(user)`: Get user's phone/email
- `isUserAuthenticated()`: Check if user is authenticated

## User Flow

1. User navigates to the login page
2. OTPless SDK loads and displays the authentication widget
3. User chooses authentication method (SMS, WhatsApp, Email, or Social)
4. User completes authentication
5. Callback receives user data including token and profile information
6. User data is stored in localStorage
7. User is redirected to the home page

## Authentication Data

Upon successful authentication, the following data is available:

```javascript
{
  "token": "unique-auth-token",
  "userId": "unique-user-id",
  "timestamp": "2025-12-27T...",
  "mobile": {
    "name": "User Name",
    "number": "+919876543210",
    "verified": true
  }
}
```

## Backend Integration

To validate tokens on your backend:

1. Send the `token` from the OTPless response to your backend
2. Use OTPless's verification endpoint with your Client ID and Client Secret
3. Verify the token authenticity before granting access

Example backend verification (pseudo-code):

```javascript
const verifyToken = async (token) => {
  const response = await fetch('https://otpless.com/auth/v1/verify', {
    method: 'POST',
    headers: {
      'clientId': process.env.OTPLESS_CLIENT_ID,
      'clientSecret': process.env.OTPLESS_CLIENT_SECRET,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  return await response.json();
};
```

## Customization

To customize the OTPless widget:

1. Log in to your OTPless dashboard at https://otpless.com/dashboard
2. Navigate to Settings > Customization
3. Configure:
   - Enabled authentication methods
   - Widget theme colors
   - Logo and branding
   - Button text and labels

## Testing

### Development Testing

For local development:
1. Use a tool like ngrok to create an HTTPS tunnel: `ngrok http 5173`
2. Access your app via the HTTPS URL provided by ngrok
3. OTPless requires HTTPS for security

### Production Testing

1. Deploy your application with HTTPS enabled
2. Test all authentication methods (SMS, WhatsApp, Email, Social)
3. Verify token validation on your backend
4. Test logout functionality using `clearOTPlessUser()`

## Security Notes

- Never expose Client Secret on the frontend
- Always validate tokens on the backend
- Use HTTPS in production
- Store sensitive credentials in environment variables
- Regularly rotate your API keys

## Troubleshooting

### Widget Not Loading
- Check browser console for errors
- Verify the SDK script is loaded in `index.html`
- Ensure App ID is correct
- Check HTTPS requirement

### Authentication Fails
- Verify credentials in OTPless dashboard
- Check callback function is properly defined
- Ensure `div#otpless-login-page` exists in DOM
- Review browser console for error messages

### Token Validation Fails
- Verify Client ID and Client Secret on backend
- Check token hasn't expired
- Ensure proper headers in verification request

## Support

For OTPless-specific issues:
- Documentation: https://otpless.com/docs
- Dashboard: https://otpless.com/dashboard
- Support: support@otpless.com
