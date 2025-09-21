import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a clean numeric amount from AI-generated cost text
 * Handles formats like "₹135,000 - ₹150,000" or "₹75,000 per person"
 * Returns the average of range or single amount
 */
export function extractPaymentAmount(costText) {
  if (!costText || typeof costText !== 'string') {
    return 0;
  }

  // Remove currency symbol and commas, extract numbers
  const numbers = costText.match(/₹?[\d,]+/g);
  
  if (!numbers || numbers.length === 0) {
    return 0;
  }

  // Convert to actual numbers
  const amounts = numbers.map(num => {
    return parseInt(num.replace(/[₹,]/g, ''));
  }).filter(num => !isNaN(num) && num > 0);

  if (amounts.length === 0) {
    return 0;
  }

  // If we have a range (like ₹135,000 - ₹150,000), take the average
  if (amounts.length >= 2) {
    return Math.round((amounts[0] + amounts[1]) / 2);
  }

  // Otherwise return the single amount
  return amounts[0];
}

/**
 * Formats a number as Indian currency
 */
export function formatCurrency(amount) {
  if (!amount) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}