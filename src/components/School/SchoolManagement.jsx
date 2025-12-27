import { useState, useEffect } from 'react';
import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';
import { getSchoolTeachers } from '../../firebase/schoolService';
import InviteTeachers from './InviteTeachers';
import Card from '../Card';
import CircularProgress from '../Subscription/CircularProgress';
import StatusBadge from '../Subscription/StatusBadge';
import ExpiryDisplay from '../Subscription/ExpiryDisplay';
import ContributionPanel from '../Subscription/ContributionPanel';
import { getPlanTheme } from '../Subscription/subscriptionThemes';

/**
 * Book Icon - Used for subjects
 */
const BookIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

/**
 * Users Icon - Used for students
 */
const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

/**
 * Star Icon - Used for Free tier
 */
const StarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

/**
 * Sparkles Icon - Used for Premium tier
 */
const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

/**
 * Crown Icon - Used for VIP tier
 */
const CrownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l3-3 4 4 4-8 4 8 3-3v10H3V10z" />
  </svg>
);

const TIER_ICONS = { StarIcon, SparklesIcon, CrownIcon };
const getTierIcon = (iconName) => TIER_ICONS[iconName] || StarIcon;

export default function SchoolManagement() {
  const { school, isAdmin, teacherRelationship, subjectUsage, studentUsage, teacherUsage } = useSchoolSubscription();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (school && isAdmin) {
      loadTeachers();
    } else {
      setLoading(false);
    }
  }, [school, isAdmin]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const teacherList = await getSchoolTeachers(school.id);
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!school) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  const planTier = school.planTier || 'free';
  const theme = getPlanTheme(planTier);
  const TierIcon = getTierIcon(theme.icon);
  const schoolUsageData = { subjects: subjectUsage?.current || 0, students: studentUsage?.current || 0 };

  return (
    <Card className={`card-transition bg-gradient-to-br ${theme.gradient} border-2 ${theme.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${theme.iconBg} p-2.5 rounded-xl shadow-sm`}>
            <TierIcon className={`h-6 w-6 text-${theme.accentColor}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{school.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${theme.badgeColor} shadow-sm`}>
                {planTier.toUpperCase()}
              </span>
              {isAdmin && <span className="text-xs text-blue-600 font-semibold">(Admin)</span>}
            </div>
          </div>
        </div>
        <StatusBadge status={school.status || 'active'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'overview' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {isAdmin && (
          <>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'teachers' 
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('teachers')}
            >
              Teachers ({school.teacherCount || 0})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'invite' 
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('invite')}
            >
              Invite Teachers
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Usage Statistics with Circular Progress */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">School-Wide Usage</h4>
              <div className="grid grid-cols-2 gap-6 justify-items-center">
                <CircularProgress
                  current={subjectUsage?.current || 0}
                  limit={subjectUsage?.limit || 0}
                  label="Subjects"
                  icon={<BookIcon className="w-full h-full" />}
                  size="md"
                />
                <CircularProgress
                  current={studentUsage?.current || 0}
                  limit={studentUsage?.limit || 0}
                  label="Students"
                  icon={<UsersIcon className="w-full h-full" />}
                  size="md"
                />
              </div>
            </div>

            {/* Teacher Contribution Panel */}
            {teacherUsage && (
              <ContributionPanel teacherUsage={teacherUsage} schoolUsage={schoolUsageData} />
            )}

            {/* Expiry Display */}
            {planTier !== 'free' && school.expiryDate && (
              <div className="flex justify-center">
                <ExpiryDisplay expiryDate={school.expiryDate} showFullDate={true} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && isAdmin && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Teachers in {school.name}</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No teachers found</div>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{teacher.id}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        teacher.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {teacher.role}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Subjects: {teacher.currentSubjects || 0}</span>
                      <span>Students: {teacher.currentStudents || 0}</span>
                    </div>
                    {teacher.joinedAt && (
                      <div className="text-xs text-gray-400 mt-2">
                        Joined: {new Date(teacher.joinedAt.seconds * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && isAdmin && (
          <InviteTeachers />
        )}
      </div>
    </Card>
  );
}
