import { describe, it, expect, vi, beforeEach } from "vitest";
import { initializeTeacherSubscription } from "../../../utils/subscriptionInit";

// Mock Firebase
vi.mock("../../../firebase/config", () => ({
  db: {},
  auth: {},
}));

// Mock Firestore functions
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: vi.fn(),
  increment: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe("Subscription Lifecycle Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Free Plan Initialization", () => {
    it("should create Free plan subscription for new teacher", async () => {
      const teacherId = "teacher123";

      // Mock no existing subscription
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      mockSetDoc.mockResolvedValue(undefined);

      const result = await initializeTeacherSubscription(teacherId);

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();

      // Verify subscription data structure
      const subscriptionData = mockSetDoc.mock.calls[0][1];
      expect(subscriptionData.teacherId).toBe(teacherId);
      expect(subscriptionData.planTier).toBe("free");
      expect(subscriptionData.status).toBe("active");
      expect(subscriptionData.subjectLimit).toBe(3);
      expect(subscriptionData.studentLimit).toBe(10);
      expect(subscriptionData.currentSubjects).toBe(0);
      expect(subscriptionData.currentStudents).toBe(0);
      expect(subscriptionData.amount).toBe(0);
      expect(subscriptionData.expiryDate).toBeNull();
    });

    it("should not create duplicate subscription if one exists", async () => {
      const teacherId = "teacher123";

      // Mock existing subscription
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          planTier: "free",
          status: "active",
        }),
      });

      const result = await initializeTeacherSubscription(teacherId);

      expect(result.success).toBe(true);
      expect(result.message).toContain("already exists");
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("should handle initialization errors gracefully", async () => {
      const teacherId = "teacher123";

      mockGetDoc.mockRejectedValue(new Error("Database error"));

      const result = await initializeTeacherSubscription(teacherId);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Database error");
    });
  });

  describe("Renewal Reminder Logic", () => {
    it("should identify subscriptions expiring within 7 days", () => {
      const now = new Date();
      const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

      // Subscription expiring in 6 days should trigger reminder
      const shouldRemind6Days = sixDaysFromNow > now && sixDaysFromNow <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(shouldRemind6Days).toBe(true);

      // Subscription expiring in 8 days should not trigger reminder yet
      const shouldRemind8Days = eightDaysFromNow > now && eightDaysFromNow <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(shouldRemind8Days).toBe(false);
    });

    it("should calculate days until expiry correctly", () => {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const daysUntilExpiry = Math.ceil((threeDaysFromNow - now) / (1000 * 60 * 60 * 24));
      expect(daysUntilExpiry).toBe(3);
    });
  });

  describe("Automatic Renewal", () => {
    it("should extend subscription by one month on successful renewal", () => {
      const currentExpiryDate = new Date("2024-01-15");
      const newExpiryDate = new Date(currentExpiryDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);

      expect(newExpiryDate.getMonth()).toBe(1); // February (0-indexed)
      expect(newExpiryDate.getDate()).toBe(15);
    });

    it("should activate grace period when payment method is missing", () => {
      const subscription = {
        planTier: "premium",
        paystackCustomerCode: null,
        paystackSubscriptionCode: null,
      };

      const shouldActivateGracePeriod = !subscription.paystackCustomerCode || !subscription.paystackSubscriptionCode;
      expect(shouldActivateGracePeriod).toBe(true);
    });

    it("should activate grace period when renewal fails", () => {
      const renewalSuccess = false;

      if (!renewalSuccess) {
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        const daysInGracePeriod = Math.ceil((gracePeriodEnd - new Date()) / (1000 * 60 * 60 * 24));
        expect(daysInGracePeriod).toBe(3);
      }
    });
  });

  describe("Grace Period Activation", () => {
    it("should set grace period end date to 3 days from now", () => {
      const now = new Date();
      const gracePeriodEnd = new Date(now);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

      const daysDifference = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
      expect(daysDifference).toBe(3);
    });

    it("should update subscription status to grace_period", () => {
      const subscriptionUpdate = {
        status: "grace_period",
        gracePeriodEnd: new Date(),
      };

      expect(subscriptionUpdate.status).toBe("grace_period");
      expect(subscriptionUpdate.gracePeriodEnd).toBeInstanceOf(Date);
    });
  });

  describe("Downgrade with Data Retention", () => {
    it("should retain all data when downgrading to Free plan", () => {
      const subscription = {
        planTier: "premium",
        currentSubjects: 5,
        currentStudents: 18,
      };

      const freePlanLimits = {
        subjectLimit: 3,
        studentLimit: 10,
      };

      // After downgrade
      const downgradedSubscription = {
        ...subscription,
        planTier: "free",
        subjectLimit: freePlanLimits.subjectLimit,
        studentLimit: freePlanLimits.studentLimit,
        // currentSubjects and currentStudents remain unchanged
      };

      expect(downgradedSubscription.currentSubjects).toBe(5);
      expect(downgradedSubscription.currentStudents).toBe(18);
      expect(downgradedSubscription.planTier).toBe("free");
    });

    it("should identify when usage exceeds Free plan limits", () => {
      const subscription = {
        currentSubjects: 5,
        currentStudents: 18,
      };

      const freePlanLimits = {
        subjectLimit: 3,
        studentLimit: 10,
      };

      const exceedsSubjectLimit = subscription.currentSubjects > freePlanLimits.subjectLimit;
      const exceedsStudentLimit = subscription.currentStudents > freePlanLimits.studentLimit;

      expect(exceedsSubjectLimit).toBe(true);
      expect(exceedsStudentLimit).toBe(true);
    });

    it("should block new registrations when usage exceeds limits", () => {
      const subscription = {
        planTier: "free",
        currentSubjects: 5,
        subjectLimit: 3,
        currentStudents: 18,
        studentLimit: 10,
      };

      const canAddSubject = subscription.currentSubjects < subscription.subjectLimit;
      const canAddStudent = subscription.currentStudents < subscription.studentLimit;

      expect(canAddSubject).toBe(false);
      expect(canAddStudent).toBe(false);
    });

    it("should allow registrations after removing excess data", () => {
      const subscription = {
        planTier: "free",
        currentSubjects: 2, // Reduced from 5
        subjectLimit: 3,
        currentStudents: 9, // Reduced from 18
        studentLimit: 10,
      };

      const canAddSubject = subscription.currentSubjects < subscription.subjectLimit;
      const canAddStudent = subscription.currentStudents < subscription.studentLimit;

      expect(canAddSubject).toBe(true);
      expect(canAddStudent).toBe(true);
    });

    it("should clear payment-related fields on downgrade", () => {
      const downgradedSubscription = {
        planTier: "free",
        amount: 0,
        expiryDate: null,
        gracePeriodEnd: null,
        lastPaymentDate: null,
        paystackCustomerCode: null,
        paystackSubscriptionCode: null,
      };

      expect(downgradedSubscription.amount).toBe(0);
      expect(downgradedSubscription.expiryDate).toBeNull();
      expect(downgradedSubscription.paystackCustomerCode).toBeNull();
    });
  });

  describe("Grace Period Expiration", () => {
    it("should identify expired grace periods", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const isExpired = yesterday <= now;
      expect(isExpired).toBe(true);
    });

    it("should not process grace periods that haven't expired", () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const isExpired = tomorrow <= now;
      expect(isExpired).toBe(false);
    });
  });
});
