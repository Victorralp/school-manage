# Per-Teacher Limits Implementation Guide

## Quick Reference

The subscription system enforces limits **per teacher**, not school-wide.

## How It Works

### Limit Checking
When a teacher tries to register a subject or student:

1. System checks the teacher's `currentSubjects` or `currentStudents` count
2. Compares against the school's plan tier limit
3. Allows registration if teacher hasn't reached their individual limit

### Example Scenario

**School**: ABC Academy (Free Plan)
**Teachers**: 
- Teacher A: 2 subjects registered
- Teacher B: 3 subjects registered  
- Teacher C: 1 subject registered

**Result**:
- Teacher A can register 1 more subject (has 2/3)
- Teacher B cannot register more subjects (has 3/3)
- Teacher C can register 2 more subjects (has 1/3)

Total school subjects: 6 (but each teacher is limited to 3)

## Code Usage

### Check if Teacher Can Add Subject

```javascript
import { useSchoolSubscription } from './context/SchoolSubscriptionContext';

function SubjectForm() {
  const { canAddSubject, subjectUsage } = useSchoolSubscription();
  
  if (!canAddSubject()) {
    return <div>You've reached your limit of {subjectUsage.limit} subjects</div>;
  }
  
  // Show form...
}
```

### Display Teacher's Usage

```javascript
function UsageDisplay() {
  const { subjectUsage, studentUsage } = useSchoolSubscription();
  
  return (
    <div>
      <p>Your Subjects: {subjectUsage.current} / {subjectUsage.limit}</p>
      <p>Your Students: {studentUsage.current} / {studentUsage.limit}</p>
    </div>
  );
}
```

## Database Structure

### Teacher-School Relationship Document
```
teacherSchools/{teacherId}
{
  teacherId: "teacher123",
  schoolId: "school456",
  role: "teacher",
  currentSubjects: 2,    // This teacher's count
  currentStudents: 5,    // This teacher's count
  ...
}
```

### School Document
```
schools/{schoolId}
{
  name: "ABC Academy",
  planTier: "free",
  subjectLimit: 3,       // Per teacher limit
  studentLimit: 10,      // Per teacher limit
  currentSubjects: 6,    // Total across all teachers (for reporting)
  currentStudents: 15,   // Total across all teachers (for reporting)
  ...
}
```

## Key Points

✅ Each teacher gets the full limit (e.g., 3 subjects on Free plan)
✅ Teachers don't compete for shared resources
✅ School totals are tracked but not enforced
✅ Upgrading the plan increases limits for ALL teachers
✅ Admins have the same limits as regular teachers

## Migration Impact

If you had existing data where the school total was enforced:
- Teachers may now be able to register more items
- Each teacher's individual count is what matters
- School admins should review and upgrade if needed
