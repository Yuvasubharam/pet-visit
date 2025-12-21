
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
  onBack: () => void;
  onCreate: (pet: Omit<Pet, 'id'>) => void;
}

const AddPet: React.FC<Props> = ({ onBack, onCreate }) => {
  const [petData, setPetData] = useState<Omit<Pet, 'id'>>({
    name: '',
    species: 'dog',
    image: 'https://picsum.photos/seed/newpet/200/200'
  });
  const [isVaccinated, setIsVaccinated] = useState<'yes' | 'no'>('yes');

  return (
    <div className="flex-1 flex flex-col bg-white fade-in overflow-hidden">
      

      <main className="flex-1 px-8 pt-4 pb-12 flex flex-col overflow-y-auto no-scrollbar">
        {/* Progress Bar Indicators */}
        <div className="flex justify-center gap-2 mb-10">
          <div className="h-1.5 w-10 rounded-full bg-gray-100"></div>
          <div className="h-1.5 w-10 rounded-full bg-gray-100"></div>
          <div className="h-1.5 w-10 rounded-full bg-primary"></div>
        </div>

        {/* Upload Photo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full border-2 border-primary border-dashed flex items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
              <span className="material-symbols-outlined text-primary text-[20px] font-bold">add_circle</span>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold text-gray-900">Upload Photo</p>
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Name Of Your Pet</label>
            <input 
              type="text" 
              placeholder="Max"
              value={petData.name}
              onChange={(e) => setPetData({...petData, name: e.target.value})}
              className="w-full py-4 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary placeholder-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Choose Your Pet Breed</label>
            <div className="relative">
              <select className="w-full py-4 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary appearance-none text-gray-400">
                <option>Select option</option>
                <option>Golden Retriever</option>
                <option>German Shepherd</option>
                <option>Bulldog</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Date Of Birth</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="15-12-2020"
                className="w-full py-4 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary placeholder-gray-300"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Is Your Pet Vaccinated ?</label>
            <div className="flex items-center gap-8 px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isVaccinated === 'yes' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                  {isVaccinated === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input 
                  type="radio" 
                  name="vaccinated" 
                  className="hidden" 
                  checked={isVaccinated === 'yes'} 
                  onChange={() => setIsVaccinated('yes')}
                />
                <span className={`text-sm font-bold transition-colors ${isVaccinated === 'yes' ? 'text-primary' : 'text-gray-500'}`}>Yes</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isVaccinated === 'no' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                  {isVaccinated === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input 
                  type="radio" 
                  name="vaccinated" 
                  className="hidden" 
                  checked={isVaccinated === 'no'} 
                  onChange={() => setIsVaccinated('no')}
                />
                <span className={`text-sm font-bold transition-colors ${isVaccinated === 'no' ? 'text-primary' : 'text-gray-500'}`}>No</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12">
          <button 
            onClick={() => onCreate(petData)}
            className="w-full py-5 bg-primary text-white font-black text-sm uppercase tracking-[0.1em] rounded-[24px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all"
          >
            Add Pet
          </button>
        </div>
      </main>

      {/* Bottom Home Indicator */}
      <div className="flex justify-center pb-3">
        <div className="w-36 h-1.5 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default AddPet;
