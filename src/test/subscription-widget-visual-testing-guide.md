# Subscription Widget UI Enhancement - Manual Visual Testing Guide

This guide provides step-by-step instructions for manually testing the enhanced Subscription Widget UI.

## Prerequisites

1. Start the development server: `npm run dev`
2. Have access to test accounts with different plan tiers and statuses
3. Use browser DevTools for responsive testing

---

## Test 1: Plan Tier Visual Display (Requirements: 1.1, 1.2, 1.3, 1.4)

### 1.1 Free Plan Display
**Steps:**
1. Log in as a teacher/admin with a Free plan subscription
2. Navigate to the dashboard where the subscription widget is displayed

**Expected Results:**
- [ ] Widget has a subtle gray/blue gradient background (`from-slate-100 via-blue-50 to-slate-100`)
- [ ] Plan badge shows "FREE" with gray styling (`bg-slate-200 text-slate-700`)
- [ ] Star icon is displayed next to the school name
- [ ] Icon has a slate/gray background (`bg-slate-100`)
- [ ] Border is slate colored (`border-slate-200`)
- [ ] "View Details" button uses outline variant

### 1.2 Premium Plan Display
**Steps:**
1. Log in as a teacher/admin with a Premium plan subscription
2. Navigate to the dashboard

**Expected Results:**
- [ ] Widget has a gold/amber gradient background (`from-amber-50 via-yellow-50 to-orange-50`)
- [ ] Plan badge shows "PREMIUM" with gradient gold styling
- [ ] Sparkles icon is displayed next to the school name
- [ ] Icon has an amber background (`bg-amber-100`)
- [ ] Border is amber colored (`border-amber-200`)
- [ ] Buttons use primary variant styling

### 1.3 VIP Plan Display
**Steps:**
1. Log in as a teacher/admin with a VIP plan subscription
2. Navigate to the dashboard

**Expected Results:**
- [ ] Widget has a purple/indigo gradient background (`from-purple-50 via-indigo-50 to-violet-50`)
- [ ] Plan badge shows "VIP" with gradient purple styling
- [ ] Crown icon is displayed next to the school name
- [ ] Icon has a purple background (`bg-purple-100`)
- [ ] Border is purple colored (`border-purple-200`)
- [ ] Buttons use primary variant styling

---

## Test 2: Status Badge Display (Requirements: 2.1, 2.2, 2.3, 2.4, 2.5)

### 2.1 Active Status
**Steps:**
1. View a subscription with "active" status

**Expected Results:**
- [ ] Badge shows "Active" text
- [ ] Badge has green styling (`bg-green-100 text-green-800 border-green-200`)
- [ ] CheckCircle icon is displayed
- [ ] No animation on the badge

### 2.2 Grace Period Status
**Steps:**
1. View a subscription with "grace_period" status

**Expected Results:**
- [ ] Badge shows "Grace Period" text
- [ ] Badge has amber/orange styling (`bg-amber-100 text-amber-800 border-amber-200`)
- [ ] ExclamationTriangle icon is displayed
- [ ] Badge has a subtle pulse animation (`animate-pulse-subtle`)

### 2.3 Expired Status
**Steps:**
1. View a subscription with "expired" status

**Expected Results:**
- [ ] Badge shows "Expired" text
- [ ] Badge has red styling (`bg-red-100 text-red-800 border-red-200`)
- [ ] XCircle icon is displayed
- [ ] No animation on the badge

---

## Test 3: Usage Indicators - Circular Progress (Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6)

### 3.1 Healthy Usage (< 50%)
**Steps:**
1. View a subscription with usage below 50% (e.g., 3/10 subjects)

**Expected Results:**
- [ ] Circular progress ring is displayed
- [ ] Progress ring is green colored (`stroke-green-500`)
- [ ] Background ring is light green (`stroke-green-100`)
- [ ] Center shows count/limit (e.g., "3/10")
- [ ] Icon (book for subjects, users for students) is displayed in center
- [ ] Label "Subjects" or "Students" appears below the circle

### 3.2 Moderate Usage (50-79%)
**Steps:**
1. View a subscription with usage between 50-79% (e.g., 6/10 subjects)

**Expected Results:**
- [ ] Progress ring is yellow colored (`stroke-yellow-500`)
- [ ] Background ring is light yellow (`stroke-yellow-100`)
- [ ] Text is yellow colored (`text-yellow-600`)

### 3.3 Warning Usage (80-99%)
**Steps:**
1. View a subscription with usage between 80-99% (e.g., 8/10 subjects)

**Expected Results:**
- [ ] Progress ring is amber colored (`stroke-amber-500`)
- [ ] Background ring is light amber (`stroke-amber-100`)
- [ ] Text is amber colored (`text-amber-600`)
- [ ] Warning banner appears at top of widget

### 3.4 Critical Usage (100%)
**Steps:**
1. View a subscription with usage at 100% (e.g., 10/10 subjects)

**Expected Results:**
- [ ] Progress ring is red colored (`stroke-red-500`)
- [ ] Background ring is light red (`stroke-red-100`)
- [ ] Text is red colored (`text-red-600`)
- [ ] Warning banner appears at top of widget

### 3.5 Animation Test
**Steps:**
1. Refresh the page or navigate to the widget

**Expected Results:**
- [ ] Progress ring animates from empty to current value on load
- [ ] Animation is smooth (1s ease-out transition)

---

## Test 4: Expiry Display (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5)

### 4.1 Expiry > 30 Days
**Steps:**
1. View a paid subscription expiring in more than 30 days

**Expected Results:**
- [ ] Shows formatted date (e.g., "Jan 15, 2026")
- [ ] Neutral slate styling (`bg-slate-50 text-slate-700`)
- [ ] Calendar icon is displayed

### 4.2 Expiry 8-30 Days
**Steps:**
1. View a subscription expiring in 8-30 days

**Expected Results:**
- [ ] Shows "X days left" text
- [ ] Blue styling (`bg-blue-50 text-blue-700`)
- [ ] Calendar icon is displayed

### 4.3 Expiry 4-7 Days
**Steps:**
1. View a subscription expiring in 4-7 days

**Expected Results:**
- [ ] Shows "X days left" text
- [ ] Amber/warning styling (`bg-amber-50 text-amber-700`)
- [ ] Clock icon is displayed

### 4.4 Expiry 1-3 Days (Urgent)
**Steps:**
1. View a subscription expiring in 1-3 days

**Expected Results:**
- [ ] Shows "X day(s) left" text
- [ ] Red/urgent styling (`bg-red-50 text-red-700`)
- [ ] Clock icon is displayed
- [ ] Urgent pulse animation is active

### 4.5 Expired
**Steps:**
1. View an expired subscription

**Expected Results:**
- [ ] Shows "Expired" text
- [ ] Red styling (`bg-red-100 text-red-800`)
- [ ] ExclamationCircle icon is displayed

---

## Test 5: Contribution Panel (Requirements: 4.1, 4.2, 4.3, 4.4)

**Steps:**
1. View the subscription widget as a teacher

**Expected Results:**
- [ ] "Your Contribution" section is displayed
- [ ] Card has white semi-transparent background with shadow
- [ ] Subjects count shows with book icon (blue background)
- [ ] Students count shows with users icon (indigo background)
- [ ] Percentage of school total is displayed for each
- [ ] Icons have hover bounce effect

---

## Test 6: Responsive Behavior (Requirements: 6.4)

### 6.1 Mobile View (< 640px)
**Steps:**
1. Open browser DevTools
2. Set viewport to mobile size (e.g., 375px width)

**Expected Results:**
- [ ] Circular progress indicators stack vertically (1 column)
- [ ] Contribution panel items stack vertically
- [ ] Action buttons stack vertically
- [ ] Touch targets are at least 44x44px
- [ ] All content is readable without horizontal scrolling

### 6.2 Tablet View (641px - 1024px)
**Steps:**
1. Set viewport to tablet size (e.g., 768px width)

**Expected Results:**
- [ ] Circular progress indicators display in 2 columns
- [ ] Contribution panel displays in 2 columns
- [ ] Action buttons display side by side
- [ ] Spacing is appropriate for tablet

### 6.3 Desktop View (> 1024px)
**Steps:**
1. Set viewport to desktop size (e.g., 1280px width)

**Expected Results:**
- [ ] All elements display in optimal layout
- [ ] Enhanced hover effects are visible
- [ ] Widget has appropriate max-width

---

## Test 7: Interactive Elements (Requirements: 7.1, 7.2, 7.3, 7.4)

### 7.1 Button Hover Effects
**Steps:**
1. Hover over "View Details" button
2. Hover over "Upgrade Plan" button (if visible)

**Expected Results:**
- [ ] Buttons scale up slightly on hover (scale 1.02)
- [ ] Shadow increases on hover
- [ ] Transition is smooth (0.2s)

### 7.2 Upgrade Button Glow
**Steps:**
1. View widget as admin on Free plan
2. Hover over "Upgrade Plan" button

**Expected Results:**
- [ ] Button has gradient background (amber to orange)
- [ ] Shimmer/glow effect appears on hover
- [ ] Shadow has amber tint on hover

### 7.3 Button Click States
**Steps:**
1. Click and hold any button

**Expected Results:**
- [ ] Button scales down slightly on active (scale 0.98)
- [ ] Transition is smooth

---

## Test 8: Accessibility (Requirements: 6.5)

### 8.1 ARIA Labels
**Steps:**
1. Use browser DevTools to inspect elements
2. Or use a screen reader

**Expected Results:**
- [ ] Widget has `role="region"` and `aria-label="School subscription information"`
- [ ] Circular progress has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Status badge has `role="status"` and descriptive `aria-label`
- [ ] Expiry display has `role="status"` and descriptive `aria-label`
- [ ] Buttons have descriptive `aria-label` attributes

### 8.2 Color Contrast
**Steps:**
1. Use a contrast checker tool or browser extension

**Expected Results:**
- [ ] All text meets WCAG AA contrast requirements (4.5:1 for normal text)
- [ ] Status badges are readable
- [ ] Progress indicator text is readable

---

## Test Summary Checklist

| Test Area | Pass | Fail | Notes |
|-----------|------|------|-------|
| Free Plan Display | | | |
| Premium Plan Display | | | |
| VIP Plan Display | | | |
| Active Status Badge | | | |
| Grace Period Status Badge | | | |
| Expired Status Badge | | | |
| Healthy Usage (< 50%) | | | |
| Moderate Usage (50-79%) | | | |
| Warning Usage (80-99%) | | | |
| Critical Usage (100%) | | | |
| Progress Animation | | | |
| Expiry > 30 Days | | | |
| Expiry 8-30 Days | | | |
| Expiry 4-7 Days | | | |
| Expiry 1-3 Days | | | |
| Expired Display | | | |
| Contribution Panel | | | |
| Mobile Responsive | | | |
| Tablet Responsive | | | |
| Desktop Responsive | | | |
| Button Hover Effects | | | |
| Upgrade Button Glow | | | |
| ARIA Labels | | | |
| Color Contrast | | | |

---

## Notes

- For testing different plan tiers and statuses, you may need to modify the database directly or use admin tools
- Use browser DevTools Network throttling to test loading states
- Test on actual mobile devices if possible for touch interaction verification
