export interface OTPlessUser {
  token: string;
  userId: string;
  timestamp: string;
  mobile?: {
    name?: string;
    number: string;
    verified: boolean;
  };
  email?: {
    email: string;
    name?: string;
    verified: boolean;
  };
  waName?: string;
  waNumber?: string;
}

declare global {
  interface Window {
    otpless: (user: OTPlessUser) => void;
  }
}

export {};
