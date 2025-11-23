// Main API router for Vercel - consolidates all endpoints into one function
import { corsHeaders } from './_lib/cors.js';

// Import route handlers
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import gamesRoutes from './routes/games.js';
import transactionsRoutes from './routes/transactions.js';
import messagesRoutes from './routes/messages.js';
import paymentsRoutes from './routes/payments.js';
import settingsRoutes from './routes/settings.js';

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace('/api', '');

  try {
    // Route to appropriate handler
    if (pathname.startsWith('/auth')) {
      return await authRoutes(req, res, pathname);
    } else if (pathname.startsWith('/users')) {
      return await usersRoutes(req, res, pathname);
    } else if (pathname.startsWith('/games')) {
      return await gamesRoutes(req, res, pathname);
    } else if (pathname.startsWith('/transactions')) {
      return await transactionsRoutes(req, res, pathname);
    } else if (pathname.startsWith('/messages')) {
      return await messagesRoutes(req, res, pathname);
    } else if (pathname.startsWith('/payments')) {
      return await paymentsRoutes(req, res, pathname);
    } else if (pathname.startsWith('/settings')) {
      return await settingsRoutes(req, res, pathname);
    } else if (pathname === '/health') {
      return res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    } else if (pathname === '/init') {
      if (req.method === 'POST') {
        const { initializeAdmin } = await import('./_lib/init.js');
        const admin = await initializeAdmin();
        return res.json({ 
          message: 'Admin user initialized successfully',
          admin: {
            email: admin.email,
            name: admin.name
          }
        });
      }
      return res.status(405).json({ message: 'Method not allowed' });
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

