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

  // Extract pathname from request
  // In Vercel catch-all route, req.query.path is an array of path segments
  let pathname = '/';
  try {
    // Method 1: Check for catch-all route parameter (most reliable for Vercel)
    if (req.query && typeof req.query.path !== 'undefined') {
      // Catch-all route: req.query.path can be a string or array
      if (Array.isArray(req.query.path)) {
        // Array format: ['settings', 'global'] -> '/settings/global'
        pathname = '/' + req.query.path.filter(Boolean).join('/');
      } else if (typeof req.query.path === 'string') {
        // String format: 'settings/global' -> '/settings/global'
        pathname = '/' + req.query.path;
      }
    }
    
    // Method 2: Parse from URL if pathname is still '/' or invalid
    if ((pathname === '/' || !pathname) && req.url) {
      const urlPath = req.url.split('?')[0];
      // Remove /api prefix if present
      const extracted = urlPath.replace(/^\/api/, '') || '/';
      if (extracted !== '/') {
        pathname = extracted;
      }
    }
    
    // Clean up pathname
    // Remove query string if present in pathname
    pathname = pathname.split('?')[0];
    // Remove leading/trailing slashes except for root
    pathname = pathname.replace(/^\/+|\/+$/g, '');
    if (!pathname) {
      pathname = '/';
    } else if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }
    
    // Log for debugging
    console.log('API Request:', { 
      method: req.method, 
      pathname, 
      url: req.url, 
      query: req.query,
      queryPath: req.query?.path,
      queryPathType: typeof req.query?.path,
      isArray: Array.isArray(req.query?.path)
    });
  } catch (pathError) {
    console.error('Path extraction error:', pathError);
    return res.status(500).json({ message: 'Invalid request path', error: pathError.message });
  }

  try {
    // Route to appropriate handler
    if (pathname.startsWith('/auth')) {
      const result = await authRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/users')) {
      const result = await usersRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/games')) {
      const result = await gamesRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/transactions')) {
      const result = await transactionsRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/messages')) {
      const result = await messagesRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/payments')) {
      const result = await paymentsRoutes(req, res, pathname);
      if (result) return result;
    } else if (pathname.startsWith('/settings')) {
      const result = await settingsRoutes(req, res, pathname);
      if (result) return result;
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

    console.log('Route not found:', pathname);
    return res.status(404).json({ message: 'Not found', pathname });
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: error.message || 'Internal server error',
      pathname,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

