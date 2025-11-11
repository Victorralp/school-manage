# 🚀 Quick Start Guide

## Your App is Running!

✅ **Dev Server**: http://localhost:5173
✅ **Firebase**: Connected and working
✅ **Login Fixed**: Sign-in button now works

---

## 📍 Important Pages

### 1. **Check Existing Accounts**
**URL**: http://localhost:5173/check-accounts

See all registered users in your system. This helps you:
- Find out what accounts already exist
- Check user roles and status
- Get email addresses for login

### 2. **Login Page**
**URL**: http://localhost:5173/login

Login with existing account or create new ones:
- Sign in with email/password
- Register as School, Teacher, or Student
- Switch between login and signup

### 3. **Admin Setup**
**URL**: http://localhost:5173/admin-setup

Create new administrator accounts:
- Shows existing admins
- Create additional admin accounts
- Use different email for each admin

### 4. **Test Firebase**
**URL**: http://localhost:5173/test-firebase

Test your Firebase connection:
- Check environment variables
- Test Firestore connection
- Test authentication

---

## 🔧 What to Do Now

### Step 1: Check What Accounts Exist
```
Visit: http://localhost:5173/check-accounts
```
This will show you all registered users.

### Step 2: Login or Create Account

**If you see your account:**
1. Go to: http://localhost:5173/login
2. Enter your email and password
3. Click "Sign In"

**If no accounts exist:**
1. Go to: http://localhost:5173/admin-setup
2. Create an admin account
3. Then login

**If email is already in use:**
- Try logging in with that email
- Or use a different email for a new account
- Or check Firebase Console to see who owns it

### Step 3: Start Using the System

**As Admin:**
- Approve school registrations
- Monitor all users
- View system statistics

**As School:**
- Get your School ID
- Approve teachers and students
- View school performance

**As Teacher:**
- Create exams
- View student results
- Manage questions

**As Student:**
- Take exams
- View your scores
- Track your progress

---

## 🐛 Troubleshooting

### "Email already in use" Error
✅ **This is normal!** It means an account exists.

**Solution:**
1. Go to: http://localhost:5173/check-accounts
2. Find the email that's registered
3. Login with that email
4. Or use a different email

### Can't Remember Password
**Option 1 - Firebase Console:**
1. Go to: https://console.firebase.google.com/project/school-e49b2/authentication/users
2. Find your user
3. Click ⋮ → Reset password

**Option 2 - Create New Account:**
Use a different email address

### Account Shows "Pending"
**For Schools:**
- Admin must approve you
- Check with system admin

**For Teachers/Students:**
- School must approve you
- Contact your school administrator

---

## 📊 System Workflow

```
1. Admin creates account → Active immediately
2. School registers → Pending → Admin approves → Active
3. Teacher registers → Pending → School approves → Active
4. Student registers → Pending → School approves → Active
```

---

## 🔗 Quick Links

| Page | URL | Purpose |
|------|-----|---------|
| Check Accounts | http://localhost:5173/check-accounts | See all users |
| Login | http://localhost:5173/login | Sign in |
| Admin Setup | http://localhost:5173/admin-setup | Create admin |
| Test Firebase | http://localhost:5173/test-firebase | Test connection |
| Firebase Console | https://console.firebase.google.com/project/school-e49b2 | Manage Firebase |

---

## ✨ Next Steps

1. ✅ Check existing accounts
2. ✅ Login or create account
3. ✅ Explore your dashboard
4. ✅ Create schools/teachers/students
5. ✅ Create and take exams

---

**Need help? Check SETUP_GUIDE.md for detailed instructions!**
