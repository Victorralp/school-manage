import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkUserSchoolStatus } from '../../utils/schoolInitialization';
import SchoolSetupWizard from './SchoolSetupWizard';

/**
 * SchoolGuard Component
 * Ensures user has a school before accessing protected routes
 * Redirects to school setup if no school found
 */
export default function SchoolGuard({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [schoolStatus, setSchoolStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      checkSchoolStatus();
    } else if (!authLoading && !user) {
      setChecking(false);
    }
  }, [user, authLoading]);

  const checkSchoolStatus = async () => {
    try {
      setChecking(true);
      const status = await checkUserSchoolStatus(user.uid);
      setSchoolStatus(status);
    } catch (error) {
      console.error('Error checking school status:', error);
      setSchoolStatus({ hasSchool: false, error: error.message });
    } finally {
      setChecking(false);
    }
  };

  // Show loading state
  if (authLoading || checking) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null; // Auth guard should handle this
  }

  // User needs to set up school
  if (schoolStatus && !schoolStatus.hasSchool) {
    return <SchoolSetupWizard />;
  }

  // User has school, render children
  return <>{children}</>;
}
