# Admin Account Setup Guide

## Quick Setup

### Option 1: Automated Setup Page (Recommended)

1. **Navigate to the setup page:**
   ```
   http://localhost:5173/admin-setup
   ```
   (Or your deployed URL + `/admin-setup`)

2. **Create the admin account:**
   - Email is pre-configured: `victorralph407@gmail.com`
   - Enter a secure password (minimum 6 characters)
   - Confirm your password
   - Click "Create Admin Account"

3. **Login:**
   - You'll be automatically redirected to the login page
   - Use email: `victorralph407@gmail.com`
   - Use the password you just created
   - Click "Sign In"

4. **Access Admin Dashboard:**
   - After login, you'll be redirected to `/admin`
   - Or press `Ctrl + Shift + A` from anywhere in the app

---

### Option 2: Manual Firebase Setup

If the automated setup doesn't work, follow these steps:

1. **Register normally through the app:**
   - Go to `http://localhost:5173/login`
   - Click "Don't have an account? Sign up"
   - Fill in the form:
     - Name: System Administrator
     - Email: `victorralph407@gmail.com`
     - Password: Your choice
     - Role: Select any role (we'll change it)
   - Click "Create Account"

2. **Update role in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to **Firestore Database**
   - Click on **users** collection
   - Find the document with email `victorralph407@gmail.com`
   - Click on the document to edit
   - Change the following fields:
     - `role`: `"admin"` (must be lowercase)
     - `status`: `"active"`
   - Click **Update**

3. **Login as Admin:**
   - Log out if you're logged in
   - Go back to login page
   - Login with `victorralph407@gmail.com`
   - You now have full admin access!

---

## Admin Capabilities

Once logged in as admin, you can:

✅ **Manage Schools**
- View all registered schools
- Approve or reject school registrations
- Deactivate schools
- View school details and admin information

✅ **Manage Users**
- View all teachers and students across all schools
- Delete users if needed
- Monitor user statuses

✅ **Monitor System**
- View total statistics:
  - Total schools
  - Total teachers
  - Total students
  - Total exams created
- Track pending approvals
- View system-wide activity

✅ **View All Exams**
- See all exams created by all teachers
- Monitor exam usage and submissions

---

## Keyboard Shortcuts

### Quick Access to Admin Dashboard

Press `Ctrl + Shift + A` from anywhere in the application to:
- Navigate directly to Admin Dashboard (if you're an admin)
- Get an alert if you're not an admin
- Get a prompt to login if not authenticated

**How it works:**
- The shortcut is always active when you're logged in
- Only works for users with admin role
- Prevents accidental navigation for non-admin users

---

## Security Best Practices

### Password Requirements
- Minimum 6 characters (Firebase requirement)
- Recommended: Use a strong password with:
  - Uppercase and lowercase letters
  - Numbers
  - Special characters
  - At least 12+ characters

### Admin Account Security
✅ **DO:**
- Use a strong, unique password
- Enable two-factor authentication (if available)
- Keep your credentials private
- Log out when using shared computers
- Regularly review user activity
- Change password periodically

❌ **DON'T:**
- Share admin credentials with anyone
- Use the same password as other accounts
- Leave your admin session unattended
- Allow others to use your admin account
- Ignore suspicious activity

### Protecting Firebase Access
- Keep your Firebase credentials secure
- Don't expose API keys in public repositories
- Use environment variables for sensitive data
- Enable Firebase App Check for production
- Review Firestore security rules regularly

---

## Troubleshooting

### Issue: "Email already in use"
**Solution:** The admin account already exists. Use the login page with your password.

### Issue: "Can't access admin dashboard after login"
**Solution:** 
1. Check that your role is set to "admin" in Firestore
2. Check that your status is "active"
3. Log out and log back in
4. Clear browser cache and cookies

### Issue: "Ctrl + Shift + A doesn't work"
**Solution:**
1. Make sure you're logged in as admin
2. Try refreshing the page
3. Check browser console for errors
4. The shortcut only works for users with admin role

### Issue: "Forgot admin password"
**Solution:**
1. Use Firebase Console → Authentication
2. Find the user with email `victorralph407@gmail.com`
3. Click the three dots menu → Reset password
4. Follow the password reset process

### Issue: "Setup page not accessible"
**Solution:**
1. Make sure the dev server is running (`npm run dev`)
2. Check the URL is correct: `/admin-setup`
3. Try clearing browser cache
4. Check browser console for errors

---

## Alternative Admin Email

If you need to change the admin email from `victorralph407@gmail.com`:

### Method 1: Update the Code
1. Open `src/pages/AdminSetup.jsx`
2. Change line 10:
   ```javascript
   const ADMIN_EMAIL = "your-new-email@example.com";
   ```
3. Restart the dev server

### Method 2: Create Multiple Admins
1. Create additional users through normal registration
2. Manually change their role to "admin" in Firestore
3. Change status to "active"
4. They can now access admin features

---

## First-Time Setup Checklist

- [ ] Run `npm install` to install dependencies
- [ ] Create `.env` file with Firebase credentials
- [ ] Run `npm run dev` to start the server
- [ ] Navigate to `/admin-setup`
- [ ] Create admin account with password
- [ ] Login with `victorralph407@gmail.com`
- [ ] Verify admin dashboard access
- [ ] Test `Ctrl + Shift + A` shortcut
- [ ] Review Firestore security rules
- [ ] Set up additional admins if needed

---

## Support

If you encounter issues:

1. **Check the logs:**
   - Browser console (F12)
   - Terminal where dev server is running
   - Firebase Console → Firestore logs

2. **Common solutions:**
   - Restart the dev server
   - Clear browser cache
   - Check Firebase configuration
   - Verify internet connection

3. **Get help:**
   - Check `README.md` for general documentation
   - Review `QUICKSTART.md` for setup issues
   - Check Firebase documentation
   - Open an issue on GitHub

---

## Production Deployment

When deploying to production:

1. **Secure the setup page:**
   - Remove or protect the `/admin-setup` route
   - Use environment-based routing
   - Or create admin via Firebase Console only

2. **Example protection:**
   ```javascript
   // In App.jsx
   {process.env.NODE_ENV === 'development' && (
     <Route path="/admin-setup" element={<AdminSetup />} />
   )}
   ```

3. **Alternative: Use Firebase Admin SDK**
   - Create admins programmatically
   - Use Firebase Cloud Functions
   - More secure for production

---

**Remember:** The admin account has full system access. Keep it secure!

**Admin Email:** victorralph407@gmail.com  
**Keyboard Shortcut:** Ctrl + Shift + A  
**Setup URL:** /admin-setup

---

*Last Updated: 2024*
*Version: 1.0*