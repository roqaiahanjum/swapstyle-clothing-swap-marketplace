# Environment Variables Configuration Guide

The application uses environment variables for both the client (Vite React) and the server (Node/Express).

---

## 💻 1. Client Environment Configuration (`/client/.env`)

Create a `.env` file inside the `/client` directory.

```ini
# Backend API REST Route base
VITE_API_URL=http://localhost:5000/api

# Backend Server root URL (used for Socket.io and Uploads paths)
VITE_SOCKET_URL=http://localhost:5000
```

### Descriptions:
- **`VITE_API_URL`**: Used by the Axios instance to route API calls.
- **`VITE_SOCKET_URL`**: Used by the Socket.io client instance to initialize real-time event connections and prefix static image file uploads.

---

## 🖧 2. Server Environment Configuration (`/server/.env`)

Create a `.env` file inside the `/server` directory.

```ini
# Port the Express server listens to
PORT=5000

# MongoDB Connection URI string
MONGO_URI=mongodb://127.0.0.1:27017/swapstyle

# Secret key used for signing JWT payload hashes
JWT_SECRET=swapstyle_jwt_secret_key_2026_dev_mode

# Allowed origin for CORS validation
CLIENT_URL=http://localhost:5173
```

### Descriptions:
- **`PORT`**: The backend port. Defaults to `5000` if unspecified.
- **`MONGO_URI`**: Local or cloud MongoDB instance path. Recommend `mongodb://127.0.0.1:27017/swapstyle` for local dev.
- **`JWT_SECRET`**: Signature key for JSON Web Tokens. Ensure this is a strong, random hash in production.
- **`CLIENT_URL`**: CORS configuration parameter. Tells Socket.io and Express routes which client origins are allowed to issue requests.
