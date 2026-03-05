import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { adminSettingsService } from '../services/adminApi';

interface Props {
    onBack: () => void;
}

type SettlementType = 'all' | 'grooming' | 'doctor' | 'shop' | 'settings';

interface PlatformSettings {
    online_consultation_platform_fee: number;
    home_visit_platform_fee: number;
    clinic_visit_platform_fee: number;
    grooming_platform_fee: number;
    shop_margin_percentage: number;
}

interface GroomingStore {
    id: string;
    store_name: string;
    platform_fee_percentage: number;
    is_active: boolean;
}

interface Doctor {
    id: string;
    full_name: string;
    email: string;
    platform_fee_online: number;
    platform_fee_home: number;
    platform_fee_clinic: number;
    is_active: boolean;
}

const AdminSettlementManagement: React.FC<Props> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SettlementType>('all');
    const [earnings, setEarnings] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalPlatformFees: 0,
        totalDeliveryFees: 0,
        totalMargins: 0,
        pendingSettlements: 0
    });
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
        online_consultation_platform_fee: 5,
        home_visit_platform_fee: 5,
        clinic_visit_platform_fee: 5,
        grooming_platform_fee: 5,
        shop_margin_percentage: 15,
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [groomingStores, setGroomingStores] = useState<GroomingStore[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingStores, setLoadingStores] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
    const [storeSearchQuery, setStoreSearchQuery] = useState('');
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

    useEffect(() => {
        if (activeTab === 'settings') {
            loadPlatformSettings();
            loadGroomingStores();
            loadDoctors();
        } else {
            loadSettlementData();
        }
    }, [activeTab]);

    const loadGroomingStores = async () => {
        setLoadingStores(true);
        try {
            // First try with all columns
            const { data, error } = await supabase
                .from('grooming_stores')
                .select('id, store_name, platform_fee_percentage, is_active, margin_percentage')
                .order('store_name', { nullsFirst: false });

            if (error) {
                console.error('Error loading grooming stores with full columns:', error);
                // Try with basic columns only (columns might not exist yet)
                const { data: basicData, error: basicError } = await supabase
                    .from('grooming_stores')
                    .select('id, store_name, is_active');

                if (basicError) {
                    console.error('Error loading grooming stores basic:', basicError);
                    setGroomingStores([]);
                    return;
                }

                // Map basic data with default values for missing columns
                const mappedData = (basicData || []).map(store => ({
                    ...store,
                    platform_fee_percentage: 0,
                    margin_percentage: 0
                }));
                setGroomingStores(mappedData);
                return;
            }

            // Map data with default values for null fields
            const mappedData = (data || []).map(store => ({
                ...store,
                platform_fee_percentage: store.platform_fee_percentage ?? 0,
                margin_percentage: store.margin_percentage ?? 0
            }));
            setGroomingStores(mappedData);
        } catch (error) {
            console.error('Error loading grooming stores:', error);
            setGroomingStores([]);
        } finally {
            setLoadingStores(false);
        }
    };

    const loadDoctors = async () => {
        setLoadingDoctors(true);
        try {
            // First try with all columns
            const { data, error } = await supabase
                .from('doctors')
                .select('id, full_name, email, platform_fee_online, platform_fee_home, platform_fee_clinic, is_active, margin_percentage')
                .order('full_name', { nullsFirst: false });

            if (error) {
                console.error('Error loading doctors with full columns:', error);
                // Try with basic columns only (columns might not exist yet)
                const { data: basicData, error: basicError } = await supabase
                    .from('doctors')
                    .select('id, full_name, email, is_active');

                if (basicError) {
                    console.error('Error loading doctors basic:', basicError);
                    setDoctors([]);
                    return;
                }

                // Map basic data with default values for missing columns
                const mappedData = (basicData || []).map(doc => ({
                    ...doc,
                    platform_fee_online: 0,
                    platform_fee_home: 0,
                    platform_fee_clinic: 0,
                    margin_percentage: 0
                }));
                setDoctors(mappedData);
                return;
            }

            // Map data with default values for null fields
            const mappedData = (data || []).map(doc => ({
                ...doc,
                platform_fee_online: doc.platform_fee_online ?? 0,
                platform_fee_home: doc.platform_fee_home ?? 0,
                platform_fee_clinic: doc.platform_fee_clinic ?? 0,
                margin_percentage: doc.margin_percentage ?? 0
            }));
            setDoctors(mappedData);
        } catch (error) {
            console.error('Error loading doctors:', error);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const updateGroomingStoreFee = async (storeId: string, fee: number) => {
        try {
            const { error } = await supabase
                .from('grooming_stores')
                .update({
                    platform_fee_percentage: fee,
                    updated_at: new Date().toISOString()
                })
                .eq('id', storeId);

            if (error) throw error;

            setGroomingStores(prev => prev.map(store =>
                store.id === storeId ? { ...store, platform_fee_percentage: fee } : store
            ));
            setEditingStoreId(null);
        } catch (error) {
            console.error('Error updating grooming store fee:', error);
            alert('Failed to update fee');
        }
    };

    const updateDoctorFees = async (doctorId: string, fees: { online?: number; home?: number; clinic?: number }) => {
        try {
            const updateData: any = { updated_at: new Date().toISOString() };
            if (fees.online !== undefined) updateData.platform_fee_online = fees.online;
            if (fees.home !== undefined) updateData.platform_fee_home = fees.home;
            if (fees.clinic !== undefined) updateData.platform_fee_clinic = fees.clinic;

            const { error } = await supabase
                .from('doctors')
                .update(updateData)
                .eq('id', doctorId);

            if (error) throw error;

            setDoctors(prev => prev.map(doc =>
                doc.id === doctorId ? { ...doc, ...fees } : doc
            ));
            setEditingDoctorId(null);
        } catch (error) {
            console.error('Error updating doctor fees:', error);
            alert('Failed to update fees');
        }
    };

    const loadPlatformSettings = async () => {
        setLoading(true);
        try {
            const [online, home, clinic, grooming, shop] = await Promise.all([
                adminSettingsService.getSetting('online_consultation_platform_fee'),
                adminSettingsService.getSetting('home_visit_platform_fee'),
                adminSettingsService.getSetting('clinic_visit_platform_fee'),
                adminSettingsService.getSetting('grooming_platform_fee'),
                adminSettingsService.getSetting('shop_margin_percentage'),
            ]);

            setPlatformSettings({
                online_consultation_platform_fee: (online ?? 0.05) * 100,
                home_visit_platform_fee: (home ?? 0.05) * 100,
                clinic_visit_platform_fee: (clinic ?? 0.05) * 100,
                grooming_platform_fee: (grooming ?? 0.05) * 100,
                shop_margin_percentage: (shop ?? 0.15) * 100,
            });
        } catch (error) {
            console.error('Error loading platform settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePlatformSettings = async () => {
        setSavingSettings(true);
        try {
            await Promise.all([
                adminSettingsService.updateSetting('online_consultation_platform_fee', platformSettings.online_consultation_platform_fee / 100, 'Platform fee for Online Consultations (decimal)'),
                adminSettingsService.updateSetting('home_visit_platform_fee', platformSettings.home_visit_platform_fee / 100, 'Platform fee for Home Visits (decimal)'),
                adminSettingsService.updateSetting('clinic_visit_platform_fee', platformSettings.clinic_visit_platform_fee / 100, 'Platform fee for Clinic Visits (decimal)'),
                adminSettingsService.updateSetting('grooming_platform_fee', platformSettings.grooming_platform_fee / 100, 'Platform fee for Grooming Services (decimal)'),
                adminSettingsService.updateSetting('shop_margin_percentage', platformSettings.shop_margin_percentage / 100, 'Default margin for shop products (decimal)'),
            ]);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const loadSettlementData = async () => {
        setLoading(true);
        try {
            let allData: any[] = [];
            
            // 1. Load Doctor Earnings
            if (activeTab === 'all' || activeTab === 'doctor') {
                const { data: docData } = await supabase
                    .from('doctor_earnings')
                    .select('*, doctors!fk_doctor_earnings_doctor(full_name), bookings!fk_doctor_earnings_booking(booking_type, payment_status, total_amount, platform_fee)')
                    .order('created_at', { ascending: false });

                if (docData) {
                    allData = [...allData, ...docData.map(d => ({
                        id: d.id,
                        type: 'doctor',
                        provider: d.doctors?.full_name,
                        amount: d.amount || d.bookings?.total_amount || d.gross_amount,
                        platformFee: d.platform_fee || d.bookings?.platform_fee || d.platform_commission || 0,
                        netAmount: d.net_amount,
                        paymentStatus: d.bookings?.payment_status,
                        settlementStatus: d.status,
                        createdAt: d.created_at,
                        reference: `Booking #${d.booking_id?.slice(-6) || 'N/A'}`
                    }))];
                }
            }

            // 2. Load Grooming Earnings
            if (activeTab === 'all' || activeTab === 'grooming') {
                const { data: groomData } = await supabase
                    .from('grooming_store_earnings')
                    .select('*, grooming_stores!grooming_store_earnings_store_id_fkey(store_name), bookings!grooming_store_earnings_booking_id_fkey(payment_status, total_amount, platform_fee)')
                    .order('created_at', { ascending: false });
                
                if (groomData) {
                    allData = [...allData, ...groomData.map(g => ({
                        id: g.id,
                        type: 'grooming',
                        provider: g.grooming_stores?.store_name,
                        amount: g.package_amount || g.bookings?.total_amount,
                        platformFee: g.platform_commission || g.bookings?.platform_fee || 0,
                        netAmount: g.net_amount,
                        paymentStatus: g.bookings?.payment_status,
                        settlementStatus: g.status,
                        createdAt: g.created_at,
                        reference: `Booking #${g.booking_id?.slice(-6) || 'N/A'}`
                    }))];
                }
            }

            // 3. Load Shop Orders (Margins & Delivery)
            if (activeTab === 'all' || activeTab === 'shop') {
                const { data: shopData } = await supabase
                    .from('orders')
                    .select('*, order_items(*, shop_products(name))')
                    .order('created_at', { ascending: false });
                
                if (shopData) {
                    allData = [...allData, ...shopData.map(o => {
                        const margin = o.order_items?.reduce((sum: number, item: any) => sum + (item.admin_margin_amount || 0), 0) || 0;
                        const deliveryFee = o.delivery_fee || 0;
                        return {
                            id: o.id,
                            type: 'shop',
                            provider: 'Admin Shop',
                            amount: o.total,
                            platformFee: margin,
                            deliveryFee: deliveryFee,
                            netAmount: o.total - margin - deliveryFee,
                            paymentStatus: o.payment_status,
                            settlementStatus: o.settlement_status || (o.status === 'delivered' ? 'pending' : 'pending'),
                            createdAt: o.created_at,
                            reference: `Order #${o.order_number?.slice(-6) || 'N/A'}`
                        };
                    })];
                }
            }

            setEarnings(allData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

            // Calculate stats
            const totals = allData.reduce((acc, curr) => {
                if (curr.type === 'shop') {
                    acc.totalMargins += curr.platformFee;
                    acc.totalDeliveryFees += curr.deliveryFee;
                } else {
                    acc.totalPlatformFees += curr.platformFee;
                }
                if (curr.settlementStatus === 'pending') acc.pendingSettlements++;
                return acc;
            }, { totalPlatformFees: 0, totalDeliveryFees: 0, totalMargins: 0, pendingSettlements: 0 });
            
            setStats(totals);
        } catch (error) {
            console.error('Error loading settlement data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = async (item: any) => {
        try {
            const table = item.type === 'doctor' ? 'doctor_earnings' : 
                          item.type === 'grooming' ? 'grooming_store_earnings' :
                          item.type === 'shop' ? 'orders' : null;
            
            if (!table) return;

            const updateData: any = item.type === 'shop' 
                ? { settlement_status: 'completed', settled_at: new Date().toISOString() }
                : { status: 'paid', paid_at: new Date().toISOString() };

            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', item.id);

            if (error) throw error;
            loadSettlementData();
        } catch (error) {
            console.error('Error settling payment:', error);
            alert('Failed to settle payment');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl overflow-hidden">
            <header className="px-6 py-4 flex items-center gap-4 bg-white border-b border-gray-100 sticky top-0 z-30">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Settlements</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue & Payments</p>
                </div>
            </header>

            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar pb-24">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Platform Fees</p>
                        <p className="text-xl font-black text-primary">₹{stats.totalPlatformFees.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Margins</p>
                        <p className="text-xl font-black text-green-600">₹{stats.totalMargins.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Fees</p>
                        <p className="text-xl font-black text-blue-600">₹{stats.totalDeliveryFees.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Payouts</p>
                        <p className="text-xl font-black text-orange-600">{stats.pendingSettlements}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {['all', 'grooming', 'doctor', 'shop', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as SettlementType)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1 ${
                                activeTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'
                            }`}
                        >
                            {tab === 'settings' && <span className="material-symbols-outlined text-sm">settings</span>}
                            {tab === 'settings' ? 'Margins' : tab}
                        </button>
                    ))}
                </div>

                {/* Settings Section */}
                {activeTab === 'settings' ? (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                {/* Doctor/Consultation Fees Section */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">medical_services</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900">Doctor Consultation Fees</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fee deducted from doctor earnings</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-600">Online Consultation Fee</label>
                                                <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{platformSettings.online_consultation_platform_fee}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={platformSettings.online_consultation_platform_fee}
                                                onChange={(e) => setPlatformSettings({ ...platformSettings, online_consultation_platform_fee: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-600">Home Visit Fee</label>
                                                <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{platformSettings.home_visit_platform_fee}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={platformSettings.home_visit_platform_fee}
                                                onChange={(e) => setPlatformSettings({ ...platformSettings, home_visit_platform_fee: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-600">Clinic Visit Fee</label>
                                                <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{platformSettings.clinic_visit_platform_fee}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={platformSettings.clinic_visit_platform_fee}
                                                onChange={(e) => setPlatformSettings({ ...platformSettings, clinic_visit_platform_fee: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Grooming Fees Section */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">content_cut</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900">Grooming Service Fee</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fee deducted from grooming store earnings</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-600">Grooming Platform Fee</label>
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{platformSettings.grooming_platform_fee}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            value={platformSettings.grooming_platform_fee}
                                            onChange={(e) => setPlatformSettings({ ...platformSettings, grooming_platform_fee: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* Shop Margin Section */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">shopping_bag</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900">Shop Product Margin</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Default margin on product orders</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-600">Default Product Margin</label>
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{platformSettings.shop_margin_percentage}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={platformSettings.shop_margin_percentage}
                                            onChange={(e) => setPlatformSettings({ ...platformSettings, shop_margin_percentage: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                                            <p className="text-[10px] font-bold text-amber-700 uppercase">Note</p>
                                        </div>
                                        <p className="text-[10px] text-amber-600 leading-relaxed">
                                            This is the default margin for new sellers. Individual seller margins can be set in Seller Approvals.
                                        </p>
                                    </div>
                                </div>

                                {/* Individual Grooming Store Fee Management */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined">storefront</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900">Grooming Store Fees</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Individual store platform fees</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                            {groomingStores.length} stores
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search grooming stores..."
                                            value={storeSearchQuery}
                                            onChange={(e) => setStoreSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    {loadingStores ? (
                                        <div className="flex justify-center py-6">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <div className="max-h-64 overflow-y-auto space-y-2">
                                            {groomingStores
                                                .filter(store => store.store_name?.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                                                .map((store) => (
                                                    <div key={store.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{store.store_name}</span>
                                                            </div>
                                                            {editingStoreId === store.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        defaultValue={store.platform_fee_percentage || 0}
                                                                        className="w-16 px-2 py-1 border rounded-lg text-sm text-center"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                updateGroomingStoreFee(store.id, Number((e.target as HTMLInputElement).value));
                                                                            }
                                                                        }}
                                                                        autoFocus
                                                                    />
                                                                    <span className="text-xs text-gray-500">%</span>
                                                                    <button
                                                                        onClick={() => setEditingStoreId(null)}
                                                                        className="text-gray-400 hover:text-gray-600"
                                                                    >
                                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setEditingStoreId(store.id)}
                                                                    className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                                                >
                                                                    <span className="text-sm font-black text-primary">{store.platform_fee_percentage || 0}%</span>
                                                                    <span className="material-symbols-outlined text-gray-400 text-sm">edit</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            {groomingStores.filter(store => store.store_name?.toLowerCase().includes(storeSearchQuery.toLowerCase())).length === 0 && (
                                                <p className="text-center text-gray-400 text-sm py-4">No grooming stores found</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Individual Doctor Fee Management */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900">Doctor Consultation Fees</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Individual doctor platform fees</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                            {doctors.length} doctors
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search doctors..."
                                            value={doctorSearchQuery}
                                            onChange={(e) => setDoctorSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    {loadingDoctors ? (
                                        <div className="flex justify-center py-6">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <div className="max-h-80 overflow-y-auto space-y-3">
                                            {doctors
                                                .filter(doc => (doc.full_name || doc.email)?.toLowerCase().includes(doctorSearchQuery.toLowerCase()))
                                                .map((doctor) => (
                                                    <div key={doctor.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${doctor.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                <span className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                                                    {doctor.full_name || doctor.email}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => setEditingDoctorId(editingDoctorId === doctor.id ? null : doctor.id)}
                                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">{editingDoctorId === doctor.id ? 'close' : 'edit'}</span>
                                                                {editingDoctorId === doctor.id ? 'Cancel' : 'Edit'}
                                                            </button>
                                                        </div>

                                                        {editingDoctorId === doctor.id ? (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Online</label>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                defaultValue={doctor.platform_fee_online || 0}
                                                                                className="w-full px-2 py-1.5 border rounded-lg text-sm text-center"
                                                                                id={`doc-online-${doctor.id}`}
                                                                            />
                                                                            <span className="text-xs text-gray-400">%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Home</label>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                defaultValue={doctor.platform_fee_home || 0}
                                                                                className="w-full px-2 py-1.5 border rounded-lg text-sm text-center"
                                                                                id={`doc-home-${doctor.id}`}
                                                                            />
                                                                            <span className="text-xs text-gray-400">%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Clinic</label>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                defaultValue={doctor.platform_fee_clinic || 0}
                                                                                className="w-full px-2 py-1.5 border rounded-lg text-sm text-center"
                                                                                id={`doc-clinic-${doctor.id}`}
                                                                            />
                                                                            <span className="text-xs text-gray-400">%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const online = Number((document.getElementById(`doc-online-${doctor.id}`) as HTMLInputElement)?.value || 0);
                                                                        const home = Number((document.getElementById(`doc-home-${doctor.id}`) as HTMLInputElement)?.value || 0);
                                                                        const clinic = Number((document.getElementById(`doc-clinic-${doctor.id}`) as HTMLInputElement)?.value || 0);
                                                                        updateDoctorFees(doctor.id, {
                                                                            online: online,
                                                                            home: home,
                                                                            clinic: clinic
                                                                        });
                                                                    }}
                                                                    className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                                                                >
                                                                    Save Changes
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="text-center p-2 bg-white rounded-lg">
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Online</p>
                                                                    <p className="text-sm font-black text-primary">{doctor.platform_fee_online || 0}%</p>
                                                                </div>
                                                                <div className="text-center p-2 bg-white rounded-lg">
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Home</p>
                                                                    <p className="text-sm font-black text-primary">{doctor.platform_fee_home || 0}%</p>
                                                                </div>
                                                                <div className="text-center p-2 bg-white rounded-lg">
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Clinic</p>
                                                                    <p className="text-sm font-black text-primary">{doctor.platform_fee_clinic || 0}%</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            {doctors.filter(doc => (doc.full_name || doc.email)?.toLowerCase().includes(doctorSearchQuery.toLowerCase())).length === 0 && (
                                                <p className="text-center text-gray-400 text-sm py-4">No doctors found</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-blue-600">info</span>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 mb-1">Fee Collection Policy</p>
                                            <p className="text-[10px] text-blue-600 leading-relaxed">
                                                Platform fees are collected from service providers (doctors, grooming stores, sellers) and deducted from their earnings.
                                                Users only pay the service/product price without any additional platform charges.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={savePlatformSettings}
                                    disabled={savingSettings}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {savingSettings ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">save</span>
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    /* Transactions List */
                    <div className="space-y-3">
                        {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : earnings.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-gray-200">payments</span>
                            <p className="text-gray-500 mt-2 font-bold">No transactions found</p>
                        </div>
                    ) : (
                        earnings.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                            item.type === 'doctor' ? 'bg-purple-50 text-purple-600' :
                                            item.type === 'grooming' ? 'bg-blue-50 text-blue-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                            <span className="material-symbols-outlined">
                                                {item.type === 'doctor' ? 'medical_services' : 
                                                 item.type === 'grooming' ? 'content_cut' : 'shopping_bag'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.reference}</p>
                                            <h3 className="text-sm font-black text-gray-900">{item.provider}</h3>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                        item.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                        {item.paymentStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                                        <p className="text-xs font-black">₹{item.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Admin {item.type === 'shop' ? 'Margin' : 'Fee'}</p>
                                        <p className="text-xs font-black text-primary">₹{item.platformFee}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Payout</p>
                                        <p className="text-xs font-black text-green-600">₹{item.netAmount}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-gray-400 font-bold">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                    {item.settlementStatus === 'pending' || item.settlementStatus === 'Unsettled' ? (
                                        <button 
                                            onClick={() => handleSettle(item)}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                        >
                                            Mark Settled
                                        </button>
                                    ) : (
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            item.settlementStatus === 'paid' || item.settlementStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                            {item.settlementStatus === 'paid' || item.settlementStatus === 'completed' ? 'Settled' : 'Unsettled'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettlementManagement;
