// MongoDB connection utility optimized for Vercel serverless functions
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Cache the connection to reuse across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Check if we have a cached connection and if it's still connected
  if (cached.conn) {
    // Check connection state: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    } else {
      // Connection is not ready, reset it
      console.log('MongoDB connection not ready, reconnecting...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  // If there's already a connection promise, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      // Verify the connection is still active
      if (mongoose.connection.readyState === 1) {
        return cached.conn;
      } else {
        // Connection promise resolved but connection is not ready, reset
        cached.conn = null;
        cached.promise = null;
      }
    } catch (e) {
      // Connection failed, reset and try again
      cached.promise = null;
      cached.conn = null;
    }
  }

  // Create a new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected:', mongoose.connection.name);
      console.log('Connection state:', mongoose.connection.readyState);
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB Disconnected');
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB Reconnected');
      });

      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB Connection Error:', error.message);
      cached.promise = null;
      cached.conn = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Double-check connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready after connect');
    }
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('MongoDB connection failed:', e.message);
    throw e;
  }
}

export default connectDB;

