import connectDB from '../_lib/db.js';
import User from '../../server/models/User.js';
import OTP from '../../server/models/OTP.js';
import { corsHeaders } from '../_lib/cors.js';

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
    await connectDB();
    
    const { email, purpose } = req.body;

    // Check if user exists for password reset
    if (purpose === 'password-reset') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove old OTPs
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose 
    });

    // Store new OTP
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose,
      expiresAt
    });

    console.log(`[OTP] Generated for ${email}: ${otpCode} (${purpose})`);

    res.json({ 
      message: 'OTP sent successfully',
      success: true,
      otp: otpCode // Return OTP so frontend can send email
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
}

