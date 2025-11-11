# Deployment Guide - Complete System

## Overview
This guide covers deploying all the new features including:
- Per-teacher subscription limits
- Subject registration system
- Student registration with Student ID login
- Question limits per plan
- Firestore rules and indexes

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)
- Firebase project initialized in this directory

## Deployment Steps

### Step 1: Deploy Firestore Rules

The Firestore rules have been updated to include:
- Schools collection access
- Teachers collection access
- Subjects collection (CRUD by teachers)
- Users collection (students, teachers, schools)
- Exams collection with questions subcollection
- Results collection

**Deploy command:**
```bash
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔ Deploy complete!
```

### Step 2: Deploy Firestore Indexes

New indexes have been added for:
- Subjects queries (by teacher, school, code)
- Users queries (by role, schoolId, studentId, registeredBy)
- Exams queries (by teacher, school, subject)
- Results queries (by student, exam)

**Deploy command:**
```bash
firebase deploy --only firestore:indexes
```

**Expected output:**
```
✔ Deploy complete!
```

**Note:** Index creation can take several minutes. You can check status at:
https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes

### Step 3: Deploy Cloud Functions (if applicable)

If you have Cloud Functions for payment processing or subscriptions:

```bash
firebase deploy --only functions
```

### Step 4: Deploy Hosting (if applicable)

Deploy your React app:

```bash
npm run build
firebase deploy --only hosting
```

Or if using Vercel:
```bash
vercel --prod
```

## Verification Checklist

After deployment, verify:

### Firestore Rules
- [ ] Teachers can create subjects
- [ ] Teachers can register students
- [ ] Students can login with Student ID
- [ ] Teachers can create exams
- [ ] Students can submit results
- [ ] Proper access control is enforced

### Firestore Indexes
- [ ] No "missing index" errors in console
- [ ] Queries execute quickly
- [ ] All composite queries work

### Application Features
- [ ] Subject registration works
- [ ] Student registration generates Student ID
- [ ] Student ID login works
- [ ] Question limits are enforced
- [ ] Usage counts update correctly
- [ ] Subscription limits work per teacher

## Testing After Deployment

### 1. Test Subject Registration
```
1. Login as teacher
2. Go to Subjects tab
3. Click "Register Subject"
4. Enter subject details
5. Verify subject appears in list
6. Verify usage count increments
```

### 2. Test Student Registration
```
1. Login as teacher
2. Go to Students tab
3. Click "Register Student"
4. Enter student details
5. Note the generated Student ID
6. Verify student appears in list
7. Verify usage count increments
```

### 3. Test Student Login
```
1. Logout
2. Go to login page
3. Select "Student ID" method
4. Enter the Student ID from step 2
5. Click Login
6. Verify navigation to student dashboard
```

### 4. Test Question Limits
```
1. Login as teacher (Free plan)
2. Create new exam
3. Try to add 11 questions
4. Verify 11th question is blocked
5. Verify error message shows
```

### 5. Test Exam Creation
```
1. Login as teacher
2. Create exam for registered subject
3. Add questions (within limit)
4. Create exam
5. Verify exam appears in list
6. Verify exam code is generated
```

## Rollback Plan

If issues occur after deployment:

### Rollback Firestore Rules
```bash
# Restore previous rules from git
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Firestore Indexes
```bash
# Restore previous indexes
git checkout HEAD~1 firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Rollback Application
```bash
# Revert to previous commit
git revert HEAD
git push
# Redeploy
npm run build
firebase deploy --only hosting
```

## Common Issues and Solutions

### Issue: "Missing index" error
**Solution:** 
- Check Firebase console for index creation status
- Click the link in the error message to create index automatically
- Or manually add to firestore.indexes.json and redeploy

### Issue: "Permission denied" error
**Solution:**
- Check firestore.rules for correct permissions
- Verify user is authenticated
- Check that user has correct role
- Redeploy rules if needed

### Issue: Student ID login not working
**Solution:**
- Verify student document has studentId field
- Check that studentId is uppercase
- Verify Firestore rules allow student read
- Check AuthContext handles Student ID auth

### Issue: Usage count not updating
**Solution:**
- Check that teacher document exists in teachers collection
- Verify incrementUsage/decrementUsage functions are called
- Check Firestore rules allow writes to teachers collection
- Verify real-time listener is active

### Issue: Question limit not enforced
**Solution:**
- Check that questionLimit is in context
- Verify addQuestion function checks limit
- Check that currentPlan has questionLimit field
- Verify button disables at limit

## Monitoring

### Firebase Console
Monitor these metrics:
- Firestore reads/writes
- Authentication sign-ins
- Function executions (if applicable)
- Error logs

### Application Logs
Check browser console for:
- Authentication errors
- Firestore permission errors
- Network errors
- State management issues

## Performance Optimization

### After Deployment
1. **Monitor Firestore usage:**
   - Check read/write counts
   - Optimize queries if needed
   - Add caching where appropriate

2. **Monitor Authentication:**
   - Check sign-in success rate
   - Monitor Student ID login errors
   - Track authentication latency

3. **Monitor Application:**
   - Check page load times
   - Monitor bundle size
   - Optimize images and assets

## Security Checklist

After deployment, verify:
- [ ] Firestore rules prevent unauthorized access
- [ ] Student IDs are not predictable
- [ ] Teachers can only access their own data
- [ ] Students can only access their own results
- [ ] School data is properly isolated
- [ ] No sensitive data in client-side code
- [ ] API keys are properly secured

## Backup Plan

Before major deployments:
1. **Backup Firestore data:**
   ```bash
   gcloud firestore export gs://YOUR_BUCKET/backups/$(date +%Y%m%d)
   ```

2. **Tag current version:**
   ```bash
   git tag -a v1.0.0 -m "Pre-deployment backup"
   git push origin v1.0.0
   ```

3. **Document current state:**
   - Note current user count
   - Note current data structure
   - Save current rules and indexes

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify all features work
- [ ] Test on different devices
- [ ] Check performance metrics

### Short-term (Week 1)
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Fix any reported bugs
- [ ] Update documentation
- [ ] Train users if needed

### Long-term (Month 1)
- [ ] Review security rules
- [ ] Optimize costs
- [ ] Plan next features
- [ ] Gather user feedback
- [ ] Update roadmap

## Support

### For Issues
1. Check browser console for errors
2. Check Firebase console for logs
3. Review this deployment guide
4. Check IMPLEMENTATION_COMPLETE.md
5. Review individual feature docs

### For Questions
- Review feature documentation
- Check code comments
- Review test cases
- Consult Firebase documentation

## Success Criteria

Deployment is successful when:
- ✅ All Firestore rules deployed
- ✅ All indexes created
- ✅ Application deployed
- ✅ No console errors
- ✅ All features work as expected
- ✅ Performance is acceptable
- ✅ Security is maintained
- ✅ Users can access the system

## Next Steps

After successful deployment:
1. Monitor for 24 hours
2. Gather user feedback
3. Document any issues
4. Plan improvements
5. Update documentation
6. Train users on new features

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Version:** _____________
**Status:** _____________
