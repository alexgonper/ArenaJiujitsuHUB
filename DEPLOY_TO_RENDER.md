# Deploy Backend to Render.com (FREE)

## Why Render.com?
- ✅ **Permanent URL** (no more 503 errors)
- ✅ **Free tier** available
- ✅ **Automatic restarts** if server crashes
- ✅ **No disconnections** like LocalTunnel

## Step-by-Step Instructions

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account (or email)

### 2. Deploy Your Backend
1. Push your code to GitHub:
   ```bash
   cd /Users/ale/Documents/Antigravity/ArenaHub
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. In Render dashboard:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the **ArenaHub** repository

3. Configure the service:
   - **Name**: `arenahub-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add Environment Variables:
   - Click **"Environment"** tab
   - Add these variables:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `mongodb://localhost:27017/arena-matrix` (or your MongoDB Atlas URI)
     - `GEMINI_API_KEY` = `AIzaSyCCk6fcfIKolUiwuxXNgChe5Pa6d-_iDVc`

5. Click **"Create Web Service"**

### 3. Get Your Permanent URL
After deployment completes (5-10 minutes), you'll get a URL like:
**https://arenahub-backend.onrender.com**

### 4. Update Netlify
1. Edit `api-config.js`:
   ```javascript
   window.API_URL = 'https://arenahub-backend.onrender.com/api/v1';
   window.API_BASE_URL = 'https://arenahub-backend.onrender.com/api/v1';
   ```

2. Re-upload to Netlify one final time
3. **Never worry about 503 errors again!**

## Alternative: Quick Test Without GitHub

If you don't want to use GitHub, you can also:
1. Zip your `server` folder
2. Use Render's "Deploy from ZIP" option

## Need Help?
Just ask and I'll guide you through each step!
