"""
StockFlow Backend Server
------------------------
A Flask-based REST API for the StockFlow inventory management system.
Handles authentication, product management, and analytics queries.
"""

from flask import Flask, request, jsonify

from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
import bcrypt
import secrets
from datetime import datetime, timedelta
from functools import wraps

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        port=os.getenv("MYSQL_PORT")
    )

# --- AUTHENTICATION MIDDLEWARE ---
def require_admin(f):
    """Decorator to require admin authentication for write operations"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({"error": "Authentication required", "code": "AUTH_REQUIRED"}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        db = get_db()
        cur = db.cursor(dictionary=True)
        
        # Check if token is valid and not expired
        cur.execute("""
            SELECT s.*, u.username 
            FROM sessions s 
            JOIN admin_users u ON s.user_id = u.id 
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        
        session = cur.fetchone()
        cur.close()
        db.close()
        
        if not session:
            return jsonify({"error": "Invalid or expired token", "code": "INVALID_TOKEN"}), 401
        
        # Add user info to request context
        request.user = session
        return f(*args, **kwargs)
    
    return decorated_function

# --- AUTHENTICATION ROUTES ---
@app.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    
    db = get_db()
    cur = db.cursor(dictionary=True)
    
    # Get user
    cur.execute("SELECT * FROM admin_users WHERE username = %s", (username,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        db.close()
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        cur.close()
        db.close()
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Generate session token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=7)  # Token valid for 7 days
    
    # Store session
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user['id'], token, expires_at)
    )
    db.commit()
    cur.close()
    db.close()
    
    return jsonify({
        "token": token,
        "username": user['username'],
        "expires_at": expires_at.isoformat()
    }), 200

@app.route("/auth/logout", methods=["POST"])
def logout():
    token = request.headers.get('Authorization')
    
    if token and token.startswith('Bearer '):
        token = token[7:]
    
    if token:
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM sessions WHERE token = %s", (token,))
        db.commit()
        cur.close()
        db.close()
    
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/auth/verify", methods=["GET"])
def verify_token():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({"valid": False}), 200
    
    if token.startswith('Bearer '):
        token = token[7:]
    
    db = get_db()
    cur = db.cursor(dictionary=True)
    
    cur.execute("""
        SELECT s.*, u.username 
        FROM sessions s 
        JOIN admin_users u ON s.user_id = u.id 
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    
    session = cur.fetchone()
    cur.close()
    db.close()
    
    if session:
        return jsonify({
            "valid": True,
            "username": session['username'],
            "expires_at": session['expires_at'].isoformat()
        }), 200
    else:
        return jsonify({"valid": False}), 200


# --- ANALYTICS ---
@app.route("/analytics/metrics", methods=["GET"])
def get_analytics_metrics():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT DISTINCT name FROM fields WHERE field_type = 'number'")
    metrics = [row['name'] for row in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify(metrics)

@app.route("/analytics/data", methods=["GET"])
def get_analytics_data():
    metric_name = request.args.get('metric')
    if not metric_name:
        return jsonify({"labels": [], "values": [], "total": 0})

    db = get_db()
    cur = db.cursor(dictionary=True)
    
    # Sum up the value for every folder that has this metric
    query = """
        SELECT 
            f.name as label, 
            COALESCE(SUM(CAST(NULLIF(v.value, '') AS DECIMAL(10,2))), 0) as value
        FROM folders f
        JOIN fields fl ON f.id = fl.folder_id
        JOIN products p ON f.id = p.folder_id
        LEFT JOIN field_values v ON p.id = v.product_id AND v.field_id = fl.id
        WHERE fl.name = %s AND fl.field_type = 'number'
        GROUP BY f.id
    """
    cur.execute(query, (metric_name,))
    data = cur.fetchall()
    
    # Format for Charts (Lists are easier for Bar/Line charts)
    labels = []
    values = []
    total = 0.0

    for row in data:
        val = float(row['value'])
        labels.append(row['label'])
        values.append(val)
        total += val
    
    cur.close()
    db.close()
    return jsonify({
        "labels": labels, 
        "values": values, 
        "total": total
    })

# --- FOLDER-SPECIFIC ANALYTICS ---
@app.route("/analytics/folder/<int:folder_id>/metrics", methods=["GET"])
def get_folder_analytics_metrics(folder_id):
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT DISTINCT name FROM fields WHERE folder_id = %s AND field_type = 'number'", (folder_id,))
    metrics = [row['name'] for row in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify(metrics)

@app.route("/analytics/folder/<int:folder_id>/data", methods=["GET"])
def get_folder_analytics_data(folder_id):
    metric_name = request.args.get('metric')
    if not metric_name:
        return jsonify({"labels": [], "values": [], "total": 0})

    db = get_db()
    cur = db.cursor(dictionary=True)
    
    # Sum up the value for every product in this folder for the specified metric
    query = """
        SELECT 
            p.name as label, 
            COALESCE(CAST(NULLIF(v.value, '') AS DECIMAL(10,2)), 0) as value
        FROM products p
        JOIN fields fl ON p.folder_id = fl.folder_id
        LEFT JOIN field_values v ON p.id = v.product_id AND v.field_id = fl.id
        WHERE p.folder_id = %s AND fl.name = %s AND fl.field_type = 'number'
    """
    cur.execute(query, (folder_id, metric_name))
    data = cur.fetchall()
    
    # Format for Charts
    labels = []
    values = []
    total = 0.0

    for row in data:
        val = float(row['value'])
        labels.append(row['label'])
        values.append(val)
        total += val
    
    cur.close()
    db.close()
    return jsonify({
        "labels": labels, 
        "values": values, 
        "total": total
    })


# --- CRUD ROUTES ---
@app.route("/folders", methods=["GET", "POST"])
def manage_folders():
    db = get_db()
    cur = db.cursor(dictionary=True)
    if request.method == "POST":
        # Check authentication for POST
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Authentication required", "code": "AUTH_REQUIRED"}), 401
        
        token = token[7:]
        cur.execute("""
            SELECT s.* FROM sessions s 
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        if not cur.fetchone():
            cur.close()
            db.close()
            return jsonify({"error": "Invalid or expired token", "code": "INVALID_TOKEN"}), 401
        
        data = request.json
        cur.execute("INSERT INTO folders (name) VALUES (%s)", (data['name'],))
        db.commit()
        return jsonify({"message": "Created"}), 201
    cur.execute("SELECT * FROM folders")
    res = cur.fetchall()
    cur.close()
    db.close()
    return jsonify(res)

@app.route("/folders/<int:id>", methods=["PUT"])
@require_admin
def update_folders(id):
    data = request.json
    db = get_db()
    cur = db.cursor()
    cur.execute("UPDATE folders SET name=%s WHERE id=%s", (data['name'], id))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Folder updated"})

@app.route("/folders/<int:id>", methods=["DELETE"])
@require_admin
def delete_folder(id):
    db = get_db()
    cur = db.cursor()
    cur.execute("DELETE FROM folders WHERE id=%s", (id,))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Folder deleted"})

@app.route("/fields/<int:id>", methods=["PUT"])
@require_admin
def update_field(id):
    data = request.json
    db = get_db()
    cur = db.cursor()
    cur.execute("UPDATE fields SET name=%s WHERE id=%s", (data['name'], id))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Field updated"})

@app.route("/fields/<int:id>", methods=["DELETE"])
@require_admin
def delete_field(id):
    db = get_db()
    cur = db.cursor()
    cur.execute("DELETE FROM fields WHERE id=%s", (id,))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Field deleted"})

@app.route("/fields", methods=["GET", "POST"])
def manage_fields():
    db = get_db()
    cur = db.cursor(dictionary=True)
    folder_id = request.args.get('folder_id')
    if request.method == "POST":
        # Check authentication for POST
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Authentication required", "code": "AUTH_REQUIRED"}), 401
        
        token = token[7:]
        cur.execute("""
            SELECT s.* FROM sessions s 
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        if not cur.fetchone():
            cur.close()
            db.close()
            return jsonify({"error": "Invalid or expired token", "code": "INVALID_TOKEN"}), 401
        
        data = request.json
        cur.execute("INSERT INTO fields (name, field_type, folder_id) VALUES (%s, %s, %s)",
                    (data['name'], data['type'], data['folder_id']))
        db.commit()
        return jsonify({"message": "Created"}), 201
    cur.execute("SELECT * FROM fields WHERE folder_id = %s", (folder_id,))
    res = cur.fetchall()
    cur.close()
    db.close()
    return jsonify(res)

@app.route("/products", methods=["GET", "POST"])
def manage_products():
    db = get_db()
    cur = db.cursor(dictionary=True)
    
    if request.method == "POST":
        # Check authentication for POST
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Authentication required", "code": "AUTH_REQUIRED"}), 401
        
        token = token[7:]
        cur.execute("""
            SELECT s.* FROM sessions s 
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        if not cur.fetchone():
            cur.close()
            db.close()
            return jsonify({"error": "Invalid or expired token", "code": "INVALID_TOKEN"}), 401
        
        data = request.json
        cur.execute("INSERT INTO products (name, folder_id) VALUES (%s, %s)", (data['name'], data['folder_id']))
        pid = cur.lastrowid
        for fid, val in data.get('values', {}).items():
            cur.execute("INSERT INTO field_values (product_id, field_id, value) VALUES (%s, %s, %s)", (pid, fid, val))
        db.commit()
        return jsonify({"message": "Saved"}), 201

    folder_id = request.args.get('folder_id')
    cur.execute("SELECT * FROM products WHERE folder_id = %s", (folder_id,))
    products = cur.fetchall()
    
    # Attach values
    for p in products:
        cur.execute("""
            SELECT f.id, f.name, v.value 
            FROM fields f 
            LEFT JOIN field_values v ON f.id = v.field_id AND v.product_id = %s
            WHERE f.folder_id = %s
        """, (p['id'], folder_id))
        p['values'] = cur.fetchall()

    cur.close()
    db.close()
    return jsonify(products)

@app.route("/products/<int:id>", methods=["PUT"])
@require_admin
def update_product(id):
    data = request.json
    db = get_db()
    cur = db.cursor()
    
    # Update product name if provided
    if 'name' in data:
        cur.execute("UPDATE products SET name=%s WHERE id=%s", (data['name'], id))
    
    # Update field values if provided
    if 'values' in data:
        for field_id, value in data['values'].items():
            # Check if value exists, update or insert
            cur.execute("""
                INSERT INTO field_values (product_id, field_id, value) 
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE value=%s
            """, (id, field_id, value, value))
    
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Product updated"})

@app.route("/products/<int:id>", methods=["DELETE"])
@require_admin
def delete_product(id):
    db = get_db()
    cur = db.cursor()
    cur.execute("DELETE FROM products WHERE id=%s", (id,))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)