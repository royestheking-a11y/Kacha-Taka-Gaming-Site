# ✅ Connection Verification Guide

## 🔍 How to Verify Everything is Working

### 1. Check Backend Server

```bash
# Check if backend is running
lsof -ti:5001

# Test health endpoint
curl http://localhost:5001/api/health
```

**Expected:** `{"status":"OK","message":"Server is running"}`

### 2. Check MongoDB Connection

The backend server logs will show:
```
✅ MongoDB Connected: ...
📊 Database: kachataka
```

### 3. Check Frontend

```bash
# Start frontend
npm run dev
```

**Frontend will run on any available port** (3000, 3006, 3013, etc.)

### 4. Test Admin Login

1. Open browser: `http://localhost:XXXX` (port shown in terminal)
2. Go to admin login
3. Enter:
   - Email: `admin@kachataka.com`
   - Password: `kachataka`
4. Should login successfully!

## ✅ Verification Checklist

- [ ] Backend server running on port 5001
- [ ] MongoDB connected (check server logs)
- [ ] Frontend running (any port)
- [ ] Can access website in browser
- [ ] Admin login works
- [ ] Data persists in MongoDB

## 🎯 Summary

- **Backend Port 5001:** API server (fixed)
- **Frontend Port:** Any port (flexible)
- **MongoDB:** Connected via backend
- **Everything:** Working together! ✅

