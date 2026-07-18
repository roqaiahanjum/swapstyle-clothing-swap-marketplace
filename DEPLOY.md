# Production Deployment Guide

SwapStyle is designed to allow the `/server` (backend API) and `/client` (frontend SPA) to build and deploy independently.

---

## 🗄️ 1. MongoDB Database Setup (MongoDB Atlas)

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a shared cluster (M0 free tier).
3. Under **Network Access**, whitelist connection IP addresses (or allow access from anywhere `0.0.0.0/0` if deploying to serverless platforms).
4. Create a database user and copy the **SRV Connection String** (looks like `mongodb+srv://<username>:<password>@cluster.mongodb.net/swapstyle`).

---

## 🖧 2. Backend API Deployment (Render / Heroku)

Deploying the `/server` folder to Render:

1. Connect your Git repository to **Render**.
2. Click **New** -> **Web Service**.
3. Set the **Root Directory** to `server`.
4. Configure these parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Advanced** and configure these **Environment Variables**:
   - `PORT`: `10000` (or leave default, Render sets this dynamically)
   - `MONGO_URI`: *Your MongoDB Atlas Connection String*
   - `JWT_SECRET`: *A secure, random, long string*
   - `CLIENT_URL`: *The URL of your deployed frontend client*
6. Deploy the web service and copy its public URL (e.g. `https://swapstyle-backend.onrender.com`).

---

## 💻 3. Frontend Deployment (Vercel / Netlify)

Deploying the `/client` folder to Vercel:

1. Add your repository to **Vercel**.
2. Set the **Root Directory** to `client`.
3. Configure the build parameters:
   - **Framework Preset**: `Vite` (Vercel auto-configures this)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and define client keys:
   - `VITE_API_URL`: `https://swapstyle-backend.onrender.com/api` (Point to your deployed backend URL)
   - `VITE_SOCKET_URL`: `https://swapstyle-backend.onrender.com`
5. Click **Deploy**. Vercel will build the React bundle and host it at a public domain (e.g., `https://swapstyle.vercel.app`).
6. Copy this URL, return to your **Render** backend settings, and update the `CLIENT_URL` variable to match the deployed client URL. Restart the backend service.

---

## 🛡️ 4. Security Checklist for Production

- **JWT Expiry**: Set JWT tokens to expire after a reasonable interval (e.g., 7 days) and store credentials securely.
- **HTTPS Enforcement**: Always use HTTPS to protect authentication credentials.
- **Environment Isolation**: Never commit `.env` files containing secrets or credentials to Git. Use `.gitignore`.
- **CORS Lock**: Ensure `CLIENT_URL` is explicitly locked to your production frontend domain to prevent unauthorized API requests.
