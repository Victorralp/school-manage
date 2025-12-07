/**
 * Monnify Configuration Utility
 * Handles Monnify API configuration and helper functions
 * Monnify is Moniepoint's online payment gateway
 */

// Get Monnify API key from environment variables
export const getMonnifyApiKey = () => {
    const apiKey = import.meta.env.VITE_MONNIFY_API_KEY;

    if (!apiKey) {
        console.error('Monnify API key not found in environment variables');
        return '';
    }

    return apiKey;
};

// Get Monnify secret key (for backend/verification operations)
export const getMonnifySecretKey = () => {
    const secretKey = import.meta.env.VITE_MONNIFY_SECRET_KEY;

    if (!secretKey) {
        console.error('Monnify secret key not found in environment variables');
        return '';
    }

    return secretKey;
};

// Get Monnify contract code from environment variables
export const getMonnifyContractCode = () => {
    const contractCode = import.meta.env.VITE_MONNIFY_CONTRACT_CODE;

    if (!contractCode) {
        console.error('Monnify contract code not found in environment variables');
        return '';
    }

    return contractCode;
};

// Check if we're in test/sandbox mode
export const isMonnifyTestMode = () => {
    const isLive = import.meta.env.VITE_MONNIFY_IS_LIVE;
    return isLive !== 'true';
};

// Get Monnify API base URL based on environment
export const getMonnifyApiBaseUrl = () => {
    return isMonnifyTestMode()
        ? 'https://sandbox.monnify.com'
        : 'https://api.monnify.com';
};

// Convert amount to minor unit (kobo for NGN, cents for USD)
export const convertToMinorUnit = (amount, currency = 'NGN') => {
    // NGN uses kobo (100 kobo = 1 Naira)
    // USD uses cents (100 cents = 1 Dollar)
    return Math.round(amount * 100);
};

// Convert from minor unit to main currency unit
export const convertFromMinorUnit = (amountInMinorUnit, currency = 'NGN') => {
    return amountInMinorUnit / 100;
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

// Monnify configuration object
export const monnifyConfig = {
    apiKey: getMonnifyApiKey(),
    contractCode: getMonnifyContractCode(),
    currency: {
        NGN: 'NGN',
        USD: 'USD'
    },
    // Payment methods supported by Monnify
    paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD', 'PHONE_NUMBER']
};

// Validate Monnify configuration
export const validateMonnifyConfig = () => {
    const apiKey = getMonnifyApiKey();
    const contractCode = getMonnifyContractCode();

    if (!apiKey) {
        throw new Error('Monnify API key is not configured. Please add VITE_MONNIFY_API_KEY to your .env file.');
    }

    if (!contractCode) {
        throw new Error('Monnify contract code is not configured. Please add VITE_MONNIFY_CONTRACT_CODE to your .env file.');
    }

    // Monnify API keys typically start with MK_TEST_ or MK_PROD_
    if (!apiKey.startsWith('MK_')) {
        console.warn('Monnify API key format may be incorrect. API keys typically start with "MK_".');
    }

    return true;
};

// Generate transaction reference with null safety
export const generateTransactionReference = (userId, planTier) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const safeUserId = userId ? userId.substring(0, 8) : 'unknown';
    const safePlanTier = planTier ? planTier.toUpperCase() : 'PLAN';
    return `MONNIFY_${safePlanTier}_${safeUserId}_${timestamp}_${random}`;
};

// Generate Basic Auth header for Monnify API
export const getMonnifyAuthHeader = () => {
    const apiKey = getMonnifyApiKey();
    const secretKey = getMonnifySecretKey();

    if (!apiKey || !secretKey) {
        throw new Error('Monnify credentials not configured');
    }

    const credentials = btoa(`${apiKey}:${secretKey}`);
    return `Basic ${credentials}`;
};

export default monnifyConfig;
