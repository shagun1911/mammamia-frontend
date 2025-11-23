# 🔧 Render Deployment Fix

## Problem
Build command only ran `yarn install` but didn't compile TypeScript. The `dist/` folder is missing.

## Solution

### Update Build Command in Render Dashboard:

1. Go to your backend service on Render
2. Click **"Settings"** (or "Environment" tab)
3. Find **"Build Command"**
4. Change from: `yarn install`
5. Change to: `npm install && npm run build`

### Correct Configuration:

```
Build Command: npm install && npm run build
Start Command: npm start
```

This will:
1. Install all dependencies with npm
2. Run `npm run build` which executes `tsc` (TypeScript compiler)
3. Create the `dist/` folder with compiled JavaScript
4. Then `npm start` runs `node dist/server.js`

### Alternative: Add render.yaml

Or create a `render.yaml` file in backend root:

```yaml
services:
  - type: web
    name: kepleroai-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## Quick Fix Now

In Render Dashboard:
1. Go to your service
2. **Settings** → **Build & Deploy**
3. Change **Build Command** to: `npm install && npm run build`
4. Click **"Save Changes"**
5. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

This should fix the deployment!

