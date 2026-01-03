
import React, { useState, useEffect } from 'react';
import { Address } from '../types';
import { addressService } from '../services/api';
import AddressForm from '../components/AddressForm';

interface Props {
  onBack: () => void;
  onDone: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  userId?: string | null;
}

const Addresses: React.FC<Props> = ({ onBack, onDone, onHomeClick, onVisitsClick, onShopClick, userId }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadAddresses();
    }
  }, [userId]);

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await addressService.getUserAddresses(userId);
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async (address: Address) => {
    if (!userId) return;

    try {
      if (editingAddress?.id) {
        // Update existing address
        await addressService.updateAddress(editingAddress.id, address);
      } else {
        // Add new address
        await addressService.addAddress(userId, address);
      }

      await loadAddresses();
      setShowAddressForm(false);
      setEditingAddress(undefined);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await addressService.deleteAddress(addressId);
      await loadAddresses();
      setAddressToDelete(null);
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Home':
        return 'home';
      case 'Office':
        return 'work';
      default:
        return 'location_on';
    }
  };

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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {addresses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[#111418] text-lg font-bold leading-tight px-1">Saved Addresses</h3>

                  {addresses.map((address, index) => (
                    <div
                      key={address.id}
                      className={`flex flex-col bg-white rounded-2xl p-4 shadow-sm ${
                        index === 0 ? 'ring-1 ring-primary/20' : 'ring-1 ring-black/5'
                      } relative overflow-hidden group hover:shadow-md transition-shadow`}
                    >
                      {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                      <div className="flex items-start gap-4">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          index === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                        } group-hover:bg-primary/5 group-hover:text-primary transition-colors`}>
                          <span className="material-symbols-outlined" style={{fontVariationSettings: index === 0 ? "'FILL' 1" : "'FILL' 0"}}>
                            {getIconForType(address.type)}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                          <div className="flex justify-between items-center">
                            <p className="text-[#111418] font-bold text-base">{address.type}</p>
                            {index === 0 && (
                              <span className="text-primary text-[10px] uppercase font-bold bg-primary/10 px-2 py-0.5 rounded-md tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm leading-relaxed mt-1">
                            {address.flatNumber}<br/>
                            {address.street}{address.landmark ? `, ${address.landmark}` : ''}<br/>
                            {address.city}, {address.state} {address.pincode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Edit
                        </button>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <button
                          onClick={() => setAddressToDelete(address.id!)}
                          className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <h3 className="text-[#111418] text-lg font-bold leading-tight px-1">Add New Address</h3>
                <button
                  onClick={() => {
                    setEditingAddress(undefined);
                    setShowAddressForm(true);
                  }}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:ring-primary/20 hover:shadow-md transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl transition-colors">
                      add_location_alt
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">Add New Address</p>
                    <p className="text-sm text-gray-500">Use map or enter manually</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </button>
              </div>

              {addresses.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-gray-400 text-4xl">location_off</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-2">No Saved Addresses</p>
                  <p className="text-gray-500 text-sm mb-6">Add your first address to get started</p>
                </div>
              )}
            </>
          )}
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

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          onClose={() => {
            setShowAddressForm(false);
            setEditingAddress(undefined);
          }}
          onSave={handleSaveAddress}
          initialAddress={editingAddress}
        />
      )}

      {/* Delete Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-4xl">delete</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Address?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAddressToDelete(null)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAddress(addressToDelete)}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses;
