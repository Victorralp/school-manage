import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JoinSchoolModal from '../components/School/JoinSchoolModal';
import { useAuth } from '../context/AuthContext';

/**
 * JoinSchoolPage
 * Handles joining a school via invitation link
 * URL format: /join-school?code=INVITATION_CODE
 */
export default function JoinSchoolPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [invitationCode, setInvitationCode] = useState('');

  useEffect(() => {
    // Get invitation code from URL
    const code = searchParams.get('code');
    if (code) {
      setInvitationCode(code);
    }
  }, [searchParams]);

  const handleSuccess = () => {
    // Redirect to dashboard after successful join
    navigate('/dashboard');
  };

  const handleCancel = () => {
    // Redirect to home or setup page
    navigate('/');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="join-school-page">
        <div className="message-container">
          <h2>Join a School</h2>
          <p>You need to be logged in to join a school.</p>
          <button
            onClick={() => navigate('/login', { state: { returnTo: `/join-school?code=${invitationCode}` } })}
            className="btn-primary"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/register', { state: { returnTo: `/join-school?code=${invitationCode}` } })}
            className="btn-secondary"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Show join modal
  return (
    <div className="join-school-page">
      <JoinSchoolModal
        invitationCode={invitationCode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
