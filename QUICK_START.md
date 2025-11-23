# ⚡ Quick Start - Vercel Deployment

## 🚀 Deploy in 3 Steps

### 1. Set Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these:
```
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key
VITE_EMAILJS_SERVICE_ID=your-service-id (optional)
VITE_EMAILJS_PUBLIC_KEY=your-public-key (optional)
```

### 2. Deploy

**Option A - GitHub:**
- Push code to GitHub
- Go to vercel.com/new
- Import repository
- Deploy!

**Option B - CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Initialize Admin

After deployment, call:
```
POST https://your-domain.vercel.app/api/init
```

Or just login with:
- Email: `admin@kachataka.com`
- Password: `kachataka`

---

## ✅ That's It!

Your platform is now live and all features work:
- ✅ User registration & login
- ✅ All games (Crash, Mines, Slots, Dice)
- ✅ MongoDB integration
- ✅ EmailJS (if configured)
- ✅ Admin panel
- ✅ Payments & transactions
- ✅ Everything!

---

## 📚 Full Documentation

- **Deployment Guide**: `VERCEL_DEPLOYMENT.md`
- **Complete Summary**: `DEPLOYMENT_SUMMARY.md`
- **MongoDB Setup**: `README_MONGODB.md`

---

## 🎯 Test Your Deployment

1. Health Check: `https://your-domain.vercel.app/api/health`
2. Register a user
3. Play games
4. Check admin panel

**Everything is ready!** 🎉

