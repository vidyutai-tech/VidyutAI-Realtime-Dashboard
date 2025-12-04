# 🚀 Deploy VidyutAI on Vercel - Complete Guide

## ✅ What I've Set Up

I've configured your project to deploy **Frontend + Backend** on Vercel.

**Files Modified:**
- ✅ `vercel.json` - Multi-service deployment config
- ✅ `backend/server.js` - Vercel-compatible export
- ✅ `api/index.js` - Backend serverless entry point
- ✅ `frontend/services/api.ts` - Auto-detect production URLs

---

## 📋 Step-by-Step Deployment

### **Step 1: Commit Your Changes**

```bash
git add .
git commit -m "Configure Vercel deployment for frontend and backend"
git push origin main
```

### **Step 2: Vercel Will Auto-Deploy**

If your Vercel project is connected to GitHub:
- Vercel will automatically detect the push
- It will rebuild with the new configuration
- Wait 2-3 minutes for deployment

### **Step 3: Verify Deployment**

**Test Backend:**
```bash
curl https://spel.vidyutai.in/api/v1/sites
```

Should return:
```json
{
  "success": true,
  "data": [...]
}
```

**Test Frontend:**
- Visit https://spel.vidyutai.in
- Try to sign up/login
- Should work now! ✅

---

## ⚠️ AI Service Limitation

**Problem:** Vercel Python functions have limitations:
- 50 MB deployment limit
- Your ML models (`.joblib` files) might exceed this
- No persistent file system

**Solution:** Deploy AI service separately on **Railway** or **Render**

---

## 🚂 Deploy AI Service on Railway (Recommended)

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login**
```bash
railway login
```

### **Step 3: Deploy AI Service**
```bash
cd ai-service
railway init --name vidyutai-ai
railway up
```

### **Step 4: Get URL**
```bash
railway domain
# Example output: vidyutai-ai.railway.app
```

### **Step 5: Update Vercel Environment Variable**

1. Go to: https://vercel.com/dashboard
2. Select your project: `spel-vidyutai`
3. Go to: **Settings** → **Environment Variables**
4. Add/Update:
   ```
   Name: VITE_AI_BASE_URL
   Value: https://vidyutai-ai.railway.app
   ```
5. **Redeploy** (Vercel will auto-redeploy)

---

## 🎯 Final Architecture

```
Frontend (Vercel)
  ↓
https://spel.vidyutai.in
  ↓
Backend (Vercel Serverless)
  ↓
https://spel.vidyutai.in/api/v1
  ↓
AI Service (Railway)
  ↓
https://vidyutai-ai.railway.app
```

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Frontend loads: https://spel.vidyutai.in
- [ ] Backend API works: https://spel.vidyutai.in/api/v1/sites
- [ ] Login/Signup works
- [ ] AI forecasting works (needs AI service on Railway)
- [ ] AI predictions work (needs AI service on Railway)

---

## 🆘 If Something Goes Wrong

### **Check Vercel Logs:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on latest deployment
4. Check **Build Logs** and **Function Logs**

### **Common Issues:**

**Issue 1: "Failed to fetch"**
- ✅ Fixed: Frontend now uses production URLs

**Issue 2: "Module not found"**
- Check `backend/package.json` dependencies
- Ensure `npm install` works locally

**Issue 3: "Database locked"**
- SQLite doesn't work on Vercel (read-only filesystem)
- Solution: Use in-memory mock data OR switch to PostgreSQL

---

## 📞 Next Steps

**Now:**
```bash
git add .
git commit -m "Configure Vercel deployment"
git push
```

**Wait 2-3 minutes** for Vercel to deploy.

**Then test:** https://spel.vidyutai.in

**For AI Service:**
```bash
cd ai-service
railway login
railway init
railway up
```

---

**Your app should work now!** 🎉
