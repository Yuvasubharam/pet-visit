
import React, { useState, useEffect } from 'react';
import { AppView, Pet, Address, Booking } from './types';
import { supabase } from './lib/supabase';
import { authService, petService, addressService } from './services/api';
import { doctorAuthService } from './services/doctorApi';
import 'leaflet/dist/leaflet.css';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import LoginWithOTP from './pages/LoginWithOTP';
import PetSelection from './pages/PetSelection';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
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
import ConfirmationClinic from './pages/ConfirmationClinic';
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
import MyPets from './pages/MyPets';
import PersonalInformation from './pages/PersonalInformation';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfileSetup from './pages/DoctorProfileSetup';
import DoctorAvailability from './pages/DoctorAvailability';
import DoctorFeeManagement from './pages/DoctorFeeManagement';
import DoctorConsultations from './pages/DoctorConsultations';
import DoctorConsultationDetails from './pages/DoctorConsultationDetails';
import GroomingStoreLogin from './pages/GroomingStoreLogin';
import GroomingStoreRegister from './pages/GroomingStoreRegister';
import GroomingStoreDashboard from './pages/GroomingStoreDashboard';
import GroomingStoreBookings from './pages/GroomingStoreBookings';
import GroomingStoreManagement from './pages/GroomingStoreManagement';
import NewBookingPopup from './components/NewBookingPopup';
import LocationSelection from './components/LocationSelection';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [setPasswordEmail, setSetPasswordEmail] = useState<string>(''); // Email for OAuth user setting password
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string>('');
  const [selectedPetType, setSelectedPetType] = useState<string>('dog');
  const [userAddress, setUserAddress] = useState<Address>({
    type: 'Home',
    flatNumber: 'Apt 301',
    street: 'Clove Technologies Private Limited, Mithilapuri Colony Road',
    landmark: 'Hill no 2',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    pincode: '530045',
    fullAddress: 'Clove Technologies Private Limited, Mithilapuri Colony Road, Hill no 2, Visakhapatnam, Andhra Pradesh - 530045'
  });
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Checkout address state - shared between Cart and ShopCheckout
  const [checkoutAddress, setCheckoutAddress] = useState<Address | null>(null);

  // Booking state for BookingDetails
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Last created booking for confirmation pages
  const [lastCreatedBooking, setLastCreatedBooking] = useState<Booking | null>(null);

  // Pending booking data (before payment) for Checkout
  const [pendingBookingData, setPendingBookingData] = useState<{
    type: 'consultation' | 'grooming';
    petId: string;
    petName?: string;
    bookingType: 'online' | 'home' | 'clinic';
    date: string;
    time: string;
    addressId?: string;
    address?: Address;
    doctorName?: string;
    packageType?: string;
    packageId?: string;
    contactNumber?: string;
    notes?: string;
    amount: number;
    serviceName: string;
  } | null>(null);

  // Order state for passing to OrderConfirmation
  const [lastOrderData, setLastOrderData] = useState<{
    orderNumber: string;
    orderDate: string;
    cartItems: any[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
  } | null>(null);

  // Selected order ID for order details page
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Marketplace filter state
  const [marketplaceFilter, setMarketplaceFilter] = useState<string | undefined>(undefined);

  // Active booking for video calls
  const [activeCallBooking, setActiveCallBooking] = useState<Booking | null>(null);

  // Doctor portal state
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isDoctorMode, setIsDoctorMode] = useState(false);

  // Grooming Store portal state
  const [groomingStoreId, setGroomingStoreId] = useState<string | null>(null);
  const [isGroomingStoreMode, setIsGroomingStoreMode] = useState(false);

  // Load user data on mount and auth state change
  useEffect(() => {
    console.log('[useEffect] Auth check starting...');
    console.log('[useEffect] Current URL:', window.location.href);
    console.log('[useEffect] URL hash:', window.location.hash);
    console.log('[useEffect] URL search params:', window.location.search);

    // Check current session on mount
    const checkSession = async () => {
      // Check for OAuth hash with access_token FIRST
      const hasOAuthHash = window.location.hash && window.location.hash.includes('access_token');

      if (hasOAuthHash) {
        console.log('[OAuth] OAuth hash detected in URL!');
        console.log('[OAuth] Full hash:', window.location.hash);
        console.log('[OAuth] Waiting for Supabase to process the hash...');

        // Wait a bit longer for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check for OAuth error
      if (window.location.hash && window.location.hash.includes('error')) {
        console.error('[OAuth] OAuth error detected in hash:', window.location.hash);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        console.error('[OAuth] Error:', hashParams.get('error'));
        console.error('[OAuth] Error description:', hashParams.get('error_description'));
      }

      console.log('[checkSession] Checking for existing session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[checkSession] Error getting session:', error);
          return;
        }

        if (session?.user) {
          console.log('[checkSession] ✓ Found session for user:', session.user.email);
          console.log('[checkSession] Session details:', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider
          });

          // Clean up OAuth hash from URL now that session is established
          if (hasOAuthHash) {
            console.log('[OAuth] Cleaning up hash from URL');
            window.history.replaceState(null, '', window.location.pathname);
          }

          // User is authenticated, skip onboarding/login screens
          await loadUserData(session.user.id);
        } else {
          console.log('[checkSession] ✗ No session found');

          if (hasOAuthHash) {
            console.error('[checkSession] WARNING: OAuth hash present but no session!');
            console.error('[checkSession] This likely means:');
            console.error('[checkSession] 1. RLS policies are blocking the session');
            console.error('[checkSession] 2. OR redirect URL is not configured correctly in Supabase');
          }
        }
      } catch (err) {
        console.error('[checkSession] Exception getting session:', err);
      }
    };

    checkSession();

    // Listen for auth changes (like after Google OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[onAuthStateChange] Auth state changed - Event:', event, 'User:', session?.user?.email);
      if (session?.user) {
        // User just logged in, load their data and redirect appropriately
        await loadUserData(session.user.id);
      } else {
        // User logged out
        console.log('[onAuthStateChange] User logged out, resetting to onboarding');
        setUserId(null);
        setUserPets([]);
        setCurrentView('onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      console.log('[loadUserData] Starting to load user data for uid:', uid);
      console.log('[loadUserData] Current view before loading:', currentView);
      setUserId(uid);

      // Get current user from Supabase
      console.log('[loadUserData] Fetching current user from auth...');
      const currentUser = await Promise.race([
        authService.getCurrentUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getCurrentUser timeout after 5s')), 5000)
        )
      ]).catch(err => {
        console.error('[loadUserData] Error or timeout getting current user:', err);
        throw err;
      });
      console.log('[loadUserData] ✓ Current user fetched:', (currentUser as any)?.email);
      console.log('[loadUserData] User metadata:', (currentUser as any)?.user_metadata);

      // Check if this is a doctor account
      if (currentUser?.user_metadata?.user_type === 'doctor') {
        // This is a doctor, load doctor profile instead
        try {
          const doctorProfile = await doctorAuthService.getDoctorProfile(uid);
          if (doctorProfile && (doctorProfile as any).id) {
            setDoctorId((doctorProfile as any).id);
            setIsDoctorMode(true);
            // Only redirect if we're on login/splash screens
            if (currentView === 'splash' || currentView === 'onboarding' || currentView === 'doctor-login') {
              setCurrentView('doctor-dashboard');
            }
          }
          return; // Exit early, don't load user profile
        } catch (error) {
          console.error('Error loading doctor profile:', error);
          // Doctor profile doesn't exist, stay on current screen
          return;
        }
      }

      // Load or create user profile
      let profile;
      let isNewUser = false;

      try {
        console.log('[loadUserData] Fetching user profile from database...');
        profile = await authService.getUserProfile(uid);
        console.log('[loadUserData] ✓ Profile fetched:', profile?.name);

        // If profile exists but email or phone is missing, update from auth
        if (currentUser && (!profile.email || !profile.phone)) {
          const updates: { email?: string; phone?: string } = {};

          if (!profile.email && currentUser.email) {
            updates.email = currentUser.email;
          }

          if (!profile.phone && currentUser.phone) {
            updates.phone = currentUser.phone;
          }

          // Update profile with missing data from auth
          if (Object.keys(updates).length > 0) {
            profile = await authService.createOrUpdateUserProfile(uid, {
              name: profile.name,
              email: updates.email || profile.email,
              phone: updates.phone || profile.phone,
              profile_photo_url: profile.profile_photo_url,
            });
          }
        }
      } catch (err) {
        // Profile doesn't exist for this auth ID
        console.log('[loadUserData] Profile not found, error:', err);
        console.log('[loadUserData] Attempting to create new profile or merge existing...');

        // Check if an account with this email already exists (for OAuth account merging)
        if (currentUser?.email) {
          const existingProfile = await authService.checkEmailExists(currentUser.email);

          if (existingProfile) {
            // Email exists in database but with different auth ID
            // This happens when user registered with email/password, then logged in with Google
            console.log('[loadUserData] Found existing profile with same email, merging accounts...');

            // Merge: Update the existing profile to use the new auth ID
            try {
              profile = await authService.createOrUpdateUserProfile(uid, {
                name: (existingProfile as any).name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User',
                email: currentUser.email,
                phone: (existingProfile as any).phone || currentUser.phone || '',
                profile_photo_url: (existingProfile as any).profile_photo_url || currentUser.user_metadata?.avatar_url || null,
              });
              console.log('[loadUserData] Successfully merged account');
              // Not a new user since they had an account before
              isNewUser = false;
            } catch (mergeError) {
              console.error('[loadUserData] Error merging account:', mergeError);
              throw mergeError;
            }
          } else {
            // Truly new user, create profile from auth data
            console.log('[loadUserData] Creating new user profile...');
            isNewUser = true;
            const userName = currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              currentUser.email?.split('@')[0] ||
              'User';

            try {
              profile = await authService.createOrUpdateUserProfile(uid, {
                name: userName,
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                profile_photo_url: currentUser.user_metadata?.avatar_url || null,
              });
              console.log('[loadUserData] Successfully created new profile');
            } catch (createError) {
              console.error('[loadUserData] Error creating profile:', createError);
              throw createError;
            }
          }
        } else {
          // No email available, create basic profile
          console.log('[loadUserData] No email available, creating basic profile...');
          isNewUser = true;
          try {
            profile = await authService.createOrUpdateUserProfile(uid, {
              name: 'User',
              email: '',
              phone: currentUser?.phone || '',
            });
            console.log('[loadUserData] Successfully created basic profile');
          } catch (createError) {
            console.error('[loadUserData] Error creating basic profile:', createError);
            throw createError;
          }
        }
      }

      if (profile) {
        setUserName(profile.name);
        setUserEmail(profile.email || '');
        setUserPhone(profile.phone || '');
        setUserProfilePhoto(profile.profile_photo_url || null);
        setUserCreatedAt(profile.created_at);
      }

      // Load user pets
      const pets = await petService.getUserPets(uid);
      const hasPets = pets && pets.length > 0;
      console.log('[loadUserData] User has pets:', hasPets, 'Count:', pets?.length);

      if (hasPets) {
        setUserPets(pets.map(pet => ({
          id: pet.id,
          name: pet.name,
          species: pet.species,
          image: pet.image,
        })));
      }

      // Load user addresses
      const addresses = await addressService.getUserAddresses(uid);
      if (addresses && addresses.length > 0) {
        const primaryAddress = addresses[0];
        setUserAddress({
          id: primaryAddress.id,
          type: primaryAddress.type,
          flatNumber: primaryAddress.flat_number,
          street: primaryAddress.street,
          landmark: primaryAddress.landmark,
          city: primaryAddress.city,
          state: primaryAddress.state,
          pincode: primaryAddress.pincode,
          latitude: primaryAddress.latitude || undefined,
          longitude: primaryAddress.longitude || undefined,
          fullAddress: primaryAddress.full_address || undefined,
        });
      }

      // Smart routing: new users or users without pets go to pet selection
      console.log('[loadUserData] Routing decision - currentView:', currentView, 'isNewUser:', isNewUser, 'hasPets:', hasPets);

      // Determine the target view based on user state
      let targetView: AppView;
      if (!isNewUser && hasPets) {
        // Existing user with pets -> go to home
        targetView = 'home';
        console.log('[loadUserData] Target view: HOME (existing user with pets)');
      } else if (isNewUser && !hasPets) {
        // New user without pets -> go to pet selection
        targetView = 'pet-selection';
        console.log('[loadUserData] Target view: PET-SELECTION (new user without pets)');
      } else {
        // Existing user without pets OR edge case -> go to home
        targetView = 'home';
        console.log('[loadUserData] Target view: HOME (existing user without pets OR default)');
      }

      // Always route authenticated users to their target view
      // Don't route if user is already on a main app screen (home, grooming, shop, etc.)
      const authScreens: AppView[] = ['splash', 'onboarding', 'register', 'set-password', 'login', 'login-otp'];
      if (authScreens.includes(currentView)) {
        console.log('[loadUserData] User is on auth screen, routing to:', targetView);
        setCurrentView(targetView);
      } else {
        console.log('[loadUserData] User is already on app screen:', currentView, '- not auto-routing');
      }
    } catch (error) {
      console.error('[loadUserData] CRITICAL ERROR loading user data:', error);
      console.error('[loadUserData] Error details:', JSON.stringify(error, null, 2));
      // Don't silently fail - show the error to help debug
      if (error instanceof Error) {
        console.error('[loadUserData] Error message:', error.message);
        console.error('[loadUserData] Error stack:', error.stack);
      }
    }
  };

  useEffect(() => {
    if (currentView === 'splash') {
      console.log('[Splash Timer] Setting timer to switch to onboarding in 1s');
      const timer = setTimeout(() => {
        console.log('[Splash Timer] Timer fired - checking if we should still go to onboarding');
        // Only go to onboarding if user is not authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user) {
            console.log('[Splash Timer] No session, moving to onboarding');
            setCurrentView('onboarding');
          } else {
            console.log('[Splash Timer] User is authenticated, NOT moving to onboarding');
            // Don't change view - let loadUserData handle routing
          }
        });
      }, 1000); // Changed from 3000ms to 1000ms
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
      case 'onboarding': return <Onboarding onNext={() => setCurrentView('register')} onLogin={() => setCurrentView('login')} onDoctorLogin={() => setCurrentView('doctor-login')} />;
      case 'register': return <Register onNext={(name) => { setUserName(name); setCurrentView('pet-selection'); }} onSetPassword={(email) => { setSetPasswordEmail(email); setCurrentView('set-password'); }} />;
      case 'set-password': return <SetPassword email={setPasswordEmail} onBack={() => setCurrentView('register')} onComplete={() => setCurrentView('home')} />;
      case 'login': return <Login onNext={(name) => { setUserName(name); setCurrentView('home'); }} />;
      case 'login-otp': return <LoginWithOTP onNext={() => setCurrentView('home')} />;
      case 'pet-selection': return <PetSelection onNext={(petType) => { setSelectedPetType(petType); setCurrentView('add-pet'); }} onAdd={() => setCurrentView('add-pet')} onSkip={() => setCurrentView('home')} userName={userName} />;
      case 'add-pet': return <AddPet onBack={() => setCurrentView('pet-selection')} onCreate={async (pet) => {
        if (userId) {
          try {
            const newPet = await petService.addPet(userId, pet);
            if (newPet) {
              setUserPets([...userPets, {
                id: newPet.id,
                name: newPet.name,
                species: newPet.species,
                image: newPet.image,
              }]);
            }
          } catch (error) {
            console.error('Error adding pet:', error);
          }
        }
        setCurrentView('home');
      }} selectedPetType={selectedPetType} />;
      case 'edit-pet': {
        const petToEdit = userPets.find(p => p.id === selectedPetId);
        if (!petToEdit) {
          setCurrentView('home');
          return null;
        }
        return <EditPet
          pet={petToEdit}
          onBack={() => {
            setSelectedPetId(null);
            setCurrentView('home');
          }}
          onUpdate={async (petId, updates) => {
            if (userId) {
              try {
                const updatedPet = await petService.updatePet(petId, updates);
                if (updatedPet) {
                  setUserPets(userPets.map(p => p.id === petId ? {
                    id: updatedPet.id,
                    name: updatedPet.name,
                    species: updatedPet.species,
                    image: updatedPet.image,
                  } : p));
                }
              } catch (error) {
                console.error('Error updating pet:', error);
              }
            }
            setSelectedPetId(null);
            setCurrentView('home');
          }}
        />;
      }
      case 'home': return (
        <Home
          pets={userPets}
          onServiceClick={(s) => {
            if (s === 'Grooming') setCurrentView('grooming');
            if (s === 'Online Consult') setCurrentView('online-consult-booking');
            if (s === 'Health Check' || s === 'Doctor Visit') setCurrentView('home-consult-booking');
            if (s === 'Pharmacy') {
              setMarketplaceFilter('Medicine');
              setCurrentView('shop');
            }
            if (s === 'Pet Food') {
              setMarketplaceFilter('Food');
              setCurrentView('shop');
            }
            if (s === 'Accessories') {
              setMarketplaceFilter('Toys');
              setCurrentView('shop');
            }
          }}
          onShopClick={() => {
            setMarketplaceFilter(undefined);
            setCurrentView('shop');
          }}
          onBookingsClick={() => setCurrentView('bookings-overview')}
          onPlusClick={() => setShowBookingPopup(true)}
          onProfileClick={() => setCurrentView('profile')}
          onAddPetClick={() => setCurrentView('pet-selection')}
          onDeletePet={async (petId) => {
            try {
              await petService.deletePet(petId);
              setUserPets(userPets.filter(p => p.id !== petId));
            } catch (error) {
              console.error('Error deleting pet:', error);
              alert('Failed to delete pet. Please try again.');
            }
          }}
          onEditPet={(petId) => {
            setSelectedPetId(petId);
            setCurrentView('edit-pet');
          }}
          userName={userName}
          userProfilePhoto={userProfilePhoto}
          onLocationClick={() => setShowLocationPopup(true)}
          userAddress={userAddress}
          userId={userId}
        />
      );
      case 'grooming': return <Grooming
        onBack={() => setCurrentView('home')}
        pets={userPets}
        userId={userId}
        defaultAddress={userAddress}
        onProceedToCheckout={(bookingData) => {
          setPendingBookingData(bookingData);
          setCurrentView('checkout');
        }}
      />;
      case 'shop': return <Marketplace onBack={() => setCurrentView('home')} onCartClick={() => setCurrentView('shopping-cart')} userId={userId} initialCategory={marketplaceFilter} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onProfileClick={() => setCurrentView('profile')} />;
      case 'bookings-overview': return (
        <BookingsOverview
          onBack={() => setCurrentView('home')}
          onDetailClick={(booking) => {
            setSelectedBooking(booking);
            setCurrentView('booking-details');
          }}
          onPlusClick={() => setShowBookingPopup(true)}
          onHomeClick={() => setCurrentView('home')}
          onJoinCall={(booking) => {
            setActiveCallBooking(booking);
            setCurrentView('live-consultation');
          }}
          onProfileClick={() => setCurrentView('profile')}
          onPetsClick={() => setCurrentView('my-pets')}
          userId={userId}
        />
      );
      case 'booking-details': return <BookingDetails onBack={() => setCurrentView('bookings-overview')} booking={selectedBooking} userId={userId} onCartClick={() => setCurrentView('shopping-cart')} />;
      case 'online-consult-booking': return <OnlineConsultBooking
        pets={userPets}
        onBack={() => setCurrentView('home')}
        onBook={() => setCurrentView('checkout')}
        userId={userId}
        onProceedToCheckout={(bookingData) => {
          setPendingBookingData(bookingData);
          setCurrentView('checkout');
        }}
      />;
      case 'home-consult-booking': return <HomeConsultBooking
        pets={userPets}
        onBack={() => setCurrentView('home')}
        onBook={() => setCurrentView('checkout')}
        userId={userId}
        defaultAddress={userAddress}
        onProceedToCheckout={(bookingData) => {
          setPendingBookingData(bookingData);
          setCurrentView('checkout');
        }}
      />;
      case 'checkout': return <Checkout
        onBack={() => {
          // Go back to the appropriate booking page
          if (pendingBookingData?.type === 'grooming') {
            setCurrentView('grooming');
          } else if (pendingBookingData?.bookingType === 'online') {
            setCurrentView('online-consult-booking');
          } else {
            setCurrentView('home-consult-booking');
          }
        }}
        onPay={async () => {
          // Create the booking after successful payment
          if (!pendingBookingData || !userId) {
            alert('Missing booking data');
            return;
          }

          try {
            let booking;

            if (pendingBookingData.type === 'grooming') {
              const { groomingService } = await import('./services/api');
              booking = await groomingService.createGroomingBooking({
                userId,
                petId: pendingBookingData.petId,
                packageType: pendingBookingData.packageType!,
                packageId: pendingBookingData.packageId!,
                location: pendingBookingData.bookingType as 'home' | 'clinic',
                contactNumber: pendingBookingData.contactNumber!,
                date: pendingBookingData.date,
                time: pendingBookingData.time,
                addressId: pendingBookingData.addressId,
                paymentAmount: pendingBookingData.amount,
                groomingStoreId: pendingBookingData.groomingStoreId,
              });
            } else {
              const { consultationService } = await import('./services/api');
              booking = await consultationService.createConsultationBooking({
                userId,
                petId: pendingBookingData.petId,
                bookingType: pendingBookingData.bookingType,
                date: pendingBookingData.date,
                time: pendingBookingData.time,
                addressId: pendingBookingData.addressId,
                doctorId: pendingBookingData.doctorId,
                doctorName: pendingBookingData.doctorName!,
                notes: pendingBookingData.notes!,
                paymentAmount: pendingBookingData.amount,
              });
            }

            setLastCreatedBooking(booking);
            setPendingBookingData(null);

            // Navigate to appropriate confirmation page
            if (pendingBookingData.bookingType === 'home') {
              setCurrentView('confirmation-home');
            } else if (pendingBookingData.bookingType === 'clinic') {
              setCurrentView('confirmation-clinic');
            } else {
              setCurrentView('confirmation-online');
            }
          } catch (error: any) {
            console.error('Error creating booking:', error);
            alert(`Failed to create booking: ${error.message || 'Please try again'}`);
            setCurrentView('payment-failure');
          }
        }}
        userId={userId}
        bookingData={pendingBookingData}
      />;
      case 'confirmation-online': return <ConfirmationOnline onBackHome={() => setCurrentView('home')} onViewAppointments={() => setCurrentView('bookings-overview')} booking={lastCreatedBooking} />;
      case 'confirmation-home': return <ConfirmationHome onBackHome={() => setCurrentView('home')} onViewAppointments={() => setCurrentView('bookings-overview')} booking={lastCreatedBooking} />;
      case 'confirmation-clinic': return <ConfirmationClinic onBackHome={() => setCurrentView('home')} onViewAppointments={() => setCurrentView('bookings-overview')} booking={lastCreatedBooking} />;
      case 'payment-failure': return <PaymentFailure onClose={() => setCurrentView('home')} onRetry={() => setCurrentView('checkout')} />;
      case 'waiting-room': return activeCallBooking ? (
        <WaitingRoom
          onBack={() => setCurrentView('bookings-overview')}
          onJoin={() => setCurrentView('live-consultation')}
          booking={activeCallBooking}
          userId={userId || ''}
          userType="customer"
        />
      ) : null;
      case 'live-consultation': return activeCallBooking ? (
        <LiveConsultation
          onEnd={() => {
            setActiveCallBooking(null);
            if (isDoctorMode) {
              setCurrentView('doctor-consultations');
            } else {
              setCurrentView('home');
            }
          }}
          bookingId={activeCallBooking.id}
          userId={isDoctorMode ? (activeCallBooking.user_id) : (userId || '')}
          doctorId={activeCallBooking.doctor_id || ''}
          userType={isDoctorMode ? 'doctor' : 'customer'}
          doctorName={isDoctorMode ? 'You' : 'Doctor'}
        />
      ) : null;
      case 'profile': return (
        <Profile
          onBack={() => setCurrentView('home')}
          onHomeClick={() => setCurrentView('home')}
          onAppointmentsClick={() => setCurrentView('bookings-overview')}
          onAddressClick={() => setCurrentView('address-management')}
          onOrdersClick={() => setCurrentView('orders-history')}
          onMyPetsClick={() => setCurrentView('my-pets')}
          onPersonalInfoClick={() => setCurrentView('personal-information')}
          onPlusClick={() => setShowBookingPopup(true)}
          onShopClick={() => setCurrentView('shop')}
          userName={userName}
          userProfilePhoto={userProfilePhoto}
          userCreatedAt={userCreatedAt}
          userId={userId}
          onPhotoUpload={(photoUrl) => {
            setUserProfilePhoto(photoUrl);
          }}
          onLogout={() => {
            // Reset all app state
            setUserId(null);
            setUserName('');
            setUserEmail('');
            setUserPhone('');
            setUserProfilePhoto(null);
            setUserCreatedAt('');
            setUserPets([]);
            // Go back to login
            setCurrentView('login-otp');
          }}
        />
      );
      case 'address-management': return <Addresses onBack={() => setCurrentView('profile')} onDone={() => setCurrentView('profile')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} userId={userId} />;
      case 'shopping-cart': return (
        <Cart
          onBack={() => setCurrentView('shop')}
          onHomeClick={() => setCurrentView('home')}
          onVisitsClick={() => setCurrentView('bookings-overview')}
          onProceed={(selectedAddress) => {
            // Save the selected address from Cart
            console.log('App - Cart proceeding with address:', selectedAddress);
            setCheckoutAddress(selectedAddress);
            setCurrentView('checkout-shop');
          }}
          onProfileClick={() => setCurrentView('profile')}
          userId={userId}
          initialAddress={checkoutAddress || userAddress}
          headerAddress={userAddress}
        />
      );
      case 'checkout-shop': return (
        <ShopCheckout
          onBack={() => setCurrentView('shopping-cart')}
          onPlaceOrder={(orderData) => {
            setLastOrderData(orderData);
            setCurrentView('order-confirmation');
          }}
          onAddressChange={(selectedAddress) => {
            // Update the checkout address when user changes it in ShopCheckout
            console.log('App - Checkout address changed:', selectedAddress);
            setCheckoutAddress(selectedAddress);
          }}
          userId={userId}
          initialAddress={checkoutAddress || userAddress}
          headerAddress={userAddress}
        />
      );
      case 'order-confirmation': return <OrderConfirmation onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onContinueShopping={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} onViewOrderDetails={() => setCurrentView('orders-history')} orderData={lastOrderData} />;
      case 'orders-history': return <OrdersHistory onBack={() => setCurrentView('profile')} onOrderClick={(orderId) => { setSelectedOrderId(orderId); setCurrentView('order-details-page'); }} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} userId={userId} />;
      case 'order-details-page': return <OrderDetailsPage onBack={() => setCurrentView('orders-history')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} userId={userId} orderId={selectedOrderId} />;
      case 'my-pets': return <MyPets pets={userPets} onBack={() => setCurrentView('profile')} onAddPet={() => setCurrentView('add-pet')} onEditPet={(petId) => { setSelectedPetId(petId); setCurrentView('edit-pet'); }} onDeletePet={async (petId) => { try { await petService.deletePet(petId); setUserPets(userPets.filter(p => p.id !== petId)); } catch (error) { console.error('Error deleting pet:', error); alert('Failed to delete pet. Please try again.'); } }} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} />;
      case 'personal-information': return <PersonalInformation onBack={() => setCurrentView('profile')} onHomeClick={() => setCurrentView('home')} onVisitsClick={() => setCurrentView('bookings-overview')} onShopClick={() => setCurrentView('shop')} onProfileClick={() => setCurrentView('profile')} userName={userName} userEmail={userEmail} userPhone={userPhone} userId={userId} onUserUpdate={(name, email, phone) => { setUserName(name); setUserEmail(email); setUserPhone(phone); }} />;

      // Doctor Portal Routes
      case 'doctor-login': return <DoctorLogin onBack={() => setCurrentView('onboarding')} onGroomingStoreLogin={() => setCurrentView('grooming-store-login')} onLoginSuccess={async () => {
        // After doctor login, load doctor profile and set doctor ID
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const doctorProfile = await doctorAuthService.getDoctorProfile(user.id);
            setDoctorId(doctorProfile.id);
            setIsDoctorMode(true);
            setCurrentView('doctor-dashboard');
          }
        } catch (error) {
          console.error('Error loading doctor profile:', error);
          alert('Failed to load doctor profile');
        }
      }} onRegister={() => setCurrentView('doctor-register')} />;
      case 'doctor-register': return <DoctorRegister onBack={() => setCurrentView('doctor-login')} onRegisterSuccess={() => setCurrentView('doctor-login')} />;
      case 'doctor-dashboard': return (
        <DoctorDashboard
          doctorId={doctorId}
          onProfileSetup={() => setCurrentView('doctor-profile-setup')}
          onAvailability={() => setCurrentView('doctor-availability')}
          onFeeManagement={() => setCurrentView('doctor-fee-management')}
          onConsultations={() => setCurrentView('doctor-consultations')}
        />
      );
      case 'doctor-profile-setup': return <DoctorProfileSetup onBack={() => setCurrentView('doctor-dashboard')} doctorId={doctorId} />;
      case 'doctor-availability': return <DoctorAvailability onBack={() => setCurrentView('doctor-dashboard')} doctorId={doctorId} />;
      case 'doctor-fee-management': return <DoctorFeeManagement onBack={() => setCurrentView('doctor-dashboard')} doctorId={doctorId!} />;
      case 'doctor-consultations': return <DoctorConsultations onBack={() => setCurrentView('doctor-dashboard')} onDetailClick={(booking) => { setSelectedBooking(booking); setCurrentView('doctor-consultation-details'); }} onJoinCall={(booking) => { setActiveCallBooking(booking); setCurrentView('live-consultation'); }} doctorId={doctorId} />;
      case 'doctor-consultation-details': return <DoctorConsultationDetails onBack={() => setCurrentView('doctor-consultations')} booking={selectedBooking} doctorId={doctorId} />;

      // Grooming Store Portal Routes
      case 'grooming-store-login': return <GroomingStoreLogin onBack={() => setCurrentView('doctor-login')} onRegister={() => setCurrentView('grooming-store-register')} onLoginSuccess={async () => {
        // After grooming store login, load store profile and set store ID
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { groomingStoreAuthService } = await import('./services/groomingStoreApi');
            const storeProfile = await groomingStoreAuthService.getGroomingStoreProfile(user.id);
            if (storeProfile) {
              setGroomingStoreId(storeProfile.id);
              setIsGroomingStoreMode(true);
              setCurrentView('grooming-store-dashboard');
            }
          }
        } catch (error) {
          console.error('Error loading grooming store profile:', error);
          alert('Failed to load store profile');
        }
      }} />;
      case 'grooming-store-register': return <GroomingStoreRegister onBack={() => setCurrentView('grooming-store-login')} onRegisterSuccess={() => setCurrentView('grooming-store-login')} />;
      case 'grooming-store-dashboard': return (
        <GroomingStoreDashboard
          storeId={groomingStoreId}
          onBookings={() => setCurrentView('grooming-store-bookings')}
          onPackages={() => setCurrentView('grooming-store-management')}
          onStoreSettings={() => setCurrentView('grooming-store-management')}
          onLogout={() => {
            // Reset grooming store state
            setGroomingStoreId(null);
            setIsGroomingStoreMode(false);
            setCurrentView('grooming-store-login');
          }}
        />
      );
      case 'grooming-store-bookings': return <GroomingStoreBookings storeId={groomingStoreId} onBack={() => setCurrentView('grooming-store-dashboard')} />;
      case 'grooming-store-management': return <GroomingStoreManagement storeId={groomingStoreId} onBack={() => setCurrentView('grooming-store-dashboard')} />;

      default: return <Home pets={userPets} onServiceClick={() => { }} onShopClick={() => { }} onBookingsClick={() => { }} onPlusClick={() => { }} onProfileClick={() => { }} />;
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
      {showLocationPopup && (
        <LocationSelection
          onClose={() => setShowLocationPopup(false)}
          onSelect={async (location) => {
            console.log('App - Location selected:', location);
            // Reload addresses to find the selected one
            if (userId) {
              try {
                const addresses = await addressService.getUserAddresses(userId);
                console.log('App - Fetched addresses:', addresses);

                if (addresses && addresses.length > 0) {
                  // Find the address that matches the selected location
                  const selectedAddress = addresses.find(
                    (addr: any) => addr.full_address === location
                  );

                  if (selectedAddress) {
                    // User selected a specific address
                    console.log('App - Setting selected address as default:', selectedAddress);
                    setUserAddress({
                      id: selectedAddress.id,
                      type: selectedAddress.type,
                      flatNumber: selectedAddress.flat_number,
                      street: selectedAddress.street,
                      landmark: selectedAddress.landmark,
                      city: selectedAddress.city,
                      state: selectedAddress.state,
                      pincode: selectedAddress.pincode,
                      latitude: selectedAddress.latitude,
                      longitude: selectedAddress.longitude,
                      fullAddress: selectedAddress.full_address,
                    });
                  } else {
                    // No specific address found, use the first one (most recent)
                    console.log('App - Using most recent address:', addresses[0]);
                    const latestAddress = addresses[0];
                    setUserAddress({
                      id: latestAddress.id,
                      type: latestAddress.type,
                      flatNumber: latestAddress.flat_number,
                      street: latestAddress.street,
                      landmark: latestAddress.landmark,
                      city: latestAddress.city,
                      state: latestAddress.state,
                      pincode: latestAddress.pincode,
                      latitude: latestAddress.latitude,
                      longitude: latestAddress.longitude,
                      fullAddress: latestAddress.full_address,
                    });
                  }
                }
              } catch (error) {
                console.error('App - Error loading addresses:', error);
              }
            }
            setShowLocationPopup(false);
          }}
          currentLocation={userAddress.fullAddress || `${userAddress.city}, ${userAddress.state}`}
          userId={userId}
        />
      )}
    </div>
  );
};

export default App;