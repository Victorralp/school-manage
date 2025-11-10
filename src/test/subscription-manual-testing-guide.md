# Subscription System Manual Testing Guide

This guide provides step-by-step instructions for manually testing the subscription system end-to-end.

## Prerequisites
- Development server running (`npm run dev`)
- Firebase emulator or live Firebase project configured
- Paystack test keys configured in `.env`
- Test user accounts (teacher role)

## Test Scenarios

### 1. Free → Premium Upgrade with Payment

**Objective**: Test the complete flow of upgrading from Free to Premium plan with payment processing.

**Steps**:
1. Login as a teacher with Free plan
2. Navigate to Subscription Settings page
3. Verify current plan shows "Free Plan" with 3 subjects / 10 students limits
4. Click "View All Plans" button
5. Verify plan comparison modal opens showing all three plans
6. Click "Select Plan" on Premium plan card
7. Verify payment modal opens with:
   - Plan details (6 subjects, 15-20 students)
   - Currency selector (NGN/USD)
   - Correct pricing (₦1,500 or $1)
8. Select currency (NGN)
9. Click "Pay" button
10. Complete Paystack payment using test card:
    - Card: 4084084084084081
    - CVV: 408
    - Expiry: Any future date
    - PIN: 0000
    - OTP: 123456
11. Verify success toast notification appears
12. Verify subscription dashboard updates to show Premium plan
13. Verify usage limits updated to 6 subjects / 15-20 students
14. Verify transaction appears in payment history

**Expected Results**:
- ✅ Payment processes successfully
- ✅ Toast notification shows success message
- ✅ Dashboard updates immediately
- ✅ New limits are active
- ✅ Transaction recorded in history

---

### 2. Limit Enforcement at Each Tier

**Objective**: Verify that subject and student registration limits are enforced correctly.

#### Test 2a: Free Plan Limits

**Steps**:
1. Login as teacher with Free plan (3 subjects, 10 students)
2. Register 3 subjects successfully
3. Attempt to register 4th subject
4. Verify error toast appears: "You've reached your subject limit"
5. Verify registration is blocked
6. Register 10 students successfully
7. Attempt to register 11th student
8. Verify error toast appears: "You've reached your student limit"
9. Verify registration is blocked

**Expected Results**:
- ✅ Can register up to limits
- ✅ Cannot exceed limits
- ✅ Error toasts display correctly
- ✅ Upgrade prompt shown in error

#### Test 2b: Premium Plan Limits

**Steps**:
1. Upgrade to Premium plan
2. Register 6 subjects successfully
3. Attempt to register 7th subject
4. Verify limit enforcement
5. Register 15-20 students successfully
6. Attempt to exceed student limit
7. Verify limit enforcement

**Expected Results**:
- ✅ Premium limits enforced correctly
- ✅ Error messages appropriate for Premium tier

#### Test 2c: 80% Warning Threshold

**Steps**:
1. On Free plan with 0 subjects
2. Register 2 subjects (67% usage)
3. Register 3rd subject (100% usage)
4. Verify warning toast appears at 80%+ usage
5. Repeat for students (8+ students should trigger warning)

**Expected Results**:
- ✅ Warning toast appears at 80% threshold
- ✅ Warning suggests upgrading
- ✅ Warning is dismissible

---

### 3. Downgrade with Data Retention

**Objective**: Verify that downgrading retains existing data but blocks new registrations.

**Steps**:
1. Login as teacher with Premium plan
2. Register 5 subjects and 15 students
3. Navigate to Subscription Settings
4. Click "Cancel Subscription"
5. Confirm cancellation in modal
6. Verify warning toast about grace period
7. Wait for grace period to expire (or manually trigger downgrade)
8. Verify plan downgrades to Free
9. Verify all 5 subjects still visible and accessible
10. Verify all 15 students still visible and accessible
11. Attempt to register new subject
12. Verify blocked with message about exceeding Free plan limits
13. Delete 2 subjects to get to 3 total
14. Verify can now register new subjects (up to 3 total)

**Expected Results**:
- ✅ Cancellation initiates grace period
- ✅ After grace period, downgrades to Free
- ✅ All existing data retained
- ✅ New registrations blocked when over limits
- ✅ Can register again after reducing to within limits

---

### 4. Payment Failure Scenarios

**Objective**: Test error handling for failed payments.

#### Test 4a: Declined Card

**Steps**:
1. Attempt to upgrade to Premium
2. Use Paystack test card for declined transaction: 5060666666666666666
3. Verify payment fails
4. Verify error toast appears
5. Verify plan remains unchanged (Free)
6. Verify no transaction recorded

**Expected Results**:
- ✅ Payment failure handled gracefully
- ✅ Error toast displays user-friendly message
- ✅ Plan not upgraded
- ✅ User can retry

#### Test 4b: Network Error

**Steps**:
1. Disconnect internet
2. Attempt to upgrade
3. Verify error handling
4. Reconnect internet
5. Retry upgrade

**Expected Results**:
- ✅ Network errors caught and displayed
- ✅ User can retry after reconnection

#### Test 4c: User Closes Payment Modal

**Steps**:
1. Click upgrade to Premium
2. Open payment modal
3. Close modal without paying
4. Verify plan remains unchanged
5. Verify no error messages

**Expected Results**:
- ✅ Closing modal doesn't cause errors
- ✅ Can reopen and try again

---

### 5. Mobile Experience

**Objective**: Verify responsive design and mobile usability.

**Steps**:
1. Open app on mobile device or use browser dev tools (375px width)
2. Navigate to Subscription Settings
3. Verify dashboard displays correctly:
   - Plan cards stack vertically
   - Text is readable
   - Buttons are touch-friendly (44px min)
4. Open plan comparison
5. Verify plans stack vertically on mobile
6. Verify all content is accessible without horizontal scroll
7. Open payment modal
8. Verify modal fits screen
9. Verify currency selector works on touch
10. Test toast notifications on mobile
11. Verify toasts appear at top and are readable
12. Verify toasts can be dismissed with touch

**Expected Results**:
- ✅ All components responsive
- ✅ No horizontal scrolling required
- ✅ Touch targets adequate size
- ✅ Text readable at mobile sizes
- ✅ Modals fit mobile screens
- ✅ Toasts display correctly

---

## Error Boundary Testing

**Objective**: Verify error boundaries catch and display errors gracefully.

**Steps**:
1. Temporarily introduce an error in SubscriptionDashboard component
2. Navigate to subscription page
3. Verify error boundary catches error
4. Verify user-friendly error message displays
5. Verify "Try Again" and "Reload Page" buttons work
6. Fix the error
7. Verify app recovers

**Expected Results**:
- ✅ Error boundary catches errors
- ✅ User-friendly fallback UI shown
- ✅ Recovery options work

---

## Loading States Testing

**Objective**: Verify skeleton loaders display during data fetching.

**Steps**:
1. Clear browser cache
2. Navigate to Subscription Settings
3. Observe loading state (may need to throttle network)
4. Verify skeleton loader displays
5. Verify skeleton matches final layout
6. Wait for data to load
7. Verify smooth transition from skeleton to content

**Expected Results**:
- ✅ Skeleton loaders display during loading
- ✅ Layout doesn't shift when content loads
- ✅ Smooth visual transition

---

## Toast Notification Testing

**Objective**: Verify all toast notifications work correctly.

**Test Cases**:
1. **Success Toast**: Upgrade plan successfully
2. **Error Toast**: Attempt to exceed limit
3. **Warning Toast**: Reach 80% of limit
4. **Warning Toast**: Cancel subscription
5. **Multiple Toasts**: Trigger multiple notifications quickly

**Expected Results**:
- ✅ Toasts appear with correct styling
- ✅ Icons match notification type
- ✅ Messages are clear and actionable
- ✅ Toasts auto-dismiss after 5 seconds
- ✅ Can manually dismiss toasts
- ✅ Multiple toasts stack correctly

---

## Regression Testing

After completing all tests above, verify:
- ✅ Existing features still work (subject/student registration)
- ✅ Navigation works correctly
- ✅ No console errors
- ✅ No memory leaks (check browser dev tools)
- ✅ Performance is acceptable

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1. Free → Premium Upgrade | ⬜ Pass ⬜ Fail | |
| 2a. Free Plan Limits | ⬜ Pass ⬜ Fail | |
| 2b. Premium Plan Limits | ⬜ Pass ⬜ Fail | |
| 2c. 80% Warning | ⬜ Pass ⬜ Fail | |
| 3. Downgrade with Data | ⬜ Pass ⬜ Fail | |
| 4a. Declined Card | ⬜ Pass ⬜ Fail | |
| 4b. Network Error | ⬜ Pass ⬜ Fail | |
| 4c. Close Modal | ⬜ Pass ⬜ Fail | |
| 5. Mobile Experience | ⬜ Pass ⬜ Fail | |
| Error Boundaries | ⬜ Pass ⬜ Fail | |
| Loading States | ⬜ Pass ⬜ Fail | |
| Toast Notifications | ⬜ Pass ⬜ Fail | |
```

---

## Known Issues / Notes

Document any issues found during testing:
- 
- 
- 

---

## Paystack Test Cards

For testing different scenarios:

| Scenario | Card Number | CVV | PIN | OTP |
|----------|-------------|-----|-----|-----|
| Success | 4084084084084081 | 408 | 0000 | 123456 |
| Declined | 5060666666666666666 | 123 | 0000 | 123456 |
| Insufficient Funds | 5060666666666666666 | 123 | 0000 | 123456 |

More test cards: https://paystack.com/docs/payments/test-payments
