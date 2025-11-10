import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActiveSubscriptionsByTier,
  calculateTotalRevenue,
  getSubscriptionEvents,
  getSubscriptionMetrics,
  getSubscriptionTrends,
  getRevenueByPlanTier
} from "../subscriptionAnalytics";
import { getDocs } from "firebase/firestore";

// Mock Firebase
vi.mock("../../firebase/config", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => date)
  }
}));

describe("subscriptionAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveSubscriptionsByTier", () => {
    it("should count active subscriptions by tier", async () => {
      const mockDocs = [
        { data: () => ({ planTier: "free", status: "active" }) },
        { data: () => ({ planTier: "premium", status: "active" }) },
        { data: () => ({ planTier: "premium", status: "active" }) },
        { data: () => ({ planTier: "vip", status: "active" }) }
      ];

      getDocs.mockResolvedValue({
        size: 4,
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await getActiveSubscriptionsByTier();

      expect(result).toEqual({
        free: 1,
        premium: 2,
        vip: 1,
        total: 4
      });
    });

    it("should filter by specific plan tier", async () => {
      getDocs.mockResolvedValue({
        size: 2,
        forEach: vi.fn()
      });

      const result = await getActiveSubscriptionsByTier("premium");

      expect(result).toEqual({
        premium: 2
      });
    });

    it("should handle errors gracefully", async () => {
      getDocs.mockRejectedValue(new Error("Firestore error"));

      await expect(getActiveSubscriptionsByTier()).rejects.toThrow(
        "Failed to fetch subscription counts"
      );
    });
  });

  describe("calculateTotalRevenue", () => {
    it("should calculate total revenue by currency", async () => {
      const mockDocs = [
        { data: () => ({ amount: 1500, currency: "NGN", status: "success" }) },
        { data: () => ({ amount: 4500, currency: "NGN", status: "success" }) },
        { data: () => ({ amount: 1, currency: "USD", status: "success" }) },
        { data: () => ({ amount: 3, currency: "USD", status: "success" }) }
      ];

      getDocs.mockResolvedValue({
        size: 4,
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await calculateTotalRevenue();

      expect(result).toEqual({
        NGN: 6000,
        USD: 4,
        total: 6004,
        transactionCount: 4
      });
    });

    it("should filter by date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      getDocs.mockResolvedValue({
        size: 2,
        forEach: (callback) => {
          const mockDocs = [
            { data: () => ({ amount: 1500, currency: "NGN", status: "success" }) },
            { data: () => ({ amount: 1500, currency: "NGN", status: "success" }) }
          ];
          mockDocs.forEach(callback);
        }
      });

      const result = await calculateTotalRevenue(startDate, endDate);

      expect(result.NGN).toBe(3000);
      expect(result.transactionCount).toBe(2);
    });

    it("should filter by currency", async () => {
      getDocs.mockResolvedValue({
        size: 2,
        forEach: (callback) => {
          const mockDocs = [
            { data: () => ({ amount: 1, currency: "USD", status: "success" }) },
            { data: () => ({ amount: 3, currency: "USD", status: "success" }) }
          ];
          mockDocs.forEach(callback);
        }
      });

      const result = await calculateTotalRevenue(null, null, "USD");

      expect(result.USD).toBe(4);
      expect(result.NGN).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      getDocs.mockRejectedValue(new Error("Firestore error"));

      await expect(calculateTotalRevenue()).rejects.toThrow(
        "Failed to calculate revenue"
      );
    });
  });

  describe("getSubscriptionEvents", () => {
    it("should fetch subscription events", async () => {
      const mockTimestamp = new Date("2024-01-15");
      const mockDocs = [
        {
          id: "event1",
          data: () => ({
            eventType: "plan_upgrade",
            teacherId: "teacher1",
            timestamp: { toDate: () => mockTimestamp }
          })
        },
        {
          id: "event2",
          data: () => ({
            eventType: "payment_transaction",
            teacherId: "teacher2",
            timestamp: { toDate: () => mockTimestamp }
          })
        }
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await getSubscriptionEvents();

      expect(result).toHaveLength(2);
      expect(result[0].eventType).toBe("plan_upgrade");
      expect(result[1].eventType).toBe("payment_transaction");
    });

    it("should filter by event type", async () => {
      const mockDocs = [
        {
          id: "event1",
          data: () => ({
            eventType: "plan_upgrade",
            timestamp: { toDate: () => new Date() }
          })
        }
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await getSubscriptionEvents(null, null, "plan_upgrade");

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("plan_upgrade");
    });
  });

  describe("getSubscriptionMetrics", () => {
    it("should return comprehensive metrics", async () => {
      // Mock subscription counts
      getDocs.mockResolvedValueOnce({
        size: 10,
        forEach: (callback) => {
          const mockDocs = [
            { data: () => ({ planTier: "free", status: "active" }) },
            { data: () => ({ planTier: "premium", status: "active" }) },
            { data: () => ({ planTier: "vip", status: "active" }) }
          ];
          mockDocs.forEach(callback);
        }
      });

      // Mock revenue
      getDocs.mockResolvedValueOnce({
        size: 5,
        forEach: (callback) => {
          const mockDocs = [
            { data: () => ({ amount: 1500, currency: "NGN", status: "success" }) }
          ];
          mockDocs.forEach(callback);
        }
      });

      // Mock events
      getDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          const mockDocs = [
            {
              id: "event1",
              data: () => ({
                eventType: "plan_upgrade",
                timestamp: { toDate: () => new Date() }
              })
            },
            {
              id: "event2",
              data: () => ({
                eventType: "payment_transaction",
                timestamp: { toDate: () => new Date() }
              })
            }
          ];
          mockDocs.forEach(callback);
        }
      });

      const result = await getSubscriptionMetrics();

      expect(result).toHaveProperty("subscriptionCounts");
      expect(result).toHaveProperty("revenue");
      expect(result).toHaveProperty("eventStats");
      expect(result.eventStats.upgrades).toBe(1);
      expect(result.eventStats.payments).toBe(1);
    });
  });

  describe("getSubscriptionTrends", () => {
    it("should return daily trends data", async () => {
      const mockDocs = [
        {
          id: "event1",
          data: () => ({
            eventType: "plan_upgrade",
            amount: 1500,
            timestamp: { toDate: () => new Date() }
          })
        },
        {
          id: "event2",
          data: () => ({
            eventType: "payment_transaction",
            amount: 1500,
            timestamp: { toDate: () => new Date() }
          })
        }
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await getSubscriptionTrends(7);

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("upgrades");
      expect(result[0]).toHaveProperty("payments");
      expect(result[0]).toHaveProperty("revenue");
    });
  });

  describe("getRevenueByPlanTier", () => {
    it("should calculate revenue by plan tier", async () => {
      const mockDocs = [
        { data: () => ({ planTier: "premium", amount: 1500, currency: "NGN", status: "success" }) },
        { data: () => ({ planTier: "premium", amount: 1, currency: "USD", status: "success" }) },
        { data: () => ({ planTier: "vip", amount: 4500, currency: "NGN", status: "success" }) },
        { data: () => ({ planTier: "vip", amount: 3, currency: "USD", status: "success" }) }
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => mockDocs.forEach(callback)
      });

      const result = await getRevenueByPlanTier();

      expect(result.premium.NGN).toBe(1500);
      expect(result.premium.USD).toBe(1);
      expect(result.premium.count).toBe(2);
      expect(result.vip.NGN).toBe(4500);
      expect(result.vip.USD).toBe(3);
      expect(result.vip.count).toBe(2);
    });

    it("should filter by date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      getDocs.mockResolvedValue({
        forEach: (callback) => {
          const mockDocs = [
            { data: () => ({ planTier: "premium", amount: 1500, currency: "NGN", status: "success" }) }
          ];
          mockDocs.forEach(callback);
        }
      });

      const result = await getRevenueByPlanTier(startDate, endDate);

      expect(result.premium.NGN).toBe(1500);
      expect(result.premium.count).toBe(1);
    });
  });
});
