
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    print("🔧 StockFlow Full Database Setup")
    print("=" * 50)

    try:
        # 1. Connect to Database
        print("\n📡 Connecting to MySQL (TiDB)...")
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DB"),
            port=os.getenv("MYSQL_PORT")
        )
        cursor = conn.cursor()

        # 2. Read schema.sql
        print("Pg Reading schema.sql...")
        with open('schema.sql', 'r') as f:
            schema = f.read()

        # 3. Execute Schema queries
        # Split by ; and ignore empty lines/comments
        print("📦 Creating Tables...")
        commands = schema.split(';')
        
        for command in commands:
            cleaned_command = command.strip()
            if cleaned_command:
                try:
                    cursor.execute(cleaned_command)
                except mysql.connector.Error as err:
                    # Ignore "database exists" or "table exists" warnings if you want, 
                    # but usually it's better to see them.
                    # schema.sql uses IF NOT EXISTS, so mostly safe.
                    print(f"   ⚠️  Warning executing command: {err}")

        conn.commit()
        print("✅ Tables Created/Verified from schema.sql")

        # 4. Final Verification
        cursor.execute("SHOW TABLES")
        tables = [x[0] for x in cursor.fetchall()]
        print(f"\n📊 Current Tables in '{os.getenv('MYSQL_DB')}':")
        for table in tables:
            print(f"   - {table}")

        cursor.close()
        conn.close()

        print("\n✅ Database Setup Complete!")
        print("   User credentials should be in 'admin_users' table.")
        print("   (Default: admin / admin123)")

    except Exception as e:
        print(f"\n❌ Setup Failed: {e}")

if __name__ == "__main__":
    setup_database()
