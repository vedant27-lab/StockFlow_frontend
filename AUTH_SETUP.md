# 🔐 Authentication System Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies (including bcrypt)
pip install -r requirements.txt

# Or if using virtual environment
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Setup Authentication Database

```bash
# Run the authentication setup script
python setup_auth.py
```

This will:
- Create `admin_users` table
- Create `sessions` table  
- Create default admin user (username: `admin`, password: `admin123`)

### 3. Start the Server

```bash
python server.py
```

### 4. Test Authentication

**Option A: Use the Mobile App**
1. Open the app
2. Tap "Login" button
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
4. You're now in Admin Mode!

**Option B: Test with cURL**
```bash
# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response will include token:
# {"token":"abc123...","username":"admin","expires_at":"..."}

# Use token for protected routes
curl -X POST http://localhost:5000/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Test Folder"}'
```

## Access Modes

### 👁️ View-Only Mode (Default)
- **No login required**
- Browse all folders and products
- View analytics and charts
- Cannot create, edit, or delete

### 🔐 Admin Mode (Requires Login)
- **Login required**
- Full CRUD operations
- Create folders, fields, products
- Edit and delete content
- Manage entire inventory

## Default Credentials

**Username**: `admin`  
**Password**: `admin123`

⚠️ **IMPORTANT**: Change this password in production!

## Changing the Admin Password

### Method 1: Using Python Script

```python
import bcrypt
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

# Your new password
new_password = "your_secure_password_here"

# Hash it
password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

# Update database
conn = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST"),
    user=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
    database=os.getenv("MYSQL_DB")
)
cursor = conn.cursor()
cursor.execute(
    "UPDATE admin_users SET password_hash = %s WHERE username = 'admin'",
    (password_hash.decode('utf-8'),)
)
conn.commit()
print("Password updated successfully!")
```

### Method 2: Direct SQL (Advanced)

1. Generate password hash using bcrypt online tool or Python:
```python
import bcrypt
print(bcrypt.hashpw(b"new_password", bcrypt.gensalt()).decode('utf-8'))
```

2. Update database:
```sql
UPDATE admin_users 
SET password_hash = '$2b$12$YOUR_HASH_HERE' 
WHERE username = 'admin';
```

## Adding More Admin Users

```sql
-- First, hash the password using bcrypt
-- Then insert the new user:

INSERT INTO admin_users (username, password_hash) 
VALUES ('newadmin', '$2b$12$HASHED_PASSWORD_HERE');
```

## Troubleshooting

### "Authentication required" error
- You're trying to perform an admin action without being logged in
- Solution: Login as admin first

### "Invalid credentials" error
- Wrong username or password
- Solution: Check credentials, default is admin/admin123

### Can't run setup_auth.py
- Missing bcrypt module
- Solution: `pip install bcrypt==4.1.2`

### Database connection error
- MySQL not running or wrong credentials
- Solution: Check .env file and MySQL service

## Security Best Practices

1. ✅ **Change default password** immediately in production
2. ✅ **Use HTTPS** in production (not HTTP)
3. ✅ **Regular session cleanup** - remove expired tokens
4. ✅ **Monitor failed login attempts**
5. ✅ **Keep dependencies updated** (especially bcrypt)
6. ✅ **Use environment variables** for sensitive data
7. ✅ **Implement rate limiting** on login endpoint (future)

## Session Management

- **Token Lifetime**: 7 days
- **Storage**: AsyncStorage (mobile), Database (server)
- **Automatic Cleanup**: Expired tokens remain in DB (manual cleanup recommended)

### Clean Expired Sessions

```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### View Active Sessions

```sql
SELECT u.username, s.token, s.expires_at 
FROM sessions s 
JOIN admin_users u ON s.user_id = u.id 
WHERE s.expires_at > NOW();
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | No | Login and get token |
| POST | `/auth/logout` | No | Logout and invalidate token |
| GET | `/auth/verify` | No | Verify token validity |

### Protected Endpoints (Require Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/folders` | Create folder |
| PUT | `/folders/:id` | Update folder |
| DELETE | `/folders/:id` | Delete folder |
| POST | `/fields` | Create field |
| PUT | `/fields/:id` | Update field |
| DELETE | `/fields/:id` | Delete field |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/folders` | List all folders |
| GET | `/fields` | List fields for folder |
| GET | `/products` | List products for folder |
| GET | `/analytics/*` | All analytics endpoints |

## Mobile App Usage

### For Regular Users
1. Open app
2. Skip login or tap "Continue as Viewer"
3. Browse and view data
4. Enjoy read-only access

### For Administrators
1. Open app
2. Tap "Login" button (top-right)
3. Enter admin credentials
4. Tap "Login as Admin"
5. Full access granted!

### Visual Indicators
- **Green dot** + "Admin: username" = Logged in
- **Gray dot** + "View-Only Mode" = Not logged in
- **Login button** = Visible when not logged in
- **Logout button** = Visible when logged in

## Error Handling

The app handles authentication errors gracefully:

- **No token**: Prompts to login when attempting admin action
- **Expired token**: Shows "Session Expired" dialog
- **Invalid token**: Redirects to login
- **Network error**: Shows appropriate error message

## Development vs Production

### Development
- Default credentials OK
- HTTP OK
- Longer session times OK
- Debug mode ON

### Production
- ⚠️ **MUST change default password**
- ⚠️ **MUST use HTTPS**
- ⚠️ **Consider shorter session times**
- ⚠️ **Debug mode OFF**
- ⚠️ **Add rate limiting**
- ⚠️ **Add audit logging**

## Next Steps

After setting up authentication:

1. ✅ Test login functionality
2. ✅ Change default password
3. ✅ Test view-only mode
4. ✅ Test admin operations
5. ✅ Review security settings
6. ✅ Setup regular session cleanup
7. ✅ Monitor authentication logs

## Support

For issues or questions:
1. Check [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed docs
2. Review [DEBUG_SUMMARY.md](./DEBUG_SUMMARY.md) for common issues
3. Check server logs for error messages

---

**Security Level**: Basic Authentication with Token Management  
**Recommended For**: Internal tools, small teams, development  
**Not Recommended For**: Public-facing apps without additional security layers
