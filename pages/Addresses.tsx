
import React from 'react';

interface Props {
  onBack: () => void;
  onDone: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
}

const Addresses: React.FC<Props> = ({ onBack, onDone, onHomeClick, onVisitsClick, onShopClick }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full w-full flex-col overflow-x-hidden pb-32">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-black/5">
          <div className="flex items-center h-12 justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-[#111418] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <p className="text-primary tracking-tight text-[22px] font-extrabold leading-tight">Addresses</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={onDone} className="text-primary font-bold text-sm">Done</button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-8 pb-40">
          <div className="space-y-4">
            <h3 className="text-[#111418] text-lg font-bold leading-tight px-1">Saved Addresses</h3>
            
            <div className="flex flex-col bg-white rounded-2xl p-4 shadow-sm ring-1 ring-primary/20 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div> 
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined filled" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
                </div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[#111418] font-bold text-base">Home</p>
                    <span className="text-primary text-[10px] uppercase font-bold bg-primary/10 px-2 py-0.5 rounded-md tracking-wider">Default</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mt-1">
                    123 Maple Avenue<br/>
                    Apartment 4B<br/>
                    Seattle, WA 98109
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </button>
              </div>
            </div>

            <div className="flex flex-col bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 group hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div className="flex flex-col flex-1 gap-1">
                  <p className="text-[#111418] font-bold text-base">Work</p>
                  <p className="text-gray-500 text-sm leading-relaxed mt-1">
                    456 Tech Park Blvd<br/>
                    Building C, Suite 200<br/>
                    Redmond, WA 98052
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-[#111418] text-lg font-bold leading-tight px-1">Add New Address</h3>
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Label <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative group">
                  <input className="w-full h-11 rounded-xl border-0 ring-1 ring-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-gray-400 pl-10 transition-all" placeholder="e.g. Grandma's House" type="text"/>
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-primary">label</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Street Address</label>
                <input className="w-full h-11 rounded-xl border-0 ring-1 ring-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-gray-400 pl-3 transition-all" placeholder="Street and Number" type="text"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">City</label>
                <input className="w-full h-11 rounded-xl border-0 ring-1 ring-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-gray-400 pl-3 transition-all" placeholder="City" type="text"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">State</label>
                  <div className="relative">
                    <select className="w-full h-11 rounded-xl border-0 ring-1 ring-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white text-[#111418] appearance-none pl-3 pr-10">
                      <option disabled selected value="">Select</option>
                      <option>WA</option>
                      <option>OR</option>
                      <option>CA</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Zip Code</label>
                  <input className="w-full h-11 rounded-xl border-0 ring-1 ring-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-gray-400 pl-3 transition-all" placeholder="Zip Code" type="text"/>
                </div>
              </div>
              <button className="mt-2 w-full h-12 bg-primary hover:bg-[#013d63] text-white font-bold text-base rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <span className="material-symbols-outlined">add_location_alt</span>
                Save New Address
              </button>
            </div>
          </div>
        </main>

        <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary group transition-all">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary group transition-all">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              <span className="text-[10px] font-medium">Visits</span>
            </button>
            <button onClick={onShopClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary group transition-all">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
              <span className="text-[10px] font-medium">Shop</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-primary">
              <div className="relative">
                <span className="material-symbols-outlined text-[24px] filled" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-2 ring-white"></span>
              </div>
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Addresses;
