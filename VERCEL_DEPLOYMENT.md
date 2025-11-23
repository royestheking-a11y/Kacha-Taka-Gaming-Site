# 🚀 Vercel Deployment Guide

This project has been fully configured for deployment on Vercel with MongoDB integration and EmailJS support.

## ✅ What's Been Configured

1. **Serverless Functions**: All Express routes converted to Vercel serverless functions in `/api` directory
2. **MongoDB Connection**: Optimized for serverless with connection pooling
3. **CORS**: Configured for Vercel deployment
4. **API Routes**: All endpoints work as serverless functions
5. **EmailJS**: Client-side email service configured
6. **Build Configuration**: Vite configured for Vercel

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Your MongoDB connection string
3. **EmailJS Account**: For sending OTP emails (optional but recommended)

## 🔧 Environment Variables Setup

### In Vercel Dashboard:

1. Go to your project settings → Environment Variables
2. Add the following variables:

#### Required:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/kachataka?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Optional (for EmailJS):
```
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID_REGISTRATION=your-registration-template-id
VITE_EMAILJS_TEMPLATE_ID_PASSWORD_RESET=your-password-reset-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

**Note**: 
- `VITE_*` variables are exposed to the frontend
- Non-`VITE_*` variables are only available in serverless functions
- Make sure to set these for **Production**, **Preview**, and **Development** environments

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect the settings
5. Add environment variables in the dashboard
6. Click "Deploy"

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── _lib/              # Shared utilities (db, auth, cors)
│   ├── auth/              # Authentication endpoints
│   ├── users/             # User management endpoints
│   ├── games/             # Game-related endpoints
│   ├── transactions/      # Transaction endpoints
│   ├── messages/          # Message endpoints
│   ├── payments/          # Payment request endpoints
│   └── settings/          # Settings endpoints
├── server/                # Original Express server (kept for reference)
├── src/                   # React frontend
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## 🔌 API Endpoints

All API endpoints are available at `/api/*`:

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, etc.
- **Users**: `/api/users`, `/api/users/[id]`, etc.
- **Games**: `/api/games/history`, `/api/games/stats`
- **Transactions**: `/api/transactions`
- **Messages**: `/api/messages`
- **Payments**: `/api/payments`
- **Settings**: `/api/settings/game`, `/api/settings/global`, `/api/settings/stats`
- **Health**: `/api/health`

## 🗄️ MongoDB Connection

The MongoDB connection is optimized for serverless:
- Connection pooling across function invocations
- Automatic reconnection handling
- Efficient connection reuse

## 📧 EmailJS Setup

1. Sign up at [emailjs.com](https://www.emailjs.com)
2. Create email service (Gmail, Outlook, etc.)
3. Create email templates for:
   - Registration OTP
   - Password Reset OTP
4. Get your Service ID, Template IDs, and Public Key
5. Add them as environment variables in Vercel

### EmailJS Template Variables

Your EmailJS templates should use these variables:
- `{{to_email}}` or `{{user_email}}` or `{{email}}` - Recipient email
- `{{otp_code}}` or `{{otp}}` or `{{passcode}}` or `{{code}}` - OTP code
- `{{purpose}}` - Purpose of OTP (Registration, Password Reset, etc.)

## 🔒 Security Notes

1. **JWT_SECRET**: Use a strong, random string in production
2. **MONGODB_URI**: Keep your connection string secure
3. **CORS**: Currently set to allow all origins (`*`). For production, consider restricting to your domain
4. **Environment Variables**: Never commit `.env` files to Git

## 🧪 Testing After Deployment

1. **Health Check**: Visit `https://your-domain.vercel.app/api/health`
2. **User Registration**: Test creating a new account
3. **Login**: Test user authentication
4. **Games**: Test game functionality
5. **Admin Panel**: Login with admin credentials
   - Email: `admin@kachataka.com`
   - Password: `kachataka`

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)
- Verify network access in MongoDB Atlas

### API Errors
- Check Vercel function logs in dashboard
- Verify environment variables are set correctly
- Check CORS headers if getting CORS errors

### Build Errors
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility
- Review build logs in Vercel dashboard

## 📝 Notes

- The original Express server in `/server` is kept for reference but not used in Vercel deployment
- All API routes are now serverless functions in `/api`
- Frontend automatically uses relative API paths in production (`/api`)
- EmailJS works client-side, so no backend changes needed

## 🎉 Success!

Once deployed, your application will be available at:
- Production: `https://your-project.vercel.app`
- Preview: `https://your-project-git-branch.vercel.app`

All functions and MongoDB integration will work seamlessly on Vercel!

