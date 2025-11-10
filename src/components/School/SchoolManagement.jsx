import { useState, useEffect } from 'react';
import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';
import { getSchoolTeachers } from '../../firebase/schoolService';
import InviteTeachers from './InviteTeachers';

export default function SchoolManagement() {
  const { school, isAdmin, teacherRelationship } = useSchoolSubscription();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'teachers', 'invite'

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
    return <div>Loading school information...</div>;
  }

  return (
    <div className="school-management">
      <div className="school-header">
        <h2>{school.name}</h2>
        {isAdmin && <span className="admin-badge">Admin</span>}
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {isAdmin && (
          <>
            <button
              className={activeTab === 'teachers' ? 'active' : ''}
              onClick={() => setActiveTab('teachers')}
            >
              Teachers ({school.teacherCount})
            </button>
            <button
              className={activeTab === 'invite' ? 'active' : ''}
              onClick={() => setActiveTab('invite')}
            >
              Invite Teachers
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="school-info-grid">
              <div className="info-card">
                <h4>School Plan</h4>
                <p className="plan-name">{school.planTier.toUpperCase()}</p>
                <p className="plan-status">Status: {school.status}</p>
              </div>

              <div className="info-card">
                <h4>Teachers</h4>
                <p className="stat-number">{school.teacherCount}</p>
                <p className="stat-label">Total teachers</p>
              </div>

              <div className="info-card">
                <h4>Subjects</h4>
                <p className="stat-number">{school.currentSubjects} / {school.subjectLimit}</p>
                <p className="stat-label">School-wide usage</p>
              </div>

              <div className="info-card">
                <h4>Students</h4>
                <p className="stat-number">{school.currentStudents} / {school.studentLimit}</p>
                <p className="stat-label">School-wide usage</p>
              </div>
            </div>

            {teacherRelationship && (
              <div className="my-usage">
                <h4>Your Contribution</h4>
                <div className="usage-grid">
                  <div>
                    <strong>Subjects:</strong> {teacherRelationship.currentSubjects}
                  </div>
                  <div>
                    <strong>Students:</strong> {teacherRelationship.currentStudents}
                  </div>
                </div>
              </div>
            )}

            {school.expiryDate && (
              <div className="expiry-info">
                <p>Plan expires: {new Date(school.expiryDate.seconds * 1000).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && isAdmin && (
          <div className="teachers-tab">
            <h3>Teachers in {school.name}</h3>
            {loading ? (
              <p>Loading teachers...</p>
            ) : (
              <div className="teachers-list">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="teacher-card">
                    <div className="teacher-info">
                      <strong>{teacher.id}</strong>
                      <span className={`role-badge ${teacher.role}`}>
                        {teacher.role}
                      </span>
                    </div>
                    <div className="teacher-usage">
                      <span>Subjects: {teacher.currentSubjects}</span>
                      <span>Students: {teacher.currentStudents}</span>
                    </div>
                    <div className="teacher-meta">
                      Joined: {new Date(teacher.joinedAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && isAdmin && (
          <div className="invite-tab">
            <InviteTeachers />
          </div>
        )}
      </div>
    </div>
  );
}
