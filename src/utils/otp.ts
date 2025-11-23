// OTP Utility Functions
// This file handles OTP generation, storage, and verification

export interface OTPData {
  code: string;
  email: string;
  purpose: 'registration' | 'password-reset' | 'login';
  expiresAt: number;
  attempts: number;
}

const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const OTP_STORAGE_KEY = 'kachaTaka_otps';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in localStorage
export function storeOTP(email: string, code: string, purpose: OTPData['purpose']): void {
  // Normalize email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();
  
  const otps = getStoredOTPs();
  
  // Remove any existing OTPs for this email and purpose
  const filtered = otps.filter(
    (otp) => !(otp.email.trim().toLowerCase() === normalizedEmail && otp.purpose === purpose)
  );
  
  const otpData: OTPData = {
    code: normalizedCode,
    email: normalizedEmail,
    purpose,
    expiresAt: Date.now() + OTP_EXPIRY_TIME,
    attempts: 0,
  };
  
  console.log('Storing OTP:', {
    email: normalizedEmail,
    code: normalizedCode,
    purpose,
    expiresAt: new Date(otpData.expiresAt).toISOString()
  });
  
  filtered.push(otpData);
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filtered));
}

// Get stored OTPs
export function getStoredOTPs(): OTPData[] {
  try {
    const stored = localStorage.getItem(OTP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Verify OTP
export function verifyOTP(email: string, code: string, purpose: OTPData['purpose']): {
  valid: boolean;
  message: string;
} {
  // Normalize inputs (trim whitespace, lowercase email)
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();
  
  const otps = getStoredOTPs();
  
  // Debug logging
  console.log('Verifying OTP:', {
    email: normalizedEmail,
    code: normalizedCode,
    purpose,
    storedOTPs: otps.map(o => ({
      email: o.email,
      purpose: o.purpose,
      code: o.code,
      expiresAt: new Date(o.expiresAt).toISOString(),
      attempts: o.attempts
    }))
  });
  
  const otp = otps.find(
    (o) => o.email.trim().toLowerCase() === normalizedEmail && o.purpose === purpose
  );
  
  if (!otp) {
    console.error('OTP not found for:', { email: normalizedEmail, purpose });
    return { valid: false, message: 'OTP not found. Please request a new one.' };
  }
  
  // Check if expired
  if (Date.now() > otp.expiresAt) {
    console.error('OTP expired:', { expiresAt: new Date(otp.expiresAt).toISOString(), now: new Date().toISOString() });
    removeOTP(email, purpose);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  // Check attempts
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    console.error('Too many attempts:', { attempts: otp.attempts, max: MAX_OTP_ATTEMPTS });
    removeOTP(email, purpose);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Increment attempts
  otp.attempts += 1;
  updateOTP(otp);
  
  // Compare codes (normalize both)
  const storedCode = otp.code.trim();
  const inputCode = normalizedCode;
  
  console.log('Comparing codes:', {
    storedCode,
    inputCode,
    match: storedCode === inputCode
  });
  
  if (storedCode !== inputCode) {
    console.error('OTP mismatch:', { storedCode, inputCode, attempts: otp.attempts });
    return { valid: false, message: `Invalid OTP code. Please try again. (Attempts: ${otp.attempts}/${MAX_OTP_ATTEMPTS})` };
  }
  
  // OTP is valid, remove it
  console.log('OTP verified successfully!');
  removeOTP(email, purpose);
  return { valid: true, message: 'OTP verified successfully.' };
}

// Update OTP
function updateOTP(otp: OTPData): void {
  const otps = getStoredOTPs();
  const index = otps.findIndex(
    (o) => o.email === otp.email && o.purpose === otp.purpose
  );
  
  if (index !== -1) {
    otps[index] = otp;
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
  }
}

// Remove OTP
export function removeOTP(email: string, purpose: OTPData['purpose']): void {
  const otps = getStoredOTPs();
  const filtered = otps.filter(
    (o) => !(o.email === email && o.purpose === purpose)
  );
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filtered));
}

// Clean expired OTPs
export function cleanExpiredOTPs(): void {
  const otps = getStoredOTPs();
  const valid = otps.filter((otp) => Date.now() < otp.expiresAt);
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(valid));
}

// Get remaining time for OTP
export function getOTPRemainingTime(email: string, purpose: OTPData['purpose']): number {
  const otps = getStoredOTPs();
  const otp = otps.find(
    (o) => o.email === email && o.purpose === purpose
  );
  
  if (!otp) return 0;
  const remaining = otp.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
}

