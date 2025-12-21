
import React from 'react';

interface Props {
  onNext: () => void;
}

const Onboarding: React.FC<Props> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col bg-white fade-in overflow-hidden">
      <div className="flex-1 p-6 flex flex-col justify-center items-center">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <div className="relative">
            <img
              src="./assets/images/logo.jpg"
              alt="Pet Visit Logo"
              className="w-32 h-auto relative z-1 object-contain"
            />
          </div>
        </div>

        <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl mb-8">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZygq6yzH4lAIe4IrzwgCWOYtLQ4o1aJBV0VbQzD6g7NQ68od2_8e1as1mpFBQEmumSyMxnycqSSveKgQQuOxI6YaYyt12THyIbUj2SG0EWw9SN4CuD5SNXH80Bxo2Ljm9_kKBBU46gOg8Bg7-D8OeAKQe63munhoYPmzCRYW1NeUf6ghAYHtVvpm3koIe44PnHTcTYYRRCuiNeSISNGmevaaF3BboIONW2Eku24OUe1l9HYVWxY5fAknL6ZjuNx2ejbJoB86kOyc"
            alt="Doctors with pet"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-primary">
            <span className="material-symbols-outlined text-sm text-yellow-500">sentiment_satisfied</span>
            HAPPY PETS
          </div>
        </div>

        <div className="text-center space-y-4 px-4">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Complete Care for Your Best Friend</h1>
          <p className="text-gray-500 text-sm leading-relaxed">Experience the easiest way to manage your pet's health and happiness, all in one friendly app.</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-center gap-2 mb-4">
          <div className="h-1.5 w-8 bg-primary rounded-full"></div>
          <div className="h-1.5 w-1.5 bg-gray-200 rounded-full"></div>
          <div className="h-1.5 w-1.5 bg-gray-200 rounded-full"></div>
        </div>
        <button
          onClick={onNext}
          className="w-full h-14 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-lg transition-transform active:scale-95"
        >
          Get Started
        </button>
        <button className="w-full h-12 bg-primary/5 text-primary font-bold text-sm rounded-2xl">
          Log In
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">By joining, you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
};

export default Onboarding;
