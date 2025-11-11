import { useState } from 'react';
import CreateSchoolModal from './CreateSchoolModal';
import JoinSchoolModal from './JoinSchoolModal';
import { useNavigate } from 'react-router-dom';
import Card from '../Card';
import Button from '../Button';

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
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Welcome! Let's Get Started
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          To use the system, you need to either create a new school or join an existing one.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Create School Card */}
        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">🏫</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Create a School</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Set up a new school and become the admin. You'll be able to invite other teachers and manage the subscription.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setStep('create')}
              className="text-base py-3 shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create School
            </Button>
          </div>
        </Card>

        {/* Join School Card */}
        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Join a School</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Join an existing school using an invitation code from your school admin.
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setStep('join')}
              className="text-base py-3 shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join School
            </Button>
          </div>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">What's the difference?</h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Column */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <strong className="text-lg text-gray-900">School Admin</strong>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Manages school subscription</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Processes payments</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Invites teachers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Views all school data</span>
                </li>
              </ul>
            </div>

            {/* Teacher Column */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <strong className="text-lg text-gray-900">Teacher</strong>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Registers subjects and students</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Views school plan and limits</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Shares school-wide limits</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Contacts admin for upgrades</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
