
import React, { useState } from 'react';

interface Props {
    onNext: (petType: string) => void;
    onAdd: () => void;
    onSkip?: () => void;
    userName?: string;
}

const PetSelection: React.FC<Props> = ({ onNext, onAdd, onSkip, userName = 'Ajay Kanna' }) => {
    const [selected, setSelected] = useState<'dog' | 'cat' | 'other' | null>('dog');
    const [showOtherDropdown, setShowOtherDropdown] = useState(false);
    const [otherPetType, setOtherPetType] = useState<string>('');

    const getSelectedPetType = () => {
        if (selected === 'other' && otherPetType) {
            return otherPetType;
        }
        return selected || 'dog';
    };

    const otherPets = [
        { value: 'bunny', label: 'Bunny', icon: 'cruelty_free' },
        { value: 'hamster', label: 'Hamster', icon: 'interests' },
        { value: 'bird', label: 'Bird', icon: 'flutter_dash' },
        { value: 'fish', label: 'Fish', icon: 'phishing' },
        { value: 'turtle', label: 'Turtle', icon: 'mood' },
    ];

    return (
        <div className="flex-1 flex flex-col bg-white p-8 fade-in">
            <div className="flex justify-center space-x-2 mt-4 mb-10">
                <div className="h-1.5 w-12 bg-primary rounded-full"></div>
                <div className="h-1.5 w-12 bg-gray-100 rounded-full"></div>
                <div className="h-1.5 w-12 bg-gray-100 rounded-full"></div>
            </div>

            <div className="space-y-2 mb-10">
                <p className="text-gray-400 text-lg font-medium">Welcome {userName},</p>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Choose Your Pet...</h1>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <button
                    onClick={() => setSelected('dog')}
                    className={`relative p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all transform active:scale-95 ${selected === 'dog' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 bg-gray-50'}`}
                >
                    {selected === 'dog' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selected === 'dog' ? 'bg-white' : 'bg-white/50'}`}>
                        <span className={`material-symbols-outlined text-4xl ${selected === 'dog' ? 'text-primary' : 'text-gray-400'}`}>pets</span>
                    </div>
                    <span className={`text-lg font-bold ${selected === 'dog' ? 'text-primary' : 'text-gray-400'}`}>Dog</span>
                </button>

                <button
                    onClick={() => setSelected('cat')}
                    className={`relative p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all transform active:scale-95 ${selected === 'cat' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 bg-gray-50'}`}
                >
                    {selected === 'cat' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selected === 'cat' ? 'bg-white' : 'bg-white/50'}`}>
                        <span className={`material-symbols-outlined text-4xl ${selected === 'cat' ? 'text-primary' : 'text-gray-400'}`}>mood</span>
                    </div>
                    <span className={`text-lg font-bold ${selected === 'cat' ? 'text-primary' : 'text-gray-400'}`}>Cat</span>
                </button>

                <div className="relative col-span-2">
                    <button
                        onClick={() => {
                            setSelected('other');
                            setShowOtherDropdown(!showOtherDropdown);
                        }}
                        className={`w-full relative p-6 rounded-3xl border-2 flex items-center justify-between transition-all transform active:scale-95 ${selected === 'other' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selected === 'other' ? 'bg-white' : 'bg-white/50'}`}>
                                <span className={`material-symbols-outlined text-4xl ${selected === 'other' ? 'text-primary' : 'text-gray-400'}`}>
                                    {otherPetType ? otherPets.find(p => p.value === otherPetType)?.icon : 'pets'}
                                </span>
                            </div>
                            <span className={`text-lg font-bold ${selected === 'other' ? 'text-primary' : 'text-gray-400'}`}>
                                {otherPetType ? otherPets.find(p => p.value === otherPetType)?.label : 'Other'}
                            </span>
                        </div>
                        <span className={`material-symbols-outlined ${selected === 'other' ? 'text-primary' : 'text-gray-400'}`}>
                            {showOtherDropdown ? 'expand_less' : 'expand_more'}
                        </span>
                        {selected === 'other' && otherPetType && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-xs">check</span>
                            </div>
                        )}
                    </button>

                    {showOtherDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-gray-100 shadow-xl z-10 max-h-64 overflow-y-auto">
                            {otherPets.map((pet) => (
                                <button
                                    key={pet.value}
                                    onClick={() => {
                                        setOtherPetType(pet.value);
                                        setShowOtherDropdown(false);
                                        setSelected('other');
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-b-0"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-gray-600">{pet.icon}</span>
                                    </div>
                                    <span className="text-base font-medium text-gray-700">{pet.label}</span>
                                    {otherPetType === pet.value && (
                                        <span className="material-symbols-outlined text-primary ml-auto">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto space-y-3">
                <button
                    onClick={() => selected ? onNext(getSelectedPetType()) : onAdd()}
                    className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    CONTINUE
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="w-full py-3 bg-primary/5 text-primary font-bold text-sm rounded-2xl transition-transform active:scale-95"
                    >
                        SKIP
                    </button>
                )}
                <div className="w-1/3 h-1.5 bg-gray-200 rounded-full mx-auto mt-2"></div>
            </div>
        </div>
    );
};

export default PetSelection;
