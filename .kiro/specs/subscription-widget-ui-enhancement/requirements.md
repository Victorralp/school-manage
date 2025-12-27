# Requirements Document

## Introduction

This document defines the requirements for enhancing the visual design of the School Subscription Widget displayed on the teacher/admin dashboard. The current widget shows subscription plan details (plan tier, status, subjects/students usage, teacher contribution, and expiry date) in a plain, text-heavy format. The goal is to transform this into a visually engaging, modern UI that provides clear information hierarchy and delightful user experience.

## Glossary

- **Subscription_Widget**: The UI component that displays school subscription plan information on the dashboard
- **Plan_Card**: A visual card element displaying the current subscription tier with distinctive styling
- **Usage_Indicator**: A visual element showing resource consumption (subjects, students) with progress visualization
- **Status_Badge**: A styled indicator showing subscription status (active, expired, grace period)
- **Contribution_Panel**: A section displaying the individual teacher's contribution to school-wide usage
- **Expiry_Display**: A visual element showing when the subscription plan expires

## Requirements

### Requirement 1: Plan Tier Visual Identity

**User Story:** As a user, I want to see my subscription plan tier displayed with distinctive visual styling, so that I can immediately recognize my plan level.

#### Acceptance Criteria

1. THE Subscription_Widget SHALL display the plan tier (Free, Premium, VIP) with a distinctive color scheme for each tier
2. WHEN displaying the Premium plan, THE Subscription_Widget SHALL use a gradient background with gold/amber tones
3. WHEN displaying the VIP plan, THE Subscription_Widget SHALL use a gradient background with purple/indigo tones
4. WHEN displaying the Free plan, THE Subscription_Widget SHALL use a subtle gray/blue gradient
5. THE Subscription_Widget SHALL display a plan tier icon or badge that visually represents the tier level
6. THE Subscription_Widget SHALL include subtle animations or visual effects to enhance the premium feel

### Requirement 2: Status Indicator Enhancement

**User Story:** As a user, I want to see my subscription status displayed prominently with clear visual cues, so that I understand my current subscription state at a glance.

#### Acceptance Criteria

1. THE Status_Badge SHALL display the subscription status (active, expired, grace_period) with color-coded styling
2. WHEN the status is active, THE Status_Badge SHALL display with a green color and checkmark icon
3. WHEN the status is grace_period, THE Status_Badge SHALL display with an amber/orange color and warning icon
4. WHEN the status is expired, THE Status_Badge SHALL display with a red color and alert icon
5. THE Status_Badge SHALL include a subtle pulse animation for grace_period status to draw attention

### Requirement 3: Usage Statistics Visual Enhancement

**User Story:** As a user, I want to see my resource usage displayed with engaging visual elements, so that I can quickly understand my consumption levels.

#### Acceptance Criteria

1. THE Usage_Indicator SHALL display subjects and students usage with circular progress indicators or gauge-style visualizations
2. THE Usage_Indicator SHALL use color gradients that transition from green to yellow to red based on usage percentage
3. WHEN usage exceeds 80 percent, THE Usage_Indicator SHALL display a warning state with amber styling
4. WHEN usage reaches 100 percent, THE Usage_Indicator SHALL display an alert state with red styling
5. THE Usage_Indicator SHALL display the current count and limit in a clear, readable format within or near the progress visualization
6. THE Usage_Indicator SHALL include smooth animations when values change

### Requirement 4: Teacher Contribution Panel Enhancement

**User Story:** As a teacher, I want to see my individual contribution displayed in an engaging format, so that I understand my impact on school-wide usage.

#### Acceptance Criteria

1. THE Contribution_Panel SHALL display teacher's subjects and students counts with icon-based visual elements
2. THE Contribution_Panel SHALL use a card-style layout with subtle shadow and border styling
3. THE Contribution_Panel SHALL display contribution as both absolute numbers and percentage of school total
4. THE Contribution_Panel SHALL use distinct icons for subjects (book/document icon) and students (user/people icon)

### Requirement 5: Expiry Date Display Enhancement

**User Story:** As a user, I want to see my plan expiry date displayed in a clear and visually distinct format, so that I know when my subscription needs renewal.

#### Acceptance Criteria

1. THE Expiry_Display SHALL show the expiry date in a formatted, human-readable style
2. WHEN the plan expires within 7 days, THE Expiry_Display SHALL highlight with amber/warning styling
3. WHEN the plan expires within 3 days, THE Expiry_Display SHALL highlight with red/urgent styling
4. THE Expiry_Display SHALL include a calendar or clock icon to reinforce the time-based nature
5. THE Expiry_Display SHALL show days remaining when expiry is within 30 days

### Requirement 6: Overall Layout and Visual Polish

**User Story:** As a user, I want the subscription widget to have a polished, modern appearance, so that it feels professional and trustworthy.

#### Acceptance Criteria

1. THE Subscription_Widget SHALL use consistent spacing, typography, and visual hierarchy
2. THE Subscription_Widget SHALL include subtle shadow effects for depth and dimension
3. THE Subscription_Widget SHALL use smooth transitions and micro-animations for state changes
4. THE Subscription_Widget SHALL be fully responsive and display correctly on mobile devices
5. THE Subscription_Widget SHALL maintain accessibility standards with proper contrast ratios and ARIA labels
6. THE Subscription_Widget SHALL use the existing Tailwind CSS design system for consistency with the application

### Requirement 7: Interactive Elements Enhancement

**User Story:** As a user, I want interactive elements (buttons, links) to have engaging hover and click states, so that the interface feels responsive and modern.

#### Acceptance Criteria

1. WHEN a user hovers over action buttons, THE Subscription_Widget SHALL display smooth hover transitions with scale or color changes
2. THE Subscription_Widget SHALL display upgrade prompts with visually appealing call-to-action styling
3. WHEN displaying the "View Details" button, THE Subscription_Widget SHALL use styling consistent with the plan tier theme
4. WHEN displaying the "Upgrade Plan" button, THE Subscription_Widget SHALL use prominent, attention-grabbing styling
