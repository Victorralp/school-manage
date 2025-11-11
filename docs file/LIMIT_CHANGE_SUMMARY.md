# Subscription Limit Change: Per-Teacher Implementation

## Change Summary

The subscription system has been updated to enforce limits **per teacher** instead of school-wide.

### Previous Behavior (School-Wide)
- Free Plan: 3 subjects total across ALL teachers in a school
- If a school had 5 teachers, they would share 3 subject slots total

### New Behavior (Per-Teacher)
- Free Plan: 3 subjects **per teacher**
- If a school has 5 teachers, each teacher can register 3 subjects (15 total)

## Updated Limits

### Free Plan
- **3 subjects per teacher** (not school-wide)
- **10 students per teacher** (not school-wide)
- Cost: ₦0 / $0

### Premium Plan
- **6 subjects per teacher**
- **15-20 students per teacher**
- Cost: ₦1,500 / $1 per month

### VIP Plan
- **6-10 subjects per teacher**
- **30 students per teacher**
- Cost: ₦4,500 / $3 per month

## Technical Changes

### Files Modified

1. **src/firebase/subscriptionModels.js**
   - Updated PLAN_CONFIG to clarify per-teacher limits
   - Added comments indicating limits are per teacher

2. **src/context/SchoolSubscriptionContext.jsx**
   - Changed `subjectUsage` and `studentUsage` to check teacher's individual usage
   - Updated `checkLimit()` to validate against teacher's limits, not school totals
   - Modified `exceedsLimits()` to check teacher's usage

3. **src/context/SubscriptionContext.jsx**
   - Updated default plan features to specify "per teacher"

4. **functions/index.js**
   - Added comments clarifying free plan limits are per teacher

5. **Documentation Files**
   - `.kiro/specs/subscription-plan-system/requirements.md`
   - `.kiro/specs/subscription-plan-system/design.md`
   - Updated all references from "school-wide" to "per teacher"

## Impact

### For Teachers
- Each teacher now has their own allocation of subjects and students
- Teachers can register up to their limit independently
- No competition for shared school resources

### For Schools
- More scalable: Adding teachers doesn't dilute existing teachers' limits
- Each teacher gets full access to plan benefits
- School admins still control the plan tier for all teachers

## Migration Notes

- Existing data is preserved
- Teachers who previously exceeded their individual limit (because it was school-wide) will not be able to add new items until they remove some or the school upgrades
- The system checks each teacher's `currentSubjects` and `currentStudents` from their teacher-school relationship document
