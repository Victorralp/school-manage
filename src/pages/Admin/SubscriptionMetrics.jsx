import { useState, useEffect } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  getActiveSubscriptionsByTier,
  calculateTotalRevenue,
  getSubscriptionMetrics,
  getSubscriptionTrends,
  getRevenueByPlanTier
} from "../../utils/subscriptionAnalytics";

const SubscriptionMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [revenueByTier, setRevenueByTier] = useState(null);
  const [dateRange, setDateRange] = useState("30"); // days
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch all metrics
      const [metricsData, trendsData, revenueData] = await Promise.all([
        getSubscriptionMetrics(startDate, endDate),
        getSubscriptionTrends(parseInt(dateRange)),
        getRevenueByPlanTier(startDate, endDate)
      ]);

      setMetrics(metricsData);
      setTrends(trendsData);
      setRevenueByTier(revenueData);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const formatCurrency = (amount, currency) => {
    if (currency === "NGN") {
      return `₦${amount.toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMetrics}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Metrics</h1>
          <p className="text-gray-600 mt-1">Monitor subscription performance and revenue</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button onClick={fetchMetrics} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Subscription Counts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="p-6">
              <p className="text-sm font-medium text-blue-600 mb-1">Total Active</p>
              <p className="text-3xl font-bold text-blue-900">
                {metrics?.subscriptionCounts?.total || 0}
              </p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="p-6">
              <p className="text-sm font-medium text-green-600 mb-1">Free Plan</p>
              <p className="text-3xl font-bold text-green-900">
                {metrics?.subscriptionCounts?.free || 0}
              </p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="p-6">
              <p className="text-sm font-medium text-purple-600 mb-1">Premium Plan</p>
              <p className="text-3xl font-bold text-purple-900">
                {metrics?.subscriptionCounts?.premium || 0}
              </p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="p-6">
              <p className="text-sm font-medium text-yellow-600 mb-1">VIP Plan</p>
              <p className="text-3xl font-bold text-yellow-900">
                {metrics?.subscriptionCounts?.vip || 0}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Revenue Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="p-6">
              <p className="text-sm font-medium text-emerald-600 mb-1">Total Revenue (NGN)</p>
              <p className="text-3xl font-bold text-emerald-900">
                {formatCurrency(metrics?.revenue?.NGN || 0, "NGN")}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                {metrics?.revenue?.transactionCount || 0} transactions
              </p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <div className="p-6">
              <p className="text-sm font-medium text-teal-600 mb-1">Total Revenue (USD)</p>
              <p className="text-3xl font-bold text-teal-900">
                {formatCurrency(metrics?.revenue?.USD || 0, "USD")}
              </p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="p-6">
              <p className="text-sm font-medium text-indigo-600 mb-1">Avg Transaction</p>
              <p className="text-3xl font-bold text-indigo-900">
                {metrics?.revenue?.transactionCount > 0
                  ? formatCurrency(
                      metrics.revenue.total / metrics.revenue.transactionCount,
                      "NGN"
                    )
                  : "₦0"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Revenue by Plan Tier */}
      {revenueByTier && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Plan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">NGN Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(revenueByTier.premium.NGN, "NGN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">USD Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(revenueByTier.premium.USD, "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-gray-900">
                      {revenueByTier.premium.count}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">VIP Plan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">NGN Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(revenueByTier.vip.NGN, "NGN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">USD Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(revenueByTier.vip.USD, "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-gray-900">
                      {revenueByTier.vip.count}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Event Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Summary</h2>
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {metrics?.eventStats?.upgrades || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Upgrades</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {metrics?.eventStats?.downgrades || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Downgrades</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {metrics?.eventStats?.cancellations || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Cancellations</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {metrics?.eventStats?.renewals || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Renewals</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {metrics?.eventStats?.payments || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Payments</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trends Chart */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Trends</h2>
        <Card>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upgrades
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downgrades
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trends.slice(-10).reverse().map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {day.upgrades}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {day.downgrades}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {day.payments}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.revenue, "NGN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trends.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No trend data available for the selected period
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionMetrics;
