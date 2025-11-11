import React, { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Alert from '../Alert';

const StudentRegistrationModal = ({ 
  isOpen, 
  onClose, 
  onRegister, 
  loading,
  canRegister,
  currentUsage,
  limit
}) => {
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      showAlert('error', 'Please enter student name');
      return;
    }

    // Email is now required for Student ID login
    if (!email.trim()) {
      showAlert('error', 'Please enter student email (required for login)');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('error', 'Please enter a valid email address');
      return;
    }

    // Phone is optional
    if (phoneNumber.trim()) {
      // Basic phone validation (10-15 digits)
      const phoneRegex = /^\+?[\d\s-]{10,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        showAlert('error', 'Please enter a valid phone number');
        return;
      }
    }

    if (!canRegister) {
      showAlert('error', `You've reached your limit of ${limit} students`);
      return;
    }

    try {
      await onRegister({
        name: studentName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || null
      });
      
      // Reset form
      setStudentName('');
      setEmail('');
      setPhoneNumber('');
      onClose();
    } catch (error) {
      showAlert('error', error.message || 'Failed to register student');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Student"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
            disabled={!canRegister}
          >
            Register Student
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Usage Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Your Students
            </span>
            <span className="text-lg font-bold text-blue-600">
              {currentUsage} / {limit}
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                currentUsage >= limit ? 'bg-red-500' : 
                currentUsage / limit >= 0.8 ? 'bg-yellow-500' : 
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {!canRegister && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <p className="text-sm text-red-800">
              <strong>Limit Reached!</strong> You've registered the maximum number of students allowed on your plan.
            </p>
          </div>
        )}

        <Input
          label="Student Name"
          placeholder="e.g., John Doe"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          required
        />

        <Input
          label="Student Email"
          type="email"
          placeholder="e.g., student@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          helperText="Required for Student ID login"
        />

        <Input
          label="Student Phone Number (Optional)"
          type="tel"
          placeholder="e.g., +234 123 456 7890"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>📧 Email is required</strong> for Student ID login. 
            A unique Student ID will be generated automatically.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default StudentRegistrationModal;
