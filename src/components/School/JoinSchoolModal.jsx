import { useState } from 'react';
import { joinExistingSchool, validateInvitationCode } from '../../utils/schoolInitialization';
import { useAuth } from '../../context/AuthContext';

export default function JoinSchoolModal({ onSuccess, onCancel, invitationCode: initialCode = '' }) {
  const { user } = useAuth();
  const [invitationCode, setInvitationCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!invitationCode.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    setLoading(true);

    try {
      // Validate invitation code
      const validation = validateInvitationCode(invitationCode.trim());

      if (!validation.valid) {
        setError(validation.error || 'Invalid invitation code');
        setLoading(false);
        return;
      }

      // Join school
      const result = await joinExistingSchool(user.uid, validation.schoolId);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to join school');
      }
    } catch (err) {
      console.error('Error joining school:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Join a School</h2>
        <p>Enter the invitation code provided by your school admin.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invitationCode">Invitation Code</label>
            <input
              type="text"
              id="invitationCode"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Enter invitation code"
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
              {loading ? 'Joining...' : 'Join School'}
            </button>
          </div>
        </form>

        <div className="info-box">
          <p><strong>Don't have an invitation code?</strong></p>
          <p>Ask your school admin to send you an invitation link or code.</p>
        </div>
      </div>
    </div>
  );
}
