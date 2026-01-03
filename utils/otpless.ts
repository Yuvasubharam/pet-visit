import type { OTPlessUser } from '../types/otpless';

export const getStoredOTPlessUser = (): OTPlessUser | null => {
  const userStr = localStorage.getItem('otplessUser');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as OTPlessUser;
  } catch (error) {
    console.error('Error parsing stored OTPless user:', error);
    return null;
  }
};

export const clearOTPlessUser = (): void => {
  localStorage.removeItem('otplessUser');
};

export const getUserDisplayName = (user: OTPlessUser): string => {
  return user.mobile?.name || user.email?.name || user.waName || 'User';
};

export const getUserIdentifier = (user: OTPlessUser): string => {
  return user.mobile?.number || user.email?.email || user.waNumber || 'Unknown';
};

export const isUserAuthenticated = (): boolean => {
  const user = getStoredOTPlessUser();
  return user !== null && !!user.token;
};
