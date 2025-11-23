import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import User from './models/User.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gameRoutes from './routes/games.js';
import transactionRoutes from './routes/transactions.js';
import messageRoutes from './routes/messages.js';
import paymentRoutes from './routes/payments.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3006',
      'http://localhost:3013'
    ].filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize default admin user
async function initializeAdmin() {
  try {
    const adminExists = await User.findOne({ email: 'admin@kachataka.com' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@kachataka.com',
        phone: '+8801700000000',
        password: 'kachataka',
        demoPoints: 100,
        realBalance: 100000,
        isAdmin: true,
        kycStatus: 'verified',
        referralCode: 'ADMIN001'
      });
      console.log('✅ Default admin user created');
      console.log('   Email: admin@kachataka.com');
      console.log('   Password: kachataka');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error.message);
  }
}

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await initializeAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

