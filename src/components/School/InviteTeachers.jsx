import { useState } from 'react';
import { getInvitationLink } from '../../utils/schoolInitialization';
import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';

export default function InviteTeachers() {
  const { school, isAdmin } = useSchoolSubscription();
  const [copied, setCopied] = useState(false);

  if (!isAdmin) {
    return (
      <div className="info-message">
        Only school admins can invite teachers.
      </div>
    );
  }

  if (!school) {
    return <div>Loading...</div>;
  }

  const invitationLink = getInvitationLink(school.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${school.name}`,
        text: `You've been invited to join ${school.name}. Click the link to get started!`,
        url: invitationLink
      }).catch(err => console.error('Error sharing:', err));
    } else {
      handleCopy();
    }
  };

  return (
    <div className="invite-teachers">
      <h3>Invite Teachers to {school.name}</h3>
      <p>Share this invitation link with teachers you want to add to your school.</p>

      <div className="invitation-link-container">
        <input
          type="text"
          value={invitationLink}
          readOnly
          className="invitation-link-input"
        />
        <button
          onClick={handleCopy}
          className="btn-secondary"
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
        {navigator.share && (
          <button
            onClick={handleShare}
            className="btn-primary"
          >
            Share
          </button>
        )}
      </div>

      <div className="invitation-instructions">
        <h4>How to invite teachers:</h4>
        <ol>
          <li>Copy the invitation link above</li>
          <li>Send it to teachers via email, WhatsApp, or any messaging app</li>
          <li>Teachers click the link and join your school</li>
          <li>They'll automatically inherit your school's subscription plan</li>
        </ol>
      </div>

      <div className="info-box">
        <p><strong>Note:</strong> Invitation links are valid for 30 days. All teachers in your school share the same subscription limits.</p>
      </div>
    </div>
  );
}
