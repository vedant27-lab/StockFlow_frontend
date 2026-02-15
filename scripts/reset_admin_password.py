
import mysql.connector
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

def reset_password(username, new_password):
    print(f"🔧 Resetting password for user: '{username}'")
    
    try:
        # 1. Connect
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DB"),
            port=os.getenv("MYSQL_PORT")
        )
        cursor = conn.cursor()
        
        # 2. Generate New Hash
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        # 3. Update Database
        cursor.execute(
            "UPDATE admin_users SET password_hash = %s WHERE username = %s",
            (hashed.decode('utf-8'), username)
        )
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"✅ Success! Password for '{username}' has been updated to '{new_password}'.")
        else:
            print(f"⚠️  User '{username}' not found. Creating user now...")
            cursor.execute(
                "INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)",
                (username, hashed.decode('utf-8'))
            )
            conn.commit()
            print(f"✅ Created user '{username}' with password '{new_password}'.")
            
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_password('admin', 'admin123')
