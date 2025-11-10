# School Exam Management System

A comprehensive web-based exam management platform built with React, Firebase, and Tailwind CSS. This system enables schools, teachers, and students to manage and conduct online examinations efficiently.

## 🚀 Features

### Four Role-Based Dashboards

#### 1. **Admin Dashboard**
- Approve or reject new school registrations
- Monitor all registered schools, teachers, and students
- View overall system statistics
- Manage user accounts across the platform
- Track exam metrics and performance

#### 2. **School Dashboard**
- Approve/reject teacher and student registrations
- View performance summaries for all students and teachers
- Monitor school-level statistics
- Track average scores and pass rates
- Manage school-level settings

#### 3. **Teacher Dashboard**
- Create exams with multiple-choice questions (A-D)
- Set time limits and exam dates
- View student submissions and results
- Manage exam library
- Track student performance analytics
- Auto-grading functionality

#### 4. **Student Dashboard**
- Take assigned exams with countdown timer
- View scores immediately after submission
- Review past exam results and performance trends
- Track progress with detailed analytics
- Auto-submit when time expires

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Hosting**: Vercel-ready
- **Storage**: Cloudinary (for media uploads)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Cloudinary account (optional, for media uploads)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Set up Firebase**
   
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firestore security rules (see below)
   - Copy your Firebase config to the `.env` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🔥 Firebase Configuration

### Firestore Collections Structure

```
users/
  - uid (document ID)
  - email
  - name
  - role (admin/school/teacher/student)
  - schoolId
  - status (pending/active/rejected)
  - createdAt

schools/
  - schoolId (document ID)
  - name
  - email
  - status (pending/active/rejected)
  - createdAt

exams/
  - examId (document ID)
  - title
  - subject
  - timeLimit
  - teacherId
  - teacherName
  - schoolId
  - description
  - totalQuestions
  - createdAt
  - questions/ (subcollection)
    - questionText
    - options [array of 4 strings]
    - correctOption (0-3)
    - questionNumber

results/
  - resultId (document ID)
  - studentId
  - examId
  - score
  - totalQuestions
  - answers (object)
  - timestamp
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isSchool() {
      return isAuthenticated() && getUserRole() == 'school';
    }
    
    function isTeacher() {
      return isAuthenticated() && getUserRole() == 'teacher';
    }
    
    function isStudent() {
      return isAuthenticated() && getUserRole() == 'student';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        request.auth.uid == userId || 
        isAdmin() || 
        isSchool()
      );
      allow delete: if isAdmin() || isSchool();
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || request.auth.uid == schoolId;
      allow delete: if isAdmin();
    }
    
    // Exams collection
    match /exams/{examId} {
      allow read: if isAuthenticated();
      allow create: if isTeacher();
      allow update: if isAuthenticated() && resource.data.teacherId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.teacherId == request.auth.uid;
      
      match /questions/{questionId} {
        allow read: if isAuthenticated();
        allow write: if isTeacher();
      }
    }
    
    // Results collection
    match /results/{resultId} {
      allow read: if isAuthenticated();
      allow create: if isStudent();
      allow update: if isAdmin() || isTeacher();
      allow delete: if isAdmin();
    }
  }
}
```

### Firebase Authentication Setup

1. Go to Firebase Console → Authentication
2. Enable "Email/Password" sign-in method
3. No additional configuration needed (registration is handled in-app)

## 📱 Usage

### First-Time Setup

1. **Create Admin Account**
   - Register with role "School Administrator" (this will be treated as admin)
   - Manually update the user's role to "admin" in Firestore
   - Or use Firebase Console to create admin user

2. **School Registration**
   - Schools register through the signup form with their school name
   - School administrators provide both their personal name and official school name
   - Admin approves school registrations
   - Schools receive a unique School ID after approval
   - School ID is displayed in the School Dashboard for sharing with staff/students

3. **Teacher Registration**
   - Teachers register with their school's unique School ID (provided by their school admin)
   - School administrators approve teacher accounts
   - Teachers can then create exams

4. **Student Registration**
   - Students register with their school's unique School ID (provided by their school admin)
   - School administrators approve student accounts
   - Students can then take available exams

### Creating an Exam (Teacher)

1. Login as a teacher
2. Click "Create New Exam"
3. Fill in exam details (title, subject, time limit)
4. Add questions with 4 options each
5. Mark the correct answer for each question
6. Submit to create the exam

### Taking an Exam (Student)

1. Login as a student
2. Navigate to "Available Exams" tab
3. Click "Take Exam" on desired exam
4. Read instructions and click "Start Exam"
5. Answer questions within time limit
6. Submit exam (or auto-submit when time expires)
7. View results immediately

## 🎨 Features in Detail

### Real-Time Timer
- Countdown timer shows remaining time
- Color-coded warnings (green → yellow → red)
- Auto-submit when time runs out
- Prevents exam retaking

### Auto-Grading
- Instant results upon submission
- Automatic score calculation
- Pass/fail status (50% threshold)
- Detailed performance analytics

### Role-Based Access
- Protected routes based on user roles
- Automatic redirection to appropriate dashboard
- Secure authentication flow

### Approval Workflows
- Multi-level approval system
- Pending/Active/Rejected status tracking
- Email notifications (can be implemented)

### Performance Analytics
- Average scores and pass rates
- Student performance trends
- School-wide statistics
- Teacher exam metrics

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add environment variables in Vercel Dashboard**
   - Go to your project settings
   - Add all VITE_* environment variables
   - Redeploy

### Alternative: GitHub + Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy automatically on push

## 📂 Project Structure

```
school-system/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Alert.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Layout.jsx
│   │   ├── Modal.jsx
│   │   └── Table.jsx
│   ├── context/            # React Context providers
│   │   └── AuthContext.jsx
│   ├── firebase/           # Firebase configuration
│   │   └── config.js
│   ├── pages/              # Page components
│   │   ├── Admin/
│   │   │   └── AdminDashboard.jsx
│   │   ├── School/
│   │   │   └── SchoolDashboard.jsx
│   │   ├── Teacher/
│   │   │   └── TeacherDashboard.jsx
│   │   ├── Student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── Exam/
│   │   │       └── TakeExam.jsx
│   │   └── Login.jsx
│   ├── routes/             # Route protection
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .env                    # Environment variables (not in repo)
├── .env.example           # Template for environment variables
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Firestore Rules**: Implement proper security rules
3. **Authentication**: Use Firebase Authentication
4. **Data Validation**: Validate all inputs on both client and server
5. **Role Verification**: Always verify user roles before operations

## 🐛 Troubleshooting

### Common Issues

**Firebase not connecting**
- Check if `.env` variables are correctly set
- Verify Firebase project configuration
- Ensure Firestore is initialized

**Authentication errors**
- Check Firebase Authentication is enabled
- Verify email/password provider is active
- Check browser console for detailed errors

**Deployment issues**
- Ensure all environment variables are set in Vercel
- Check build logs for errors
- Verify Node.js version compatibility

## 🔑 School ID System

The system uses a unique School ID for each school to manage teacher and student registrations:

- **School Administrators**: Automatically receive a unique School ID upon registration
- **Teachers & Students**: Must use their school's ID when registering
- **School Dashboard**: Displays the School ID with a "Copy" button for easy sharing
- **Security**: School IDs are unique and cannot be changed

For detailed information, see [SCHOOL_ID_GUIDE.md](./SCHOOL_ID_GUIDE.md)

## 📝 Future Enhancements

- [ ] Email notifications for approvals
- [ ] PDF export for exam results
- [ ] Bulk student upload via CSV
- [ ] Question bank management
- [ ] Exam scheduling
- [ ] Multiple question types (essay, true/false)
- [ ] Image upload support via Cloudinary
- [ ] Dark mode
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Exam templates
- [ ] Question randomization
- [ ] Certificate generation

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email your-email@example.com or open an issue in the repository.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Tailwind CSS for styling
- React community for excellent tools and libraries

---

**Built with ❤️ for better education management**# school-manage
