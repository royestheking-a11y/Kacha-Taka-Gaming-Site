# 🔐 Environment Variables Setup for Vercel

## ⚠️ CRITICAL: You MUST set these environment variables in Vercel!

Without these environment variables, your application will NOT work:
- ❌ MongoDB connection will fail
- ❌ Authentication will fail
- ❌ Admin login will fail
- ❌ All API endpoints will fail

---

## 📋 Required Environment Variables

### 1. **MONGODB_URI** (REQUIRED)
```
MONGODB_URI=mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority
```

**OR** use your own MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kachataka?retryWrites=true&w=majority
```

### 2. **JWT_SECRET** (REQUIRED)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important**: Use a strong, random string (at least 32 characters)

---

## 🚀 How to Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project: **Kacha-Taka-Gaming-Site**

### Step 2: Navigate to Settings
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar

### Step 3: Add Environment Variables

#### Add MONGODB_URI:
1. Click **Add New**
2. **Key**: `MONGODB_URI`
3. **Value**: `mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority`
4. **Environment**: Select **Production**, **Preview**, and **Development** (all three)
5. Click **Save**

#### Add JWT_SECRET:
1. Click **Add New**
2. **Key**: `JWT_SECRET`
3. **Value**: `kachataka-super-secret-jwt-key-2024` (or generate a new one)
4. **Environment**: Select **Production**, **Preview**, and **Development** (all three)
5. Click **Save**

### Step 4: Redeploy
After adding environment variables, you MUST redeploy:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## 📧 Optional: EmailJS Variables (for OTP emails)

If you want to use EmailJS for sending OTP emails:

```
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID_REGISTRATION=your-template-id
VITE_EMAILJS_TEMPLATE_ID_PASSWORD_RESET=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

**Note**: These are `VITE_*` variables, so they're exposed to the frontend.

---

## ✅ Verification

After setting environment variables and redeploying:

1. **Test Health Endpoint**:
   ```
   https://your-domain.vercel.app/api/health
   ```
   Should return: `{"status":"OK","message":"Server is running",...}`

2. **Test MongoDB Connection**:
   Try to register a new user or login. If MongoDB is connected, it will work.

3. **Check Vercel Logs**:
   - Go to **Deployments** → Click on deployment → **Functions** tab
   - Check for MongoDB connection logs
   - Look for errors

---

## 🐛 Troubleshooting

### MongoDB Connection Fails
- ✅ Verify `MONGODB_URI` is set correctly
- ✅ Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for all IPs)
- ✅ Verify network access in MongoDB Atlas
- ✅ Check Vercel function logs for connection errors

### Authentication Fails
- ✅ Verify `JWT_SECRET` is set
- ✅ Check that environment variables are set for **all environments** (Production, Preview, Development)
- ✅ Redeploy after setting environment variables

### Admin Can't Login
- ✅ First, initialize admin: `POST /api/init`
- ✅ Or login with: `admin@kachataka.com` / `kachataka`
- ✅ Check MongoDB connection is working
- ✅ Verify JWT_SECRET is set

---

## 🔒 Security Notes

1. **Never commit** `.env` files to Git
2. **Use strong JWT_SECRET** in production
3. **Restrict MongoDB access** to specific IPs if possible
4. **Rotate secrets** regularly

---

## 📝 Quick Checklist

- [ ] `MONGODB_URI` set in Vercel
- [ ] `JWT_SECRET` set in Vercel
- [ ] Environment variables set for **all environments**
- [ ] Project redeployed after setting variables
- [ ] Health endpoint returns OK
- [ ] MongoDB connection working
- [ ] Admin can login

---

**⚠️ IMPORTANT**: Without these environment variables, your application will NOT work!

