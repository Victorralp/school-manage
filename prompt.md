You are an expert full-stack web developer.

Your task is to continue building a web-based School Exam Management System with the following stack:

- Frontend: React (Vite)
- Backend: Firebase (Firestore + Auth + Cloud Functions)
- Storage: Cloudinary
- Hosting: Vercel

---

## 🧱 Project Overview
The platform allows multiple schools, teachers, and students to interact in a structured exam environment.

There are 4 dashboards:
1. **Admin Dashboard**
   - Approves or rejects new schools.
   - Manages all registered schools, teachers, and students.
   - Monitors overall exam statistics.

2. **School Dashboard**
   - Approves or rejects teacher and student registrations.
   - Views performance summaries for all students and teachers.
   - Manages school-level settings.

3. **Teacher Dashboard**
   - Creates exams with multiple-choice questions (A–D).
   - Sets time limits, exam date, and assigns to specific students.
   - Registers students for exams and views their results.
   - Exam results are automatically graded and stored in Firestore.

4. **Student Dashboard**
   - Takes assigned exams within time limits.
   - Views scores immediately after submission.
   - Reviews past exam results.

---

## ⚙️ Key Features to Maintain and Extend
- Firebase Authentication for role-based login (Admin, School, Teacher, Student).
- Firestore collections:
  - `/users`
  - `/schools`
  - `/exams`
  - `/questions`
  - `/results`
- Auto-grading logic using Firebase Cloud Functions.
- Cloudinary integration for media uploads (exam images, profile pictures, etc.).
- Real-time Firestore data updates for scores, approvals, and status changes.
- Deployment-ready for Vercel.

---

## 🧩 Additional Development Guidelines
- Use React Router for navigation between dashboards.
- Protect routes using custom ProtectedRoute components.
- Use Context API for global auth state.
- Keep UI modular: reusable components for tables, forms, and alerts.
- Implement Firebase role checks before allowing access to certain pages.
- For styling: TailwindCSS or Material UI (developer’s choice).
- Every exam submission should be time-tracked; auto-submit when time runs out.
- Results appear immediately after grading.
- Use `.env` variables for Firebase and Cloudinary credentials.

---

## 🚀 Next Development Milestones
1. Add role-based redirects after login (user → respective dashboard).
2. Build Teacher “Create Exam” page with question builder UI.
3. Implement Cloud Function for automatic grading.
4. Add School/Teacher approval workflows.
5. Design analytics charts (average score, pass/fail stats).
6. Finalize responsive UI and test deployment on Vercel.

---

End of prompt.
