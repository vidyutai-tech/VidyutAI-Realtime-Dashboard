# 🚀 Simple Deployment Guide for VidyutAI Dashboard

## Quick Deploy to Vercel (vidyutai.in)

Since you already have the domain `vidyutai.in` on Vercel, here's the **simplest way** to deploy:

### Option 1: Frontend Only (Easiest - 5 minutes)

**For demo purposes, deploy just the frontend:**

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Link to your domain**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Domains
   - Add `vidyutai.in` and `www.vidyutai.in`

5. **Update API URL** (if backend is separate):
   - In Vercel Dashboard → Settings → Environment Variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.com/api/v1`

**Note:** For full functionality, you'll need to deploy backend separately (see Option 2).

---

### Option 2: Full Stack (Frontend + Backend)

#### Step 1: Deploy Frontend to Vercel

```bash
cd frontend
vercel --prod
```

#### Step 2: Deploy Backend (Choose one):

**A. Railway (Recommended - Free tier available)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway up
```

**B. Render (Free tier available)**
1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo
4. Set:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Environment: `Node`

**C. Vercel Serverless Functions** (For simple APIs)
- Create `api/` folder in root
- Move backend routes to serverless functions
- More complex setup

#### Step 3: Update Environment Variables

**In Vercel (Frontend):**
- `VITE_API_BASE_URL` = `https://your-backend-url.com/api/v1`

**In Backend (Railway/Render):**
- `FRONTEND_URL` = `https://vidyutai.in`
- `NODE_ENV` = `production`

---

### Option 3: All-in-One with Docker (Advanced)

If you want everything on one platform:

1. **Use Railway or Render** with Docker Compose
2. Deploy all services together
3. Point `vidyutai.in` to the deployed URL

---

## 🎯 Recommended Quick Setup (Demo)

**For a quick demo, use:**

1. **Frontend**: Vercel (vidyutai.in) ✅
2. **Backend**: Railway (free tier) - `vidyutai-backend.railway.app`
3. **AI Service**: Skip for demo (or use Railway too)

### Quick Commands:

```bash
# 1. Deploy Frontend
cd frontend
vercel --prod

# 2. Deploy Backend to Railway
cd backend
railway login
railway init
railway up

# 3. Get backend URL from Railway dashboard
# 4. Update Vercel env var: VITE_API_BASE_URL
```

---

## 📝 Environment Variables Checklist

### Frontend (Vercel):
- `VITE_API_BASE_URL` = Backend API URL

### Backend (Railway/Render):
- `PORT` = 5001 (or auto-assigned)
- `FRONTEND_URL` = `https://vidyutai.in`
- `NODE_ENV` = `production`
- Database: SQLite (file-based, works on most platforms)

---

## 🔧 Troubleshooting

**Issue: Frontend can't connect to backend**
- Check CORS settings in `backend/server.js`
- Verify `VITE_API_BASE_URL` in Vercel environment variables
- Check backend is running and accessible

**Issue: Socket.IO not working**
- Socket.IO needs WebSocket support
- Railway/Render support WebSockets
- Vercel serverless functions don't support WebSockets (use Railway for backend)

**Issue: Database errors**
- SQLite works on Railway/Render
- For production, consider PostgreSQL (Railway offers free tier)

---

## 🎉 After Deployment

1. Visit `https://vidyutai.in`
2. Test login/functionality
3. Check browser console for errors
4. Monitor backend logs in Railway/Render dashboard

---

## 💡 Pro Tips

- **Free Tier Limits**: Railway/Render have usage limits on free tier
- **Database**: SQLite is fine for demo, but consider PostgreSQL for production
- **SSL**: Vercel automatically provides SSL for your domain
- **Custom Domain**: Already configured on Vercel ✅

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs

