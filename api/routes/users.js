import connectDB from '../_lib/db.js';
import User from '../../server/models/User.js';
import { authenticate, isAdmin } from '../_lib/auth.js';

export default async function usersRoutes(req, res, pathname) {
  await connectDB();

  // Get all users (Admin only)
  if (pathname === '/users' && req.method === 'GET') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const adminCheck = isAdmin(authResult.user);
      if (adminCheck.error) {
        return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
      }

      const users = await User.find().select('-password').sort({ createdAt: -1 });
      // Transform MongoDB documents to JSON format
      return res.json(users.map(user => user.toJSON()));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Get user by referral code
  if (pathname.startsWith('/users/referral/') && req.method === 'GET') {
    try {
      const code = pathname.split('/users/referral/')[1];
      const user = await User.findOne({ referralCode: code.toUpperCase() }).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user.toJSON());
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Get user referrals
  if (pathname.match(/^\/users\/[^/]+\/referrals$/) && req.method === 'GET') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const id = pathname.split('/users/')[1].split('/referrals')[0];
      const referrals = await User.find({ referredBy: id }).select('-password');
      return res.json(referrals.map(user => user.toJSON()));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Update user balance (Admin only)
  if (pathname.match(/^\/users\/[^/]+\/balance$/) && req.method === 'PATCH') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const adminCheck = isAdmin(authResult.user);
      if (adminCheck.error) {
        return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
      }

      const id = pathname.split('/users/')[1].split('/balance')[0];
      const { demoPoints, realBalance } = req.body;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (demoPoints !== undefined) user.demoPoints = demoPoints;
      if (realBalance !== undefined) user.realBalance = realBalance;

      await user.save();
      return res.json(user.toJSON());
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Get user by ID or Update user
  if (pathname.match(/^\/users\/[^/]+$/) && !pathname.includes('/referrals') && !pathname.includes('/balance')) {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const id = pathname.split('/users/')[1];

      if (req.method === 'GET') {
        const user = await User.findById(id).select('-password');
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user.toJSON());
      } else if (req.method === 'PUT') {
        if (id !== authResult.user._id.toString() && !authResult.user.isAdmin) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (authResult.user.isAdmin) {
          Object.assign(user, req.body);
        } else {
          if (req.body.demoPoints !== undefined) user.demoPoints = req.body.demoPoints;
          if (req.body.realBalance !== undefined) user.realBalance = req.body.realBalance;
          if (req.body.name !== undefined) user.name = req.body.name;
          if (req.body.phone !== undefined) user.phone = req.body.phone;
        }

        await user.save();
        return res.json(user.toJSON());
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

