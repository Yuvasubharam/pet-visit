
import React, { useState, useEffect } from 'react';
import { AppView, Pet } from './types';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import PetSelection from './pages/PetSelection';
import AddPet from './pages/AddPet';
import Home from './pages/Home';
import Grooming from './pages/Grooming';
import Marketplace from './pages/Marketplace';
import BookingsOverview from './pages/BookingsOverview';
import BookingDetails from './pages/BookingDetails';
import OnlineConsultBooking from './pages/OnlineConsultBooking';
import HomeConsultBooking from './pages/HomeConsultBooking';
import Checkout from './pages/Checkout';
import ConfirmationOnline from './pages/ConfirmationOnline';
import ConfirmationHome from './pages/ConfirmationHome';
import PaymentFailure from './pages/PaymentFailure';
import WaitingRoom from './pages/WaitingRoom';
import LiveConsultation from './pages/LiveConsultation';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Cart from './pages/Cart';
import ShopCheckout from './pages/ShopCheckout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrdersHistory from './pages/OrdersHistory';
import OrderDetailsPage from './pages/OrderDetailsPage';
import NewBookingPopup from './components/NewBookingPopup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [userPets, setUserPets] = useState<Pet[]>([
    { 
      id: '1', 
      name: 'Max', 
      species: 'dog', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAescF9pZXllFXXlMqlJFpFBp9pO9jTzUOyCR8lAB808mu6xGBb7VKrpMmvkSVYOQDnS_FkQ5W8eJo1uLL_80rIphearuEWyKWnFBLB25w433ZWH2KokSIL6pw2teEkJ-ABhQL6zPW5-VrygwH35Skqedvzk8PIg-CWFAChiaPrRCUkWlkRkR0aTeDAo7fJsya6NMyWL9jfZwtVY4H29QxsCXd70-SyI9ZFfjm1UEco3bopi96qu1bN3RayI1sKSaUFTB97aptEQrQ' 
    },
    { 
      id: '2', 
      name: 'Bella', 
      species: 'cat', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL1_2yi5QrWeb4-vPMc4-wV76_VD_CUlOapA7IgXfOTwRAm2maoYeSAJquSO3g4IqnzC_6o5_u0Rznq6CgHZ61rCzVSD4y_xCVrOs7qvwtx7iTud1XYity_eLSkp2q0gGWJnqCeQFN49rmiCMuPBsg4S80PI-vN0U-ZjejeayqTHHai6J-4JTIgRBoGDwP57SyKs4t0zPtKt66i_bIOPSfE6lXRBBb04PHlwgioXn7pt3A1s7JFCg-5_9MwurKM4qOlduUvlvM3z0' 
    },
  ]);

  useEffect(() => {
    if (currentView === 'splash') {
      const timer = setTimeout(() => setCurrentView('onboarding'), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const handleNewBooking = (type: 'online' | 'home' | 'clinic') => {
    setShowBookingPopup(false);
    if (type === 'online') setCurrentView('online-consult-booking');
    else setCurrentView('home-consult-booking'); 
  };

  const renderView = () => {
    switch (currentView) {
      case 'splash': return <Splash />;
      case 'onboarding': return <Onboarding onNext={() => setCurrentView('login')} />;
      case 'login': return <Login onNext={() => setCurrentView('pet-selection')} />;
      case 'pet-selection': return <PetSelection onNext={() => setCurrentView('add-pet')} onAdd={() => setCurrentView('add-pet')} />;
      case 'add-pet': return <AddPet onBack={() => setCurrentView('pet-selection')} onCreate={(pet) => {
        setUserPets([...userPets, { ...pet, id: Date.now().toString() }]);
        setCurrentView('home');
      }} />;
      case 'home': return (
        <Home 
          pets={userPets} 
          onServiceClick={(s) => {
            if (s === 'Grooming') setCurrentView('grooming');
            if (s === 'Online Consult') setCurrentView('online-consult-booking');
            if (s === 'Health Check' || s === 'Doctor Visit') setCurrentView('home-consult-booking');
            if (s === 'Pet Food' || s === 'Accessories') setCurrentView('shop');
          }} 
          onShopClick={() => setCurrentView('shop')}
          onBookingsClick={() => setCurrentView('bookings-overview')}
          onPlusClick={() => setShowBookingPopup(true)}
          onProfileClick={() => setCurrentView('profile')}
        />
      );
      case 'grooming': return <Grooming onBack={() => setCurrentView('home')} pets={userPets} />;
      case 'shop': return <Marketplace onBack={() => setCurrentView('home')} onCartClick={() => setCurrentView('shopping-cart')} />;
      case 'bookings-overview': return (
        <BookingsOverview 
          onBack={() => setCurrentView('home')} 
          onDetailClick={() => setCurrentView('booking-details')} 
          onPlusClick={() => setShowBookingPopup(true)} 
          onHomeClick={() => setCurrentView('home')} 
          onJoinCall={() => setCurrentView('waiting-room')}
          onProfileClick={() => setCurrentView('profile')}
        />
      );
      case 'booking-details': return <BookingDetails onBack={() => setCurrentView('bookings-overview')} />;
      case 'online-consult-booking': return <OnlineConsultBooking pets={userPets} onBack={() => setCurrentView('home')} onBook={() => setCurrentView('checkout')} />;
      case 'home-consult-booking': return <HomeConsultBooking pets={userPets} onBack={() => setCurrentView('home')} onBook={() => setCurrentView('checkout')} />;
      case 'checkout': return <Checkout onBack={() => setCurrentView('home')} onPay={() => Math.random() > 0.1 ? setCurrentView('confirmation-online') : setCurrentView('payment-failure')} />;
      case 'confirmation-online': return <ConfirmationOnline onBackHome={() => setCurrentView('home')} onViewAppointments={() => setCurrentView('bookings-overview')} />;
      case 'confirmation-home': return <ConfirmationHome onBackHome={() => setCurrentView('home')} onViewAppointments={() => setCurrentView('bookings-overview')} />;
      case 'payment-failure': return <PaymentFailure onClose={() => setCurrentView('home')} onRetry={() => setCurrentView('checkout')} />;
      case 'waiting-room': return <WaitingRoom onBack={() => setCurrentView('bookings-overview')} onJoin={() => setCurrentView('live-consultation')} />;
      case 'live-consultation': return <LiveConsultation onEnd={() => setCurrentView('home')} />;
      case 'profile': return (
        <Profile 
          onBack={() => setCurrentView('home')} 
          onHomeClick={() => setCurrentView('home')} 
          onAppointmentsClick={() => setCurrentView('bookings-overview')} 
          onAddressClick={() => setCurrentView('address-management')}
          onOrdersClick={() => setCurrentView('orders-history')}
        />
      );
      case 'address-management': return <Addresses onBack={() => setCurrentView('profile')} onDone={() => setCurrentView('profile')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} />;
      case 'shopping-cart': return <Cart onBack={() => setCurrentView('shop')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onProceed={() => setCurrentView('checkout-shop')} onProfileClick={() => setCurrentView('profile')} />;
      case 'checkout-shop': return <ShopCheckout onBack={() => setCurrentView('shopping-cart')} onPlaceOrder={() => setCurrentView('order-confirmation')} />;
      case 'order-confirmation': return <OrderConfirmation onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onContinueShopping={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} onViewOrderDetails={() => setCurrentView('orders-history')} />;
      case 'orders-history': return <OrdersHistory onBack={() => setCurrentView('profile')} onOrderClick={() => setCurrentView('order-details-page')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} />;
      case 'order-details-page': return <OrderDetailsPage onBack={() => setCurrentView('orders-history')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} />;
      default: return <Home pets={userPets} onServiceClick={() => {}} onShopClick={() => {}} onBookingsClick={() => {}} onPlusClick={() => {}} onProfileClick={() => {}} />;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen relative bg-background-light overflow-hidden flex flex-col font-body shadow-2xl">
      {renderView()}
      {showBookingPopup && (
        <NewBookingPopup 
          onClose={() => setShowBookingPopup(false)} 
          onSelect={handleNewBooking}
        />
      )}
    </div>
  );
};

export default App;
