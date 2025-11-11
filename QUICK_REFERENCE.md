# Quick Reference Guide

## 🚀 Quick Start

### For Developers

**Deploy Everything:**
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Build and deploy app
npm run build
firebase deploy --only hosting
```

**Test Locally:**
```bash
npm start
# Open http://localhost:3000
```

---

## 📋 Feature Cheat Sheet

### Subject Registration
```
Location: Teacher Dashboard → Subjects Tab
Action: Click "Register Subject"
Limit: 3 subjects (Free), 6 (Premium), 6-10 (VIP)
Result: Subject created, usage count +1
```

### Student Registration
```
Location: Teacher Dashboard → Students Tab
Action: Click "Register Student"
Input: Name + (Email OR Phone)
Result: Student ID generated (e.g., STU-A3B7K9)
Limit: 10 students (Free), 15-20 (Premium), 30 (VIP)
```

### Student Login
```
Location: Login Page
Method: Select "Student ID"
Input: STU-XXXXXX
Result: Access to Student Dashboard
```

### Exam Creation
```
Location: Teacher Dashboard → Exams Tab
Requirement: Must have registered subject
Questions: 10 (Free), 30 (Premium), 100 (VIP)
Result: Exam created with unique code
```

---

## 🔑 Important IDs and Formats

### Student ID
```
Format: STU-XXXXXX
Example: STU-A3B7K9
Length: 10 characters (STU- + 6 chars)
Characters: A-Z, 2-9 (no 0, O, I, 1)
Case: Always uppercase
```

### Exam Code
```
Format: XXXXXX
Example: A3B7K9
Length: 6 characters
Generated: Automatically on exam creation
```

### Subject Code
```
Format: Custom (teacher defined)
Example: MATH101, ENG201
Length: Up to 10 characters
Case: Uppercase recommended
```

---

## 📊 Plan Limits Quick Reference

| Feature | Free | Premium | VIP |
|---------|------|---------|-----|
| **Subjects** | 3 | 6 | 6-10 |
| **Students** | 10 | 15-20 | 30 |
| **Questions/Exam** | 10 | 30 | 100 |
| **Price (Monthly)** | ₦0 / $0 | ₦1,500 / $1 | ₦4,500 / $3 |

**Note:** All limits are PER TEACHER, not school-wide.

---

## 🗂️ File Locations

### Components
```
src/components/
├── Subject/
│   └── SubjectRegistrationModal.jsx
└── Student/
    └── StudentRegistrationModal.jsx
```

### Services
```
src/firebase/
├── subjectService.js
├── studentService.js
├── schoolService.js
└── subscriptionModels.js
```

### Pages
```
src/pages/
├── Teacher/
│   └── TeacherDashboard.jsx
└── Login.jsx
```

### Config
```
firestore.rules
firestore.indexes.json
```

---

## 🔧 Common Commands

### Firebase
```bash
# Login
firebase login

# Initialize project
firebase init

# Deploy rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy

# Check deployment status
firebase projects:list
```

### Development
```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Git
```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Description"

# Push to remote
git push origin main

# Create tag
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

---

## 🐛 Quick Troubleshooting

### Issue: "Missing index" error
```bash
# Solution 1: Click the link in error message
# Solution 2: Deploy indexes
firebase deploy --only firestore:indexes
```

### Issue: "Permission denied"
```bash
# Check rules
firebase deploy --only firestore:rules
# Verify user is authenticated
# Check user role in Firestore
```

### Issue: Student ID login fails
```javascript
// Check:
1. Student document has studentId field
2. studentId is uppercase
3. Student status is "active"
4. Firestore rules allow read
```

### Issue: Usage count not updating
```javascript
// Check:
1. Teacher document exists in teachers collection
2. Real-time listener is active
3. incrementUsage() is called
4. No console errors
```

### Issue: Question limit not working
```javascript
// Check:
1. questionLimit in context
2. addQuestion() checks limit
3. Button has disabled prop
4. currentPlan has questionLimit
```

---

## 📞 Quick Support

### Check These First
1. Browser console (F12)
2. Firebase console logs
3. Network tab for failed requests
4. Firestore rules simulator
5. Authentication state

### Documentation
- `IMPLEMENTATION_COMPLETE.md` - Full implementation
- `DEPLOYMENT_GUIDE.md` - Deployment steps
- `FEATURES_SUMMARY.md` - All features
- `STUDENT_REGISTRATION_SYSTEM.md` - Student system
- `SUBJECT_REGISTRATION_SYSTEM.md` - Subject system

---

## ✅ Testing Checklist

### Quick Test (5 minutes)
- [ ] Login as teacher
- [ ] Register a subject
- [ ] Register a student (note Student ID)
- [ ] Create an exam
- [ ] Logout
- [ ] Login with Student ID
- [ ] Verify student dashboard loads

### Full Test (15 minutes)
- [ ] Test all subject operations
- [ ] Test all student operations
- [ ] Test exam creation with questions
- [ ] Test question limits
- [ ] Test usage limits
- [ ] Test Student ID login
- [ ] Test error handling
- [ ] Test on mobile device

---

## 🎯 Key Metrics to Monitor

### Daily
- Error rate in console
- Login success rate
- Page load times
- User complaints

### Weekly
- Active users
- New registrations
- Feature usage
- Performance metrics

### Monthly
- Growth rate
- Plan upgrades
- User retention
- System costs

---

## 🔐 Security Checklist

- [ ] Firestore rules deployed
- [ ] Authentication required
- [ ] Role-based access working
- [ ] Student IDs are unique
- [ ] No sensitive data exposed
- [ ] API keys secured
- [ ] HTTPS enabled
- [ ] Regular backups

---

## 📈 Performance Tips

### Frontend
- Use React.memo for expensive components
- Implement lazy loading
- Optimize images
- Minimize bundle size
- Use production build

### Backend
- Use Firestore indexes
- Batch operations when possible
- Cache frequently accessed data
- Optimize query patterns
- Monitor read/write counts

### Database
- Create composite indexes
- Avoid N+1 queries
- Use real-time listeners wisely
- Implement pagination
- Clean up old data

---

## 🎨 UI/UX Quick Tips

### Good Practices
- Show loading states
- Display clear error messages
- Provide success feedback
- Use progress indicators
- Make actions reversible
- Confirm destructive actions

### Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Provide alt text
- Use sufficient contrast
- Test with screen readers

---

## 📱 Mobile Considerations

### Responsive Design
- Test on various screen sizes
- Use mobile-first approach
- Optimize touch targets
- Simplify navigation
- Reduce data usage

### Performance
- Minimize bundle size
- Optimize images
- Use lazy loading
- Cache resources
- Test on slow networks

---

## 🔄 Update Process

### Regular Updates
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Test locally
npm start

# 4. Build
npm run build

# 5. Deploy
firebase deploy
```

### Emergency Hotfix
```bash
# 1. Create hotfix branch
git checkout -b hotfix/issue-name

# 2. Fix issue
# ... make changes ...

# 3. Test
npm test

# 4. Commit and push
git commit -m "Fix: issue description"
git push origin hotfix/issue-name

# 5. Deploy immediately
firebase deploy
```

---

## 💡 Pro Tips

### Development
- Use React DevTools
- Enable Firebase debug mode
- Use console.log strategically
- Test edge cases
- Write meaningful commit messages

### Debugging
- Check browser console first
- Use Firebase console logs
- Test in incognito mode
- Clear cache if needed
- Check network requests

### Optimization
- Profile with React Profiler
- Monitor Firestore usage
- Optimize expensive operations
- Use memoization
- Implement code splitting

---

## 📚 Additional Resources

### Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

### Tools
- [Firebase Console](https://console.firebase.google.com)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools)

---

## 🎉 Success Indicators

Your system is working well when:
- ✅ No errors in console
- ✅ Fast page loads (< 3 seconds)
- ✅ Smooth user experience
- ✅ All features functional
- ✅ Users can complete tasks easily
- ✅ Good performance metrics
- ✅ Positive user feedback

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
