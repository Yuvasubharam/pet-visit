
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
  pets: Pet[];
  onBack: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  onProfileClick: () => void;
  onAddPet: () => void;
  onEditPet: (petId: string) => void;
  onDeletePet: (petId: string) => void;
}

const MyPets: React.FC<Props> = ({
  pets,
  onBack,
  onHomeClick,
  onVisitsClick,
  onShopClick,
  onProfileClick,
  onAddPet,
  onEditPet,
  onDeletePet
}) => {
  const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (petId: string, petName: string) => {
    setPetToDelete({ id: petId, name: petName });
  };

  const confirmDelete = () => {
    if (petToDelete) {
      onDeletePet(petToDelete.id);
      setPetToDelete(null);
    }
  };

  const cancelDelete = () => {
    setPetToDelete(null);
  };

  const getPetIcon = (species: string) => {
    const icons: { [key: string]: string } = {
      dog: '🐕',
      cat: '🐈',
      bunny: '🐰',
      hamster: '🐹',
      bird: '🦜',
      fish: '🐠',
      turtle: '🐢',
      other: '🐾'
    };
    return icons[species] || icons.other;
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-slate-900 overflow-hidden fade-in h-screen">
      <div className="relative min-h-screen w-full mx-auto max-w-md bg-background-light flex flex-col pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900">My Pets</h1>
          <button
            onClick={onAddPet}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-light transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          {pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <span className="text-6xl">🐾</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Pets Yet</h2>
              <p className="text-gray-500 text-center mb-6 px-8">
                Add your first pet to get started with bookings and services
              </p>
              <button
                onClick={onAddPet}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-light transition-colors"
              >
                Add Your First Pet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {pets.length} {pets.length === 1 ? 'Pet' : 'Pets'}
                </p>
              </div>

              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center p-4">
                    {/* Pet Image */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100">
                        <img
                          src={pet.image}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-lg">
                        {getPetIcon(pet.species)}
                      </div>
                    </div>

                    {/* Pet Details */}
                    <div className="flex-1 ml-4">
                      <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {pet.species}
                        </span>
                        {pet.breed && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-medium text-gray-500">
                              {pet.breed}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {pet.age !== undefined && pet.age > 0 && (
                          <span className="text-xs font-medium text-gray-500">
                            {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                          </span>
                        )}
                        {pet.weight && (
                          <>
                            {pet.age !== undefined && pet.age > 0 && (
                              <span className="text-gray-300">•</span>
                            )}
                            <span className="text-xs font-medium text-gray-500">
                              {pet.weight} kg
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => onEditPet(pet.id)}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(pet.id, pet.name)}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {petToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Pet?</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{petToDelete.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex justify-around items-center h-16 pb-2 px-4 relative">
            <button
              onClick={onHomeClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">home</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </button>
            <button
              onClick={onVisitsClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">calendar_month</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Bookings</span>
            </button>
            <button className="flex flex-col items-center justify-center flex-1 gap-1 text-primary relative">
              <span className="material-symbols-outlined fill-current -translate-y-0.5">pets</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Pets</span>
              <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></div>
            </button>
            <button
              onClick={onShopClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">shopping_bag</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Shop</span>
            </button>
            <button
              onClick={onProfileClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">account_circle</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MyPets;
