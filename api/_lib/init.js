// Initialize default admin user (run once on deployment)
import connectDB from './db.js';
import User from '../../server/models/User.js';

export async function initializeAdmin() {
  try {
    await connectDB();
    
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
      return admin;
    } else {
      console.log('✅ Admin user already exists');
      return adminExists;
    }
  } catch (error) {
    console.error('Error initializing admin:', error.message);
    throw error;
  }
}

