// Email Service for sending OTP emails
// This file handles email sending using EmailJS (free tier, no backend needed)
// Alternative: You can replace this with your own backend API

// EmailJS Configuration
// You need to set these in your .env file or environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID_REGISTRATION = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_REGISTRATION || '';
const EMAILJS_TEMPLATE_ID_PASSWORD_RESET = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_PASSWORD_RESET || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Fallback to single template ID if separate ones are not provided
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

// Get template ID based on purpose
function getTemplateId(purpose: 'registration' | 'password-reset' | 'login'): string {
  if (purpose === 'registration' && EMAILJS_TEMPLATE_ID_REGISTRATION) {
    return EMAILJS_TEMPLATE_ID_REGISTRATION;
  }
  if (purpose === 'password-reset' && EMAILJS_TEMPLATE_ID_PASSWORD_RESET) {
    return EMAILJS_TEMPLATE_ID_PASSWORD_RESET;
  }
  // Fallback to single template ID or registration template
  return EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID_REGISTRATION || '';
}

// Check if EmailJS is configured
export const isEmailJSConfigured = () => {
  return !!(
    EMAILJS_SERVICE_ID && 
    EMAILJS_PUBLIC_KEY && 
    (EMAILJS_TEMPLATE_ID_REGISTRATION || EMAILJS_TEMPLATE_ID_PASSWORD_RESET || EMAILJS_TEMPLATE_ID)
  );
};

// Send OTP via EmailJS
export async function sendOTPEmail(
  email: string,
  otpCode: string,
  purpose: 'registration' | 'password-reset' | 'login'
): Promise<{ success: boolean; message: string }> {
  // If EmailJS is not configured, use mock mode for development
  if (!isEmailJSConfigured()) {
    console.warn('EmailJS not configured. Using mock mode.');
    console.log(`[MOCK] OTP for ${email}: ${otpCode} (Purpose: ${purpose})`);
    
    // In development, you can check the console for the OTP
    // In production, you MUST configure EmailJS or use a backend service
    return {
      success: true,
      message: 'OTP sent (mock mode - check console)',
    };
  }

  try {
    // Dynamically import EmailJS
    const emailjs = await import('@emailjs/browser');
    
    // Get the appropriate template ID based on purpose
    const templateId = getTemplateId(purpose);
    
    if (!templateId) {
      throw new Error('Template ID not configured for this purpose');
    }
    
    // EmailJS template parameters
    // Common variable names: to_email, user_email, email, recipient_email
    // Make sure your EmailJS template uses one of these variable names
    // OTP variable names: otp_code, otp, passcode, code
    const templateParams = {
      to_email: email,        // Primary recipient email variable
      user_email: email,      // Alternative variable name
      email: email,           // Simple email variable
      recipient_email: email, // Another alternative
      otp_code: otpCode,      // Primary OTP variable
      otp: otpCode,           // Alternative OTP variable name
      passcode: otpCode,      // Your template uses {{passcode}}
      code: otpCode,          // Another alternative
      purpose: purpose === 'registration' 
        ? 'Account Registration' 
        : purpose === 'password-reset'
        ? 'Password Reset'
        : 'Login Verification',
      app_name: 'Kacha Taka Gaming Platform',
      time: new Date(Date.now() + 5 * 60 * 1000).toLocaleString(), // 5 minutes from now
    };

    // Log for debugging (remove in production)
    console.log('Sending email with params:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: templateId,
      email: email,
      otpCode: otpCode,
      purpose: purpose
    });

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    return {
      success: true,
      message: 'OTP sent successfully to your email',
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      message: error.message
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to send OTP. Please try again.';
    
    if (error.status === 422) {
      errorMessage = 'Email configuration error: Please check that your EmailJS template has the correct email variable (to_email, user_email, or email).';
    } else if (error.text) {
      errorMessage = error.text;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// Alternative: Send OTP via your own backend API
// Replace the sendOTPEmail function with this if you have a backend:
/*
export async function sendOTPEmail(
  email: string,
  otpCode: string,
  purpose: 'registration' | 'password-reset' | 'login'
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp: otpCode,
        purpose,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return {
      success: true,
      message: 'OTP sent successfully to your email',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    };
  }
}
*/

