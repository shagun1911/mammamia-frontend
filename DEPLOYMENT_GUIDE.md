# 🚀 Free Deployment Guide for KepleroAI

This guide will help you deploy your KepleroAI project completely **FREE** using various free-tier services.
..
## 📋 Overview

- **Frontend (Next.js)**: Vercel (Free Tier)..
- **Backend (Express API)**: Render (Free Tier)
- **Database**: MongoDB Atlas (Free Tier - 512MB)
- **Redis**: Upstash (Free Tier - 10K commands/day)
- **File Storage**: Cloudinary (Free Tier - 25GB storage)

-----


## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Sign up for free account..
3. Create a **FREE M0 Cluster** (512MB storage, shared)

### 1.2 Configure Database
1. Click **"Build a Database"** → Select **"M0 FREE"**
2. Choose a cloud provider and region (closest to your users)
3. Cluster Name: `keplero-cluster`

### 1.3 Setup Access
1. **Database Access**: Create a database user
   - Username: `keplero_admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: **Read and write to any database**

2. **Network Access**: Add IP addresses
   - Click **"Add IP Address"**
   - Choose **"Allow access from anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to specific IPs

### 1.4 Get Connection String
1. Click **"Connect"** → **"Connect your application"**
2. Copy the connection string:
   ```
   mongodb+srv://keplero_admin:<password>@keplero-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password
4. Add database name: `/chatbot_platform` before the `?`
   ```
   mongodb+srv://keplero_admin:YOUR_PASSWORD@keplero-cluster.xxxxx.mongodb.net/chatbot_platform?retryWrites=true&w=majority
   ```

---

## 🔴 Step 2: Setup Upstash Redis (Caching)

### 2.1 Create Account
1. Go to [Upstash](https://upstash.com/)
2. Sign up with GitHub/Google
3. Create a **Redis Database**

### 2.2 Configure Redis
1. Name: `keplero-redis`
2. Type: **Regional**
3. Region: Choose closest to your backend
4. Click **"Create"**

### 2.3 Get Connection URL
1. In your database dashboard, copy the **REST URL** or **Redis URL**:
   ```
   redis://default:YOUR_PASSWORD@us1-equal-firefly-12345.upstash.io:6379
   ```
2. Save this for backend environment variables

---

## ☁️ Step 3: Setup Cloudinary (File Storage)

### 3.1 Create Account
1. Go to [Cloudinary](https://cloudinary.com/users/register/free)
2. Sign up for free (25GB storage, 25GB bandwidth/month)

### 3.2 Get Credentials
1. Go to Dashboard
2. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Your upload URL will be:
   ```
   https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload
   ```

---

## 🖥️ Step 4: Deploy Backend to Render

### 4.1 Create Account
1. Go to [Render](https://render.com/)
2. Sign up with GitHub

### 4.2 Connect Repository
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Or create new repo and push your code:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### 4.3 Configure Web Service
- **Name**: `keplero-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: **Free** ⭐

### 4.4 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add all these:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://keplero_admin:YOUR_PASSWORD@keplero-cluster.xxxxx.mongodb.net/chatbot_platform?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:YOUR_PASSWORD@us1-equal-firefly-12345.upstash.io:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_to_random_32_chars_minimum
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS (will update after frontend deployment)
CORS_ORIGIN=*

# File Storage - Use Cloudinary instead of AWS
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_KNOWLEDGE_BASE_SIZE=104857600

# Email (Optional - use free Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=KepleroAI

# Frontend URL (will update after frontend deployment)
FRONTEND_URL=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=pdf,docx,csv,txt,tsv

# Logging
LOG_LEVEL=info

# Socket.io
SOCKET_IO_CORS_ORIGIN=*

# Jobs
ENABLE_SCHEDULED_JOBS=true

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# API Version
API_VERSION=v1
```

### 4.5 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://keplero-backend.onrender.com`

⚠️ **Note**: Free tier spins down after 15 min of inactivity. First request may take 30-60 seconds.

---

## 🌐 Step 5: Deploy Frontend to Vercel

### 5.1 Create Account
1. Go to [Vercel](https://vercel.com/signup)
2. Sign up with GitHub

### 5.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Or use Vercel CLI:
   ```bash
   npm i -g vercel
   cd /Users/lovjeetsingh/Desktop/KepleroAI_v1
   vercel
   ```

### 5.3 Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (project root)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 5.4 Add Environment Variables
Add these environment variables in Vercel dashboard:

```bash
# Backend API URL (from Step 4.5)
NEXT_PUBLIC_API_URL=https://keplero-backend.onrender.com

# If you have any other public env vars, add them here
NEXT_PUBLIC_SOCKET_URL=https://keplero-backend.onrender.com
```

### 5.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app is live! 🎉
4. Copy your URL: `https://keplero-ai.vercel.app`

---

## 🔄 Step 6: Update CORS Settings

### 6.1 Update Backend Environment
1. Go back to Render dashboard
2. Find your backend service
3. Update these environment variables:
   ```bash
   CORS_ORIGIN=https://keplero-ai.vercel.app
   SOCKET_IO_CORS_ORIGIN=https://keplero-ai.vercel.app
   FRONTEND_URL=https://keplero-ai.vercel.app
   ```
4. Save and redeploy

---

## 📝 Step 7: Update Frontend API Configuration

Make sure your frontend is pointing to the correct backend URL. Check `lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://keplero-backend.onrender.com';
```

---

## 🔐 Step 8: Seed Database (Optional)

After deployment, seed your database with initial data:

```bash
# Connect to your Render backend shell (in Render dashboard → Shell)
npm run seed:admin
npm run seed:folders
npm run seed:kb
npm run seed:lists
```

Or run locally pointing to production database:
```bash
cd backend
# Update .env with production MONGODB_URI
npm run seed:admin
```

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string saved
- [ ] Upstash Redis database created and URL saved
- [ ] Cloudinary account created and credentials saved
- [ ] Backend deployed to Render with all env vars
- [ ] Frontend deployed to Vercel with API URL
- [ ] CORS settings updated with frontend URL
- [ ] Database seeded with initial data
- [ ] Test login and basic functionality

---

## 🚀 Quick Deploy Commands

### Using Vercel CLI (Frontend):
```bash
cd /Users/lovjeetsingh/Desktop/KepleroAI_v1
npm i -g vercel
vercel login
vercel --prod
```

### Push Backend to GitHub (for Render):
```bash
cd backend
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

---

## 🌟 Alternative Free Hosting Options

### Backend Alternatives:
- **Railway** (500 hrs/month free) - Easier than Render
- **Fly.io** (3 shared VMs free)
- **Cyclic** (Unlimited apps, serverless)

### Database Alternatives:
- **Supabase** (PostgreSQL, 500MB free)
- **PlanetScale** (MySQL, 5GB free)

### Redis Alternatives:
- **Redis Cloud** (30MB free)

---

## ⚠️ Important Notes

1. **Free Tier Limitations**:
   - Render: Service sleeps after 15 min inactivity
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage
   - Upstash: 10K commands/day

2. **First Request Slowness**: 
   - Free backends sleep when inactive
   - First request may take 30-60 seconds
   - Consider upgrading to paid tier ($7/mo) for production

3. **Custom Domain** (Optional):
   - Vercel: Add custom domain for free in settings
   - Render: Custom domain requires paid plan

4. **Monitoring**:
   - Use [BetterUptime](https://betteruptime.com/) free tier to ping your backend every 5 minutes (prevents sleeping)

---

## 🛠️ Troubleshooting

### Backend won't start:
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### Frontend can't connect to backend:
- Check CORS settings
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors

### Database connection failed:
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Check username/password in connection string
- Ensure database user has read/write permissions

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 You're Done!

Your KepleroAI project is now live and deployed for FREE! 

**Frontend**: `https://keplero-ai.vercel.app`  
**Backend**: `https://keplero-backend.onrender.com`

Share your deployed app and start using it! 🚀

