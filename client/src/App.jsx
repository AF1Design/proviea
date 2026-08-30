import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import AuthModal from './components/AuthModal';
import HomeScreen from './components/HomeScreen';
import SchoolListForm from './components/SchoolListForm';
import ReviewModal from './components/ReviewModal';
import ConfirmationScreen from './components/ConfirmationScreen';
import OrderTrackingScreen from './components/OrderTrackingScreen';
import BagsScreen from './components/BagsScreen';
import AccountScreen from './components/AccountScreen';
import AdminDashboard from './components/AdminDashboard';

function MainApp() {
  const { user } = useAuth();

  // Screen State:
  // 'splash' | 'auth' | 'home' | 'form' | 'review' | 'confirmation' | 'orders' | 'bags' | 'account' | 'admin'
  const [screen, setScreen] = useState('splash');
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  // Form & Order State
  const [formData, setFormData] = useState(null);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // URL Parameters detection (for exhibition QR scans like ?company=CORP15)
  const [initialCompanyCode, setInitialCompanyCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const comp = params.get('company');
    const orderParam = params.get('order');
    const isAdmin = params.get('admin');

    if (comp) {
      setInitialCompanyCode(comp);
    }
    if (orderParam) {
      setTrackingOrderId(orderParam);
      setScreen('orders');
      setHasSeenSplash(true);
    } else if (isAdmin === 'true' || window.location.pathname === '/admin') {
      setScreen('admin');
      setHasSeenSplash(true);
    }
  }, []);

  // Handle Splash Screen Completion
  const handleSplashFinish = () => {
    setHasSeenSplash(true);
    if (!user) {
      setScreen('auth');
    } else {
      setScreen('home');
    }
  };

  // Handle Auth Completion (after OTP)
  const handleAuthComplete = () => {
    if (formData) {
      setScreen('review');
    } else {
      setScreen('home');
    }
  };

  // Start School List Form
  const handleStartSchoolList = () => {
    if (!user) {
      setScreen('auth');
    } else {
      setScreen('form');
    }
  };

  // Proceed to Review Screen
  const handleProceedToReview = (data) => {
    setFormData(data);
    if (!user) {
      setScreen('auth');
    } else {
      setScreen('review');
    }
  };

  // Order Submitted Successfully
  const handleOrderSuccess = (newOrder) => {
    setSubmittedOrder(newOrder);
    setTrackingOrderId(newOrder.id);
    setFormData(null);
    setScreen('confirmation');
  };

  // Track Order
  const handleTrackOrder = () => {
    setScreen('orders');
  };

  // Submit another new list
  const handleNewList = () => {
    setFormData(null);
    setSubmittedOrder(null);
    setScreen('form');
  };

  return (
    <div className="min-h-screen bg-offwhite flex flex-col selection:bg-yellow selection:text-navy pb-16 sm:pb-20">
      {/* 1. Splash Screen (5-second auto transition on QR Scan) */}
      {!hasSeenSplash && screen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* Top Navbar */}
      {hasSeenSplash && (
        <Navbar 
          onNavigate={(targetScreen) => setScreen(targetScreen)} 
          currentScreen={screen} 
        />
      )}

      {/* Main Screen Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {screen === 'auth' && (
          <div className="py-4">
            <AuthModal onComplete={handleAuthComplete} />
          </div>
        )}

        {screen === 'home' && (
          <HomeScreen
            onStartSchoolList={handleStartSchoolList}
            onViewOrders={() => setScreen('orders')}
          />
        )}

        {screen === 'form' && (
          <SchoolListForm
            onProceedToReview={handleProceedToReview}
            onBack={() => setScreen('home')}
            initialData={formData || (initialCompanyCode ? { companyCode: initialCompanyCode } : null)}
          />
        )}

        {screen === 'review' && formData && (
          <ReviewModal
            formData={formData}
            onBackToEdit={() => setScreen('form')}
            onSuccess={handleOrderSuccess}
          />
        )}

        {screen === 'confirmation' && submittedOrder && (
          <ConfirmationScreen
            order={submittedOrder}
            onTrackOrder={handleTrackOrder}
            onNewList={handleNewList}
          />
        )}

        {screen === 'orders' && (
          <OrderTrackingScreen
            selectedOrderId={trackingOrderId}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'bags' && (
          <BagsScreen
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'account' && (
          <AccountScreen
            onBack={() => setScreen('home')}
            onNavigateToOrders={() => setScreen('orders')}
            onNavigateToAuth={() => setScreen('auth')}
          />
        )}

        {screen === 'admin' && (
          <AdminDashboard onBackToHome={() => setScreen('home')} />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar (الرئيسية، طلباتي، شنط مدرسية، حسابي) */}
      {hasSeenSplash && screen !== 'splash' && (
        <BottomNav
          currentScreen={screen}
          onNavigate={(targetScreen) => setScreen(targetScreen)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
