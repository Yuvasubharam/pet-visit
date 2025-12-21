
import React from 'react';

interface Props {
  onNext: () => void;
}

const Login: React.FC<Props> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light fade-in">
      <div className="h-[45vh] flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-blue-50/50 -z-10"></div>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMrqOyKTZQM8CkTI7jCMV_qC9aQ-4zCkclALNo2GMIaA7rF4lZB_DkrRprV2wq4ac9jJw5ZJJzwkuG8OjBEODesT_NtphZHe9hy96ol87uCZdE1wMLoxUKJB5LMDfRqjCHS8FuJpGB2gdhW23YSEsjMONSwKeFt2Wg-lIhHqrN1kttIUEskWQoeXgO1-sxJVwH67ENshl59i0bn-0yUc9aWfaTHJFHWVNQFtlr6153I8cRNn6ZRvqB5W8kc0k22xQ6K_XGixqMwJY"
          alt="Illustration"
          className="w-full max-w-[280px] object-contain"
        />
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src="./assets/images/logo.jpg"
              alt="Pet Visit Logo"
              className="w-32 h-auto relative z-1 object-contain mb-10"
            />
          </div>
          <p className="text-gray-400 text-sm font-medium mt-1">Simplifying Pet Parenting</p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">smartphone</span>
              <input
                type="tel"
                placeholder="Enter your mobile number"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900"
              />
            </div>
          </div>
          <button
            onClick={onNext}
            className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-95"
          >
            GET STARTED
          </button>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-[10px] text-gray-400">
            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> & <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
