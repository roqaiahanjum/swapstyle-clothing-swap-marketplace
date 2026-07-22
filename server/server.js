const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// CORS configuration
const normalizeUrl = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

const defaultOrigins = [
  'http://localhost:5173',
  'https://swapstyle-clothing-swap-marketplace.vercel.app'
];

let envOrigins = [];
if (process.env.CLIENT_URL) {
  envOrigins = process.env.CLIENT_URL.split(',').map(normalizeUrl).filter(Boolean);
}

const rawOrigins = [...defaultOrigins, ...envOrigins];
const allowedOrigins = Array.from(new Set(rawOrigins.flatMap(url => {
  const clean = normalizeUrl(url);
  return [clean, `${clean}/`];
})));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = normalizeUrl(origin);
    const isAllowed = allowedOrigins.some(allowed => normalizeUrl(allowed) === cleanOrigin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swapstyle';
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Socket.io Setup
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

app.set('io', io);

// Import socket events
require('./sockets/chatSocket')(io);

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Root endpoint for testing deployment
app.get('/', (req, res) => {
  res.json({ message: 'SwapStyle API Server is running.' });
});

// Global Error Handler
app.use(errorHandler);

// Listen on Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
