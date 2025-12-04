# 🔧 Backend Deployment on Vercel - Architecture Explained

## 📁 File Structure

```
VidyutAI Realtime Dashboard/
├── vercel.json              ← Main config (orchestrates all 3 services)
├── api/
│   └── index.js            ← Backend entry point (serverless function)
└── backend/
    ├── server.js           ← Express app (imported by api/index.js)
    ├── database/
    ├── routes/
    └── services/
```

---

## 🔗 How Backend is Deployed

### **Step 1: Root vercel.json Defines Build**

```json
{
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ]
}
```

This tells Vercel:
- ✅ Build `api/index.js` as a Node.js serverless function
- ✅ Use `@vercel/node` runtime
- ✅ Bundle all dependencies from `backend/`

---

### **Step 2: api/index.js Imports Backend**

```javascript
// api/index.js
const app = require('../backend/server');
module.exports = app;
```

This simple file:
- ✅ Imports your Express app from `backend/server.js`
- ✅ Exports it as a Vercel serverless function
- ✅ Handles all HTTP requests

---

### **Step 3: backend/server.js Exports App**

```javascript
// backend/server.js (end of file)
module.exports = app;

// Only start server locally (not on Vercel)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log('Server running...');
  });
}
```

This modification:
- ✅ Exports `app` for Vercel to use
- ✅ Skips `server.listen()` on Vercel (serverless)
- ✅ Still works locally with `npm start`

---

### **Step 4: Routes Map URLs to Functions**

```json
{
  "routes": [
    {
      "src": "/api/v1/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

This means:
- URL: `https://spel.vidyutai.in/api/v1/sites`
- Vercel routes to: `api/index.js`
- Which runs: `backend/server.js`
- Which handles: Express route `/sites`

---

## 🎯 Request Flow

```
User Browser
  ↓
https://spel.vidyutai.in/api/v1/auth/register
  ↓
Vercel Routing Layer
  ↓ (matches /api/v1/*)
  ↓
api/index.js (Serverless Function)
  ↓ (requires backend/server.js)
  ↓
backend/server.js (Express App)
  ↓ (routes to /api/v1/auth/register)
  ↓
backend/routes/auth.js
  ↓
Response back to user
```

---

## 📦 What Gets Deployed

When Vercel builds `api/index.js`, it automatically:
1. ✅ Detects dependencies from `backend/package.json`
2. ✅ Installs all npm packages
3. ✅ Bundles entire `backend/` folder
4. ✅ Creates a serverless function (~5 MB)
5. ✅ Deploys to Vercel's edge network

---

## 🔄 Local vs Production

### **Local Development:**
```bash
cd backend
npm start
# Runs: server.listen(5001)
# Server: http://localhost:5001
```

### **Vercel Production:**
```bash
# No server.listen() - Vercel handles HTTP
# Serverless function invoked per request
# URL: https://spel.vidyutai.in/api/v1
```

---

## ✅ Key Benefits

1. **Automatic Scaling**: Vercel scales based on traffic
2. **Global CDN**: Backend deployed to multiple regions
3. **Zero Config**: No server management needed
4. **Cost Efficient**: Pay only for requests
5. **HTTPS**: Free SSL certificate

---

## ⚠️ Limitations

1. **10-second timeout**: Long operations fail
2. **No persistent storage**: In-memory SQLite resets
3. **No WebSocket**: Socket.IO won't work
4. **Cold starts**: First request may be slow

---

## 🎯 Summary

**Backend deployment method:**
```
Root vercel.json 
  → Builds api/index.js 
    → Imports backend/server.js 
      → Bundles backend/* 
        → Deploys as serverless function
```

**That's it!** Your entire Express backend runs as a Vercel serverless function! 🚀
