# Quick Start Guide

Get up and running with the School Exam Management System in 5 minutes!

## Prerequisites

- Node.js (v16+) installed
- A Firebase account
- Code editor (VS Code recommended)

## Step 1: Clone and Install

```bash
# Clone the repository (or download the code)
cd school-system

# Install dependencies
npm install
```

## Step 2: Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add Project"
   - Enter project name (e.g., "school-exam-system")
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Authentication**
   - In Firebase Console, go to Authentication
   - Click "Get Started"
   - Enable "Email/Password" provider
   - Click "Save"

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Choose "Start in test mode" (we'll add rules later)
   - Select your region
   - Click "Enable"

4. **Get Firebase Config**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the config values

## Step 3: Configure Environment Variables

1. **Copy the example file**
   ```bash
   cp .env.example .env
   ```

2. **Add your Firebase credentials to `.env`**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

## Step 4: Add Firestore Security Rules

In Firebase Console → Firestore Database → Rules, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        request.auth.uid == userId || 
        getUserRole() == 'admin' || 
        getUserRole() == 'school'
      );
      allow delete: if getUserRole() == 'admin' || getUserRole() == 'school';
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if getUserRole() == 'admin' || request.auth.uid == schoolId;
      allow delete: if getUserRole() == 'admin';
    }
    
    // Exams collection
    match /exams/{examId} {
      allow read: if isAuthenticated();
      allow create: if getUserRole() == 'teacher';
      allow update: if isAuthenticated() && resource.data.teacherId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.teacherId == request.auth.uid;
      
      match /questions/{questionId} {
        allow read: if isAuthenticated();
        allow write: if getUserRole() == 'teacher';
      }
    }
    
    // Results collection
    match /results/{resultId} {
      allow read: if isAuthenticated();
      allow create: if getUserRole() == 'student';
      allow update: if getUserRole() == 'admin' || getUserRole() == 'teacher';
      allow delete: if getUserRole() == 'admin';
    }
  }
}
```

Click "Publish"

## Step 5: Run the Application

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

## Step 6: Create Your First Admin Account

### Option 1: Using Setup Page (Recommended)

1. Navigate to `http://localhost:5173/admin-setup`
2. Enter a secure password for the admin account
3. Email is pre-configured: `victorralph407@gmail.com`
4. Click "Create Admin Account"
5. Login with the admin credentials

### Option 2: Manual Setup (If account already exists)

If you see "Account already exists" message:

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - You'll see your collections

3. **Find the admin user**
   - Click on the `users` collection
   - Look for the document with email: `victorralph407@gmail.com`
   - Click on that document to open it

4. **Update the user role**
   - Find the `role` field and change it to: `admin` (lowercase)
   - Find the `status` field and change it to: `active`
   - Click "Update" to save changes

5. **Login**
   - Go back to the login page
   - Use email: `victorralph407@gmail.com`
   - Use your password
   - You'll be redirected to the Admin Dashboard

🎉 **You're now an admin!**

**Quick Tip:** Press `Ctrl + Shift + A` from anywhere in the app to quickly navigate to the Admin Dashboard (only works when logged in as admin).

## Quick Test Workflow

### As Admin:
1. Approve school registrations
2. Monitor system statistics

### As School:
1. Register as a new user with role "School Administrator"
2. Wait for admin approval (or manually approve in Firestore)
3. Approve teacher and student registrations
4. View school performance

### As Teacher:
1. Register with a school ID
2. Wait for school approval
3. Create an exam:
   - Fill in title, subject, time limit
   - Add questions with 4 options
   - Mark correct answers
   - Submit
4. View student results

### As Student:
1. Register with a school ID
2. Wait for school approval
3. Take an available exam:
   - Click "Take Exam"
   - Start the timer
   - Answer questions
   - Submit before time runs out
4. View your results instantly

## Common Issues

**Q: "Firebase not defined" error**
- Check your `.env` file has all variables
- Restart the dev server: `Ctrl+C` then `npm run dev`

**Q: "Permission denied" in Firestore**
- Make sure you've added the security rules
- Check the user's `status` is "active"

**Q: Login not working**
- Verify Email/Password is enabled in Firebase Auth
- Check browser console for errors

**Q: Can't create exams**
- Ensure user role is "teacher" and status is "active"
- Check Firestore security rules are published

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Customize the UI colors in `tailwind.config.js`
- Add more question types
- Implement email notifications
- Deploy to Vercel (see README for instructions)

## Need Help?

- Check the browser console for errors
- Review Firebase Console logs
- Open an issue on GitHub
- Check that all environment variables are set correctly

---

**Happy coding! 🚀**