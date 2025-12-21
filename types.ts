
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  image: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type AppView = 
  | 'splash' 
  | 'onboarding' 
  | 'login' 
  | 'pet-selection' 
  | 'add-pet' 
  | 'home' 
  | 'grooming' 
  | 'shop'
  | 'bookings-overview'
  | 'booking-details'
  | 'online-consult-booking'
  | 'home-consult-booking'
  | 'checkout'
  | 'confirmation-online'
  | 'confirmation-home'
  | 'payment-failure'
  | 'waiting-room'
  | 'live-consultation'
  | 'profile'
  | 'address-management'
  | 'shopping-cart'
  | 'checkout-shop'
  | 'order-confirmation'
  | 'orders-history'
  | 'order-details-page';
