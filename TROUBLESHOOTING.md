# Sign-In Button Troubleshooting Guide

## Issue Fixed
The login function had a bug where it was creating a document reference but not fetching data. This has been fixed.

## Steps to Test the Fix

1. **Open the app in your browser:**
   - Go to http://localhost:5173
   - You should see the login page

2. **Check Browser Console:**
   - Press F12 to open Developer Tools
   - Go to the Console tab
   - You should see: "Firebase Config: ✓ Set, ✓ Set, ✓ Set"
   - If you see "✗ Missing", restart the dev server

3. **Test Login:**
   - Try logging in with existing credentials
   - Check console for any error messages

## Common Issues & Solutions

### 1. Firebase Authentication Not Enabled
**Symptoms:** Error like "auth/operation-not-allowed"

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `school-e49b2`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### 2. No User Account Exists
**Symptoms:** Error like "auth/user-not-found" or "auth/wrong-password"

**Solution:**
- You need to create an account first
- Click "Don't have an account? Sign up"
- Or create admin account at: http://localhost:5173/admin-setup

### 3. Environment Variables Not Loading
**Symptoms:** Console shows "✗ Missing" for Firebase config

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Vite requires restart to load .env changes

### 4. Firestore Rules Not Set
**Symptoms:** Error like "permission-denied"

**Solution:**
1. Go to Firebase Console → Firestore Database
2. Go to **Rules** tab
3. Update rules (see README.md for complete rules)
4. Publish the rules

### 5. Button Not Responding
**Symptoms:** Button click does nothing

**Solution:**
- Check browser console for JavaScript errors
- Make sure form fields are filled
- Check if loading state is stuck (button shows spinner)

## Testing Checklist

- [ ] Dev server is running (http://localhost:5173)
- [ ] Browser console shows Firebase config is set
- [ ] Firebase Authentication Email/Password is enabled
- [ ] At least one user account exists
- [ ] Firestore rules are published
- [ ] No JavaScript errors in console

## Create Test Account

### Option 1: Via UI (Recommended)
1. Go to http://localhost:5173/login
2. Click "Don't have an account? Sign up"
3. Fill in the form:
   - Name: Test User
   - Role: Student (or any role)
   - Email: test@example.com
   - Password: test123
   - School ID: (leave empty for now)
4. Click "Create Account"

### Option 2: Create Admin Account
1. Go to http://localhost:5173/admin-setup
2. Set password for admin account
3. Email will be: victorralph407@gmail.com

### Option 3: Via Firebase Console
1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password
4. Then add user document in Firestore:
   - Collection: `users`
   - Document ID: (use the UID from Authentication)
   - Fields:
     ```
     uid: [user's UID]
     email: [user's email]
     name: "Test User"
     role: "student"
     status: "active"
     createdAt: [current timestamp]
     ```

## Debug Mode

To see detailed error messages:
1. Open `src/pages/Login.jsx`
2. The console.error on line 54 will show detailed errors
3. Check browser console when clicking Sign In

## Still Not Working?

If the button still doesn't work:
1. Share the error message from browser console
2. Check Network tab in DevTools for failed requests
3. Verify Firebase project is active and not suspended
4. Check if you have internet connection (Firebase requires it)
