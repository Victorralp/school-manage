# Subject Registration System - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Teacher Dashboard                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Subjects   │  │    Exams     │  │   Results    │        │
│  │     Tab      │  │     Tab      │  │     Tab      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │   Register   │  │   Create     │                          │
│  │   Subject    │  │    Exam      │                          │
│  │    Modal     │  │    Modal     │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Subject Service Layer                        │
│                                                                 │
│  registerSubject()  │  getTeacherSubjects()  │  deleteSubject()│
│  incrementExamCount()  │  decrementExamCount()                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firestore Database                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   subjects   │  │    exams     │  │   results    │        │
│  │  collection  │  │  collection  │  │  collection  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Relationship

```
Teacher
   │
   ├─── Subject 1 (MATH101) ────┬─── Exam 1: Midterm
   │                            ├─── Exam 2: Final
   │                            └─── Exam 3: Quiz 1
   │
   ├─── Subject 2 (ENG201) ─────┬─── Exam 1: Essay Test
   │                            └─── Exam 2: Grammar Quiz
   │
   └─── Subject 3 (PHY301) ─────└─── Exam 1: Lab Test

Limit: 3 subjects (Free Plan)
Exams: Unlimited per subject
```

## User Flow - Register Subject

```
┌─────────────────┐
│ Teacher clicks  │
│ "Register       │
│  Subject"       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check if limit  │
│ is reached      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  YES        NO
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │ Show subject    │
    │    │ registration    │
    │    │ modal           │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Enter subject   │
    │    │ name & code     │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Check for       │
    │    │ duplicate code  │
    │    └────────┬────────┘
    │             │
    │        ┌────┴────┐
    │        │         │
    │        ▼         ▼
    │      YES        NO
    │        │         │
    │        │         ▼
    │        │    ┌─────────────────┐
    │        │    │ Create subject  │
    │        │    │ in Firestore    │
    │        │    └────────┬────────┘
    │        │             │
    │        │             ▼
    │        │    ┌─────────────────┐
    │        │    │ Increment usage │
    │        │    │ count           │
    │        │    └────────┬────────┘
    │        │             │
    │        │             ▼
    │        │    ┌─────────────────┐
    │        │    │ Show success    │
    │        │    │ message         │
    │        │    └─────────────────┘
    │        │
    │        ▼
    │   ┌─────────────────┐
    │   │ Show error:     │
    │   │ "Code exists"   │
    │   └─────────────────┘
    │
    ▼
┌─────────────────┐
│ Show error:     │
│ "Limit reached" │
└─────────────────┘
```

## User Flow - Create Exam

```
┌─────────────────┐
│ Teacher clicks  │
│ "Create Exam"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check if any    │
│ subjects exist  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   NO        YES
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │ Show exam       │
    │    │ creation modal  │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Display subject │
    │    │ selector        │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Teacher selects │
    │    │ a subject       │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Enter exam      │
    │    │ details         │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Add questions   │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Create exam     │
    │    │ in Firestore    │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Increment       │
    │    │ subject exam    │
    │    │ count           │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Show success    │
    │    │ with exam code  │
    │    └─────────────────┘
    │
    ▼
┌─────────────────┐
│ Prompt to       │
│ register        │
│ subject first   │
└─────────────────┘
```

## Limit Enforcement Flow

```
Free Plan Teacher (Limit: 3 subjects)

Initial State:
┌─────────────────────────────────┐
│ Subjects: 0/3                   │
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Status: Can register            │
└─────────────────────────────────┘

After registering "Mathematics":
┌─────────────────────────────────┐
│ Subjects: 1/3                   │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ │
│ Status: Can register            │
└─────────────────────────────────┘

After registering "English":
┌─────────────────────────────────┐
│ Subjects: 2/3                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ │
│ Status: Can register            │
└─────────────────────────────────┘

After registering "Physics":
┌─────────────────────────────────┐
│ Subjects: 3/3                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ Status: LIMIT REACHED           │
└─────────────────────────────────┘

Attempting to register "Chemistry":
┌─────────────────────────────────┐
│ ❌ Cannot register              │
│ Limit reached (3/3)             │
│ Options:                        │
│ • Delete unused subject         │
│ • Upgrade plan                  │
└─────────────────────────────────┘

Creating exams (no limit impact):
┌─────────────────────────────────┐
│ Mathematics (MATH101)           │
│ ├─ Midterm Exam                │
│ ├─ Final Exam                  │
│ ├─ Quiz 1                      │
│ ├─ Quiz 2                      │
│ └─ Quiz 3                      │
│                                 │
│ Subjects: Still 3/3             │
│ (Exams don't count!)            │
└─────────────────────────────────┘
```

## Multi-Teacher School Example

```
School: ABC Academy (Free Plan)

Teacher A (3/3 subjects):
├─ Mathematics
├─ Physics  
└─ Chemistry

Teacher B (2/3 subjects):
├─ English
└─ History

Teacher C (1/3 subjects):
└─ Biology

Total School Subjects: 6
But each teacher has their own limit!

Teacher A: Cannot add more (3/3)
Teacher B: Can add 1 more (2/3)
Teacher C: Can add 2 more (1/3)
```

## Upgrade Impact

```
Before Upgrade (Free Plan):
┌─────────────────────────────────┐
│ Teacher Limit: 3 subjects       │
│ Current: 3/3 (FULL)             │
│                                 │
│ ✓ Mathematics                   │
│ ✓ English                       │
│ ✓ Physics                       │
│ ✗ Cannot add more               │
└─────────────────────────────────┘

After Upgrade (Premium Plan):
┌─────────────────────────────────┐
│ Teacher Limit: 6 subjects       │
│ Current: 3/6                    │
│                                 │
│ ✓ Mathematics                   │
│ ✓ English                       │
│ ✓ Physics                       │
│ ○ Can add 3 more!               │
└─────────────────────────────────┘
```

## Subject Lifecycle

```
┌──────────────┐
│   Created    │ ← registerSubject()
│ status:      │
│  "active"    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   In Use     │ ← Exams created
│ examCount: 3 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Exams Deleted│ ← All exams removed
│ examCount: 0 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deleted    │ ← deleteSubject()
│ status:      │
│ "inactive"   │
└──────────────┘
```

## Component Interaction

```
SubjectRegistrationModal
         │
         ├─ Validates input
         ├─ Checks limit
         └─ Calls onRegister()
                │
                ▼
        TeacherDashboard
                │
                ├─ handleRegisterSubject()
                │       │
                │       ▼
                │  subjectService.registerSubject()
                │       │
                │       ▼
                │  Firestore: subjects collection
                │       │
                │       ▼
                └─ incrementUsage()
                        │
                        ▼
                   SchoolSubscriptionContext
                        │
                        ▼
                   Updates teacher usage count
```
