# 🚀 Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   When prompted, add these variables:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyCEPWwPgIMH0tXW4oQu9lRk38Lz0VGi0Fg
   VITE_FIREBASE_AUTH_DOMAIN=school-e49b2.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=school-e49b2
   VITE_FIREBASE_STORAGE_BUCKET=school-e49b2.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=825074668893
   VITE_FIREBASE_APP_ID=1:825074668893:web:8492574ecd62b3126004b4
   VITE_FIREBASE_MEASUREMENT_ID=G-6R3GL4GB6M
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

### Option 2: Deploy via GitHub + Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Project**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   
   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyCEPWwPgIMH0tXW4oQu9lRk38Lz0VGi0Fg` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `school-e49b2.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `school-e49b2` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `school-e49b2.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `825074668893` |
   | `VITE_FIREBASE_APP_ID` | `1:825074668893:web:8492574ecd62b3126004b4` |
   | `VITE_FIREBASE_MEASUREMENT_ID` | `G-6R3GL4GB6M` |

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

---

## After Deployment

### 1. Update Firebase Configuration

Add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/project/school-e49b2)
2. Go to **Authentication** → **Settings** → **Authorized domains**
3. Click "Add domain"
4. Add your Vercel domain (e.g., `your-app.vercel.app`)
5. Save

### 2. Test Your Deployment

Visit your Vercel URL and test:
- ✅ Login/Register
- ✅ Create exams
- ✅ Take exams
- ✅ All dashboards

### 3. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Add custom domain to Firebase authorized domains

---

## Troubleshooting

### Build Fails

**Issue**: Build command fails

**Solution**:
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel logs
vercel logs
```

### Environment Variables Not Working

**Issue**: Firebase not connecting

**Solution**:
1. Check all environment variables are added
2. Make sure they start with `VITE_`
3. Redeploy after adding variables
4. Check browser console for errors

### 404 Errors on Routes

**Issue**: Direct URLs return 404

**Solution**: The `vercel.json` file handles this with rewrites. Make sure it's committed.

### Firebase Auth Errors

**Issue**: "auth/unauthorized-domain"

**Solution**: Add your Vercel domain to Firebase authorized domains (see step 1 above)

---

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch auto-deploys
- Pull requests get preview deployments
- Rollback to previous versions anytime

---

## Vercel CLI Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Open project in browser
vercel open
```

---

## Environment Variables via CLI

```bash
# Add environment variable
vercel env add VITE_FIREBASE_API_KEY

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VITE_FIREBASE_API_KEY
```

---

## Performance Tips

1. **Enable Analytics**
   - Vercel Dashboard → Analytics
   - Monitor performance

2. **Enable Speed Insights**
   - Install: `npm install @vercel/speed-insights`
   - Add to your app

3. **Optimize Build**
   - Already configured in `vite.config.js`
   - Automatic code splitting
   - Tree shaking enabled

---

## Security Checklist

Before deploying:
- ✅ Environment variables are set
- ✅ Firebase rules are configured
- ✅ `.env` file is in `.gitignore`
- ✅ No sensitive data in code
- ✅ HTTPS enabled (automatic on Vercel)

---

## Your Deployment URLs

After deployment, you'll get:
- **Production**: `https://your-app.vercel.app`
- **Preview**: `https://your-app-git-branch.vercel.app`

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Firebase Docs: https://firebase.google.com/docs

---

**Ready to deploy? Run `vercel` in your terminal!** 🚀
