# 🚀 Vercel Deployment Guide

## ✅ Current Status
- **Frontend**: Deployed at `spel.vidyutai.in`
- **Backend**: ❌ Not configured
- **AI Service**: ❌ Not configured

---

## 🔴 Issue: "Failed to fetch"

Your frontend is trying to connect to `localhost:5001`, which doesn't exist in production.

**Error:**
```
Failed to fetch
POST http://localhost:5001/api/v1/auth/register
```

---

## ✅ Fix: Deploy Backend & Configure URLs

### **Step 1: Deploy Backend**

#### **Option A: Railway (Recommended)**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Deploy Backend:**
```bash
cd backend
railway init
railway up
```

4. **Get the URL:**
```bash
railway domain
# Example output: your-project.railway.app
```

#### **Option B: Render.com**

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. **Settings:**
   - **Name**: `vidyutai-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=5001
     ```
5. Click "Create Web Service"

---

### **Step 2: Deploy AI Service**

#### **Railway Deployment:**
```bash
cd ai-service
railway init
railway up
```

#### **Render Deployment:**
Same as backend, but:
- **Root Directory**: `ai-service`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

---

### **Step 3: Configure Vercel Environment Variables**

1. **Go to Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Select your project** (spel-vidyutai-in)

3. **Go to Settings → Environment Variables**

4. **Add these variables:**

```bash
# Backend URL (from Railway/Render)
VITE_API_BASE_URL=https://vidyutai-backend.railway.app/api/v1

# AI Service URL (from Railway/Render)
VITE_AI_BASE_URL=https://vidyutai-ai.railway.app

# Groq API Key (for AI insights)
VITE_GROQ_API_KEY=your_groq_api_key_here
```

5. **Redeploy:**
   - Vercel will automatically redeploy with new environment variables
   - OR trigger manual redeploy from Deployments tab

---

## 🎯 Quick Fix (If Backend Already Deployed)

If your backend is already running somewhere, just:

1. **Find your backend URL** (e.g., `https://api.vidyutai.com`)
2. **Add to Vercel**:
   ```
   VITE_API_BASE_URL=https://api.vidyutai.com/api/v1
   ```
3. **Redeploy** on Vercel

---

## 🔍 Check if Backend is Running

Test your backend URL:
```bash
curl https://your-backend.railway.app/api/v1/sites
```

Should return:
```json
{
  "success": true,
  "data": [...]
}
```

---

## 📋 Required Environment Variables

### **Frontend (Vercel):**
```bash
VITE_API_BASE_URL=<backend-url>/api/v1
VITE_AI_BASE_URL=<ai-service-url>
```

### **Backend (Railway/Render):**
```bash
NODE_ENV=production
PORT=5001
JWT_SECRET=your_jwt_secret_here
```

### **AI Service (Railway/Render):**
```bash
GROQ_API_KEY=your_groq_api_key_here
PORT=8000
```

---

## ✅ Verification Steps

After deployment:

1. **Test Backend:**
   ```bash
   curl https://your-backend.railway.app/api/v1/sites
   ```

2. **Test AI Service:**
   ```bash
   curl https://your-ai-service.railway.app/health
   ```

3. **Test Frontend:**
   - Visit `spel.vidyutai.in`
   - Open browser console (F12)
   - Try to sign up
   - Check Network tab for API calls

---

## 🆘 Quick Fix (Temporary)

If you need a quick fix just to test:

**Deploy backend on Vercel too:**

1. Create new project in Vercel
2. Point to `backend` directory
3. Set build settings:
   - **Framework**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: `.`
   - **Install Command**: `npm install`
4. Add `vercel.json` to backend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

## 📞 Next Steps

**Tell me:**
1. Where is your backend deployed? (Railway/Render/AWS/Not yet)
2. Where is your AI service deployed? (Railway/Render/AWS/Not yet)
3. Or do you want me to help you deploy them?

Once I know where your backend is, I can give you the exact environment variable values to set in Vercel! 🚀

