# Requirements Document

## Introduction

This document defines the requirements for a school-based subscription plan system that enables schools to manage subscriptions while teachers register subjects and students. The system provides three tiers (Free, Premium, and VIP) with different limits on the number of subjects and students that can be registered per teacher (not school-wide).

## Glossary

- **Subscription System**: The software component that manages school subscription plans, enforces limits, and processes payments
- **School**: An educational institution that holds the subscription and contains multiple teachers
- **School Admin**: A user with administrative privileges who can manage the school's subscription and payment
- **Teacher**: A user who registers subjects and students within the application, belonging to a school
- **Subject**: An academic course or class that a teacher can register in the system
- **Student**: A learner who can be registered under a teacher's account
- **Plan Tier**: A subscription level (Free, Premium, or VIP) with specific limits and pricing
- **Subject Limit**: The maximum number of subjects that can be registered per teacher based on the school's plan tier
- **Student Limit**: The maximum number of students that can be registered per teacher based on the school's plan tier
- **Payment Gateway**: The external service that processes subscription payments
- **School-Wide Usage**: The aggregate count of subjects and students across all teachers in a school

## Requirements

### Requirement 1

**User Story:** As a new school admin, I want to create a school with a free plan, so that my teachers can try the system without any payment

#### Acceptance Criteria

1. WHEN a school admin creates a school, THE Subscription System SHALL assign the Free plan to the school
2. THE Subscription System SHALL set the subject limit to 3 per teacher for the Free plan
3. THE Subscription System SHALL set the student limit to 10 per teacher for the Free plan
4. THE Subscription System SHALL allow all teachers in the school to access Free plan features without payment information
5. THE Subscription System SHALL designate the school creator as the school admin with payment privileges

### Requirement 2

**User Story:** As a school admin on the Free plan, I want to upgrade to Premium, so that my teachers can register more subjects and students

#### Acceptance Criteria

1. WHEN a school admin selects the Premium plan upgrade, THE Subscription System SHALL display the price as ₦1,500 or $1
2. WHEN a school admin completes Premium plan payment, THE Subscription System SHALL update each teacher's subject limit to 6
3. WHEN a school admin completes Premium plan payment, THE Subscription System SHALL update each teacher's student limit to a range between 15 and 20
4. WHEN the Premium plan payment is verified, THE Subscription System SHALL activate the Premium plan features for all teachers within 5 minutes
5. IF payment verification fails, THEN THE Subscription System SHALL maintain the current plan and notify the school admin of the failure
6. THE Subscription System SHALL only allow school admins to initiate plan upgrades and process payments

### Requirement 3

**User Story:** As a school admin with growing needs, I want to upgrade to the VIP plan, so that my teachers can manage more subjects and students

#### Acceptance Criteria

1. WHEN a school admin selects the VIP plan upgrade, THE Subscription System SHALL display the price as ₦4,500 or $3
2. WHEN a school admin completes VIP plan payment, THE Subscription System SHALL update each teacher's subject limit to a range between 6 and 10
3. WHEN a school admin completes VIP plan payment, THE Subscription System SHALL update each teacher's student limit to 30
4. WHEN the VIP plan payment is verified, THE Subscription System SHALL activate the VIP plan features for all teachers within 5 minutes
5. IF payment verification fails, THEN THE Subscription System SHALL maintain the current plan and notify the school admin of the failure
6. THE Subscription System SHALL only allow school admins to initiate plan upgrades and process payments

### Requirement 4

**User Story:** As a teacher, I want to see my school's current plan details, so that I know the school-wide limits and usage

#### Acceptance Criteria

1. THE Subscription System SHALL display the school's current plan tier name
2. THE Subscription System SHALL display the number of subjects currently registered by the teacher and their individual subject limit
3. THE Subscription System SHALL display the number of students currently registered by the teacher and their individual student limit
4. THE Subscription System SHALL display the plan expiration date for Premium and VIP plans
5. THE Subscription System SHALL display the teacher's individual usage (subjects and students registered by this teacher)
6. WHEN a teacher views plan details, THE Subscription System SHALL display the information within 2 seconds
7. THE Subscription System SHALL indicate whether the user is a school admin with payment privileges

### Requirement 5

**User Story:** As a teacher, I want to be prevented from exceeding my school's plan limits, so that the system enforces fair usage across all teachers

#### Acceptance Criteria

1. WHEN any teacher attempts to register a subject beyond their individual subject limit, THE Subscription System SHALL reject the registration request
2. WHEN any teacher attempts to register a student beyond their individual student limit, THE Subscription System SHALL reject the registration request
3. WHEN a registration is rejected due to limits, THE Subscription System SHALL display a message indicating the teacher's current limit and suggest that the school admin upgrade
4. THE Subscription System SHALL validate school-wide limits before allowing any subject or student registration by any teacher
5. WHEN the school reaches 80 percent of any limit, THE Subscription System SHALL display a warning notification to all teachers
6. THE Subscription System SHALL track individual teacher usage for reporting purposes while enforcing school-wide limits

### Requirement 6

**User Story:** As a teacher, I want to view available plans and their features, so that I can choose the best option for my needs

#### Acceptance Criteria

1. THE Subscription System SHALL display all three plan tiers with their names, prices, and limits per teacher
2. THE Subscription System SHALL display the Free plan with 0 cost, 3 subjects per teacher, and 10 students per teacher
3. THE Subscription System SHALL display the Premium plan with ₦1,500 cost, 6 subjects per teacher, and 15-20 students per teacher
4. THE Subscription System SHALL display the VIP plan with ₦4,500 cost, 6-10 subjects per teacher, and 30 students per teacher
5. THE Subscription System SHALL highlight the teacher's current plan in the plan comparison view

### Requirement 7

**User Story:** As a school with a paid plan, I want the subscription to renew automatically, so that teachers don't lose access to subjects and students

#### Acceptance Criteria

1. WHEN a Premium or VIP plan approaches expiration within 7 days, THE Subscription System SHALL send a renewal reminder to the school admin
2. WHEN a paid plan expires, THE Subscription System SHALL attempt automatic renewal using the stored payment method
3. IF automatic renewal succeeds, THEN THE Subscription System SHALL extend the plan for another billing period
4. IF automatic renewal fails, THEN THE Subscription System SHALL notify the school admin and provide a 3-day grace period
5. WHEN the grace period expires without payment, THE Subscription System SHALL downgrade the school to the Free plan
6. THE Subscription System SHALL notify all teachers in the school when a downgrade occurs

### Requirement 8

**User Story:** As a school being downgraded to a lower plan, I want to retain all teacher data, so that we don't lose our work

#### Acceptance Criteria

1. WHEN a school downgrades to a plan with lower limits, THE Subscription System SHALL retain all existing subjects and students across all teachers
2. WHEN existing data exceeds the new plan limits, THE Subscription System SHALL prevent new registrations by any teacher until enough data is removed or the school admin upgrades
3. THE Subscription System SHALL display a notification to all teachers explaining the data retention and registration restrictions
4. THE Subscription System SHALL allow all teachers to view and manage all existing data regardless of current plan limits
5. WHEN teachers remove enough data to fall within limits, THE Subscription System SHALL allow new registrations within 1 minute
6. THE Subscription System SHALL notify the school admin about the downgrade and current usage status

### Requirement 9

**User Story:** As a system administrator, I want to track school subscription metrics, so that I can understand plan adoption and revenue

#### Acceptance Criteria

1. THE Subscription System SHALL record the timestamp of each school plan upgrade or downgrade
2. THE Subscription System SHALL record the payment amount, currency, and paying user for each transaction
3. THE Subscription System SHALL maintain a count of active school subscriptions for each plan tier
4. THE Subscription System SHALL calculate total revenue from Premium and VIP school subscriptions
5. THE Subscription System SHALL track the number of teachers per school
6. WHEN an administrator requests subscription metrics, THE Subscription System SHALL provide the data within 5 seconds

### Requirement 10

**User Story:** As a school admin, I want to receive confirmation after payment, so that I know the school upgrade was successful

#### Acceptance Criteria

1. WHEN a payment is successfully processed, THE Subscription System SHALL send a confirmation email to the school admin within 2 minutes
2. THE Subscription System SHALL display a success message on screen immediately after payment verification
3. THE Subscription System SHALL include the school name, plan name, price paid, and new limits in the confirmation
4. THE Subscription System SHALL provide a receipt with a unique transaction identifier
5. THE Subscription System SHALL update all teachers' dashboards to reflect the new plan within 1 minute of payment confirmation
6. THE Subscription System SHALL notify all teachers in the school about the plan upgrade

### Requirement 11

**User Story:** As a new user, I want to create or join a school, so that I can start using the system

#### Acceptance Criteria

1. WHEN a new user registers, THE Subscription System SHALL prompt them to either create a new school or join an existing school
2. WHEN a user creates a new school, THE Subscription System SHALL designate them as the school admin
3. WHEN a user joins an existing school, THE Subscription System SHALL assign them the teacher role
4. THE Subscription System SHALL require a school invitation code or admin approval for teachers joining existing schools
5. THE Subscription System SHALL allow school admins to invite teachers via email or shareable invitation link
6. THE Subscription System SHALL increment the school's teacher count when a new teacher joins
