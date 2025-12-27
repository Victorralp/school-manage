import React from 'react';
import { calculateContribution } from './subscriptionThemes';

/**
 * Book Icon - Used for subjects count
 */
const BookIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

/**
 * Users Icon - Used for students count
 */
const UsersIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

/**
 * ContributionPanel Component
 * Displays teacher's individual contribution to school-wide usage
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param {object} teacherUsage - Teacher's usage data { subjects: number, students: number }
 * @param {object} schoolUsage - School's total usage { subjects: number, students: number }
 * @param {string} className - Additional CSS classes
 */
const ContributionPanel = ({ 
  teacherUsage = { subjects: 0, students: 0 }, 
  schoolUsage = { subjects: 0, students: 0 },
  className = '' 
}) => {
  // Calculate contribution percentages
  const subjectContribution = calculateContribution(
    teacherUsage.subjects, 
    schoolUsage.subjects
  );
  const studentContribution = calculateContribution(
    teacherUsage.students, 
    schoolUsage.students
  );

  return (
    <div
      className={`
        bg-white bg-opacity-60 rounded-lg p-4
        border border-slate-200 shadow-sm
        card-transition
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="region"
      aria-label="Your contribution to school usage"
    >
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Your Contribution
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 contribution-grid">
        {/* Subjects Contribution */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg icon-hover-bounce">
            <BookIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Subjects</p>
            <p className="text-xl font-bold text-gray-900 animate-count-up" aria-label={`${teacherUsage.subjects} subjects`}>
              {teacherUsage.subjects}
            </p>
            <p className="text-xs text-gray-500">
              {subjectContribution}% of school
            </p>
          </div>
        </div>

        {/* Students Contribution */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-indigo-50 rounded-lg icon-hover-bounce">
            <UsersIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Students</p>
            <p className="text-xl font-bold text-gray-900 animate-count-up" aria-label={`${teacherUsage.students} students`}>
              {teacherUsage.students}
            </p>
            <p className="text-xs text-gray-500">
              {studentContribution}% of school
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionPanel;
