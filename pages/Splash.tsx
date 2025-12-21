
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-12 bg-white fade-in">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
        <div className="relative">
          <div className="absolute -inset-12 bg-primary/5 blur-3xl rounded-full"></div>
          <img
            src="./assets/images/logo.jpg"
            alt="Pet Visit Logo"
            className="w-56 h-56 object-contain relative z-10 drop-shadow-2xl transition-transform duration-1000 scale-105"
          />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-extrabold text-primary tracking-tighter font-display">Pet Visit</h1>
          <div className="h-0.5 w-12 bg-primary/20 mx-auto rounded-full"></div>
          <p className="text-gray-400 font-semibold tracking-[0.2em] uppercase text-[10px]">Comfort • Care • Convenience</p>
        </div>
      </div>

      <div className="w-full max-w-[200px] space-y-6 mb-8">
        <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-3000 ease-out" style={{ width: '100%', transitionDuration: '3000ms' }}></div>
        </div>
        <p className="text-center text-[9px] font-black text-gray-300 tracking-[0.3em] uppercase">Premium Pet Care</p>
      </div>
    </div>
  );
};

export default Splash;
