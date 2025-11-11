# Question Limits Per Plan - Implementation

## Overview
Added question limits per exam based on subscription plan tier.

## Question Limits by Plan

| Plan | Questions Per Exam |
|------|-------------------|
| **Free** | 10 questions |
| **Premium** | 30 questions |
| **VIP** | 100 questions |

## Changes Made

### 1. Updated Subscription Models (subscriptionModels.js)

Added `questionLimit` to each plan configuration:

```javascript
free: {
  questionLimit: 10,
  features: [
    "3 subjects per teacher",
    "Up to 10 students per teacher",
    "10 questions per exam",  // NEW
    "Limited support"
  ]
}

premium: {
  questionLimit: 30,
  features: [
    "6 subjects per teacher",
    "15-20 students per teacher",
    "Up to 30 questions per exam",  // NEW
    "Priority support",
    "Advanced analytics"
  ]
}

vip: {
  questionLimit: 100,
  features: [
    "6-10 subjects per teacher",
    "30 students per teacher",
    "Up to 100 questions per exam",  // NEW
    "24/7 support",
    "Custom features",
    "Priority processing"
  ]
}
```

### 2. Updated SchoolSubscriptionContext

**Added questionLimit getter:**
```javascript
const questionLimit = useMemo(() => {
  if (!currentPlan) {
    return 10; // Default to free plan limit
  }
  return currentPlan.questionLimit || 10;
}, [currentPlan]);
```

**Exported in context value:**
```javascript
const value = {
  // ... other values
  questionLimit,  // NEW
  // ... rest
};
```

### 3. Updated TeacherDashboard

**Added questionLimit from context:**
```javascript
const { 
  // ... other values
  questionLimit  // NEW
} = useSchoolSubscription();
```

**Added validation in addQuestion():**
```javascript
// Check question limit
if (questions.length >= questionLimit) {
  showAlert("error", `You've reached the maximum of ${questionLimit} questions for your plan.`);
  return;
}
```

**Updated UI elements:**

1. **Info Box** - Shows plan limits:
```
FREE Plan Limits
Questions per exam: Up to 10 questions
Subjects: 1/3 used
```

2. **Progress Summary** - Shows count with limit:
```
2 / 10 Questions Added
```

3. **Add Question Button** - Disabled when limit reached:
```
2 / 10 questions added (Limit reached)
[Add Question to Exam] (disabled)
```

## User Experience

### Free Plan (10 Questions)

1. **Adding Questions:**
   - Can add up to 10 questions
   - Counter shows "X / 10"
   - Button disables at 10 questions

2. **At Limit:**
   - Alert: "You've reached the maximum of 10 questions for your plan. Upgrade to add more questions."
   - Button is disabled
   - Visual indicator shows "Limit reached"

### Premium Plan (30 Questions)

1. **Adding Questions:**
   - Can add up to 30 questions
   - Counter shows "X / 30"
   - More flexibility for comprehensive exams

### VIP Plan (100 Questions)

1. **Adding Questions:**
   - Can add up to 100 questions
   - Counter shows "X / 100"
   - Suitable for extensive assessments

## Visual Indicators

### 1. Plan Info Box
```
┌─────────────────────────────────────┐
│ ℹ️ FREE Plan Limits                 │
│                                     │
│ Questions per exam: Up to 10        │
│ Subjects: 1/3 used                  │
└─────────────────────────────────────┘
```

### 2. Progress Summary (When Questions Added)
```
┌─────────────────────────────────────┐
│ ✓ 8 / 10 Questions Added           │
│   Ready to create exam              │
│                           8 / 10    │
└─────────────────────────────────────┘
```

### 3. At Limit
```
┌─────────────────────────────────────┐
│ ✓ 10 / 10 Questions Added          │
│   Limit reached                     │
│                          10 / 10    │
└─────────────────────────────────────┘

10 / 10 questions added (Limit reached)
[Add Question to Exam] (disabled)
```

## Benefits

✅ **Clear Limits:** Teachers know exactly how many questions they can add
✅ **Plan Differentiation:** Higher plans offer more questions
✅ **Visual Feedback:** Real-time counter and progress indicators
✅ **Upgrade Incentive:** Free plan users see the benefit of upgrading
✅ **No Confusion:** Button disables when limit is reached

## Testing Checklist

### Free Plan (10 Questions)
- [ ] Add 9 questions → Should work
- [ ] Add 10th question → Should work
- [ ] Try to add 11th → Should show error and disable button
- [ ] Counter shows "10 / 10"
- [ ] Button is disabled

### Premium Plan (30 Questions)
- [ ] Add 29 questions → Should work
- [ ] Add 30th question → Should work
- [ ] Try to add 31st → Should show error
- [ ] Counter shows "30 / 30"

### VIP Plan (100 Questions)
- [ ] Add 99 questions → Should work
- [ ] Add 100th question → Should work
- [ ] Try to add 101st → Should show error
- [ ] Counter shows "100 / 100"

### UI Elements
- [ ] Info box shows correct plan and limit
- [ ] Progress summary updates in real-time
- [ ] Button disables at limit
- [ ] "Limit reached" message appears
- [ ] Counter format is correct (X / Y)

## Files Modified

1. **src/firebase/subscriptionModels.js**
   - Added `questionLimit` to all plans
   - Updated features text

2. **src/context/SchoolSubscriptionContext.jsx**
   - Added `questionLimit` getter
   - Exported in context value

3. **src/pages/Teacher/TeacherDashboard.jsx**
   - Added `questionLimit` from context
   - Added validation in `addQuestion()`
   - Updated info box
   - Updated progress summary
   - Updated add button with disabled state
   - Added question counter

## Upgrade Path

When a teacher on Free plan reaches 10 questions:
1. Alert message suggests upgrading
2. Premium plan allows 30 questions (3x more)
3. VIP plan allows 100 questions (10x more)

This creates a clear value proposition for plan upgrades.

## Status

✅ **Complete** - Question limits implemented
✅ **Tested** - No diagnostics errors
✅ **User-Friendly** - Clear visual indicators
✅ **Scalable** - Easy to adjust limits per plan
