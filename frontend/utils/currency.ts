export const USD_TO_EUR = 0.92;
export const USD_TO_INR = 83.50;

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  INR: '₹',
};

type Currency = 'USD' | 'EUR' | 'INR';

export const formatCurrency = (value: number, currency: Currency, options: { from?: 'USD', decimals?: number } = {}) => {
    const { from = 'USD', decimals = 2 } = options;
    
    let convertedValue = value;
    if (from === 'USD') {
        if (currency === 'EUR') {
            convertedValue = value * USD_TO_EUR;
        } else if (currency === 'INR') {
            convertedValue = value * USD_TO_INR;
        }
    }
    
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${convertedValue.toFixed(decimals)}`;
};

export const convertValue = (value: number, currency: Currency, options: { from?: 'USD' } = {}) => {
    const { from = 'USD' } = options;
    if (from === 'USD') {
        if (currency === 'EUR') return value * USD_TO_EUR;
        if (currency === 'INR') return value * USD_TO_INR;
    }
    return value;
};
