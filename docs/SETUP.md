# StockFlow Backend Setup Guide

## Prerequisites
- Python 3.12+ installed
- MySQL Server installed and running
- Node.js and npm installed (for frontend)

## Backend Setup

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Database
1. Make sure MySQL server is running
2. Update the `.env` file with your MySQL credentials:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_actual_password
   MYSQL_DB=stockflow
   ```

### 3. Create Database Schema
Run the SQL schema file to create the database and tables:
```bash
mysql -u root -p < schema.sql
```

Or manually execute the SQL commands in MySQL:
```bash
mysql -u root -p
source schema.sql
```

### 4. Start the Backend Server
```bash
python server.py
```

The server will run on `http://0.0.0.0:5000`

## Frontend Setup

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Update API Configuration
Make sure the API URL in `services/api.js` matches your backend server:
```javascript
const API_URL = 'http://10.77.100.174:5000';  // Update this to your server IP
```

### 3. Start the Frontend
```bash
npm start
```

## Troubleshooting

### MySQL Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure the `stockflow` database exists

### Port Already in Use
- Change the port in `server.py`: `app.run(host="0.0.0.0", port=5001, debug=True)`
- Update the API_URL in `services/api.js` accordingly

### Module Not Found Errors
- Reinstall dependencies: `pip install -r requirements.txt`
- For frontend: `npm install`

## API Endpoints

### Analytics
- `GET /analytics/metrics` - Get available metrics
- `GET /analytics/data?metric=<name>` - Get chart data for a metric

### Folders
- `GET /folders` - Get all folders
- `POST /folders` - Create a new folder
- `PUT /folders/<id>` - Update folder name

### Fields
- `GET /fields?folder_id=<id>` - Get fields for a folder
- `POST /fields` - Create a new field
- `PUT /fields/<id>` - Update field name
- `DELETE /fields/<id>` - Delete a field

### Products
- `GET /products?folder_id=<id>` - Get products for a folder
- `POST /products` - Create a new product
- `DELETE /products/<id>` - Delete a product
