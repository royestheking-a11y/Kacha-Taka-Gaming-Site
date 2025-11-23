import connectDB from '../_lib/db.js';
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
    
    const { email, code, purpose } = req.body;

    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      purpose,
      code: code.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Increment attempts
    otp.attempts += 1;
    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        valid: false,
        message: 'Too many attempts. Please request a new OTP.' 
      });
    }

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otp._id });

    res.json({ 
      valid: true,
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      valid: false,
      message: error.message || 'OTP verification failed' 
    });
  }
}

