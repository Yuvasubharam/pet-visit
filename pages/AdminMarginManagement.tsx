import React, { useState, useEffect } from 'react';
import { adminSettingsService } from '../services/adminApi';

interface Props {
    onBack: () => void;
}

interface Setting {
    id: string;
    setting_key: string;
    setting_value: any;
    description: string;
}

const AdminMarginManagement: React.FC<Props> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Setting[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // First initialize defaults to make sure we have the keys we need
            await adminSettingsService.initializeDefaults();
            const data = await adminSettingsService.getAllSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateValue = async (key: string, newValue: string) => {
        const floatValue = parseFloat(newValue);
        if (isNaN(floatValue)) return;

        setUpdating(key);
        try {
            await adminSettingsService.updateSetting(key, floatValue);
            await loadSettings();
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Failed to update setting');
        } finally {
            setUpdating(null);
        }
    };

    const getDisplayName = (key: string) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl overflow-hidden">
            <header className="px-6 py-4 flex items-center gap-4 bg-white border-b border-gray-100 sticky top-0 z-30">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Margin Management</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fees & Commissions</p>
                </div>
            </header>

            <div className="p-4 space-y-6 overflow-y-auto no-scrollbar pb-24">
                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-bold leading-relaxed">
                        Manage platform fees collected from users and shop product margins. 
                        Fees should be entered as decimals (e.g., 0.05 for 5%).
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {settings.map((setting) => (
                            <div key={setting.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900">{getDisplayName(setting.setting_key)}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{setting.description}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            defaultValue={setting.setting_value?.value ?? setting.setting_value}
                                            onBlur={(e) => handleUpdateValue(setting.setting_key, e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-black focus:ring-primary focus:ring-2 shadow-inner"
                                            disabled={updating === setting.setting_key}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                                            {Math.round((setting.setting_value?.value ?? setting.setting_value) * 100)}%
                                        </div>
                                    </div>
                                    {updating === setting.setting_key && (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMarginManagement;
