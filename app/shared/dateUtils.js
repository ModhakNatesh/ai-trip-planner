// Date utilities shared between client and server
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export const formatDateRange = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const startFormatted = format(start, 'MMM dd');
    const endFormatted = format(end, 'MMM dd, yyyy');
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error('Date range formatting error:', error);
    return 'Invalid Date Range';
  }
};

export const getTripDuration = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const days = differenceInDays(end, start);
    
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    let result = weeks === 1 ? '1 week' : `${weeks} weeks`;
    if (remainingDays > 0) {
      result += remainingDays === 1 ? ' 1 day' : ` ${remainingDays} days`;
    }
    
    return result;
  } catch (error) {
    console.error('Trip duration calculation error:', error);
    return 'Unknown duration';
  }
};

export const isDateInPast = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

export const isDateInFuture = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

export const addDaysToDate = (date, days) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Add days error:', error);
    return null;
  }
};