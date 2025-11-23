# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: 404 Errors on API Routes

**Symptoms:**
- All API calls return 404
- Error: "The page cannot be found"
- API routes not working

**Solutions:**

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Go to **Functions** tab
   - Check if `api/[...path].js` is listed
   - Check for any errors

2. **Verify File Structure:**
   ```
   api/
   ├── [...path].js  ← This file must exist
   ├── _lib/
   └── routes/
   ```

3. **Check Environment Variables:**
   - Go to Settings → Environment Variables
   - Verify `MONGODB_URI` and `JWT_SECRET` are set
   - Make sure they're set for **all environments**

4. **Redeploy:**
   - After making changes, always redeploy
   - Go to Deployments → Click ⋯ → Redeploy

---

### Issue 2: "No token provided" Errors

**Symptoms:**
- 401 errors on authenticated endpoints
- "No token provided" error messages

**This is NORMAL if:**
- You're not logged in
- The page is trying to fetch data before login

**Solutions:**

1. **Login First:**
   - Go to the login page
   - Login with your credentials
   - The token will be stored in localStorage

2. **Check Token Storage:**
   - Open browser DevTools → Application → Local Storage
   - Look for `kachaTaka_token`
   - If missing, login again

3. **For Admin Login:**
   - Email: `admin@kachataka.com`
   - Password: `kachataka`
   - If admin doesn't exist, call: `POST /api/init`

---

### Issue 3: MongoDB Connection Fails

**Symptoms:**
- All database operations fail
- "MongoDB connection error" in logs
- Data not loading

**Solutions:**

1. **Check Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kachataka?retryWrites=true&w=majority
   ```
   - Verify it's set correctly in Vercel
   - Check for typos
   - Make sure it's set for **all environments**

2. **Check MongoDB Atlas:**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` to allow all IPs (for testing)
   - Or add Vercel's IP ranges

3. **Check Connection String:**
   - Verify username and password are correct
   - Check database name is correct
   - Verify cluster URL is correct

4. **Check Vercel Logs:**
   - Look for "✅ MongoDB Connected" message
   - If you see connection errors, check the error message

---

### Issue 4: Admin Can't Login

**Symptoms:**
- Admin login fails
- "Invalid email or password" error

**Solutions:**

1. **Initialize Admin:**
   ```bash
   POST https://your-domain.vercel.app/api/init
   ```
   Or use curl:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/init
   ```

2. **Check Admin Credentials:**
   - Email: `admin@kachataka.com`
   - Password: `kachataka`

3. **Check MongoDB:**
   - Verify MongoDB connection is working
   - Check if admin user exists in database

4. **Check JWT_SECRET:**
   - Verify `JWT_SECRET` is set in Vercel
   - Make sure it's the same across all environments

---

### Issue 5: API Returns HTML Instead of JSON

**Symptoms:**
- API calls return HTML (index.html)
- Error: "Unexpected token '<', "<!DOCTYPE "..."

**Solutions:**

1. **Check vercel.json:**
   - Make sure rewrites exclude `/api/*`
   - Should have: `"source": "/((?!api).*)"`

2. **Check API Route:**
   - Verify `api/[...path].js` exists
   - Check Vercel Functions tab to see if it's deployed

3. **Redeploy:**
   - Sometimes a redeploy fixes routing issues

---

### Issue 6: Functions Not Working After Deployment

**Symptoms:**
- Deployment succeeds but nothing works
- All API calls fail

**Checklist:**

1. ✅ **Environment Variables Set?**
   - `MONGODB_URI` - Required
   - `JWT_SECRET` - Required

2. ✅ **Redeployed After Setting Variables?**
   - Environment variables only apply after redeploy

3. ✅ **Check Vercel Logs:**
   - Look for errors in function logs
   - Check for connection errors

4. ✅ **Test Health Endpoint:**
   ```
   GET https://your-domain.vercel.app/api/health
   ```
   Should return: `{"status":"OK",...}`

---

## Quick Debugging Steps

1. **Check Vercel Dashboard:**
   - Go to Deployments → Latest deployment
   - Check Functions tab
   - Check Logs for errors

2. **Test API Endpoints:**
   ```bash
   # Health check
   curl https://your-domain.vercel.app/api/health
   
   # Initialize admin
   curl -X POST https://your-domain.vercel.app/api/init
   ```

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for API errors
   - Check Network tab for failed requests

4. **Check Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify all required variables are set
   - Make sure they're set for all environments

---

## Still Having Issues?

1. **Check Vercel Documentation:**
   - [Vercel Serverless Functions](https://vercel.com/docs/functions)
   - [Environment Variables](https://vercel.com/docs/environment-variables)

2. **Check Function Logs:**
   - Vercel Dashboard → Deployments → Functions → View Logs

3. **Test Locally:**
   - Run `npm run dev` locally
   - Test API endpoints
   - Check if issues are deployment-specific

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No token provided" | Not logged in | Login first |
| "404 Not Found" | Route not found | Check API route exists |
| "MongoDB connection error" | Database connection failed | Check MONGODB_URI |
| "Invalid token" | JWT verification failed | Check JWT_SECRET |
| "Unexpected token '<'" | API returning HTML | Check routing configuration |

