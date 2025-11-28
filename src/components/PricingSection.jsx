import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_CONFIG } from '../firebase/subscriptionModels';
import Button from './Button';

/**
 * PricingSection Component
 * Displays all available subscription plans on the public Welcome page
 */
const PricingSection = () => {
  const navigate = useNavigate();

  const formatLimit = (limit) => {
    if (typeof limit === 'object' && limit.min && limit.max) {
      return `${limit.min}-${limit.max}`;
    }
    return limit;
  };

  const planOrder = ['free', 'premium', 'vip'];

  return (
    <div className="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            School admin pays once. All teachers share the total limit.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {planOrder.map((planKey) => {
            const plan = PLAN_CONFIG[planKey];
            const isPremium = planKey === 'premium';
            const isVip = planKey === 'vip';

            return (
              <div
                key={planKey}
                className={`relative rounded-2xl border-2 ${isPremium
                    ? 'border-blue-600 shadow-2xl scale-105 bg-white'
                    : 'border-gray-200 bg-white hover:shadow-xl'
                  } overflow-hidden transition-all duration-300`}
              >
                {/* Popular Badge for Premium */}
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold px-4 py-2 rounded-bl-2xl shadow-lg">
                    ⭐ Most Popular
                  </div>
                )}

                {/* Best Value Badge for VIP */}
                {isVip && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold px-4 py-2 rounded-bl-2xl shadow-lg">
                    💎 Best Value
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900">
                        ₦{plan.price.NGN.toLocaleString()}
                      </span>
                      {planKey !== 'free' && (
                        <span className="ml-2 text-gray-600 text-lg">/month</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ${plan.price.USD} USD
                    </p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      {planKey !== 'free' ? 'Admin pays once for entire school' : 'Free forever'}
                    </p>
                  </div>

                  {/* Key Limits */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-3">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <span className="text-base text-gray-700">
                        <span className="font-bold text-gray-900">
                          {formatLimit(plan.subjectLimit)}
                        </span>{' '}
                        subjects total
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-3">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <span className="text-base text-gray-700">
                        <span className="font-bold text-gray-900">
                          {formatLimit(plan.studentLimit)}
                        </span>{' '}
                        students total
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-3">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <span className="text-base text-gray-700">
                        <span className="font-bold text-gray-900">
                          {plan.questionLimit}
                        </span>{' '}
                        questions per exam
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      Features:
                    </p>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <svg
                          className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={isPremium || isVip ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => navigate('/login')}
                    className={isPremium ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : ''}
                  >
                    {planKey === 'free' ? 'Get Started Free' : 'Select Plan'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            🎓 All plans include basic exam management features
          </p>
          <p className="text-sm text-gray-500">
            Upgrade or downgrade anytime. No long-term contracts required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
