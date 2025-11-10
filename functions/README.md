# Firebase Cloud Functions - Subscription Lifecycle Management

This directory contains Firebase Cloud Functions that handle subscription lifecycle management, including renewal reminders, automatic renewals, grace periods, and downgrades.

## Functions

### 1. checkExpiringSubscriptions
**Schedule:** Daily at 9:00 AM UTC  
**Purpose:** Checks for subscriptions expiring within 7 days and sends renewal reminder emails.

### 2. processSubscriptionRenewals
**Schedule:** Daily at 10:00 AM UTC  
**Purpose:** Processes expired subscriptions and attempts automatic renewal using stored payment methods.

### 3. processGracePeriodExpirations
**Schedule:** Daily at 11:00 AM UTC  
**Purpose:** Processes subscriptions in grace period that have expired and downgrades them to Free plan.

### 4. manualDowngrade (HTTP Callable)
**Type:** HTTP Callable Function  
**Purpose:** Allows admins to manually trigger a downgrade for testing or administrative purposes.

## Setup

### Prerequisites
- Node.js 18 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured

### Installation

1. Navigate to the functions directory:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

### Configuration

1. Initialize Firebase in your project (if not already done):
```bash
firebase init functions
```

2. Select your Firebase project:
```bash
firebase use <your-project-id>
```

### Deployment

Deploy all functions:
```bash
npm run deploy
```

Or deploy specific functions:
```bash
firebase deploy --only functions:checkExpiringSubscriptions
firebase deploy --only functions:processSubscriptionRenewals
firebase deploy --only functions:processGracePeriodExpirations
```

### Local Testing

Run functions locally using the Firebase emulator:
```bash
npm run serve
```

## Email Templates

The functions use email templates stored in Firestore. You need to set up the following templates:

1. **subscription-renewal-reminder**: Sent 7 days before expiry
2. **subscription-renewal-success**: Sent after successful renewal
3. **subscription-grace-period**: Sent when grace period is activated
4. **subscription-downgrade**: Sent when account is downgraded to Free plan

## Paystack Integration

The automatic renewal function includes a placeholder for Paystack API integration. To enable automatic renewals:

1. Add Paystack secret key to Firebase Functions config:
```bash
firebase functions:config:set paystack.secret_key="your-secret-key"
```

2. Implement the `chargePaystackSubscription` function with actual Paystack API calls.

## Security

- Only authenticated admins can call the `manualDowngrade` function
- All scheduled functions run with admin privileges
- Subscription data is protected by Firestore security rules

## Monitoring

View function logs:
```bash
npm run logs
```

Or view logs in Firebase Console:
https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions/logs

## Testing

The subscription lifecycle logic is tested in the client-side test suite:
- `src/components/Subscription/__tests__/SubscriptionLifecycle.test.jsx`

## Notes

- Grace period is set to 3 days by default
- Renewal reminders are sent 7 days before expiry
- All existing data is retained during downgrades
- Users with excess data after downgrade cannot register new items until they remove some or upgrade
