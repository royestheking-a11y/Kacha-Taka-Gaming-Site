// Authentication middleware for Vercel serverless functions
import jwt from 'jsonwebtoken';
import User from '../../server/models/User.js';
import connectDB from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kachataka-super-secret-jwt-key-2024';

export async function authenticate(req) {
  try {
    await connectDB();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { error: { status: 401, message: 'No token provided' } };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return { error: { status: 404, message: 'User not found' } };
    }

    return { user };
  } catch (error) {
    return { error: { status: 401, message: 'Invalid token' } };
  }
}

export function isAdmin(user) {
  if (!user || !user.isAdmin) {
    return { error: { status: 403, message: 'Admin access required' } };
  }
  return { success: true };
}

