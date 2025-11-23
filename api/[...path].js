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
  // IMPORTANT: Log ALL requests to verify they reach this handler
  console.log('=== CATCH-ALL HANDLER CALLED ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Query:', JSON.stringify(req.query));
  
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Debug endpoint to test routing
  if (req.url && req.url.includes('/api/debug')) {
    return res.json({
      message: 'Catch-all route is working',
      url: req.url,
      method: req.method,
      query: req.query,
      catchAllPath: req.query['...path'],
      pathname: req.query?.path,
      headers: Object.keys(req.headers)
    });
  }

  // Extract pathname from request
  // In Vercel catch-all route [...path].js, the parameter is '...path' (with dots)
  let pathname = '/';
  try {
    // Always parse from URL first as it's most reliable
    if (req.url) {
      try {
        const urlPath = req.url.split('?')[0];
        // Remove /api prefix if present
        let extracted = urlPath.replace(/^\/api/, '') || '/';
        // Remove leading/trailing slashes
        extracted = extracted.replace(/^\/+|\/+$/g, '');
        if (extracted) {
          pathname = '/' + extracted;
        }
      } catch (urlError) {
        console.error('URL parsing error:', urlError);
      }
    }
    
    // Also check catch-all route parameter as fallback
    // Vercel uses '...path' as the key for catch-all routes
    const catchAllPath = req.query['...path'] || req.query.path;
    
    if (catchAllPath !== undefined && catchAllPath !== null && pathname === '/') {
      if (Array.isArray(catchAllPath)) {
        // Array format: ['settings', 'global'] -> '/settings/global'
        const segments = catchAllPath.filter(Boolean);
        pathname = segments.length > 0 ? '/' + segments.join('/') : '/';
      } else if (typeof catchAllPath === 'string' && catchAllPath.trim() !== '') {
        // String format: 'settings/global' or 'transactions' -> '/settings/global' or '/transactions'
        pathname = '/' + catchAllPath.trim();
      }
    }
    
    // Clean up pathname - ensure it's properly formatted
    // Remove query string if present in pathname
    pathname = pathname.split('?')[0].split('#')[0];
    // Normalize slashes
    pathname = pathname.replace(/\/+/g, '/');
    // Ensure it starts with / and doesn't end with / (except root)
    if (pathname !== '/') {
      pathname = '/' + pathname.replace(/^\/+|\/+$/g, '');
    }
    
    // Log for debugging
    console.log('API Request:', { 
      method: req.method, 
      pathname, 
      url: req.url, 
      query: req.query,
      catchAllPath: req.query['...path'],
      queryPath: req.query?.path,
      queryPathType: typeof req.query?.path,
      isArray: Array.isArray(req.query?.['...path']),
      rawQuery: JSON.stringify(req.query)
    });
  } catch (pathError) {
    console.error('Path extraction error:', pathError);
    return res.status(500).json({ message: 'Invalid request path', error: pathError.message });
  }

  try {
    let handled = false;
    
    // Route to appropriate handler
    if (pathname.startsWith('/auth')) {
      await authRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/users')) {
      await usersRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/games')) {
      await gamesRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/transactions')) {
      await transactionsRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/messages')) {
      await messagesRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/payments')) {
      await paymentsRoutes(req, res, pathname);
      handled = true;
    } else if (pathname.startsWith('/settings')) {
      await settingsRoutes(req, res, pathname);
      handled = true;
    } else if (pathname === '/health' || pathname.startsWith('/health')) {
      return res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        pathname
      });
    } else if (pathname === '/init' || pathname.startsWith('/init')) {
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

    // If route was handled but no response was sent, it means route not found in handler
    if (handled && !res.headersSent) {
      console.log('Route not found in handler:', pathname);
      return res.status(404).json({ message: 'Route not found', pathname });
    }
    
    // If route wasn't handled at all
    if (!handled) {
      console.log('Route not found:', pathname);
      return res.status(404).json({ message: 'Not found', pathname });
    }
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    
    // Only send error if response hasn't been sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: error.message || 'Internal server error',
        pathname,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

