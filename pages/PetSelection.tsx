
import React, { useState } from 'react';

interface Props {
    onNext: () => void;
    onAdd: () => void;
}

const PetSelection: React.FC<Props> = ({ onNext, onAdd }) => {
    const [selected, setSelected] = useState<'dog' | 'cat' | null>('dog');

    return (
        <div className="flex-1 flex flex-col bg-white p-8 fade-in">
            <div className="flex justify-center space-x-2 mt-4 mb-10">
                <div className="h-1.5 w-12 bg-primary rounded-full"></div>
                <div className="h-1.5 w-12 bg-gray-100 rounded-full"></div>
                <div className="h-1.5 w-12 bg-gray-100 rounded-full"></div>
            </div>

            <div className="space-y-2 mb-10">
                <p className="text-gray-400 text-lg font-medium">Welcome Ajay Kanna,</p>
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

                <button
                    onClick={() => setSelected('bunny')}
                    className={`relative p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all transform active:scale-95 ${selected === 'bunny' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 bg-gray-50'}`}
                >
                    {selected === 'bunny' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selected === 'bunny' ? 'bg-white' : 'bg-white/50'}`}>
                        <span className={`material-symbols-outlined text-4xl ${selected === 'bunny' ? 'text-primary' : 'text-gray-400'}`}>cruelty_free</span>
                    </div>
                    <span className={`text-lg font-bold ${selected === 'bunny' ? 'text-primary' : 'text-gray-400'}`}>Bunny</span>
                </button>

                <button
                    onClick={() => setSelected('hamster')}
                    className={`relative p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all transform active:scale-95 ${selected === 'hamster' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 bg-gray-50'}`}
                >
                    {selected === 'hamster' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${selected === 'hamster' ? 'bg-white' : 'bg-white/50'}`}>
                        <span className={`material-symbols-outlined text-4xl ${selected === 'hamster' ? 'text-primary' : 'text-gray-400'}`}>interests</span>
                    </div>
                    <span className={`text-lg font-bold ${selected === 'hamster' ? 'text-primary' : 'text-gray-400'}`}>Hamster</span>
                </button>
            </div>

            <div className="mt-auto">
                <button
                    onClick={selected ? onNext : onAdd}
                    className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    CONTINUE
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <div className="w-1/3 h-1.5 bg-gray-200 rounded-full mx-auto mt-6"></div>
            </div>
        </div>
    );
};

export default PetSelection;
