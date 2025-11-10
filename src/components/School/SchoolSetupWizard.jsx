import { useState } from 'react';
import CreateSchoolModal from './CreateSchoolModal';
import JoinSchoolModal from './JoinSchoolModal';
import { useNavigate } from 'react-router-dom';

export default function SchoolSetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState('choose'); // 'choose', 'create', 'join'

  const handleCreateSuccess = (schoolId) => {
    console.log('School created:', schoolId);
    // Redirect to dashboard
    navigate('/dashboard');
  };

  const handleJoinSuccess = () => {
    console.log('Joined school successfully');
    // Redirect to dashboard
    navigate('/dashboard');
  };

  const handleCancel = () => {
    setStep('choose');
  };

  if (step === 'create') {
    return (
      <CreateSchoolModal
        onSuccess={handleCreateSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (step === 'join') {
    return (
      <JoinSchoolModal
        onSuccess={handleJoinSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Choose step
  return (
    <div className="setup-wizard">
      <div className="wizard-content">
        <h1>Welcome! Let's Get Started</h1>
        <p>To use the system, you need to either create a new school or join an existing one.</p>

        <div className="wizard-options">
          <div className="option-card" onClick={() => setStep('create')}>
            <div className="option-icon">🏫</div>
            <h3>Create a School</h3>
            <p>Set up a new school and become the admin. You'll be able to invite other teachers and manage the subscription.</p>
            <button className="btn-primary">Create School</button>
          </div>

          <div className="option-card" onClick={() => setStep('join')}>
            <div className="option-icon">👥</div>
            <h3>Join a School</h3>
            <p>Join an existing school using an invitation code from your school admin.</p>
            <button className="btn-secondary">Join School</button>
          </div>
        </div>

        <div className="wizard-info">
          <h4>What's the difference?</h4>
          <div className="info-grid">
            <div>
              <strong>School Admin</strong>
              <ul>
                <li>Manages school subscription</li>
                <li>Processes payments</li>
                <li>Invites teachers</li>
                <li>Views all school data</li>
              </ul>
            </div>
            <div>
              <strong>Teacher</strong>
              <ul>
                <li>Registers subjects and students</li>
                <li>Views school plan and limits</li>
                <li>Shares school-wide limits</li>
                <li>Contacts admin for upgrades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
