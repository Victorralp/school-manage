# Setup Guide - Getting Started

## ✅ Good News!
Your Firebase connection is working! The error `auth/email-already-in-use` means an account already exists.

## Next Steps

### Option 1: Login with Existing Account
If you already created an account, simply login:

1. Go to: http://localhost:5173/login
2. Enter your email and password
3. Click "Sign In"

### Option 2: Create New Admin with Different Email
If you want to create a new admin account:

1. Go to: http://localhost:5173/admin-setup
2. Use a **different email address** (not the one that already exists)
3. Fill in the form and submit

### Option 3: Check Existing Accounts in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `school-e49b2`
3. Go to **Authentication** → **Users** tab
4. You'll see all registered users with their emails

### Option 4: Reset Password (If You Forgot)

**Via Firebase Console:**
1. Go to Firebase Console → Authentication → Users
2. Find your user
3. Click the three dots (⋮) → Reset password
4. Firebase will send a password reset email

**Via Login Page:**
You can add a "Forgot Password" feature if needed.

## Current System Status

✅ **Firebase Connected** - Your app is communicating with Firebase
✅ **Authentication Working** - Email/password auth is enabled
✅ **Admin Setup Page** - Working correctly
✅ **Login Page** - Fixed and ready to use

## Test Your Login

### For Admin Account:
1. Go to: http://localhost:5173/login
2. Enter the email you used during setup
3. Enter your password
4. Click "Sign In"
5. You should be redirected to: http://localhost:5173/admin

### For Testing Other Roles:

**Create a School Account:**
1. Go to login page
2. Click "Don't have an account? Sign up"
3. Select role: "School Administrator"
4. Fill in school name and details
5. Register (will be pending approval)

**Create a Teacher Account:**
1. Sign up as Teacher
2. You'll need a School ID (get from school admin)
3. Register (will be pending approval by school)

**Create a Student Account:**
1. Sign up as Student
2. You'll need a School ID (get from school admin)
3. Register (will be pending approval by school)

## Troubleshooting

### "Email already in use" Error
- This email is already registered
- Try logging in instead
- Or use a different email for a new account

### "User not found" Error
- The email is not registered
- Check spelling
- Or create a new account

### "Wrong password" Error
- Password is incorrect
- Try again or reset password via Firebase Console

### Can't Login After Creating Account
- Check if account status is "active" in Firestore
- Go to Firebase Console → Firestore Database → users collection
- Find your user document
- Make sure `status: "active"` and `role: "admin"`

## Firebase Console Quick Links

- **Authentication Users**: https://console.firebase.google.com/project/school-e49b2/authentication/users
- **Firestore Database**: https://console.firebase.google.com/project/school-e49b2/firestore
- **Project Settings**: https://console.firebase.google.com/project/school-e49b2/settings/general

## Need Help?

### Check User Status in Firestore:
1. Firebase Console → Firestore Database
2. Click on `users` collection
3. Find your user document (by email)
4. Check these fields:
   - `role`: should be "admin"
   - `status`: should be "active"
   - `email`: your email address

### Manually Activate Account:
If your account is pending:
1. Go to Firestore Database → users
2. Find your user document
3. Edit the document
4. Change `status` from "pending" to "active"
5. Save

## What's Next?

Once you successfully login as admin:
1. ✅ Approve school registrations
2. ✅ Monitor all users
3. ✅ View system statistics
4. ✅ Manage the platform

Once schools are approved:
1. ✅ Schools can approve teachers and students
2. ✅ Teachers can create exams
3. ✅ Students can take exams
4. ✅ Everyone can view results

## Quick Test Workflow

1. **Admin Login** → Approve schools
2. **School Login** → Get School ID, approve teachers/students
3. **Teacher Login** → Create exams
4. **Student Login** → Take exams, view results

---

**Your app is ready to use! Just login with your existing account or create a new one with a different email.**
