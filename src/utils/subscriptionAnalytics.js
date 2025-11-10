import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Get count of active subscriptions by tier
 * @param {string} planTier - Optional: filter by specific plan tier
 * @returns {Promise<Object>} Subscription counts by tier
 */
export const getActiveSubscriptionsByTier = async (planTier = null) => {
  try {
    const subscriptionsRef = collection(db, "subscriptions");
    
    let q;
    if (planTier) {
      q = query(
        subscriptionsRef,
        where("planTier", "==", planTier),
        where("status", "==", "active")
      );
    } else {
      q = query(
        subscriptionsRef,
        where("status", "==", "active")
      );
    }

    const querySnapshot = await getDocs(q);
    
    if (planTier) {
      return {
        [planTier]: querySnapshot.size
      };
    }

    // Count by tier
    const counts = {
      free: 0,
      premium: 0,
      vip: 0,
      total: querySnapshot.size
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.planTier && counts.hasOwnProperty(data.planTier)) {
        counts[data.planTier]++;
      }
    });

    return counts;
  } catch (error) {
    console.error("Error getting active subscriptions:", error);
    throw new Error("Failed to fetch subscription counts");
  }
};

/**
 * Calculate total revenue from paid plans
 * @param {Date} startDate - Optional: start date for filtering
 * @param {Date} endDate - Optional: end date for filtering
 * @param {string} currency - Optional: filter by currency (NGN/USD)
 * @returns {Promise<Object>} Revenue totals by currency
 */
export const calculateTotalRevenue = async (startDate = null, endDate = null, currency = null) => {
  try {
    const transactionsRef = collection(db, "transactions");
    
    let q = query(
      transactionsRef,
      where("status", "==", "success")
    );

    // Add date range filters if provided
    if (startDate) {
      q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
    }
    if (currency) {
      q = query(q, where("currency", "==", currency));
    }

    const querySnapshot = await getDocs(q);
    
    const revenue = {
      NGN: 0,
      USD: 0,
      total: 0,
      transactionCount: querySnapshot.size
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount || 0;
      const curr = data.currency || "NGN";
      
      if (revenue.hasOwnProperty(curr)) {
        revenue[curr] += amount;
      }
      revenue.total += amount;
    });

    // Round to 2 decimal places
    revenue.NGN = Math.round(revenue.NGN * 100) / 100;
    revenue.USD = Math.round(revenue.USD * 100) / 100;
    revenue.total = Math.round(revenue.total * 100) / 100;

    return revenue;
  } catch (error) {
    console.error("Error calculating revenue:", error);
    throw new Error("Failed to calculate revenue");
  }
};

/**
 * Get subscription events with date range filtering
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @param {string} eventType - Optional: filter by event type
 * @returns {Promise<Array>} Array of subscription events
 */
export const getSubscriptionEvents = async (startDate = null, endDate = null, eventType = null) => {
  try {
    const eventsRef = collection(db, "subscriptionEvents");
    
    let q = query(eventsRef, orderBy("timestamp", "desc"));

    // Add filters
    if (startDate) {
      q = query(q, where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }
    if (eventType) {
      q = query(q, where("eventType", "==", eventType));
    }

    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });

    return events;
  } catch (error) {
    console.error("Error fetching subscription events:", error);
    throw new Error("Failed to fetch subscription events");
  }
};

/**
 * Get subscription metrics for a specific date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Comprehensive metrics
 */
export const getSubscriptionMetrics = async (startDate = null, endDate = null) => {
  try {
    // Get active subscriptions by tier
    const subscriptionCounts = await getActiveSubscriptionsByTier();
    
    // Get revenue for date range
    const revenue = await calculateTotalRevenue(startDate, endDate);
    
    // Get events for date range
    const events = await getSubscriptionEvents(startDate, endDate);
    
    // Calculate event statistics
    const eventStats = {
      upgrades: events.filter(e => e.eventType === "plan_upgrade").length,
      downgrades: events.filter(e => e.eventType === "plan_downgrade").length,
      cancellations: events.filter(e => e.eventType === "subscription_cancelled").length,
      renewals: events.filter(e => e.eventType === "subscription_renewal").length,
      payments: events.filter(e => e.eventType === "payment_transaction").length
    };

    return {
      subscriptionCounts,
      revenue,
      eventStats,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  } catch (error) {
    console.error("Error getting subscription metrics:", error);
    throw new Error("Failed to fetch subscription metrics");
  }
};

/**
 * Get subscription trends over time
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Daily subscription counts
 */
export const getSubscriptionTrends = async (days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await getSubscriptionEvents(startDate, endDate);
    
    // Group events by date
    const dailyData = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyData[dateKey] = {
        date: dateKey,
        upgrades: 0,
        downgrades: 0,
        payments: 0,
        revenue: 0
      };
    }

    // Populate with actual data
    events.forEach(event => {
      if (event.timestamp) {
        const dateKey = event.timestamp.toISOString().split('T')[0];
        
        if (dailyData[dateKey]) {
          if (event.eventType === "plan_upgrade") {
            dailyData[dateKey].upgrades++;
          } else if (event.eventType === "plan_downgrade") {
            dailyData[dateKey].downgrades++;
          } else if (event.eventType === "payment_transaction") {
            dailyData[dateKey].payments++;
            dailyData[dateKey].revenue += event.amount || 0;
          }
        }
      }
    });

    return Object.values(dailyData);
  } catch (error) {
    console.error("Error getting subscription trends:", error);
    throw new Error("Failed to fetch subscription trends");
  }
};

/**
 * Get revenue by plan tier
 * @param {Date} startDate - Optional: start date
 * @param {Date} endDate - Optional: end date
 * @returns {Promise<Object>} Revenue breakdown by plan tier
 */
export const getRevenueByPlanTier = async (startDate = null, endDate = null) => {
  try {
    const transactionsRef = collection(db, "transactions");
    
    let q = query(
      transactionsRef,
      where("status", "==", "success")
    );

    if (startDate) {
      q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
    }

    const querySnapshot = await getDocs(q);
    
    const revenueByTier = {
      premium: { NGN: 0, USD: 0, count: 0 },
      vip: { NGN: 0, USD: 0, count: 0 }
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const planTier = data.planTier;
      const amount = data.amount || 0;
      const currency = data.currency || "NGN";
      
      if (revenueByTier[planTier]) {
        revenueByTier[planTier][currency] += amount;
        revenueByTier[planTier].count++;
      }
    });

    // Round values
    Object.keys(revenueByTier).forEach(tier => {
      revenueByTier[tier].NGN = Math.round(revenueByTier[tier].NGN * 100) / 100;
      revenueByTier[tier].USD = Math.round(revenueByTier[tier].USD * 100) / 100;
    });

    return revenueByTier;
  } catch (error) {
    console.error("Error getting revenue by plan tier:", error);
    throw new Error("Failed to calculate revenue by plan tier");
  }
};

export default {
  getActiveSubscriptionsByTier,
  calculateTotalRevenue,
  getSubscriptionEvents,
  getSubscriptionMetrics,
  getSubscriptionTrends,
  getRevenueByPlanTier
};
