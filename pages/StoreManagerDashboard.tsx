import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StoreManager } from '../types';

interface Props {
    userId: string;
    onLogout: () => void;
    onManageOrders: () => void;
    onManageProducts: () => void;
    onProfileSetup: () => void;
}

const StoreManagerDashboard: React.FC<Props> = ({ userId, onLogout, onManageOrders, onManageProducts, onProfileSetup }) => {
    const [manager, setManager] = useState<StoreManager | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0
    });

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: profile } = await supabase
                .from('store_managers')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (profile) {
                setManager(profile);
                
                // Load stats
                const { data: items } = await supabase
                    .from('order_items')
                    .select('quantity, price, fulfillment_status')
                    .eq('seller_id', userId);

                if (items) {
                    setStats({
                        totalOrders: items.length,
                        pendingOrders: items.filter(i => i.fulfillment_status === 'pending').length,
                        totalEarnings: items.filter(i => i.fulfillment_status === 'delivered').reduce((sum, i) => sum + (i.price * i.quantity), 0)
                    });
                }
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (manager?.approval_status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-yellow-500 text-5xl">pending_actions</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Approval Pending</h1>
                <p className="text-gray-500 mb-8">Your account is currently under review by our administration. We'll notify you once it's approved.</p>
                <button 
                    onClick={onLogout}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                    Logout
                </button>
            </div>
        );
    }

    if (manager?.approval_status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-red-500 text-5xl">cancel</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Application Rejected</h1>
                <p className="text-gray-500 mb-4">{manager.rejection_reason || 'Unfortunately, your application was not approved at this time.'}</p>
                <button 
                    onClick={onLogout}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl overflow-hidden">
            <header className="px-6 py-8 bg-white border-b border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Store Dashboard</p>
                    <h1 className="text-2xl font-black text-gray-900">{manager?.store_name}</h1>
                </div>
                <button onClick={onProfileSetup} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pending Orders</span>
                        <span className="text-3xl font-black text-gray-900">{stats.pendingOrders}</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Total Orders</span>
                        <span className="text-3xl font-black text-gray-900">{stats.totalOrders}</span>
                    </div>
                    <div className="col-span-2 bg-primary p-6 rounded-3xl shadow-lg shadow-primary/20 text-white">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2 block">Your Earnings</span>
                        <span className="text-3xl font-black">₹{stats.totalEarnings.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Management</h2>
                    
                    <button 
                        onClick={onManageOrders}
                        className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all"
                    >
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-black text-gray-900">Manage Orders</h3>
                            <p className="text-xs text-gray-400 font-bold">Process incoming orders</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </button>

                    <button 
                        onClick={onManageProducts}
                        className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-black text-gray-900">Store Products</h3>
                            <p className="text-xs text-gray-400 font-bold">Add and edit products</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </button>
                </div>

                <button 
                    onClick={onLogout}
                    className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-xs hover:text-red-500 transition-colors"
                >
                    Logout Account
                </button>
            </main>
        </div>
    );
};

export default StoreManagerDashboard;
