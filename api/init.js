// Initialize admin user endpoint (call once after deployment)
import { initializeAdmin } from './_lib/init.js';
import { corsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = await initializeAdmin();
    res.json({ 
      message: 'Admin user initialized successfully',
      admin: {
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ message: error.message || 'Failed to initialize admin' });
  }
}

