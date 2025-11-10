# School ID Reference Guide

## What is a School ID?

A School ID is a unique identifier assigned to each school when a School Administrator registers. This ID is used by teachers and students to link their accounts to the correct school during registration.

## How to Get Your School ID

### For School Administrators:

1. **Register your school**
   - Go to the login page
   - Click "Sign up"
   - Select "School Administrator" as your role
   - Fill in:
     - Your full name (admin name)
     - School name (official name of your institution)
     - Email address
     - Password
   - Click "Create Account"

2. **Wait for approval**
   - Your registration will be reviewed by the system admin
   - You'll receive an email once approved (if email notifications are enabled)
   - Status will change from "Pending" to "Active"

3. **Access your School ID**
   - Log in to your School Dashboard
   - Your School ID is displayed at the top of the page
   - Click the "Copy ID" button to copy it to clipboard
   - Example: `a1b2c3d4e5f6g7h8i9j0`

4. **Share with your staff and students**
   - Send the School ID to teachers and students via email or school portal
   - Teachers and students need this ID to register

## How to Use School ID

### For Teachers:

1. Go to the registration page
2. Select "Teacher" as your role
3. Enter your personal information
4. **Paste the School ID** provided by your school administrator in the "School ID" field
5. Submit registration
6. Wait for your school to approve your account

### For Students:

1. Go to the registration page
2. Select "Student" as your role
3. Enter your personal information
4. **Paste the School ID** provided by your school administrator in the "School ID" field
5. Submit registration
6. Wait for your school to approve your account

## Registration Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ADMINISTRATOR                      │
│                  (Created manually first)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Approves
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   SCHOOL ADMINISTRATOR                       │
│              Registers with School Name                      │
│           Gets unique School ID after approval               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Shares School ID
                         ├──────────────┬──────────────────────┐
                         ↓              ↓                      ↓
              ┌──────────────┐  ┌──────────────┐   ┌──────────────┐
              │   TEACHER    │  │   TEACHER    │   │   STUDENT    │
              │  Register    │  │  Register    │   │  Register    │
              │  with ID     │  │  with ID     │   │  with ID     │
              └──────┬───────┘  └──────┬───────┘   └──────┬───────┘
                     │                 │                   │
                     │                 │                   │
                     └─────────────────┴───────────────────┘
                                       │
                          School Admin Approves
                                       │
                                       ↓
                              ┌────────────────┐
                              │  ACTIVE USERS  │
                              │  Can use full  │
                              │   features     │
                              └────────────────┘
```

## Common Issues and Solutions

### Issue 1: "School ID not found"
**Problem:** The School ID entered doesn't match any registered school.

**Solutions:**
- Double-check the School ID with your school administrator
- Make sure you copied the entire ID (no spaces before/after)
- Verify the school has been approved by the system admin

### Issue 2: "Registration pending for too long"
**Problem:** Your account is stuck in "pending" status.

**Solutions:**
- Contact your school administrator to approve your account
- Check if you entered the correct School ID
- Verify your school administrator has been approved

### Issue 3: "Can't find my School ID"
**Problem:** School administrator can't locate their School ID.

**Solutions:**
- Log in to your School Dashboard
- The School ID is displayed prominently at the top
- Click "Copy ID" button to copy it
- You can also find it in the School Info section

## Best Practices

### For School Administrators:

1. **Keep your School ID secure but accessible**
   - Don't share publicly on social media
   - Share only with verified staff and students
   - Keep a record in your school's documentation

2. **Communicate clearly**
   - Send welcome emails with the School ID
   - Post on your school portal
   - Include in orientation materials

3. **Monitor pending registrations**
   - Check your dashboard regularly for new registrations
   - Approve legitimate staff and students promptly
   - Reject suspicious registrations

4. **Maintain accurate records**
   - Keep track of who you've shared the ID with
   - Update your school information if it changes
   - Remove access for former staff/students

### For Teachers and Students:

1. **Get the ID from official sources**
   - Only accept School ID from your school administrator
   - Don't use IDs shared by other students
   - Verify with school office if uncertain

2. **Keep it confidential**
   - Don't share with people outside your school
   - Don't post on public forums
   - Store securely in your notes

3. **Register early**
   - Register as soon as you receive the School ID
   - Allow time for approval process
   - Contact administrator if delayed

## Security Tips

### For Everyone:

✅ **DO:**
- Keep your School ID private within your school community
- Verify the source before using a School ID
- Report suspicious activity to your administrator
- Change your password regularly
- Log out when using shared computers

❌ **DON'T:**
- Share your School ID publicly online
- Use someone else's School ID
- Share your login credentials
- Register with unknown schools
- Ignore approval delays

## Technical Details

### School ID Format:
- **Type:** Alphanumeric string
- **Length:** Variable (typically 20-28 characters)
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2`
- **Case Sensitive:** Yes
- **Spaces:** No spaces allowed

### Storage:
- School IDs are stored securely in Firebase Firestore
- Each school has a unique, automatically generated ID
- IDs cannot be changed once created
- IDs persist for the lifetime of the school account

### Validation:
- System checks if School ID exists before registration
- School must be in "Active" status for new registrations
- One School ID can have multiple teachers and students
- School ID is linked to user accounts permanently

## Support

If you need help with School ID issues:

1. **For School Administrators:**
   - Contact the System Administrator
   - Email: admin@yourschool-system.com
   - Check the Admin Dashboard for your school status

2. **For Teachers/Students:**
   - Contact your School Administrator
   - Check with your school office
   - Verify your School ID is correct

3. **Technical Issues:**
   - Check your internet connection
   - Clear browser cache and cookies
   - Try a different browser
   - Contact technical support

## Frequently Asked Questions

**Q: Can I change my School ID?**
A: No, School IDs are permanent and cannot be changed once assigned.

**Q: What if I lose my School ID?**
A: School administrators can always find their ID in the School Dashboard. Teachers and students should contact their school administrator.

**Q: Can one person belong to multiple schools?**
A: Currently, each user account can only be linked to one school at a time.

**Q: How long does approval take?**
A: School approvals by system admin may take 24-48 hours. Teacher/student approvals by schools are typically faster, depending on the school's process.

**Q: Can I register without a School ID?**
A: Teachers and students must have a School ID. Only School Administrators register without one (they get assigned one automatically).

**Q: Is the School ID case-sensitive?**
A: Yes, copy and paste the exact ID provided to avoid errors.

**Q: What happens if my school administrator leaves?**
A: Contact the system administrator to transfer school ownership or assign a new school administrator.

---

**Last Updated:** 2024
**Version:** 1.0

For more information, see the main [README.md](./README.md) or [QUICKSTART.md](./QUICKSTART.md) guide.