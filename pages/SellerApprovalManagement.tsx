import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Doctor, GroomingStore, StoreManager } from '../types';

interface Props {
    onBack: () => void;
    adminId: string;
}

type SellerType = 'doctor' | 'grooming_store' | 'store_manager';

interface SellerDetails {
    id: string;
    full_name?: string;
    store_name?: string;
    email: string;
    approval_status?: string;
    approval?: string;
    margin_percentage?: number;
    license_url?: string;
    license_document?: string;
    rejection_reason?: string;
    created_at: string;
}

const SellerApprovalManagement: React.FC<Props> = ({ onBack, adminId }) => {
    const [sellers, setSellers] = useState<SellerDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<SellerType>('store_manager');
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [marginPercentage, setMarginPercentage] = useState<number>(10);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

    useEffect(() => {
        loadSellers();
    }, [type, filter]);

    const loadSellers = async () => {
        try {
            setLoading(true);
            const table = type === 'doctor' ? 'doctors' : 
                          type === 'grooming_store' ? 'grooming_stores' : 
                          'store_managers';
            
            // Determine possible status field names
            let statusField = 'approval_status';
            if (type === 'doctor') {
                statusField = 'approval';
            }

            // Try to fetch with preferred status field
            let { data, error } = await supabase
                .from(table)
                .select('*')
                .eq(statusField, filter)
                .order('created_at', { ascending: false });

            // Fallback: If status field is missing, try the other one
            if (error && error.code === '42703') { // undefined_column
                const otherField = statusField === 'approval' ? 'approval_status' : 'approval';
                console.log(`Fallback: checking for "${otherField}" column in ${table}`);
                const retry = await supabase
                    .from(table)
                    .select('*')
                    .eq(otherField, filter)
                    .order('created_at', { ascending: false });
                data = retry.data;
                error = retry.error;
            }

            if (error) {
                // Table not found (404) or other PGRST error
                if (error.code === 'PGRST116' || error.message?.includes('not found') || error.code === '42P01') {
                    console.warn(`Table ${table} not found or inaccessible. Skipping.`);
                    setSellers([]);
                    return;
                }
                throw error;
            }
            setSellers(data || []);
        } catch (error: any) {
            console.error('Error loading sellers:', error);
            setSellers([]);
        } finally {
            setLoading(false);
        }
    };

    const uploadLicense = async (file: File, sellerId: string): Promise<string | null> => {
        try {
            const timestamp = Date.now();
            const fileName = `${type}/${sellerId}/${timestamp}-${file.name}`;

            const { data, error } = await supabase.storage
                .from('seller-documents')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: publicUrl } = supabase.storage
                .from('seller-documents')
                .getPublicUrl(fileName);

            return publicUrl.publicUrl;
        } catch (error) {
            console.error('Error uploading license:', error);
            return null;
        }
    };

    const updateStatus = async (id: string, newStatus: string, reason?: string) => {
        try {
            const table = type === 'doctor' ? 'doctors' :
                          type === 'grooming_store' ? 'grooming_stores' :
                          'store_managers';

            // Check for correct status field name
            let statusField = 'approval_status';
            if (type === 'doctor') {
                statusField = 'approval';
            }

            // Validate which field exists
            const { error: checkError } = await supabase
                .from(table)
                .select(statusField)
                .eq('id', id)
                .single();

            if (checkError && checkError.code === '42703') {
                statusField = statusField === 'approval' ? 'approval_status' : 'approval';
            }

            const updates: any = {
                [statusField]: newStatus,
                is_active: newStatus === 'approved',
                updated_at: new Date().toISOString()
            };

            if (reason) updates.rejection_reason = reason;

            // Add margin percentage for sellers
            if (newStatus === 'approved' && marginPercentage) {
                updates.margin_percentage = marginPercentage;
            }

            const { error } = await supabase
                .from(table)
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // If approving a grooming store or doctor, and they want to sell products,
            // we could also ensure they have a store_manager record if that's what's needed.
            // But for now, just updating the main table.

            setShowApprovalModal(false);
            setShowEditModal(false);
            setSelectedSeller(null);
            setMarginPercentage(10);
            setLicenseFile(null);
            loadSellers();
            alert(`Seller ${newStatus} successfully`);
        } catch (error) {
            console.error('Error updating seller:', error);
            alert('Failed to update seller status');
        }
    };

    const updateMargin = async (id: string, newMargin: number) => {
        try {
            const table = type === 'doctor' ? 'doctors' :
                          type === 'grooming_store' ? 'grooming_stores' :
                          'store_managers';

            const { error } = await supabase
                .from(table)
                .update({
                    margin_percentage: newMargin,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setShowEditModal(false);
            setSelectedSeller(null);
            loadSellers();
            alert('Margin updated successfully');
        } catch (error) {
            console.error('Error updating margin:', error);
            alert('Failed to update margin');
        }
    };

    const revokeSeller = async (id: string) => {
        try {
            const table = type === 'doctor' ? 'doctors' :
                          type === 'grooming_store' ? 'grooming_stores' :
                          'store_managers';

            // Check for correct status field name
            let statusField = 'approval_status';
            if (type === 'doctor') {
                statusField = 'approval';
            }

            const { error } = await supabase
                .from(table)
                .update({
                    [statusField]: 'revoked',
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setShowRevokeConfirm(false);
            setSelectedSeller(null);
            loadSellers();
            alert('Seller access revoked successfully');
        } catch (error) {
            console.error('Error revoking seller:', error);
            alert('Failed to revoke seller access');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto shadow-xl overflow-hidden font-sans">
            <header className="px-6 py-5 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="size-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-900 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Seller Approvals</h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Review & Verify Partners</p>
                    </div>
                </div>
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
            </header>

            <div className="bg-white px-4 py-3 border-b border-slate-100">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['store_manager', 'grooming_store', 'doctor'] as SellerType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setType(t); setFilter('pending'); }}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                type === t 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white">
                {['pending', 'approved', 'rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
                            filter === f 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-primary"></div>
                        <p className="text-slate-400 text-xs font-bold mt-4 animate-pulse">LOADING SELLERS...</p>
                    </div>
                ) : sellers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                        <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
                        </div>
                        <h3 className="text-slate-900 font-bold">No {filter} sellers found</h3>
                        <p className="text-slate-400 text-xs mt-1">There are no {type.replace('_', ' ')}s in this category yet.</p>
                    </div>
                ) : (
                    sellers.map((seller) => (
                        <div key={seller.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-primary transition-colors">
                                        {seller.store_name || seller.full_name || 'Unnamed Seller'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                                        <p className="text-[11px] text-slate-500 truncate">{seller.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-primary/10">
                                        {seller.margin_percentage ? `${seller.margin_percentage}% Margin` : 'No Margin'}
                                    </span>
                                    <span className="text-[9px] text-slate-300 font-medium">
                                        {new Date(seller.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {seller.license_url && (
                                <div className="mb-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">description</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-700 leading-none">Business License</p>
                                            <p className="text-[9px] text-slate-400 mt-1">Verification Document</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={seller.license_url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary border border-slate-200 hover:border-primary transition-all active:scale-95 shadow-sm"
                                    >
                                        VIEW FILE
                                    </a>
                                </div>
                            )}

                            {seller.rejection_reason && (
                                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="material-symbols-outlined text-[14px] text-red-500">error</span>
                                        <p className="text-[10px] font-bold text-red-600 uppercase">Rejection Reason</p>
                                    </div>
                                    <p className="text-xs text-red-500 font-medium ml-5">{seller.rejection_reason}</p>
                                </div>
                            )}

                            {filter === 'pending' && (
                                <button
                                    onClick={() => {
                                        setSelectedSeller(seller);
                                        setMarginPercentage(seller.margin_percentage || 10);
                                        setShowApprovalModal(true);
                                    }}
                                    className="w-full bg-slate-900 text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                >
                                    Review & Approve Seller
                                </button>
                            )}

                            {filter === 'approved' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedSeller(seller);
                                            setMarginPercentage(seller.margin_percentage || 10);
                                            setShowEditModal(true);
                                        }}
                                        className="flex-1 bg-primary text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit Margin
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSeller(seller);
                                            setShowRevokeConfirm(true);
                                        }}
                                        className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">block</span>
                                        Revoke
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            {showApprovalModal && selectedSeller && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
                    <div className="w-full bg-white rounded-t-[32px] p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">Verification</h2>
                                <p className="text-xs text-slate-400 font-medium">Complete seller onboarding</p>
                            </div>
                            <button 
                                onClick={() => setShowApprovalModal(false)}
                                className="size-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">storefront</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate">
                                    {selectedSeller.store_name || selectedSeller.full_name}
                                </h3>
                                <p className="text-xs text-slate-400 truncate">{selectedSeller.email}</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {(type === 'store_manager' || type === 'grooming_store' || type === 'doctor') && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Margin Fee (%)</label>
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                                {marginPercentage}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={marginPercentage}
                                            onChange={(e) => setMarginPercentage(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                                            <span>0%</span>
                                            <span>Platform Fee Deduction</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">Proof of License</label>
                                        <label className="w-full flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-blue-50/20 cursor-pointer transition-all">
                                            <input 
                                                type="file" 
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <div className={`size-12 rounded-full flex items-center justify-center mb-2 transition-all ${licenseFile ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                                <span className="material-symbols-outlined">
                                                    {licenseFile ? 'check_circle' : 'cloud_upload'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">
                                                {licenseFile ? licenseFile.name : 'Upload license document'}
                                            </span>
                                            {!licenseFile && <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG or DOC (max 5MB)</span>}
                                        </label>
                                    </div>

                                    {type === 'grooming_store' && (
                                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-[18px] text-orange-500">info</span>
                                                <p className="text-[11px] font-bold text-orange-700 uppercase">Product Seller Access</p>
                                            </div>
                                            <p className="text-[10px] text-orange-600 leading-relaxed font-medium">
                                                By approving this grooming store as a seller, they will also gain access to Store & Order Management to sell products.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={async () => {
                                        if (!selectedSeller) return;
                                        setUploading(true);
                                        
                                        let licenseUrl = selectedSeller.license_url;
                                        if (licenseFile) {
                                            licenseUrl = await uploadLicense(licenseFile, selectedSeller.id) || licenseUrl;
                                        }
                                        
                                        await updateStatus(selectedSeller.id, 'approved');
                                        setUploading(false);
                                    }}
                                    disabled={uploading}
                                    className="w-full bg-primary text-white py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/20"
                                >
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        'Approve & Verify'
                                    )}
                                </button>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => {
                                            const reason = prompt('Reason for rejection?');
                                            if (reason && selectedSeller) {
                                                updateStatus(selectedSeller.id, 'rejected', reason);
                                            }
                                        }}
                                        className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all active:scale-[0.98]"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => setShowApprovalModal(false)}
                                        className="flex-1 bg-slate-100 text-slate-500 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Margin Modal */}
            {showEditModal && selectedSeller && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
                    <div className="w-full bg-white rounded-t-[32px] p-8 space-y-6 max-h-[70vh] overflow-y-auto animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">Edit Seller</h2>
                                <p className="text-xs text-slate-400 font-medium">Manage margin and settings</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="size-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">storefront</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate">
                                    {selectedSeller.store_name || selectedSeller.full_name}
                                </h3>
                                <p className="text-xs text-slate-400 truncate">{selectedSeller.email}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">Active</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Platform Margin (%)</label>
                                    <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                        {marginPercentage}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={marginPercentage}
                                    onChange={(e) => setMarginPercentage(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                                    <span>0%</span>
                                    <span>Platform Fee Deduction</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-[18px] text-blue-500">info</span>
                                    <p className="text-[11px] font-bold text-blue-700 uppercase">Seller Access Note</p>
                                </div>
                                <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                                    {type === 'store_manager'
                                        ? 'This seller has access to Shop & Order Management only.'
                                        : type === 'grooming_store'
                                        ? 'This grooming store can continue operating their grooming dashboard. Shop access is for product selling only.'
                                        : 'This doctor can continue operating their doctor dashboard. Shop access is for product selling only.'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => updateMargin(selectedSeller.id, marginPercentage)}
                                    className="w-full bg-primary text-white py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal */}
            {showRevokeConfirm && selectedSeller && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-6 animate-slide-up shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl">warning</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Revoke Seller Access?</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                This will revoke <strong>{selectedSeller.store_name || selectedSeller.full_name}</strong>'s access to Shop & Order Management.
                            </p>
                            {(type === 'grooming_store' || type === 'doctor') && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-xl mt-3">
                                    Their {type === 'grooming_store' ? 'grooming store' : 'doctor'} dashboard will remain active.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRevokeConfirm(false);
                                    setSelectedSeller(null);
                                }}
                                className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => revokeSeller(selectedSeller.id)}
                                className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all active:scale-[0.98]"
                            >
                                Revoke Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerApprovalManagement;
