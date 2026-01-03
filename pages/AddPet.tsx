
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
  onBack: () => void;
  onCreate: (pet: Omit<Pet, 'id'>) => void;
  selectedPetType?: string;
}

const AddPet: React.FC<Props> = ({ onBack, onCreate, selectedPetType = 'dog' }) => {
  const [petData, setPetData] = useState<Omit<Pet, 'id'>>({
    name: '',
    species: selectedPetType,
    image: 'https://picsum.photos/seed/newpet/200/200'
  });
  const [isVaccinated, setIsVaccinated] = useState<'yes' | 'no'>('yes');
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setUploadedImage(imageUrl);
        setPetData({ ...petData, image: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateOfBirth(event.target.value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddPet = () => {
    const age = calculateAge(dateOfBirth);
    const petWeight = weight ? parseFloat(weight) : undefined;

    const completePetData: Omit<Pet, 'id'> = {
      ...petData,
      breed: selectedBreed || undefined,
      age: age > 0 ? age : undefined,
      weight: petWeight,
    };

    onCreate(completePetData);
  };

  // Breed options based on pet type
  const breedOptions: { [key: string]: string[] } = {
    dog: ['Golden Retriever', 'German Shepherd', 'Bulldog', 'Labrador', 'Poodle', 'Beagle', 'Shiztu'],
    cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal'],
    bunny: ['Holland Lop', 'Netherland Dwarf', 'Flemish Giant', 'Mini Rex', 'Lionhead'],
    hamster: ['Syrian', 'Dwarf Campbell', 'Roborovski', 'Chinese', 'Winter White'],
    bird: ['Parrot', 'Canary', 'Budgie', 'Cockatiel', 'Finch', 'Lovebird'],
    fish: ['Goldfish', 'Betta', 'Guppy', 'Angelfish', 'Tetra', 'Molly'],
    turtle: ['Red-Eared Slider', 'Box Turtle', 'Painted Turtle', 'Snapping Turtle', 'Musk Turtle'],
    other: ['Mixed Breed', 'Unknown', 'Other']
  };

  const currentBreeds = breedOptions[selectedPetType] || breedOptions['other'];

  return (
    <div className="flex-1 flex flex-col bg-white fade-in overflow-hidden">
      {/* Progress Bar Indicators - Fixed at top */}
      <div className="flex justify-center gap-2 py-6 bg-white">
        <div className="h-1.5 w-10 rounded-full bg-gray-100"></div>
        <div className="h-1.5 w-10 rounded-full bg-primary"></div>
        <div className="h-1.5 w-10 rounded-full bg-gray-100"></div>
      </div>

      <main className="flex-1 px-8 pt-4 pb-12 flex flex-col overflow-y-auto no-scrollbar">

        {/* Upload Photo Section */}
        <div className="flex flex-col items-center mb-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedImage ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
                <img
                  src={uploadedImage}
                  alt="Pet preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full border-2 border-primary border-dashed flex items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
              <span className="material-symbols-outlined text-primary text-[20px] font-bold">
                {uploadedImage ? 'edit' : 'add_circle'}
              </span>
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
              onChange={(e) => setPetData({ ...petData, name: e.target.value })}
              className="w-full py-4 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary placeholder-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Choose Your Pet Breed</label>
            <div className="relative">
              <select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                className="w-full py-4 px-6 pr-12 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary text-gray-400 cursor-pointer"
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option value="" disabled>Select option</option>
                {currentBreeds.map((breed) => (
                  <option key={breed} value={breed} className="text-gray-900">
                    {breed}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Date Of Birth</label>
            <div className="relative">
              <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  opacity: 0;
                  cursor: pointer;
                }
                input[type="date"]::-webkit-inner-spin-button,
                input[type="date"]::-webkit-clear-button {
                  display: none;
                }
                input[type="date"]::-webkit-datetime-edit {
                  color: transparent;
                }
                input[type="date"]::-webkit-datetime-edit-fields-wrapper {
                  color: transparent;
                }
              `}</style>
              <input
                type="date"
                value={dateOfBirth}
                onChange={handleDateChange}
                className="w-full py-4 px-6 pr-12 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary cursor-pointer"
                style={{
                  colorScheme: 'light'
                }}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              {dateOfBirth ? (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-900 pointer-events-none">
                  {formatDate(dateOfBirth)}
                </div>
              ) : (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
                  Select date
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="5.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full py-4 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary placeholder-gray-300"
            />
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
            onClick={handleAddPet}
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
