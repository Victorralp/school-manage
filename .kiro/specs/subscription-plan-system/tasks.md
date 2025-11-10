# Implementation Plan

- [x] 1. Set up subscription data models and Firebase configuration





  - Create Firestore data structure for subscriptions collection
  - Create plan configuration document in Firestore
  - Add Paystack environment variables to .env.example
  - _Requirements: 1.1, 1.2, 1.3, 6.2, 6.3, 6.4_

- [-] 2. Implement SubscriptionContext for state management


- [x] 2.1 Create SubscriptionContext with provider component


  - Write SubscriptionContext.jsx with state for subscription data, loading, and errors
  - Implement Firestore listener for real-time subscription updates
  - Add plan configuration fetching and caching
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [x] 2.2 Implement usage tracking methods


  - Write incrementUsage and decrementUsage functions with Firestore updates
  - Implement checkLimit validation function for subjects and students
  - Add canAddSubject and canAddStudent helper methods
  - Calculate usage percentages for warning thresholds
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 2.3 Implement plan upgrade/downgrade logic


  - Write upgradePlan function that initiates payment flow
  - Implement cancelSubscription function
  - Add plan comparison and validation logic
  - _Requirements: 2.1, 3.1, 7.5_

- [x] 2.4 Write unit tests for SubscriptionContext


  - Test usage increment/decrement logic
  - Test limit validation functions
  - Test plan upgrade flow
  - Mock Firestore operations
  - _Requirements: 2.1, 3.1, 5.1, 5.2_

- [x] 3. Create Paystack payment integration




- [x] 3.1 Install and configure Paystack library


  - Add react-paystack package to dependencies
  - Create Paystack configuration utility
  - Set up environment variables for public and secret keys
  - _Requirements: 2.1, 2.4, 3.1, 3.4_

- [x] 3.2 Implement PaymentModal component


  - Create PaymentModal.jsx with plan details display
  - Integrate Paystack payment popup
  - Add currency selector (NGN/USD)
  - Implement payment success callback
  - Handle payment errors and display user-friendly messages
  - _Requirements: 2.1, 2.2, 3.1, 10.2_

- [x] 3.3 Create payment verification system


  - Write verifyPayment function to validate Paystack transaction
  - Implement webhook handler for payment confirmation (backend)
  - Create transaction record in Firestore on successful payment
  - Update subscription document with new plan details
  - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.4, 3.5_

- [x] 3.4 Implement payment confirmation flow


  - Send confirmation email after successful payment
  - Display success modal with transaction details
  - Update UI to reflect new plan immediately
  - Create receipt with transaction ID
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3.5 Write integration tests for payment flow


  - Test payment modal rendering
  - Mock Paystack API responses
  - Test successful payment flow
  - Test payment failure handling
  - _Requirements: 2.1, 2.5, 3.5_

- [x] 4. Build subscription management UI components





- [x] 4.1 Create SubscriptionDashboard component


  - Build current plan card with plan name and limits
  - Add usage progress bars for subjects and students
  - Display plan expiry date for paid plans
  - Show upgrade CTA button
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 4.2 Create PlanComparison component

  - Build plan comparison table with all three tiers
  - Highlight current plan
  - Display features list for each plan
  - Add "Select Plan" or "Current Plan" buttons
  - Make responsive for mobile (stack cards vertically)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


- [x] 4.3 Implement LimitWarning component

  - Create warning banner for 80% threshold
  - Build blocking modal for 100% limit reached
  - Add "Upgrade Now" buttons in warnings
  - Make warnings dismissible with session persistence
  - _Requirements: 5.3, 5.5_


- [x] 4.4 Create SubscriptionSettings page

  - Build page to display subscription details
  - Add plan upgrade/downgrade options
  - Show payment history
  - Implement cancel subscription functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.5_


- [x] 4.5 Write component tests for subscription UI


  - Test SubscriptionDashboard rendering
  - Test PlanComparison interactions
  - Test LimitWarning display logic
  - Test responsive behavior
  - _Requirements: 4.1, 5.3, 6.1_

- [x] 5. Implement limit enforcement in registration flows





- [x] 5.1 Add limit validation to subject registration


  - Modify subject registration form to check limits before submission
  - Call checkLimit('subject') from SubscriptionContext
  - Display error modal if limit exceeded
  - Show upgrade prompt in error modal
  - Increment usage count on successful registration
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 5.2 Add limit validation to student registration


  - Modify student registration form to check limits before submission
  - Call checkLimit('student') from SubscriptionContext
  - Display error modal if limit exceeded
  - Show upgrade prompt in error modal
  - Increment usage count on successful registration
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 5.3 Implement usage decrement on deletion

  - Add decrementUsage call to subject deletion handler
  - Add decrementUsage call to student deletion handler
  - Ensure usage counts stay accurate
  - _Requirements: 5.4, 8.5_

- [x] 5.4 Add warning notifications at 80% threshold


  - Check usage percentage after each registration
  - Display warning banner when threshold reached
  - Persist warning dismissal state in session storage
  - _Requirements: 5.5_

- [x] 5.5 Write integration tests for limit enforcement



  - Test subject registration with limit validation
  - Test student registration with limit validation
  - Test usage increment/decrement
  - Test warning display at 80%
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 6. Implement subscription lifecycle management




- [x] 6.1 Create automatic subscription initialization for new teachers


  - Add Cloud Function or client-side logic to create Free plan subscription on teacher registration
  - Set initial usage counts to 0
  - Set plan limits based on Free tier
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6.2 Implement subscription renewal system


  - Create Cloud Function to check for expiring subscriptions daily
  - Send renewal reminder emails 7 days before expiry
  - Attempt automatic renewal using stored payment method
  - Handle renewal success and failure
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6.3 Implement grace period and downgrade logic


  - Activate grace period status on renewal failure
  - Send notification about grace period
  - Create Cloud Function to downgrade after grace period expires
  - Ensure data retention during downgrade
  - Block new registrations if over new limits
  - _Requirements: 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6.4 Write tests for subscription lifecycle


  - Test Free plan initialization
  - Test renewal reminder logic
  - Test automatic renewal
  - Test grace period activation
  - Test downgrade with data retention
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.5, 8.1_

- [x] 7. Add admin subscription metrics and monitoring





- [x] 7.1 Create admin subscription dashboard

  - Build page to display subscription metrics
  - Show count of active subscriptions per tier
  - Display total revenue from paid plans
  - Add charts for subscription trends

  - _Requirements: 9.3, 9.4_

- [x] 7.2 Implement subscription event logging

  - Log all plan upgrades/downgrades with timestamps
  - Log all payment transactions with amounts and currency
  - Create Firestore collection for subscription events
  - _Requirements: 9.1, 9.2_


- [x] 7.3 Create subscription analytics queries

  - Write function to calculate active subscriptions by tier
  - Write function to calculate total revenue
  - Implement date range filtering for metrics
  - Optimize queries with proper indexes
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 7.4 Write tests for admin metrics


  - Test subscription counting logic
  - Test revenue calculation
  - Test date range filtering
  - Mock Firestore queries
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 8. Integrate subscription system with existing teacher dashboard




- [x] 8.1 Add subscription widget to teacher dashboard


  - Display current plan and usage summary
  - Add quick upgrade button
  - Show warning if approaching limits
  - Link to full subscription settings page
  - _Requirements: 4.1, 4.2, 4.3, 5.5_

- [x] 8.2 Update navigation to include subscription link


  - Add "Subscription" or "My Plan" link to teacher navigation menu
  - Add badge indicator if warnings exist
  - _Requirements: 4.1_

- [x] 8.3 Wrap SubscriptionProvider in app component tree


  - Import SubscriptionProvider in main.jsx or App.jsx
  - Wrap application with SubscriptionProvider
  - Ensure it's nested inside AuthProvider
  - _Requirements: 1.1, 4.1_

- [x] 9. Implement data migration for existing teachers




- [x] 9.1 Create migration script for existing teachers


  - Write script to create Free plan subscriptions for all existing teachers
  - Count existing subjects and students for each teacher
  - Populate currentSubjects and currentStudents in subscription documents
  - Set appropriate limits based on Free plan
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 9.2 Test migration script with sample data


  - Run migration on test environment
  - Verify all teachers have subscriptions
  - Verify usage counts are accurate
  - Check for any errors or edge cases
  - _Requirements: 1.1, 5.4_

- [x] 9.3 Write validation tests for migration


  - Test subscription creation for teachers
  - Test usage count calculation
  - Test handling of teachers with no subjects/students
  - _Requirements: 1.1, 1.2_

- [x] 10. Add Firestore security rules and indexes





- [x] 10.1 Write security rules for subscriptions collection


  - Allow teachers to read their own subscription
  - Deny all write operations (only backend can write)
  - Allow admins to read all subscriptions
  - _Requirements: 4.1, 9.3_

- [x] 10.2 Write security rules for transactions collection

  - Allow teachers to read their own transactions
  - Deny all write operations
  - Allow admins to read all transactions
  - _Requirements: 9.2, 10.4_

- [x] 10.3 Create Firestore indexes


  - Create composite index for subscription queries (teacherId, status)
  - Create index for transaction queries (teacherId, createdAt)
  - Create index for admin metrics (planTier, status)
  - _Requirements: 9.5_

- [x] 11. Final integration and polish




- [x] 11.1 Add loading states and error boundaries


  - Implement skeleton loaders for subscription dashboard
  - Add error boundaries around subscription components
  - Show user-friendly error messages
  - _Requirements: 4.5_


- [x] 11.2 Implement toast notifications

  - Add toast for successful plan upgrades
  - Add toast for payment confirmations
  - Add toast for limit warnings
  - Use consistent styling with existing app
  - _Requirements: 10.1, 10.2, 5.3_



- [x] 11.3 Add mobile responsive styling

  - Test all subscription components on mobile devices
  - Ensure payment modal works on mobile
  - Stack plan comparison cards on small screens
  - Use bottom sheets for modals on mobile
  - _Requirements: 6.1, 2.1_


- [x] 11.4 Perform end-to-end testing

  - Test complete flow: Free → Premium upgrade with payment
  - Test limit enforcement at each tier
  - Test downgrade with data retention
  - Test payment failure scenarios
  - Test mobile experience
  - _Requirements: 1.1, 2.1, 5.1, 5.2, 8.1_

- [x] 11.5 Write end-to-end test suite


  - Create E2E tests for subscription upgrade flow
  - Create E2E tests for limit enforcement
  - Create E2E tests for payment processing
  - _Requirements: 2.1, 5.1, 5.2_
