
import React, { useState } from 'react';

interface Props {
  onNext: () => void;
  onLogin?: () => void;
  onDoctorLogin?: () => void;
  onAdminLogin?: () => void;
}

interface Slide {
  image: string;
  badge: string;
  badgeIcon: string;
  title: string;
  description: string;
}

const Onboarding: React.FC<Props> = ({ onNext, onLogin, onDoctorLogin, onAdminLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZygq6yzH4lAIe4IrzwgCWOYtLQ4o1aJBV0VbQzD6g7NQ68od2_8e1as1mpFBQEmumSyMxnycqSSveKgQQuOxI6YaYyt12THyIbUj2SG0EWw9SN4CuD5SNXH80Bxo2Ljm9_kKBBU46gOg8Bg7-D8OeAKQe63munhoYPmzCRYW1NeUf6ghAYHtVvpm3koIe44PnHTcTYYRRCuiNeSISNGmevaaF3BboIONW2Eku24OUe1l9HYVWxY5fAknL6ZjuNx2ejbJoB86kOyc",
      badge: "HAPPY PETS",
      badgeIcon: "sentiment_satisfied",
      title: "Complete Care for Your Best Friend",
      description: "Experience the easiest way to manage your pet's health and happiness, all in one friendly app."
    },
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMrqOyKTZQM8CkTI7jCMV_qC9aQ-4zCkclALNo2GMIaA7rF4lZB_DkrRprV2wq4ac9jJw5ZJJzwkuG8OjBEODesT_NtphZHe9hy96ol87uCZdE1wMLoxUKJB5LMDfRqjCHS8FuJpGB2gdhW23YSEsjMONSwKeFt2Wg-lIhHqrN1kttIUEskWQoeXgO1-sxJVwH67ENshl59i0bn-0yUc9aWfaTHJFHWVNQFtlr6153I8cRNn6ZRvqB5W8kc0k22xQ6K_XGixqMwJY",
      badge: "24/7 SUPPORT",
      badgeIcon: "schedule",
      title: "Expert Care, Anytime You Need",
      description: "Connect with certified veterinarians through video calls, chat, or schedule home visits at your convenience."
    },
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAescF9pZXllFXXlMqlJFpFBp9pO9jTzUOyCR8lAB808mu6xGBb7VKrpMmvkSVYOQDnS_FkQ5W8eJo1uLL_80rIphearuEWyKWnFBLB25w433ZWH2KokSIL6pw2teEkJ-ABhQL6zPW5-VrygwH35Skqedvzk8PIg-CWFAChiaPrRCUkWlkRkR0aTeDAo7fJsya6NMyWL9jfZwtVY4H29QxsCXd70-SyI9ZFfjm1UEco3bopi96qu1bN3RayI1sKSaUFTB97aptEQrQ",
      badge: "ALL IN ONE",
      badgeIcon: "pets",
      title: "Everything Your Pet Needs",
      description: "Book appointments, shop for pet essentials, track health records, and manage all your pet's needs in one place."
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    // Move to the last slide instead of skipping to login
    setCurrentSlide(slides.length - 1);
  };

  return (
    <div className="flex-1 flex flex-col bg-white fade-in overflow-y-auto scrollbar-hide">
      <div className="flex-1 px-7 py-8 flex flex-col justify-center items-center min-h-fit">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <div className="relative">
            <img
              src="./assets/images/logo.jpg"
              alt="Pet Visit Logo"
              className="w-32 h-auto relative z-1 object-contain"
            />
          </div>
        </div>

        <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl mb-8 bg-[#9B8B6E]">
          <img
            src={slides[currentSlide].image}
            alt="Onboarding slide"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-gray-800">
            <span className="material-symbols-outlined text-base text-yellow-500">{slides[currentSlide].badgeIcon}</span>
            {slides[currentSlide].badge}
          </div>
        </div>

        <div className="text-center space-y-3 px-4">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{slides[currentSlide].title}</h1>
          <p className="text-gray-500 text-base leading-relaxed">{slides[currentSlide].description}</p>
        </div>
      </div>

      <div className="px-7 pb-8 space-y-4">
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="w-full h-14 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-lg transition-transform active:scale-95"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>

        {currentSlide === slides.length - 1 && onLogin && (
          <button
            onClick={onLogin}
            className="w-full h-12 bg-primary/5 text-primary font-bold text-sm rounded-2xl transition-transform active:scale-95"
          >
            Already have an account? Login
          </button>
        )}

        {currentSlide === slides.length - 1 && onDoctorLogin && (
          <button
            onClick={onDoctorLogin}
            className="w-full h-12 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-bold text-sm rounded-2xl transition-transform active:scale-95 border border-primary/20"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">stethoscope</span>
              Doctor Login
            </span>
          </button>
        )}

        {currentSlide === slides.length - 1 && onAdminLogin && (
          <button
            onClick={onAdminLogin}
            className="w-full h-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 font-bold text-sm rounded-2xl transition-transform active:scale-95 border border-amber-500/20"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm filled">admin_panel_settings</span>
              Admin Login
            </span>
          </button>
        )}

        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleSkip}
            className="w-full h-12 bg-primary/5 text-primary font-bold text-sm rounded-2xl transition-transform active:scale-95"
          >
            Skip
          </button>
        )}
        <p className="text-center text-[10px] text-gray-400 mt-2">By joining, you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
};

export default Onboarding;
