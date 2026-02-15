# StockFlow Authentication System

## 🔐 Overview
StockFlow now features a comprehensive authentication system that separates admin privileges from view-only access. This allows anyone to browse and view data while restricting editing capabilities to authenticated administrators.

## 🎯 Key Features

### 1. **Dual Access Modes**
- **View-Only Mode**: Default mode for unauthenticated users
  - Browse all folders and products
  - View analytics and charts
  - Access all read-only features
  - No login required

- **Admin Mode**: For authenticated administrators
  - Full CRUD operations (Create, Read, Update, Delete)
  - Manage folders, fields, and products
  - Edit and delete content
  - Requires login with valid credentials

### 2. **Secure Authentication**
- **Password Hashing**: Uses bcrypt for secure password storage
- **Session Tokens**: JWT-like tokens with 7-day expiration
- **Token Management**: Automatic token injection in API requests
- **Session Validation**: Server-side validation on every protected request

### 3. **User Experience**
- **Seamless Browsing**: No login required to view content
- **Clear Status Indication**: Visual badge showing current access mode
- **Contextual Prompts**: Helpful dialogs when admin access is needed
- **Quick Login Access**: One-tap login button in header
- **Session Persistence**: Stay logged in across app restarts

## 📱 User Interface

### Home Screen
- **Status Badge**: Shows "View-Only Mode" or "Admin: username"
- **Login/Logout Button**: Top-right corner for quick access
- **Protected Actions**: Long-press folders (requires admin)
- **FAB Protection**: Create folder button (requires admin)

### Login Screen
- **Clean Design**: Modern, minimalistic interface
- **Two Options**:
  1. Login as Admin
  2. Continue as Viewer
- **Default Credentials Display**: Shows admin/admin123
- **Helpful Information**: Explains view-only vs admin access

## 🔧 Technical Implementation

### Backend (Python/Flask)

#### Database Schema
```sql
-- Admin users table
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

#### Authentication Endpoints

**POST /auth/login**
- Authenticates user credentials
- Returns session token
- Token valid for 7 days

```json
Request:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "abc123...",
  "username": "admin",
  "expires_at": "2026-02-22T10:00:00"
}
```

**POST /auth/logout**
- Invalidates current session token
- Removes token from database

**GET /auth/verify**
- Checks if token is valid
- Returns user information if valid

```json
Response:
{
  "valid": true,
  "username": "admin",
  "expires_at": "2026-02-22T10:00:00"
}
```

#### Protected Routes
All write operations require authentication:
- POST /folders (create folder)
- PUT /folders/:id (update folder)
- DELETE /folders/:id (delete folder)
- POST /fields (create field)
- PUT /fields/:id (update field)
- DELETE /fields/:id (delete field)
- POST /products (create product)
- PUT /products/:id (update product)
- DELETE /products/:id (delete product)

#### Middleware
```python
@require_admin
def protected_route():
    # Only accessible with valid token
    pass
```

### Frontend (React Native)

#### API Service (services/api.js)

**Authentication Functions**
```javascript
// Login
await login(username, password);

// Logout
await logout();

// Check authentication status
const isAuth = await isAuthenticated();

// Verify token
const verification = await verifyToken();

// Get username
const username = await getUsername();
```

**Automatic Token Injection**
```javascript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Error Handling
```javascript
try {
  await updateFolder(id, name);
} catch (e) {
  if (e.response?.data?.code === 'AUTH_REQUIRED' || 
      e.response?.data?.code === 'INVALID_TOKEN') {
    // Prompt user to login
    Alert.alert('Session Expired', 'Please login again');
  }
}
```

## 🚀 Usage Guide

### For Regular Users (View-Only)
1. Open the app
2. Tap "Continue as Viewer" or skip login
3. Browse folders and view data
4. View analytics and charts
5. No editing capabilities

### For Administrators
1. Open the app
2. Tap "Login" button in header
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
4. Tap "Login as Admin"
5. Full access to all features

### Managing Sessions
- **Stay Logged In**: Sessions last 7 days
- **Manual Logout**: Tap "Logout" button in header
- **Auto Logout**: Token expires after 7 days
- **Re-login**: Simply login again when prompted

## 🔒 Security Features

### Password Security
- **Bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: 12 rounds for strong protection
- **No Plain Text**: Passwords never stored in plain text

### Token Security
- **Secure Generation**: Cryptographically secure random tokens
- **URL-Safe**: Base64 URL-safe encoding
- **Expiration**: Automatic expiration after 7 days
- **Server Validation**: Every request validates token

### API Security
- **Authorization Header**: Bearer token authentication
- **CORS Protection**: Configured CORS policies
- **Error Codes**: Specific codes for auth failures
  - `AUTH_REQUIRED`: No token provided
  - `INVALID_TOKEN`: Token invalid or expired

## 📝 Default Credentials

**Username**: `admin`  
**Password**: `admin123`

⚠️ **Important**: Change the default password in production!

### Changing Default Password
1. Hash new password using bcrypt
2. Update database:
```sql
UPDATE admin_users 
SET password_hash = '$2b$12$NEW_HASH_HERE' 
WHERE username = 'admin';
```

### Adding New Admin Users
```sql
INSERT INTO admin_users (username, password_hash) 
VALUES ('newadmin', '$2b$12$HASHED_PASSWORD');
```

## 🎨 UI Components

### Status Badge
- **Green Dot**: Admin logged in
- **Gray Dot**: View-only mode
- **Text**: Shows current status and username

### Login Button
- **Blue Background**: Primary action
- **Top Right**: Easy access
- **Visible**: Only when not logged in

### Logout Button
- **Red Border**: Destructive action
- **Top Right**: Easy access
- **Visible**: Only when logged in

### Permission Dialogs
- **Clear Message**: Explains why login is needed
- **Two Options**: Cancel or Login
- **Contextual**: Appears when admin action attempted

## 🔄 Session Flow

```
1. User opens app
   ↓
2. Check for stored token
   ↓
3a. No token → View-Only Mode
3b. Has token → Verify with server
   ↓
4a. Token valid → Admin Mode
4b. Token invalid → View-Only Mode
   ↓
5. User attempts admin action
   ↓
6a. Authenticated → Action proceeds
6b. Not authenticated → Login prompt
```

## 🛠️ Troubleshooting

### "Authentication Required" Error
- **Cause**: No token or token expired
- **Solution**: Login again

### "Invalid Token" Error
- **Cause**: Token corrupted or revoked
- **Solution**: Logout and login again

### Can't Login
- **Check**: Correct username and password
- **Check**: Server is running
- **Check**: Database tables created
- **Check**: Network connection

### Session Expires Too Quickly
- **Modify**: Change expiration in server.py
```python
expires_at = datetime.now() + timedelta(days=30)  # 30 days
```

## 📊 Database Maintenance

### Clean Expired Sessions
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### View Active Sessions
```sql
SELECT u.username, s.expires_at 
FROM sessions s 
JOIN admin_users u ON s.user_id = u.id 
WHERE s.expires_at > NOW();
```

### Revoke All Sessions for User
```sql
DELETE FROM sessions 
WHERE user_id = (SELECT id FROM admin_users WHERE username = 'admin');
```

## 🎯 Best Practices

1. **Change Default Password**: Always change in production
2. **Regular Session Cleanup**: Remove expired sessions
3. **Monitor Failed Logins**: Track authentication attempts
4. **Use HTTPS**: In production, always use HTTPS
5. **Token Rotation**: Consider implementing token refresh
6. **Rate Limiting**: Add rate limiting to login endpoint
7. **Audit Logs**: Log all admin actions

## 🔮 Future Enhancements

Potential improvements:
- **Multiple Admin Roles**: Super admin, editor, viewer
- **Permission Levels**: Granular permissions per feature
- **Two-Factor Authentication**: Additional security layer
- **Password Reset**: Email-based password recovery
- **Activity Logs**: Track all admin actions
- **Session Management UI**: View and revoke active sessions
- **OAuth Integration**: Login with Google, etc.
- **Biometric Auth**: Fingerprint/Face ID support

---

**Version**: 3.0.0  
**Date**: February 15, 2026  
**Security Level**: Basic Authentication with Token Management
