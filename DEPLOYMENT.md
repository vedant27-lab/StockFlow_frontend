# 🚀 Deployment Guide: StockFlow App

This guide will help you deploy your backend to the cloud for free and build an APK for your Android device.

## Prerequisites

1.  **GitHub Account**: To store your code.
2.  **Render Account**: To host the Python backend (Free).
3.  **TiDB Cloud Account**: To host the MySQL database (Free).
4.  **Expo Account**: To build the APK (Free).

---

## Part 1: Database Setup (TiDB Cloud)

Since Render's free database is PostgreSQL (and we use MySQL), we will use **TiDB Cloud** which offers a generous free tier for MySQL-compatible databases.

1.  Go to [TiDB Cloud](https://tidbcloud.com/) and sign up.
2.  Create a **Serverless Tier** cluster (It's free).
3.  Once created, click **"Connect"**.
4.  Select "Connect with General Client".
5.  Copy the connection parameters:
    *   **Host**: `gateway01.us-west-2.prod.aws.tidbcloud.com` (example)
    *   **Port**: `4000`
    *   **User**: `...`
    *   **Password**: `...`
6.  **Important**: You will need these for Part 2.

---

## Part 2: Backend Deployment (Render)

1.  **Push to GitHub**:
    *   Create a new repository on GitHub.
    *   Push your `stockflow` folder code to it.

2.  **Deploy on Render**:
    *   Go to [Render.com](https://render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
    *   **Name**: `stockflow-api` (or similar).
    *   **Runtime**: Python 3.
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn server:app` (This is already set in your Procfile, but good to double-check).
    *   **Instance Type**: Free.

3.  **Environment Variables**:
    *   Scroll down to "Environment Variables" and add these:
        *   `MYSQL_HOST`: (Your TiDB Host)
        *   `MYSQL_USER`: (Your TiDB User)
        *   `MYSQL_PASSWORD`: (Your TiDB Password)
        *   `MYSQL_DB`: `stockflow` (or whatever you named your DB)
        *   `JWT_SECRET_KEY`: (Generate a random string)
        *   `See Also`: You might need to add `PYTHON_VERSION` = `3.9.0` if builds fail.

4.  **Finish**: Click **Create Web Service**.
    *   Wait for the deployment to finish.
    *   Copy your new URL! It will look like: `https://stockflow-api.onrender.com`.

---

## Part 3: Frontend Configuration (Expo)

Now we need to tell your app to talk to the *live* server, not your laptop.

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```

2.  **Login to Expo**:
    ```bash
    eas login
    ```

3.  **Configure Project**:
    ```bash
    eas build:configure
    ```
    *   Select `android`.

4.  **Set API URL**:
    *   Create a file named `eas.json` (if not created).
    *   Add your Render URL to the `env` section locally or in Expo secrets.
    *   **Better way**: We updated `api.js` to look for `EXPO_PUBLIC_API_URL`.
    *   In your **`eas.json`**, add the `env` block:

    ```json
    {
      "build": {
        "preview": {
          "android": {
            "buildType": "apk"
          },
          "env": {
            "EXPO_PUBLIC_API_URL": "https://your-render-app-name.onrender.com"
          }
        },
        "production": {
          "env": {
            "EXPO_PUBLIC_API_URL": "https://your-render-app-name.onrender.com"
          }
        }
      }
    }
    ```

---

## Part 4: Build the APK

1.  **Run the Build**:
    ```bash
    eas build -p android --profile preview
    ```

2.  **Wait**:
    *   Expo will build your app in the cloud.
    *   This can take 10-20 minutes.

3.  **Download**:
    *   When finished, it will give you a link to download the `.apk` file.
    *   Install it on your phone!

---

## Troubleshooting

*   **Database Connection Failed**: Double check your TiDB password and ensure you added `?ssl_mode=VERIFY_IDENTITY&ssl_ca=/etc/ssl/certs/ca-certificates.crt` to the connection string if needed, or simply ensure SSL is enabled in your connection logic. (Our code uses standard mysql-connector which supports SSL by default).
*   **App Crashes on Open**: Check if the API URL is correct. If it works on simulator but not APK, it's usually the API URL being `localhost`.

