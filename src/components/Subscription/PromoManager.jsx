import { useState, useEffect } from 'react';
import Button from '../Button';
import { getPromos, createPromoCode } from '../../firebase/schoolService';

const PromoManager = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // New Promo State
    const [newPromo, setNewPromo] = useState({
        code: '',
        type: 'percentage',
        value: 10,
        maxUses: 100,
        expiryDate: '',
        currency: 'NGN'
    });

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const data = await getPromos();
            setPromos(data);
        } catch (error) {
            console.error('Error fetching promos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const expiry = newPromo.expiryDate ? new Date(newPromo.expiryDate) : null;

            await createPromoCode({
                code: newPromo.code.toUpperCase(),
                type: newPromo.type,
                value: Number(newPromo.value),
                maxUses: Number(newPromo.maxUses),
                expiryDate: expiry,
                currency: newPromo.currency,
                currentUses: 0
            });

            setNewPromo({
                code: '',
                type: 'percentage',
                value: 10,
                maxUses: 100,
                expiryDate: '',
                currency: 'NGN'
            });

            fetchPromos();
        } catch (error) {
            console.error('Error creating promo:', error);
            alert('Failed to create promo code');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Promo</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Code</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPromo.code}
                            onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                            placeholder="e.g., WELCOME20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPromo.type}
                            onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Value</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPromo.value}
                            onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })}
                        />
                    </div>

                    {newPromo.type === 'fixed' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={newPromo.currency}
                                onChange={(e) => setNewPromo({ ...newPromo, currency: e.target.value })}
                            >
                                <option value="NGN">NGN</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max Uses</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPromo.maxUses}
                            onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPromo.expiryDate}
                            onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={creating}
                            fullWidth
                        >
                            Create Promo Code
                        </Button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Promos</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : promos.length === 0 ? (
                    <p className="text-gray-500">No promo codes found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {promos.map((promo) => (
                                    <tr key={promo.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promo.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {promo.type === 'percentage' ? `${promo.value}%` : `${promo.currency} ${promo.value}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {promo.currentUses} / {promo.maxUses}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {promo.expiryDate ? new Date(promo.expiryDate.seconds * 1000).toLocaleDateString() : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromoManager;
