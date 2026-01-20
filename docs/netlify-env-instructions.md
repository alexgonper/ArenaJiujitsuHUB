# Netlify Configuration for Dynamic API URL

## Problem
The LocalTunnel URL changes every time the backend restarts, requiring constant redeployment.

## Solution: Use Netlify Environment Variables

### Step 1: Set Up Environment Variable in Netlify
1. Go to your Netlify site dashboard: https://app.netlify.com/
2. Navigate to: **Site Settings** > **Environment Variables**
3. Add a new variable:
   - **Key**: `API_BASE_URL`
   - **Value**: `https://fifty-hands-enter.loca.lt/api/v1` (your current backend URL)
4. Save the variable

### Step 2: Update Your Code (Already Done)
The `api-config.js` file now checks for the environment variable first.

### Step 3: When Backend URL Changes
Instead of redeploying the entire site:
1. Update the `API_BASE_URL` environment variable in Netlify
2. Trigger a redeploy (there's a button in Netlify dashboard)
3. No need to drag/drop files again

## Current Backend URL
https://fifty-hands-enter.loca.lt/api/v1

## Alternative: Use a Stable Backend
For production, consider deploying your backend to:
- **Render.com** (Free tier available)
- **Railway.app** (Free tier available)  
- **Fly.io** (Free tier available)

These services provide **stable URLs** that don't change.
