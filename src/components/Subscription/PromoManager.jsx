import { useState, useEffect } from "react";
import Button from "../Button";
import {
  getPromos,
  createPromoCode,
  incrementPromoUsage,
} from "../../firebase/schoolService";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const PromoManager = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New Promo State
  const [newPromo, setNewPromo] = useState({
    code: "",
    type: "percentage",
    value: 10,
    maxUses: 100,
    expiryDate: "",
    currency: "NGN",
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPromos();
      setPromos(data);
    } catch (err) {
      console.error("Error fetching promos:", err);
      setError("Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate code
      if (!newPromo.code.trim()) {
        setError("Promo code is required");
        setCreating(false);
        return;
      }

      // Check if code already exists
      const existingPromo = promos.find(
        (p) => p.code.toUpperCase() === newPromo.code.trim().toUpperCase(),
      );
      if (existingPromo) {
        setError("This promo code already exists");
        setCreating(false);
        return;
      }

      const expiry = newPromo.expiryDate ? new Date(newPromo.expiryDate) : null;

      await createPromoCode({
        code: newPromo.code.trim().toUpperCase(),
        type: newPromo.type,
        value: Number(newPromo.value),
        maxUses: Number(newPromo.maxUses),
        expiryDate: expiry,
        currency: newPromo.currency,
      });

      setNewPromo({
        code: "",
        type: "percentage",
        value: 10,
        maxUses: 100,
        expiryDate: "",
        currency: "NGN",
      });

      setSuccessMessage("Promo code created successfully!");
      fetchPromos();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error creating promo:", err);
      setError("Failed to create promo code");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (promoId, promoCode) => {
    if (
      !window.confirm(
        `Are you sure you want to delete promo code "${promoCode}"?`,
      )
    ) {
      return;
    }

    try {
      const promoRef = doc(db, "promos", promoId);
      await deleteDoc(promoRef);
      setSuccessMessage(`Promo code "${promoCode}" deleted successfully`);
      fetchPromos();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting promo:", err);
      setError("Failed to delete promo code");
    }
  };

  const handleToggleStatus = async (promoId, currentStatus) => {
    try {
      const promoRef = doc(db, "promos", promoId);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateDoc(promoRef, { status: newStatus });
      setSuccessMessage(`Promo code status updated to ${newStatus}`);
      fetchPromos();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating promo status:", err);
      setError("Failed to update promo status");
    }
  };

  // Helper function to format date from Firestore Timestamp or Date
  const formatDate = (dateValue) => {
    if (!dateValue) return "Never";

    try {
      // Handle Firestore Timestamp
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString();
      }
      // Handle Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      // Handle ISO string
      if (typeof dateValue === "string") {
        return new Date(dateValue).toLocaleDateString();
      }
      return "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  // Helper function to get promo status
  const getPromoStatus = (promo) => {
    // Check if manually set to inactive
    if (promo.status === "inactive") {
      return { label: "Inactive", color: "gray" };
    }

    // Check if expired
    if (promo.expiryDate) {
      const expiryDate = promo.expiryDate.seconds
        ? new Date(promo.expiryDate.seconds * 1000)
        : new Date(promo.expiryDate);
      if (expiryDate < new Date()) {
        return { label: "Expired", color: "red" };
      }
    }

    // Check if max uses reached
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return { label: "Maxed Out", color: "orange" };
    }

    return { label: "Active", color: "green" };
  };

  const getStatusBadgeClasses = (color) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (color) {
      case "green":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "red":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "orange":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "gray":
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-green-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Create Form */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Promo Code
        </h3>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm uppercase"
              value={newPromo.code}
              onChange={(e) =>
                setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., WELCOME20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount Type
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={newPromo.type}
              onChange={(e) =>
                setNewPromo({ ...newPromo, type: e.target.value })
              }
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Value{" "}
              {newPromo.type === "percentage"
                ? "(%)"
                : `(${newPromo.currency})`}
            </label>
            <input
              type="number"
              required
              min="0"
              max={newPromo.type === "percentage" ? 100 : undefined}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={newPromo.value}
              onChange={(e) =>
                setNewPromo({ ...newPromo, value: e.target.value })
              }
            />
          </div>

          {newPromo.type === "fixed" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={newPromo.currency}
                onChange={(e) =>
                  setNewPromo({ ...newPromo, currency: e.target.value })
                }
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Uses
            </label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={newPromo.maxUses}
              onChange={(e) =>
                setNewPromo({ ...newPromo, maxUses: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={newPromo.expiryDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setNewPromo({ ...newPromo, expiryDate: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              variant="primary"
              loading={creating}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Promo Code"}
            </Button>
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Promo Codes</h3>
          <Button variant="outline" size="sm" onClick={fetchPromos}>
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading promo codes...</span>
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="mt-2 text-gray-500">No promo codes found.</p>
            <p className="text-sm text-gray-400">
              Create your first promo code above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promos.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {promo.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {promo.type === "percentage" ? (
                          <span className="text-green-600 font-medium">
                            {promo.value}% off
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">
                            {promo.currency === "NGN" ? "₦" : "$"}
                            {promo.value.toLocaleString()} off
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={
                            promo.currentUses >= promo.maxUses
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {promo.currentUses || 0} / {promo.maxUses}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(promo.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClasses(status.color)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              handleToggleStatus(promo.id, promo.status)
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title={
                              promo.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {promo.status === "active" ? (
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id, promo.code)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoManager;
