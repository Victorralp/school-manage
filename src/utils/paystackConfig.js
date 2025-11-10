/**
 * Paystack Configuration Utility
 * Handles Paystack API configuration and helper functions
 */

// Get Paystack public key from environment variables
export const getPaystackPublicKey = () => {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('Paystack public key not found in environment variables');
    return '';
  }
  
  return publicKey;
};

// Get Paystack secret key (for backend operations)
export const getPaystackSecretKey = () => {
  const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
  
  if (!secretKey) {
    console.error('Paystack secret key not found in environment variables');
    return '';
  }
  
  return secretKey;
};

// Convert amount to kobo (Paystack uses smallest currency unit)
export const convertToKobo = (amount, currency = 'NGN') => {
  // NGN uses kobo (100 kobo = 1 Naira)
  // USD uses cents (100 cents = 1 Dollar)
  return Math.round(amount * 100);
};

// Convert from kobo to main currency unit
export const convertFromKobo = (amountInKobo, currency = 'NGN') => {
  return amountInKobo / 100;
};

// Format currency for display
export const formatCurrency = (amount, currency = 'NGN') => {
  const currencySymbols = {
    NGN: '₦',
    USD: '$'
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

// Paystack configuration object
export const paystackConfig = {
  publicKey: getPaystackPublicKey(),
  currency: {
    NGN: 'NGN',
    USD: 'USD'
  },
  channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  // Metadata to include in all transactions
  metadata: {
    custom_fields: []
  }
};

// Validate Paystack configuration
export const validatePaystackConfig = () => {
  const publicKey = getPaystackPublicKey();
  
  if (!publicKey) {
    throw new Error('Paystack public key is not configured. Please add VITE_PAYSTACK_PUBLIC_KEY to your .env file.');
  }
  
  if (!publicKey.startsWith('pk_')) {
    throw new Error('Invalid Paystack public key format. Public keys should start with "pk_".');
  }
  
  return true;
};

// Generate transaction reference
export const generateTransactionReference = (teacherId, planTier) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `SUB_${planTier.toUpperCase()}_${teacherId.substring(0, 8)}_${timestamp}_${random}`;
};

export default paystackConfig;
