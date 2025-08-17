# Biometric Authentication Guide

## Overview

This application supports biometric authentication using the Web Authentication API (WebAuthn) for secure, passwordless login. Users can authenticate using fingerprint sensors, Face ID, or other platform authenticators.

## Features

- **Fingerprint Authentication**: Works with devices equipped with fingerprint sensors
- **Face ID**: Available on devices with TrueDepth camera (iPhone X and later, iPad Pro)
- **Platform Authenticators**: Uses built-in device security features
- **Secure Challenge-Response**: Implements proper WebAuthn challenge verification
- **Fallback Support**: Gracefully falls back to master key authentication if biometric fails

## How It Works

### 1. Setup Process
1. User enables biometric authentication in Settings
2. System creates a WebAuthn credential using the device's biometric hardware
3. Credential data is stored securely (both locally and on server)
4. Biometric authentication is now enabled for the account

### 2. Authentication Flow
1. User attempts biometric login
2. Server generates a secure random challenge
3. Client creates WebAuthn assertion using biometric hardware
4. Server verifies the assertion and challenge
5. If successful, user is authenticated and logged in

### 3. Security Features
- **Challenge-Response**: Each authentication uses a unique, time-limited challenge
- **Credential Verification**: Server validates stored credentials against received assertions
- **Timeout Protection**: Challenges expire after 5 minutes
- **Transport Security**: Uses internal platform authenticators only

## Troubleshooting

### Common Error Messages

#### "Biometric authentication failed. Please use your master key."

This error occurs when:
- Biometric hardware is not available or not working
- User denies biometric authentication
- Stored credentials are invalid or corrupted
- Server-side verification fails

**Solutions:**
1. Check if biometric hardware is working on your device
2. Ensure biometric authentication is enabled in device settings
3. Try re-enabling biometric authentication in the app settings
4. Use master key authentication as fallback

#### "Biometric authentication not available"

This means:
- Device doesn't support WebAuthn
- Browser doesn't support required APIs
- Biometric hardware is not available

**Solutions:**
1. Use a modern browser (Chrome, Firefox, Safari, Edge)
2. Ensure device has biometric hardware
3. Check device security settings

#### "Challenge expired" or "Invalid challenge"

This indicates:
- Authentication took too long (>5 minutes)
- Challenge-response mismatch
- Server-side issue

**Solutions:**
1. Try biometric authentication again
2. Ensure stable internet connection
3. Contact support if issue persists

### Debugging

#### Client-Side Debugging
Open browser console and look for:
- Biometric support detection logs
- WebAuthn API calls
- Error details and stack traces

#### Server-Side Debugging
Check server logs for:
- Challenge generation and storage
- User authentication attempts
- Credential verification results

## Technical Requirements

### Client-Side
- Modern browser with WebAuthn support
- Device with biometric hardware
- HTTPS connection (required for WebAuthn)

### Server-Side
- Node.js with crypto module
- MongoDB for user storage
- JWT for session management

## API Endpoints

### POST /api/auth/biometric-challenge
Generates authentication challenges for WebAuthn.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": [32, 45, 67, ...],
    "rpId": "localhost",
    "userVerification": "required",
    "timeout": 60000,
    "allowCredentials": [...]
  }
}
```

### POST /api/auth/biometric-login
Verifies WebAuthn assertions and authenticates users.

**Request:**
```json
{
  "email": "user@example.com",
  "assertion": {
    "id": "credential-id",
    "type": "public-key",
    "rawId": [...],
    "response": {...}
  },
  "challenge": [32, 45, 67, ...]
}
```

### POST /api/auth/enable-biometric
Enables biometric authentication for a user account.

**Request:**
```json
{
  "credentialData": {
    "id": "credential-id",
    "type": "public-key",
    "rawId": [...],
    "response": {...}
  }
}
```

## Best Practices

### For Users
1. **Keep Device Secure**: Ensure your device's biometric authentication is properly configured
2. **Regular Updates**: Keep your browser and device software updated
3. **Fallback Ready**: Always remember your master key as a backup
4. **Trusted Devices**: Only enable biometric authentication on devices you trust

### For Developers
1. **Error Handling**: Implement comprehensive error handling for all failure scenarios
2. **User Feedback**: Provide clear, actionable error messages
3. **Security**: Never store biometric data in plain text
4. **Testing**: Test on multiple devices and browsers
5. **Monitoring**: Log authentication attempts for security monitoring

## Security Considerations

### What We Store
- **Credential IDs**: Public identifiers for WebAuthn credentials
- **Public Key Data**: Non-sensitive credential metadata
- **User Preferences**: Biometric enablement status

### What We Don't Store
- **Biometric Templates**: Actual fingerprint/face data
- **Private Keys**: Cryptographic private keys
- **Raw Biometric Data**: Any biometric sensor data

### Security Features
- **Challenge-Response**: Prevents replay attacks
- **Time Limits**: Challenges expire after 5 minutes
- **Credential Verification**: Server validates all assertions
- **HTTPS Required**: WebAuthn only works over secure connections

## Future Enhancements

- **Multi-Factor with Biometric**: Combine biometric + PIN/password
- **Cross-Device Sync**: Biometric credentials across multiple devices
- **Advanced Verification**: Server-side cryptographic verification
- **Biometric Analytics**: Usage statistics and security monitoring
- **Backup Methods**: Alternative authentication methods

## Support

If you encounter issues with biometric authentication:

1. **Check Device Settings**: Ensure biometric authentication is enabled
2. **Browser Compatibility**: Verify your browser supports WebAuthn
3. **Clear Cache**: Try clearing browser cache and cookies
4. **Re-enable**: Disable and re-enable biometric authentication
5. **Contact Support**: Provide detailed error messages and device information

## References

- [Web Authentication API Specification](https://www.w3.org/TR/webauthn/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/)
- [WebAuthn.io](https://webauthn.io/) - Interactive demo and testing
