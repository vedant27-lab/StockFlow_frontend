# StockFlow Database Setup Script
# Run this script to create/update the database schema with authentication tables

import mysql.connector
import bcrypt
from dotenv import load_dotenv
import os

load_dotenv()

def setup_database():
    print("🔧 StockFlow Database Setup")
    print("=" * 50)
    
    try:
        # Connect to MySQL
        print("\n📡 Connecting to MySQL...")
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DB"),
            port=os.getenv("MYSQL_PORT")
        )
        cursor = conn.cursor()
        
        # Create database if not exists
        db_name = os.getenv("MYSQL_DB")
        print(f"📦 Creating database '{db_name}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")
        
        # Create admin_users table
        print("👤 Creating admin_users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create sessions table
        print("🔑 Creating sessions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
            )
        """)
        
        # Check if default admin exists
        cursor.execute("SELECT COUNT(*) FROM admin_users WHERE username = 'admin'")
        admin_exists = cursor.fetchone()[0] > 0
        
        if not admin_exists:
            print("🔐 Creating default admin user...")
            # Hash the default password 'admin123'
            password = 'admin123'
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            cursor.execute(
                "INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)",
                ('admin', password_hash.decode('utf-8'))
            )
            print("✅ Default admin user created!")
            print("   Username: admin")
            print("   Password: admin123")
            print("   ⚠️  Please change this password in production!")
        else:
            print("ℹ️  Default admin user already exists")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 50)
        print("✅ Database setup completed successfully!")
        print("=" * 50)
        print("\n📋 Summary:")
        print("  ✓ Database created/verified")
        print("  ✓ Authentication tables created")
        print("  ✓ Default admin user ready")
        print("\n🚀 You can now start the server with: python server.py")
        
    except mysql.connector.Error as err:
        print(f"\n❌ Database Error: {err}")
        print("\n💡 Troubleshooting:")
        print("  1. Check your .env file has correct MySQL credentials")
        print("  2. Ensure MySQL server is running")
        print("  3. Verify the user has CREATE DATABASE privileges")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    setup_database()
