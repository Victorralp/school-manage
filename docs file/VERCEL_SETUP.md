# 🚀 Quick Vercel Deployment

## Method 1: One-Click Deploy (Easiest)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```
Follow the prompts to login with your email or GitHub.

### Step 3: Deploy
```bash
vercel
```

**That's it!** Vercel will:
- Detect it's a Vite project
- Build your app
- Deploy it
- Give you a URL

### Step 4: Add Environment Variables

After first deployment, add your Firebase config:

```bash
vercel env add VITE_FIREBASE_API_KEY
```
Enter: `AIzaSyCEPWwPgIMH0tXW4oQu9lRk38Lz0VGi0Fg`

Repeat for all variables:
- `VITE_FIREBASE_AUTH_DOMAIN` → `school-e49b2.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID` → `school-e49b2`
- `VITE_FIREBASE_STORAGE_BUCKET` → `school-e49b2.firebasestorage.app`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` → `825074668893`
- `VITE_FIREBASE_APP_ID` → `1:825074668893:web:8492574ecd62b3126004b4`
- `VITE_FIREBASE_MEASUREMENT_ID` → `G-6R3GL4GB6M`

### Step 5: Deploy to Production
```bash
vercel --prod
```

### Step 6: Update Firebase
1. Go to https://console.firebase.google.com/project/school-e49b2/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your Vercel URL (e.g., `your-app.vercel.app`)
5. Save

---

## Method 2: Via Vercel Dashboard

### Step 1: Create Account
Go to https://vercel.com/signup

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Import from Git (or upload folder)

### Step 3: Configure
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

### Step 4: Add Environment Variables
Click "Environment Variables" and add:

```
VITE_FIREBASE_API_KEY=AIzaSyCEPWwPgIMH0tXW4oQu9lRk38Lz0VGi0Fg
VITE_FIREBASE_AUTH_DOMAIN=school-e49b2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-e49b2
VITE_FIREBASE_STORAGE_BUCKET=school-e49b2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=825074668893
VITE_FIREBASE_APP_ID=1:825074668893:web:8492574ecd62b3126004b4
VITE_FIREBASE_MEASUREMENT_ID=G-6R3GL4GB6M
```

### Step 5: Deploy
Click "Deploy" and wait!

---

## Method 3: Using Deploy Scripts

### Windows:
```bash
deploy.bat
```

### Mac/Linux:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## After Deployment Checklist

- [ ] App is live and accessible
- [ ] Login works
- [ ] Can create exams
- [ ] Can take exams
- [ ] All dashboards load
- [ ] Firebase domain is authorized

---

## Your URLs

After deployment:
- **Production**: `https://your-app.vercel.app`
- **Dashboard**: `https://vercel.com/dashboard`

---

## Common Issues

### "Unauthorized domain" error
**Fix**: Add Vercel domain to Firebase authorized domains

### Environment variables not working
**Fix**: Redeploy after adding variables
```bash
vercel --prod
```

### Build fails
**Fix**: Test locally first
```bash
npm run build
```

---

## Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Ready? Run `vercel` now!** 🚀
