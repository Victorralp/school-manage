import { useState } from 'react';
import { initializeNewSchool, validateSchoolName } from '../../utils/schoolInitialization';
import { useAuth } from '../../context/AuthContext';

export default function CreateSchoolModal({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate school name
    const validation = validateSchoolName(schoolName);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    try {
      const result = await initializeNewSchool(schoolName, user.uid);

      if (result.success) {
        onSuccess(result.schoolId);
      } else {
        setError(result.message || 'Failed to create school');
      }
    } catch (err) {
      console.error('Error creating school:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Your School</h2>
        <p>Set up your school to start managing subscriptions and inviting teachers.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="schoolName">School Name</label>
            <input
              type="text"
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Enter your school name"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>

        <div className="info-box">
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>You'll be set as the school admin</li>
            <li>Your school starts with a Free plan</li>
            <li>You can invite other teachers to join</li>
            <li>You can upgrade the plan anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
