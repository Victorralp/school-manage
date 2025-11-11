import React, { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Alert from '../Alert';

const SubjectRegistrationModal = ({ 
  isOpen, 
  onClose, 
  onRegister, 
  loading,
  canRegister,
  currentUsage,
  limit
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [description, setDescription] = useState('');
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async () => {
    if (!subjectName.trim()) {
      showAlert('error', 'Please enter a subject name');
      return;
    }

    if (!subjectCode.trim()) {
      showAlert('error', 'Please enter a subject code');
      return;
    }

    if (!canRegister) {
      showAlert('error', `You've reached your limit of ${limit} subjects`);
      return;
    }

    try {
      await onRegister({
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        description: description.trim()
      });
      
      // Reset form
      setSubjectName('');
      setSubjectCode('');
      setDescription('');
      onClose();
    } catch (error) {
      showAlert('error', error.message || 'Failed to register subject');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Subject"
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
            Register Subject
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
              Your Subjects
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
              <strong>Limit Reached!</strong> You've registered the maximum number of subjects allowed on your plan.
            </p>
          </div>
        )}

        <Input
          label="Subject Name"
          placeholder="e.g., Mathematics, English, Physics"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          required
        />

        <Input
          label="Subject Code"
          placeholder="e.g., MATH101, ENG201"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Brief description of the subject"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Once registered, you can create multiple exams for this subject. 
            Each subject counts toward your plan limit.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default SubjectRegistrationModal;
