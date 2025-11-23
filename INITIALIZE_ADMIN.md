# 🔧 Initialize Admin User

## ⚠️ IMPORTANT: Admin User Must Be Created First!

The admin user doesn't exist in the database yet. You need to initialize it.

---

## 🚀 Method 1: Using API Endpoint (Recommended)

### Step 1: Call the Init Endpoint

Open your browser or use curl:

```bash
curl -X POST https://kacha-taka-gaming-site.vercel.app/api/init
```

Or visit this URL in your browser:
```
https://kacha-taka-gaming-site.vercel.app/api/init
```

**Note**: This is a POST request, so you might need to use a tool like Postman or curl.

### Step 2: Verify Admin Created

After calling the endpoint, you should see:
```json
{
  "message": "Admin user initialized successfully",
  "admin": {
    "email": "admin@kachataka.com",
    "name": "Super Admin"
  }
}
```

### Step 3: Login

Now you can login with:
- **Email**: `admin@kachataka.com`
- **Password**: `kachataka`

---

## 🚀 Method 2: Using Browser Console

1. Open your deployed site: `https://kacha-taka-gaming-site.vercel.app`
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Run this command:

```javascript
fetch('https://kacha-taka-gaming-site.vercel.app/api/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Admin initialized:', data))
.catch(err => console.error('Error:', err));
```

---

## 🚀 Method 3: Using Postman or Similar Tool

1. Open Postman (or similar API tool)
2. Create a new request:
   - **Method**: `POST`
   - **URL**: `https://kacha-taka-gaming-site.vercel.app/api/init`
   - **Headers**: `Content-Type: application/json`
3. Click **Send**
4. You should see the success message

---

## ✅ After Initialization

Once the admin is initialized:

1. **Go to Admin Login Page**
   - Visit: `https://kacha-taka-gaming-site.vercel.app`
   - Click on "Admin Login" or navigate to admin login

2. **Login with Credentials:**
   - Email: `admin@kachataka.com`
   - Password: `kachataka`

3. **You should now be able to:**
   - Access admin panel
   - View all users
   - Manage settings
   - View transactions
   - Manage payments

---

## 🐛 Troubleshooting

### If Init Endpoint Returns Error:

1. **Check MongoDB Connection:**
   - Verify `MONGODB_URI` is set in Vercel
   - Check Vercel logs for MongoDB connection errors

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Functions
   - Look for errors when calling `/api/init`

3. **Try Again:**
   - The endpoint is idempotent (safe to call multiple times)
   - If admin already exists, it will just return the existing admin

### If Login Still Fails After Init:

1. **Verify Admin Exists:**
   - Check MongoDB database
   - Look for user with email `admin@kachataka.com`

2. **Check Password:**
   - Make sure you're using: `kachataka` (all lowercase)

3. **Check JWT_SECRET:**
   - Verify `JWT_SECRET` is set in Vercel
   - Make sure it's the same across all environments

---

## 📝 Admin Credentials

- **Email**: `admin@kachataka.com`
- **Password**: `kachataka`
- **Initial Balance**: 100,000 points
- **Initial Demo Points**: 100 points

---

## ✅ Success Indicators

After successful initialization and login:

- ✅ Admin panel loads
- ✅ Can see users list
- ✅ Can view transactions
- ✅ Can manage settings
- ✅ No 401 errors on admin endpoints

---

**Once admin is initialized, everything should work!** 🎉

