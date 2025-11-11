# Student Registration System - Teacher-Based Registration

## Overview
Changed student registration from self-registration to teacher-based registration with Student ID login.

## New Flow

### Old System:
```
Student → Register with email/password → Login with email/password
```

### New System:
```
Teacher → Register student (email or phone) → System generates Student ID
Student → Login with Student ID → Access dashboard
```

## Student ID Format

**Format:** `STU-XXXXXX`
- Prefix: `STU-`
- 6 random alphanumeric characters
- Excludes similar-looking characters (0, O, I, 1, etc.)
- Example: `STU-A3B7K9`

## Files Created

### 1. StudentRegistrationModal.jsx
**Location:** `src/components/Student/StudentRegistrationModal.jsx`

**Features:**
- Register student by email OR phone number
- Toggle between email/phone input
- Shows current usage (X / Y students)
- Progress bar
- Validates email format
- Validates phone format
- Enforces student limit

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onRegister: function,
  loading: boolean,
  canRegister: boolean,
  currentUsage: number,
  limit: number
}
```

### 2. studentService.js
**Location:** `src/firebase/studentService.js`

**Functions:**

#### `registerStudent(teacherId, schoolId, studentData)`
- Registers a new student
- Generates unique Student ID
- Checks for duplicate email/phone
- Returns student data with Student ID

#### `generateUniqueStudentId()`
- Generates unique Student ID
- Checks for duplicates
- Retries up to 10 times if collision

#### `getSchoolStudents(schoolId)`
- Gets all students in a school

#### `getTeacherStudents(teacherId)`
- Gets students registered by specific teacher

#### `getStudentByStudentId(studentId)`
- Finds student by Student ID (for login)

#### `verifyStudentId(studentId)`
- Verifies Student ID is valid and active

#### `updateStudent(studentId, updates)`
- Updates student information

#### `deactivateStudent(studentId)`
- Soft deletes a student

## Database Structure

### Student Document (users collection)
```javascript
{
  name: "John Doe",
  email: "john@example.com",      // OR null if phone used
  phoneNumber: "+234 123 456",    // OR null if email used
  studentId: "STU-A3B7K9",        // Unique ID for login
  role: "student",
  schoolId: "school123",
  registeredBy: "teacher_uid",    // Teacher who registered them
  status: "active",               // or "inactive"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Integration Steps

### Step 1: Add to TeacherDashboard

Add these imports:
```javascript
import StudentRegistrationModal from "../../components/Student/StudentRegistrationModal";
import { registerStudent } from "../../firebase/studentService";
```

Add state:
```javascript
const [showStudentModal, setShowStudentModal] = useState(false);
```

Add handler:
```javascript
const handleRegisterStudent = async (studentData) => {
  if (!checkLimit('student')) {
    setLimitModalType('student');
    setShowLimitModal(true);
    throw new Error('Student limit reached');
  }

  try {
    setLoading(true);
    const result = await registerStudent(user.uid, userData?.schoolId, studentData);
    await incrementUsage('student');
    
    showAlert('success', `Student registered! Student ID: ${result.studentId}`);
    
    // Show the student ID prominently
    alert(`Student ID: ${result.studentId}\n\nPlease save this ID. The student will use it to login.`);
    
    return result;
  } catch (error) {
    console.error('Error registering student:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

Add modal before closing Layout:
```javascript
<StudentRegistrationModal
  isOpen={showStudentModal}
  onClose={() => setShowStudentModal(false)}
  onRegister={handleRegisterStudent}
  loading={loading}
  canRegister={checkLimit('student')}
  currentUsage={studentUsage?.current || 0}
  limit={studentUsage?.limit || 0}
/>
```

Add button in students tab:
```javascript
<Button
  variant="primary"
  onClick={() => setShowStudentModal(true)}
  disabled={!checkLimit('student')}
>
  Register New Student
</Button>
```

### Step 2: Update Login Page

Add Student ID login option:

```javascript
const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'studentId'
const [studentId, setStudentId] = useState('');

// Add to login handler
if (loginMethod === 'studentId') {
  // Verify student ID
  const student = await verifyStudentId(studentId);
  // Login logic for student
} else {
  // Existing email/password login
}
```

Add UI toggle:
```javascript
<div className="flex gap-4 mb-4">
  <button
    onClick={() => setLoginMethod('email')}
    className={loginMethod === 'email' ? 'active' : ''}
  >
    Email Login
  </button>
  <button
    onClick={() => setLoginMethod('studentId')}
    className={loginMethod === 'studentId' ? 'active' : ''}
  >
    Student ID Login
  </button>
</div>

{loginMethod === 'studentId' ? (
  <Input
    label="Student ID"
    placeholder="e.g., STU-A3B7K9"
    value={studentId}
    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
  />
) : (
  // Existing email/password inputs
)}
```

### Step 3: Update Firestore Rules

Add to `firestore.rules`:

```javascript
// Students collection rules
match /users/{userId} {
  // Allow students to read their own data
  allow read: if request.auth != null && 
                 resource.data.role == 'student' &&
                 resource.data.id == request.auth.uid;
  
  // Allow teachers to create students in their school
  allow create: if request.auth != null &&
                   request.resource.data.role == 'student' &&
                   request.resource.data.registeredBy == request.auth.uid;
  
  // Allow teachers to update students they registered
  allow update: if request.auth != null &&
                   resource.data.registeredBy == request.auth.uid;
}
```

### Step 4: Add Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "registeredBy", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## User Experience

### Teacher Flow

1. **Register Student:**
   - Click "Register New Student"
   - Choose email or phone
   - Enter student name and contact
   - Click "Register Student"
   - System generates Student ID (e.g., `STU-A3B7K9`)
   - Teacher receives Student ID to share with student

2. **View Students:**
   - See all registered students
   - View Student IDs
   - Copy Student ID to clipboard
   - Edit or deactivate students

### Student Flow

1. **Receive Student ID:**
   - Teacher shares Student ID (e.g., `STU-A3B7K9`)

2. **Login:**
   - Go to login page
   - Select "Student ID Login"
   - Enter Student ID
   - Access dashboard

## Benefits

✅ **Teacher Control:** Teachers manage student registration
✅ **No Passwords:** Students don't need to remember passwords
✅ **Simple Login:** Just enter Student ID
✅ **Unique IDs:** Each student gets a unique identifier
✅ **Trackable:** Know which teacher registered each student
✅ **Secure:** Student IDs are hard to guess
✅ **Flexible:** Support both email and phone registration

## Security Features

1. **Unique IDs:** Collision detection ensures uniqueness
2. **Character Set:** Excludes confusing characters (0, O, I, 1)
3. **Validation:** Email and phone format validation
4. **Duplicate Check:** Prevents duplicate email/phone
5. **Status Tracking:** Can deactivate students
6. **Teacher Association:** Each student linked to registering teacher

## Testing Checklist

### Registration
- [ ] Register student with email
- [ ] Register student with phone
- [ ] Try duplicate email (should fail)
- [ ] Try duplicate phone (should fail)
- [ ] Verify Student ID is generated
- [ ] Verify Student ID is unique
- [ ] Check usage count increments

### Login
- [ ] Login with valid Student ID
- [ ] Try invalid Student ID (should fail)
- [ ] Try inactive student (should fail)
- [ ] Verify case-insensitive (STU-ABC123 = stu-abc123)

### Limits
- [ ] Register up to limit
- [ ] Try to exceed limit (should block)
- [ ] Verify button disables at limit

## Migration Notes

### For Existing Students
If you have students who self-registered:
1. Generate Student IDs for them
2. Update their documents
3. Notify them of their Student IDs
4. They can login with Student ID

### Migration Script Example:
```javascript
// Generate Student IDs for existing students
const students = await getDocs(
  query(collection(db, 'users'), where('role', '==', 'student'))
);

for (const doc of students.docs) {
  if (!doc.data().studentId) {
    const studentId = await generateUniqueStudentId();
    await updateDoc(doc.ref, { studentId });
    console.log(`Generated ${studentId} for ${doc.data().name}`);
  }
}
```

## Next Steps

1. ✅ Create StudentRegistrationModal component
2. ✅ Create studentService with all functions
3. ⏳ Integrate into TeacherDashboard
4. ⏳ Update Login page for Student ID login
5. ⏳ Deploy Firestore rules and indexes
6. ⏳ Test registration flow
7. ⏳ Test login flow
8. ⏳ Migrate existing students (if any)

## Status

✅ **Components Created** - Modal and service ready
⏳ **Integration Pending** - Need to add to TeacherDashboard
⏳ **Login Update Pending** - Need to update Login page
⏳ **Testing Pending** - Ready for testing after integration
