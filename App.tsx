
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
import UnifiedLogin from './pages/UnifiedLogin';
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
import RescheduleConfirmation from './pages/RescheduleConfirmation';
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
import CustomerManagement from './pages/CustomerManagement';
import AdminUsersManagement from './pages/AdminUsersManagement';
import UserDetails from './pages/UserDetails';
import DoctorManagement from './pages/DoctorManagement';
import ShopProductManagement from './pages/ShopProductManagement';
import AdminCreateProduct from './pages/AdminCreateProduct';
import AdminCreateGroupedProduct from './pages/AdminCreateGroupedProduct';
import AdminProductVariations from './pages/AdminProductVariations';
import AdminBulkImport from './pages/AdminBulkImport';
import AdminDashboard from './pages/AdminDashboard';
import SellerApprovalManagement from './pages/SellerApprovalManagement';
import OrderManagement from './pages/OrderManagement';
import AdminSettlementManagement from './pages/AdminSettlementManagement';
import AdminMarginManagement from './pages/AdminMarginManagement';
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));
import NewBookingPopup from './components/NewBookingPopup';
import LocationSelection from './components/LocationSelection';
import PasswordSetupModal from './components/PasswordSetupModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem('pet-visit-current-view');
    // If saved view exists and is not a "transient" view that should always go through splash/auth, return it
    if (saved && !['splash'].includes(saved)) {
      return saved as AppView;
    }
    return 'splash';
  });

  // Persist current view to localStorage
  useEffect(() => {
    if (currentView !== 'splash') {
      localStorage.setItem('pet-visit-current-view', currentView);
    }
  }, [currentView]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(() => {
    const saved = localStorage.getItem('pet-visit-current-view');
    // If we have a saved view that isn't splash/onboarding, we should show loader while checking session
    return !!(saved && !['splash', 'onboarding'].includes(saved));
  });
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [setPasswordEmail, setSetPasswordEmail] = useState<string>(''); // Email for OAuth user setting password
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [passwordSetupEmail, setPasswordSetupEmail] = useState<string>('');
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

  // Reschedule state - stores booking being rescheduled
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  // Store old date/time for reschedule confirmation
  const [oldSchedule, setOldSchedule] = useState<{ date: string; time: string } | null>(null);

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

  // Admin portal state
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Store Manager portal state
  const [storeManagerId, setStoreManagerId] = useState<string | null>(null);
  const [isStoreManagerMode, setIsStoreManagerMode] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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
          await loadUserData(session.user.id, session.user);
        } else {
          console.log('[checkSession] ✗ No session found');
          setIsLoadingUserData(false);

          if (hasOAuthHash) {
            console.error('[checkSession] WARNING: OAuth hash present but no session!');
            console.error('[checkSession] This likely means:');
            console.error('[checkSession] 1. RLS policies are blocking the session');
            console.error('[checkSession] 2. OR redirect URL is not configured correctly in Supabase');
          }
        }
      } catch (err) {
        console.error('[checkSession] Exception getting session:', err);
        setIsLoadingUserData(false);
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
        // Pass the session user to avoid redundant getUser() call
        await loadUserData(session.user.id, session.user);
      } else {
        // User logged out
        console.log('[onAuthStateChange] User logged out, resetting to onboarding');
        setUserId(null);
        setUserPets([]);
        localStorage.removeItem('pet-visit-current-view');
        setCurrentView('onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const loadingRef = React.useRef(false);

  const loadUserData = async (uid: string, sessionUser?: any) => {
    // Prevent duplicate calls using a ref instead of state to avoid race conditions
    if (loadingRef.current) {
      console.log('[loadUserData] Already loading user data, skipping duplicate call');
      return;
    }

    loadingRef.current = true;
    setIsLoadingUserData(true);

    try {
      console.log('[loadUserData] Starting to load user data for uid:', uid);
      console.log('[loadUserData] Current view before loading:', currentView);
      setUserId(uid);

      // Use session user if provided, otherwise get from auth (with shorter timeout)
      let currentUser = sessionUser;

      if (!currentUser) {
        console.log('[loadUserData] No session user provided, fetching from auth...');
        currentUser = await Promise.race([
          authService.getCurrentUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getCurrentUser timeout after 5s')), 5000)
          )
        ]).catch(err => {
          console.error('[loadUserData] Error or timeout getting current user:', err);
          console.log('[loadUserData] Continuing without current user data...');
          return null;
        });
      }

      if (currentUser) {
        console.log('[loadUserData] ✓ Current user available:', currentUser?.email);
        console.log('[loadUserData] User metadata:', currentUser?.user_metadata);
      }

      // Check metadata FIRST for roles - fastest way to route
      const metadataUserType = currentUser?.user_metadata?.user_type;
      console.log('[loadUserData] Metadata - user_type:', metadataUserType);

      let profile;
      let isNewUser = false;
      let userRole: string = 'user';

      // 1. DETERMINE ROLE
      if (metadataUserType && ['admin', 'super_admin', 'doctor', 'grooming_store', 'store_manager'].includes(metadataUserType)) {
        console.log('[loadUserData] ✓ Special role found in metadata:', metadataUserType);
        userRole = metadataUserType;
      } else {
        // No special role in metadata - try to fetch regular user profile with timeout
        console.log('[loadUserData] No special role in metadata, fetching user profile...');
        try {
          const profilePromise = authService.getUserProfile(uid);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUserProfile timeout after 5s')), 5000)
          );

          profile = await Promise.race([profilePromise, timeoutPromise]);
          userRole = profile?.role || 'user';
          console.log('[loadUserData] ✓ Profile fetched, role:', userRole);
        } catch (err) {
          console.log('[loadUserData] Profile fetch failed or timed out:', err);
          userRole = 'user'; // Fallback
        }
      }

      // 2. SET BASIC USER INFO
      if (currentUser) {
        setUserName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User');
        setUserEmail(currentUser.email || '');
      }

      // 3. ROUTE BASED ON ROLE
      console.log('[loadUserData] Routing for role:', userRole);

      if (userRole === 'admin' || userRole === 'super_admin') {
        setAdminId(uid);
        setIsAdminMode(true);
        setCurrentView(prevView => {
          if (['splash', 'onboarding', 'login', 'admin-login'].includes(prevView) || !prevView.startsWith('admin-')) {
            return 'admin-dashboard';
          }
          return prevView; // Keep current admin view on refresh
        });
        return;
      }

      if (userRole === 'doctor') {
        try {
          const doctorProfile = await Promise.race([
            doctorAuthService.getDoctorProfile(uid),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);

          if (doctorProfile) {
            setDoctorId(doctorProfile.id);
            if (doctorProfile.full_name) setUserName(doctorProfile.full_name);
          } else {
            setDoctorId(uid);
          }

          setIsDoctorMode(true);
          setCurrentView(prevView => {
            if (['splash', 'onboarding', 'doctor-login'].includes(prevView) || !prevView.startsWith('doctor-')) {
              return 'doctor-dashboard';
            }
            return prevView;
          });
          return;
        } catch (err) {
          console.error('[loadUserData] Doctor profile load error:', err);
          setDoctorId(uid);
          setIsDoctorMode(true);
          setCurrentView('doctor-dashboard');
          return;
        }
      }

      if (userRole === 'grooming_store' || userRole === 'store_manager') {
        try {
          const { groomingStoreAuthService } = await import('./services/groomingStoreApi');
          const storeProfile = await Promise.race([
            groomingStoreAuthService.getGroomingStoreProfile(uid),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);

          if (storeProfile) {
            setGroomingStoreId(storeProfile.id);
            if (storeProfile.store_name) setUserName(storeProfile.store_name);
          } else {
            setGroomingStoreId(uid);
          }

          setIsGroomingStoreMode(true);
          setCurrentView(prevView => {
            if (['splash', 'onboarding', 'grooming-store-login'].includes(prevView) || !prevView.startsWith('grooming-store-')) {
              return 'grooming-store-dashboard';
            }
            return prevView;
          });
          return;
        } catch (err) {
          console.error('[loadUserData] Store profile load error:', err);
          setGroomingStoreId(uid);
          setIsGroomingStoreMode(true);
          setCurrentView('grooming-store-dashboard');
          return;
        }
      }

      // Regular User Flow
      console.log('[loadUserData] Processing as regular user...');

      // Check for Google profile photo
      const googleAvatarUrl = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
      const profilePhotoUrl = profile?.profile_photo_url || googleAvatarUrl || null;

      if (profile) {
        setUserName(profile.name);
        setUserEmail(profile.email || '');
        setUserPhone(profile.phone || '');
        setUserProfilePhoto(profilePhotoUrl);
        setUserCreatedAt(profile.created_at);
      } else {
        // No profile exists yet, create one with Google data if available
        console.log('[loadUserData] No profile found, creating one for Google user...');
        const userName = currentUser?.user_metadata?.full_name ||
          currentUser?.user_metadata?.name ||
          currentUser?.email?.split('@')[0] ||
          'User';

        try {
          profile = await authService.createOrUpdateUserProfile(uid, {
            name: userName,
            email: currentUser?.email || undefined,
            phone: currentUser?.phone || undefined,
            profile_photo_url: googleAvatarUrl || undefined,
          });
          console.log('[loadUserData] ✓ Created profile for Google user:', profile);

          setUserName(profile.name);
          setUserEmail(profile.email || '');
          setUserPhone(profile.phone || '');
          setUserProfilePhoto(profilePhotoUrl);
          setUserCreatedAt(profile.created_at);
        } catch (err) {
          console.error('[loadUserData] Error creating profile for Google user:', err);
          // Fallback: just set the basic info without creating profile
          setUserName(userName);
          setUserEmail(currentUser?.email || '');
          setUserProfilePhoto(googleAvatarUrl);
        }
      }

      // Load data with timeouts
      const [pets, addresses] = await Promise.all([
        Promise.race([petService.getUserPets(uid), new Promise<any[]>(r => setTimeout(() => r([]), 3000))]),
        Promise.race([addressService.getUserAddresses(uid), new Promise<any[]>(r => setTimeout(() => r([]), 3000))])
      ]);

      if (pets && pets.length > 0) {
        setUserPets(pets.map(pet => ({
          id: pet.id,
          name: pet.name,
          species: pet.species,
          image: pet.image,
        })));
      }

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        setUserAddress({
          id: addr.id,
          type: addr.type,
          flatNumber: addr.flat_number,
          street: addr.street,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          latitude: addr.latitude || undefined,
          longitude: addr.longitude || undefined,
          fullAddress: addr.full_address || undefined,
        });
      }

      // Check if user logged in with Google and needs password setup
      const isOAuthUser = currentUser?.app_metadata?.provider === 'google';
      let needsPasswordSetup = false;

      if (isOAuthUser && currentUser?.email) {
        try {
          console.log('[loadUserData] Checking if OAuth user has password...');
          needsPasswordSetup = !(await authService.checkUserHasPassword(currentUser.email));
          console.log('[loadUserData] OAuth user needs password setup:', needsPasswordSetup);
        } catch (err) {
          console.error('[loadUserData] Error checking password for OAuth user:', err);
          // Don't block login if password check fails
          needsPasswordSetup = false;
        }
      }

      if (needsPasswordSetup && currentUser?.email) {
        console.log('[loadUserData] Showing password setup modal for OAuth user');
        setPasswordSetupEmail(currentUser.email);
        setShowPasswordSetupModal(true);
        // Don't proceed with normal routing - wait for password setup
        setIsLoadingUserData(false);
        loadingRef.current = false;
        setIsDataLoaded(true);
        return;
      }

      // Routing for users
      const hasPets = pets && pets.length > 0;
      setCurrentView(prevView => {
        if (['splash', 'onboarding', 'login', 'login-otp', 'register'].includes(prevView)) {
          return hasPets ? 'home' : 'pet-selection';
        }
        return prevView;
      });

    } catch (error) {
      console.error('[loadUserData] CRITICAL ERROR:', error);
      // Ensure we don't stay stuck on splash
      setCurrentView(prev => ['splash', 'onboarding'].includes(prev) ? 'home' : prev);
    } finally {
      setIsLoadingUserData(false);
      loadingRef.current = false;
      setIsDataLoaded(true);
      console.log('[loadUserData] Finished');
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
            console.log('[Splash Timer] User is authenticated, triggering loadUserData');
            // Trigger loadUserData with session user to ensure navigation happens
            loadUserData(session.user.id, session.user);
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
      case 'onboarding': return <Onboarding onNext={() => setCurrentView('register')} onLogin={() => setCurrentView('unified-login-user')} onDoctorLogin={() => setCurrentView('unified-login-doctor')} onAdminLogin={() => setCurrentView('unified-login-admin')} onGroomingStoreLogin={() => setCurrentView('unified-login-grooming-store')} />;
      case 'register': return <Register onNext={(name) => { setUserName(name); setCurrentView('pet-selection'); }} onSetPassword={(email) => { setSetPasswordEmail(email); setCurrentView('set-password'); }} />;
      case 'set-password': return <SetPassword email={setPasswordEmail} onBack={() => setCurrentView('register')} onComplete={() => setCurrentView('home')} />;
      case 'login': return <Login onNext={(name) => { setUserName(name); setCurrentView('home'); }} />;
      case 'login-otp': return <LoginWithOTP onNext={() => setCurrentView('home')} />;
      case 'unified-login-user': return <UnifiedLogin userType="user" onBack={() => setCurrentView('onboarding')} onLoginSuccess={() => setCurrentView('home')} onRegisterDoctor={() => setCurrentView('doctor-register')} onRegisterGroomingStore={() => setCurrentView('grooming-store-register')} />;
      case 'unified-login-doctor': return <UnifiedLogin userType="doctor" onBack={() => setCurrentView('onboarding')} onLoginSuccess={() => setCurrentView('doctor-dashboard')} onRegisterDoctor={() => setCurrentView('doctor-register')} onRegisterGroomingStore={() => setCurrentView('grooming-store-register')} />;
      case 'unified-login-grooming-store': return <UnifiedLogin userType="grooming_store" onBack={() => setCurrentView('onboarding')} onLoginSuccess={() => setCurrentView('grooming-store-dashboard')} onRegisterDoctor={() => setCurrentView('doctor-register')} onRegisterGroomingStore={() => setCurrentView('grooming-store-register')} />;
      case 'unified-login-admin': return <UnifiedLogin userType="admin" onBack={() => setCurrentView('onboarding')} onLoginSuccess={() => setCurrentView('admin-dashboard')} onRegisterDoctor={() => setCurrentView('doctor-register')} onRegisterGroomingStore={() => setCurrentView('grooming-store-register')} />;
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
                  setUserPets(userPets.map(p => p.id === petId ? updatedPet : p));
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
        onBack={() => {
          setReschedulingBooking(null);
          setOldSchedule(null);
          setCurrentView('home');
        }}
        pets={userPets}
        userId={userId}
        defaultAddress={userAddress}
        onProceedToCheckout={async (bookingData) => {
          // Check if we're rescheduling
          if (reschedulingBooking) {
            try {
              const { groomingService } = await import('./services/api');
              const updatedBooking = await groomingService.rescheduleGroomingBooking(
                reschedulingBooking.id,
                bookingData.date,
                bookingData.time
              );
              setLastCreatedBooking(updatedBooking);
              setReschedulingBooking(null);
              setCurrentView('reschedule-confirmation');
            } catch (error) {
              console.error('Error rescheduling grooming booking:', error);
              alert('Failed to reschedule booking. Please try again.');
            }
          } else {
            setPendingBookingData(bookingData);
            setCurrentView('checkout');
          }
        }}
        reschedulingBooking={reschedulingBooking}
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
          onReschedule={(booking) => {
            // Store the booking being rescheduled and old schedule
            setReschedulingBooking(booking);
            setOldSchedule({ date: booking.date, time: booking.time });
            // Navigate to appropriate booking page based on booking type
            if (booking.service_type === 'consultation') {
              if (booking.booking_type === 'online') {
                setCurrentView('online-consult-booking');
              } else {
                setCurrentView('home-consult-booking');
              }
            } else if (booking.service_type === 'grooming') {
              setCurrentView('grooming');
            }
          }}
          userId={userId}
        />
      );
      case 'booking-details': return (
        <BookingDetails
          onBack={() => setCurrentView('bookings-overview')}
          booking={selectedBooking}
          userId={userId}
          onCartClick={() => setCurrentView('shopping-cart')}
          onReschedule={(booking) => {
            // Store the booking being rescheduled and old schedule
            setReschedulingBooking(booking);
            setOldSchedule({ date: booking.date, time: booking.time });
            // Navigate to appropriate booking page based on booking type
            if (booking.service_type === 'consultation') {
              if (booking.booking_type === 'online') {
                setCurrentView('online-consult-booking');
              } else {
                setCurrentView('home-consult-booking');
              }
            } else if (booking.service_type === 'grooming') {
              setCurrentView('grooming');
            }
          }}
        />
      );
      case 'online-consult-booking': return <OnlineConsultBooking
        pets={userPets}
        onBack={() => {
          setReschedulingBooking(null); // Clear reschedule mode
          setOldSchedule(null);
          setCurrentView('home');
        }}
        onBook={() => setCurrentView('checkout')}
        userId={userId}
        onProceedToCheckout={async (bookingData) => {
          // Check if we're rescheduling an existing booking
          if (reschedulingBooking) {
            try {
              const { bookingService } = await import('./services/api');
              const updatedBooking = await bookingService.rescheduleBooking(
                reschedulingBooking.id,
                bookingData.date,
                bookingData.time
              );
              setLastCreatedBooking(updatedBooking);
              setReschedulingBooking(null);
              setCurrentView('reschedule-confirmation');
            } catch (error) {
              console.error('Error rescheduling booking:', error);
              alert('Failed to reschedule booking. Please try again.');
            }
          } else {
            setPendingBookingData(bookingData);
            setCurrentView('checkout');
          }
        }}
        reschedulingBooking={reschedulingBooking}
      />;
      case 'home-consult-booking': return <HomeConsultBooking
        pets={userPets}
        onBack={() => {
          setReschedulingBooking(null);
          setOldSchedule(null);
          setCurrentView('home');
        }}
        onBook={() => setCurrentView('checkout')}
        userId={userId}
        defaultAddress={userAddress}
        onProceedToCheckout={async (bookingData) => {
          // Check if we're rescheduling
          if (reschedulingBooking) {
            try {
              const { bookingService } = await import('./services/api');
              const updatedBooking = await bookingService.rescheduleBooking(
                reschedulingBooking.id,
                bookingData.date,
                bookingData.time
              );
              setLastCreatedBooking(updatedBooking);
              setReschedulingBooking(null);
              setCurrentView('reschedule-confirmation');
            } catch (error) {
              console.error('Error rescheduling booking:', error);
              alert('Failed to reschedule booking. Please try again.');
            }
          } else {
            setPendingBookingData(bookingData);
            setCurrentView('checkout');
          }
        }}
        reschedulingBooking={reschedulingBooking}
      />;
      case 'checkout': return <Checkout
        onBack={() => {
          // Go back to the appropriate booking page
          // Clear pending booking data so changes made in booking page will be reflected
          const bookingType = pendingBookingData?.type;
          const isOnline = pendingBookingData?.bookingType === 'online';
          setPendingBookingData(null);

          if (bookingType === 'grooming') {
            setCurrentView('grooming');
          } else if (isOnline) {
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
      case 'reschedule-confirmation': return (
        <RescheduleConfirmation
          onBackHome={() => {
            setOldSchedule(null);
            setCurrentView('home');
          }}
          onViewAppointments={() => {
            setOldSchedule(null);
            setCurrentView('bookings-overview');
          }}
          booking={lastCreatedBooking}
          oldDate={oldSchedule?.date || ''}
          oldTime={oldSchedule?.time || ''}
        />
      );

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
          onManageOrders={() => setCurrentView('admin-order-management')}
          onManageProducts={() => setCurrentView('admin-shop-products')}
          onLogout={async () => {
            // Sign out from Supabase
            await supabase.auth.signOut();
            // Reset doctor state
            setDoctorId(null);
            setIsDoctorMode(false);
            setCurrentView('doctor-login');
          }}
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
          onManageOrders={() => setCurrentView('admin-order-management')}
          onManageProducts={() => setCurrentView('admin-shop-products')}
          onLogout={async () => {
            // Sign out from Supabase
            await supabase.auth.signOut();
            // Reset grooming store state
            setGroomingStoreId(null);
            setIsGroomingStoreMode(false);
            setCurrentView('grooming-store-login');
          }}
        />
      );
      case 'grooming-store-bookings': return <GroomingStoreBookings storeId={groomingStoreId} onBack={() => setCurrentView('grooming-store-dashboard')} />;
      case 'grooming-store-management': return <GroomingStoreManagement storeId={groomingStoreId} onBack={() => setCurrentView('grooming-store-dashboard')} />;

      // Admin portal routes
      case 'admin-login': return <Login onNext={async (name) => {
        // After admin login, verify admin status and load admin profile
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { adminAuthService } = await import('./services/adminApi');
            const adminProfile = await adminAuthService.getAdminProfile(user.id);
            if (adminProfile) {
              setAdminId(adminProfile.id);
              setIsAdminMode(true);
              setCurrentView('admin-dashboard');
            } else {
              alert('You do not have admin access');
              await supabase.auth.signOut();
            }
          }
        } catch (error) {
          console.error('Error loading admin profile:', error);
          alert('Failed to load admin profile');
        }
      }} />;

      case 'admin-dashboard': return (
        <AdminDashboard
          adminId={adminId}
          onCustomerManagement={() => setCurrentView('admin-customers')}
          onDoctorManagement={() => setCurrentView('admin-doctors-management')}
          onShopManagement={() => setCurrentView('admin-shop-products')}
          onAdminUsers={() => setCurrentView('admin-users-management')}
          onSellerApprovals={() => setCurrentView('admin-seller-approvals')}
          onOrderManagement={() => setCurrentView('admin-order-management')}
          onSettlementManagement={() => setCurrentView('admin-settlements')}
          onMarginManagement={() => setCurrentView('admin-margin-management')}
          onNotifications={() => setCurrentView('admin-notifications')}
          onLogout={async () => {
            await supabase.auth.signOut();
            setAdminId(null);
            setIsAdminMode(false);
            setCurrentView('admin-login');
          }}
        />
      );

      case 'admin-notifications': return (
        <AdminNotifications
          onBack={() => setCurrentView('admin-dashboard')}
        />
      );

      case 'admin-customers': return (
        <CustomerManagement
          onBack={() => setCurrentView('admin-dashboard')}
          onCustomerSelect={(customerId) => {
            setSelectedCustomerId(customerId);
            setCurrentView('admin-customer-details');
          }}
          onAdminUsers={() => setCurrentView('admin-users-management')}
          onDoctors={() => setCurrentView('admin-doctors-management')}
          onShopProducts={() => setCurrentView('admin-shop-products')}
        />
      );

      case 'admin-customer-details': return selectedCustomerId ? (
        <UserDetails
          onBack={() => {
            setSelectedCustomerId(null);
            setCurrentView('admin-customers');
          }}
          userId={selectedCustomerId}
          currentAdminId={adminId || ''}
        />
      ) : null;

      case 'admin-users-management': return (
        <AdminUsersManagement
          onBack={() => setCurrentView('admin-dashboard')}
          currentAdminId={adminId || ''}
        />
      );

      case 'admin-doctors-management': return (
        <DoctorManagement
          onBack={() => setCurrentView('admin-dashboard')}
          currentAdminId={adminId || ''}
        />
      );

      case 'admin-shop-products': return (
        <ShopProductManagement
          onBack={() => {
            if (isAdminMode) setCurrentView('admin-dashboard');
            else if (isDoctorMode) setCurrentView('doctor-dashboard');
            else if (isGroomingStoreMode) setCurrentView('grooming-store-dashboard');
            else setCurrentView('home');
          }}
          onCreateProduct={() => {
            setSelectedProductId(null);
            setCurrentView('admin-create-product');
          }}
          onCreateGroupedProduct={() => setCurrentView('admin-create-grouped-product')}
          onBulkImport={() => setCurrentView('admin-bulk-import')}
          onEditProduct={(productId) => {
            setSelectedProductId(productId);
            setCurrentView('admin-edit-product');
          }}
          onManageVariations={(productId) => {
            setSelectedProductId(productId);
            setCurrentView('admin-product-variations');
          }}
          sellerId={isAdminMode ? undefined : (doctorId || groomingStoreId || undefined)}
        />
      );

      case 'admin-create-product': return (
        <AdminCreateProduct
          onBack={() => setCurrentView('admin-shop-products')}
          onSuccess={() => setCurrentView('admin-shop-products')}
        />
      );

      case 'admin-edit-product': return selectedProductId ? (
        <AdminCreateProduct
          onBack={() => {
            setSelectedProductId(null);
            setCurrentView('admin-shop-products');
          }}
          onSuccess={() => {
            setSelectedProductId(null);
            setCurrentView('admin-shop-products');
          }}
          editProductId={selectedProductId}
        />
      ) : null;

      case 'admin-create-grouped-product': return (
        <AdminCreateGroupedProduct
          onBack={() => setCurrentView('admin-shop-products')}
          onSuccess={() => setCurrentView('admin-shop-products')}
        />
      );

      case 'admin-product-variations': return selectedProductId ? (
        <AdminProductVariations
          onBack={() => {
            setSelectedProductId(null);
            setCurrentView('admin-shop-products');
          }}
          productId={selectedProductId}
        />
      ) : null;

      case 'admin-bulk-import': return (
        <AdminBulkImport
          onBack={() => setCurrentView('admin-shop-products')}
          onSuccess={() => setCurrentView('admin-shop-products')}
        />
      );

      case 'admin-seller-approvals': return adminId ? (
        <SellerApprovalManagement
          onBack={() => setCurrentView('admin-dashboard')}
          adminId={adminId}
        />
      ) : null;

      case 'admin-order-management': return (
        <OrderManagement
          onBack={() => {
            if (isAdminMode) setCurrentView('admin-dashboard');
            else if (isDoctorMode) setCurrentView('doctor-dashboard');
            else if (isGroomingStoreMode) setCurrentView('grooming-store-dashboard');
            else setCurrentView('home');
          }}
          isAdmin={isAdminMode}
          sellerId={isAdminMode ? undefined : (doctorId || groomingStoreId || undefined)}
        />
      );

      case 'admin-settlements': return (
        <AdminSettlementManagement
          onBack={() => setCurrentView('admin-dashboard')}
        />
      );

      case 'admin-margin-management': return (
        <AdminMarginManagement
          onBack={() => setCurrentView('admin-dashboard')}
        />
      );

      default: return <Home pets={userPets} onServiceClick={() => { }} onShopClick={() => { }} onBookingsClick={() => { }} onPlusClick={() => { }} onProfileClick={() => { }} />;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen relative bg-background-light overflow-hidden flex flex-col font-body shadow-2xl">
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        {isLoadingUserData ? (
          <div className="flex items-center justify-center h-full bg-background-light">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-slate-500 text-sm font-medium animate-pulse">Loading profile...</p>
            </div>
          </div>
        ) : (
          renderView()
        )}
      </React.Suspense>
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

      {/* Password Setup Modal for OAuth users */}
      <PasswordSetupModal
        email={passwordSetupEmail}
        isOpen={showPasswordSetupModal}
        onComplete={() => {
          setShowPasswordSetupModal(false);
          // Continue with normal user flow
          const hasPets = userPets && userPets.length > 0;
          setCurrentView(hasPets ? 'home' : 'pet-selection');
        }}
        onSkip={() => {
          setShowPasswordSetupModal(false);
          // Continue with normal user flow
          const hasPets = userPets && userPets.length > 0;
          setCurrentView(hasPets ? 'home' : 'pet-selection');
        }}
      />
    </div>
  );
};

export default App;