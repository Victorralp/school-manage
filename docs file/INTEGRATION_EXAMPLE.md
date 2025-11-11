# Integration Example - How to Use School-Based Subscription

## 1. Update App.jsx

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolSubscriptionProvider } from './context/SchoolSubscriptionContext';
import SchoolGuard from './components/School/SchoolGuard';
import JoinSchoolPage from './pages/JoinSchoolPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SchoolSubscriptionProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join-school" element={<JoinSchoolPage />} />
            
            {/* Protected routes - require school */}
            <Route path="/dashboard" element={
              <SchoolGuard>
                <Dashboard />
              </SchoolGuard>
            } />
            
            {/* Add more protected routes */}
          </Routes>
        </SchoolSubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

## 2. Update Dashboard to Show School Info

```javascript
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';
import SchoolManagement from '../components/School/SchoolManagement';

function Dashboard() {
  const { 
    school, 
    isAdmin, 
    subjectUsage, 
    studentUsage,
    teacherUsage 
  } = useSchoolSubscription();

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
        <div className="school-info">
          <span>{school?.name}</span>
          {isAdmin && <span className="badge">Admin</span>}
        </div>
      </header>

      <div className="usage-summary">
        <div className="usage-card">
          <h3>School-Wide Usage</h3>
          <p>Subjects: {subjectUsage.current} / {subjectUsage.limit}</p>
          <p>Students: {studentUsage.current} / {studentUsage.limit}</p>
        </div>
        
        <div className="usage-card">
          <h3>Your Contribution</h3>
          <p>Subjects: {teacherUsage.subjects}</p>
          <p>Students: {teacherUsage.students}</p>
        </div>
      </div>

      <SchoolManagement />
    </div>
  );
}

export default Dashboard;
```

## 3. Update Subject Registration Form

```javascript
import { useState } from 'react';
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';

function SubjectRegistrationForm() {
  const { 
    canAddSubject, 
    incrementUsage, 
    isAdmin,
    subjectUsage 
  } = useSchoolSubscription();
  
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if can add subject
    if (!canAddSubject()) {
      if (isAdmin) {
        setError('Your school has reached the subject limit. Please upgrade your plan.');
        // Show upgrade modal
      } else {
        setError('Your school has reached the subject limit. Please contact your admin to upgrade.');
      }
      return;
    }

    try {
      // Register subject in your database
      await registerSubject(formData);
      
      // Increment usage count
      await incrementUsage('subject');
      
      // Success - reset form
      setFormData({ name: '', code: '' });
      alert('Subject registered successfully!');
      
    } catch (err) {
      console.error('Error registering subject:', err);
      setError('Failed to register subject. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register Subject</h2>
      
      <div className="usage-info">
        <p>School usage: {subjectUsage.current} / {subjectUsage.limit} subjects</p>
        {subjectUsage.percentage >= 80 && (
          <div className="warning">
            Warning: Your school is at {subjectUsage.percentage}% of the subject limit
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Subject Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Subject Code"
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        required
      />

      {error && <div className="error">{error}</div>}

      <button type="submit">Register Subject</button>
    </form>
  );
}

export default SubjectRegistrationForm;
```

## 4. Update Student Registration Form

```javascript
import { useState } from 'react';
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';

function StudentRegistrationForm() {
  const { 
    canAddStudent, 
    incrementUsage, 
    isAdmin,
    studentUsage 
  } = useSchoolSubscription();
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if can add student
    if (!canAddStudent()) {
      if (isAdmin) {
        setError('Your school has reached the student limit. Please upgrade your plan.');
        // Show upgrade modal
      } else {
        setError('Your school has reached the student limit. Please contact your admin to upgrade.');
      }
      return;
    }

    try {
      // Register student in your database
      await registerStudent(formData);
      
      // Increment usage count
      await incrementUsage('student');
      
      // Success - reset form
      setFormData({ name: '', email: '' });
      alert('Student registered successfully!');
      
    } catch (err) {
      console.error('Error registering student:', err);
      setError('Failed to register student. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register Student</h2>
      
      <div className="usage-info">
        <p>School usage: {studentUsage.current} / {studentUsage.limit} students</p>
        {studentUsage.percentage >= 80 && (
          <div className="warning">
            Warning: Your school is at {studentUsage.percentage}% of the student limit
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Student Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <input
        type="email"
        placeholder="Student Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      {error && <div className="error">{error}</div>}

      <button type="submit">Register Student</button>
    </form>
  );
}

export default StudentRegistrationForm;
```

## 5. Create Upgrade Modal (Admin Only)

```javascript
import { useState } from 'react';
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';
import { PaystackButton } from 'react-paystack';
import { initializeSchoolPayment } from '../utils/schoolPaymentVerification';

function UpgradeModal({ onClose }) {
  const { 
    school, 
    isAdmin, 
    upgradePlan, 
    handlePaymentSuccess,
    availablePlans 
  } = useSchoolSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [currency, setCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="modal">
        <h2>Upgrade Not Available</h2>
        <p>Only school admins can upgrade the subscription plan.</p>
        <p>Please contact your school admin to upgrade.</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const paymentDetails = await upgradePlan(selectedPlan, currency);
      
      // Initialize Paystack payment
      const paystackConfig = initializeSchoolPayment({
        ...paymentDetails,
        schoolId: school.id,
        schoolName: school.name,
        paidByUserId: user.uid,
        email: user.email
      });

      // Payment will be handled by PaystackButton
      return paystackConfig;
      
    } catch (err) {
      console.error('Error initiating upgrade:', err);
      alert(err.message);
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (reference) => {
    try {
      const result = await handlePaymentSuccess({
        reference: reference.reference,
        planTier: selectedPlan,
        amount: availablePlans[selectedPlan].price[currency],
        currency,
        paidByUserId: user.uid
      });

      if (result.success) {
        alert('Payment successful! Your school plan has been upgraded.');
        onClose();
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('An error occurred. Please contact support.');
    }
  };

  const paystackConfig = {
    ...initializeSchoolPayment({
      schoolId: school.id,
      schoolName: school.name,
      planTier: selectedPlan,
      amount: availablePlans[selectedPlan].price[currency],
      currency,
      paidByUserId: user.uid,
      email: user.email
    }),
    onSuccess: onPaymentSuccess
  };

  return (
    <div className="modal">
      <h2>Upgrade School Plan</h2>
      
      <div className="plan-selector">
        <label>
          <input
            type="radio"
            value="premium"
            checked={selectedPlan === 'premium'}
            onChange={(e) => setSelectedPlan(e.target.value)}
          />
          Premium - {availablePlans.premium.price[currency]} {currency}
        </label>
        
        <label>
          <input
            type="radio"
            value="vip"
            checked={selectedPlan === 'vip'}
            onChange={(e) => setSelectedPlan(e.target.value)}
          />
          VIP - {availablePlans.vip.price[currency]} {currency}
        </label>
      </div>

      <div className="currency-selector">
        <label>
          <input
            type="radio"
            value="NGN"
            checked={currency === 'NGN'}
            onChange={(e) => setCurrency(e.target.value)}
          />
          Nigerian Naira (₦)
        </label>
        
        <label>
          <input
            type="radio"
            value="USD"
            checked={currency === 'USD'}
            onChange={(e) => setCurrency(e.target.value)}
          />
          US Dollar ($)
        </label>
      </div>

      <div className="plan-details">
        <h3>{availablePlans[selectedPlan].name}</h3>
        <ul>
          {availablePlans[selectedPlan].features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="modal-actions">
        <button onClick={onClose} disabled={loading}>Cancel</button>
        <PaystackButton
          {...paystackConfig}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay ${availablePlans[selectedPlan].price[currency]} ${currency}`}
        </PaystackButton>
      </div>
    </div>
  );
}

export default UpgradeModal;
```

## 6. Handle Subject/Student Deletion

```javascript
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';

function SubjectList() {
  const { decrementUsage } = useSchoolSubscription();

  const handleDelete = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      // Delete subject from your database
      await deleteSubject(subjectId);
      
      // Decrement usage count
      await decrementUsage('subject');
      
      alert('Subject deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert('Failed to delete subject. Please try again.');
    }
  };

  // ... rest of component
}
```

## 7. Add School Info to Navigation

```javascript
import { useSchoolSubscription } from '../context/SchoolSubscriptionContext';

function Navigation() {
  const { school, isAdmin, subjectUsage, studentUsage } = useSchoolSubscription();

  return (
    <nav>
      <div className="school-badge">
        <span>{school?.name}</span>
        {isAdmin && <span className="admin-tag">Admin</span>}
      </div>
      
      <div className="usage-indicators">
        {subjectUsage.percentage >= 80 && (
          <span className="warning-badge">
            Subjects: {subjectUsage.percentage}%
          </span>
        )}
        {studentUsage.percentage >= 80 && (
          <span className="warning-badge">
            Students: {studentUsage.percentage}%
          </span>
        )}
      </div>
      
      {/* ... rest of navigation */}
    </nav>
  );
}
```

## 8. Environment Variables

Add to `.env`:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
VITE_PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

## 9. Install Dependencies

```bash
npm install react-paystack
```

## 10. Testing Checklist

- [ ] User can create a school
- [ ] User can join a school via invitation
- [ ] Admin can invite teachers
- [ ] School-wide usage is tracked correctly
- [ ] Individual teacher usage is tracked
- [ ] Limits are enforced school-wide
- [ ] Admin can upgrade plan
- [ ] Regular teachers cannot upgrade
- [ ] Payment processing works
- [ ] Real-time updates work
- [ ] Usage decrements on deletion

## Notes

- Always check `canAddSubject()` or `canAddStudent()` before registration
- Always call `incrementUsage()` after successful registration
- Always call `decrementUsage()` after successful deletion
- Show different messages for admins vs teachers when limits are reached
- Use `isAdmin` to conditionally show admin-only features
- Display both school-wide and individual usage for transparency
