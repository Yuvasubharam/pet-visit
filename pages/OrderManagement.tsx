import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OrderItem } from '../types';

interface Props {
    onBack: () => void;
    sellerId?: string; // If provided, show only items for this seller
    isAdmin?: boolean;
}

const OrderManagement: React.FC<Props> = ({ onBack, sellerId, isAdmin }) => {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'all'>('pending');
    const [viewMode, setViewMode] = useState<'orders' | 'items'>(isAdmin && !sellerId ? 'orders' : 'items');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [sellerStats, setSellerStats] = useState({ pending: 0, shipped: 0, delivered: 0, totalEarnings: 0 });

    useEffect(() => {
        if (viewMode === 'items') {
            loadOrderItems();
        } else {
            loadConsolidatedOrders();
        }
    }, [sellerId, filter, viewMode]);

    useEffect(() => {
        if (sellerId && orderItems.length > 0) {
            // Calculate seller stats from order items
            const pending = orderItems.filter(i => i.fulfillment_status === 'pending').length;
            const shipped = orderItems.filter(i => i.fulfillment_status === 'shipped').length;
            const delivered = orderItems.filter(i => i.fulfillment_status === 'delivered').length;
            const totalEarnings = orderItems
                .filter((i: any) => i.fulfillment_status === 'delivered')
                .reduce((sum: number, i: any) => sum + (i.price * i.quantity - (i.admin_margin_amount || 0)), 0);
            setSellerStats({ pending, shipped, delivered, totalEarnings });
        }
    }, [sellerId, orderItems]);

    const loadConsolidatedOrders = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    users!orders_user_id_fkey(id, name, email, phone),
                    addresses(*),
                    order_items(
                        *,
                        shop_products(id, name, main_image, base_price, sale_price)
                    )
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter === 'confirmed' ? 'processing' : filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading consolidated orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrderItems = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('order_items')
                .select(`
                    *,
                    shop_products(id, name, main_image, base_price, sale_price),
                    orders!order_items_order_id_fkey(
                        *,
                        users!orders_user_id_fkey(id, name, email, phone),
                        addresses(*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (sellerId) {
                query = query.eq('seller_id', sellerId);
            }

            if (filter !== 'all') {
                query = query.eq('fulfillment_status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error('Error loading order items:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            loadConsolidatedOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const updateStatus = async (itemId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('order_items')
                .update({ fulfillment_status: newStatus })
                .eq('id', itemId);

            if (error) throw error;
            loadOrderItems();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Order Management</h1>
                        {isAdmin && !sellerId && (
                            <div className="flex gap-4 mt-1">
                                <button 
                                    onClick={() => setViewMode('orders')}
                                    className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'orders' ? 'text-primary' : 'text-gray-400'}`}
                                >
                                    Consolidated
                                </button>
                                <button 
                                    onClick={() => setViewMode('items')}
                                    className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'items' ? 'text-primary' : 'text-gray-400'}`}
                                >
                                    All Items
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Seller Stats - Only show for sellers */}
            {sellerId && (
                <div className="p-4 bg-white border-b border-gray-100">
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-orange-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Pending</p>
                            <p className="text-xl font-black text-orange-700">{sellerStats.pending}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Shipped</p>
                            <p className="text-xl font-black text-blue-700">{sellerStats.shipped}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Delivered</p>
                            <p className="text-xl font-black text-green-700">{sellerStats.delivered}</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Earnings</p>
                            <p className="text-lg font-black text-primary">₹{sellerStats.totalEarnings.toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar flex gap-2">
                {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s as any)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                            filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (viewMode === 'items' ? orderItems : orders).length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-200">shopping_bag</span>
                        <p className="text-gray-500 mt-2 font-bold">No {viewMode} found</p>
                    </div>
                ) : viewMode === 'orders' ? (
                    orders.map((order: any) => (
                        <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{order.order_number?.slice(-6)}</p>
                                    <h3 className="text-base font-black text-gray-900">{order.users?.name || 'Guest User'}</h3>
                                    <p className="text-xs text-gray-500">{order.order_items?.length} Items • ₹{order.total}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                    order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                                {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="size-14 bg-gray-50 rounded-xl flex-shrink-0 p-1 border border-gray-100">
                                        <img src={item.shop_products?.main_image} alt="" className="w-full h-full object-contain" />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button 
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-gray-50 text-gray-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-100 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                    View Details
                                </button>
                                {order.status === 'pending' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'processing')}
                                        className="bg-primary text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Process Order
                                    </button>
                                )}
                                {order.status === 'processing' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                        className="bg-primary text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Ship Order
                                    </button>
                                )}
                                {order.status === 'shipped' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                        className="bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Mark Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    orderItems.map((item: any) => (
                        <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{item.orders?.order_number?.slice(-6)}</p>
                                    <h3 className="text-sm font-black text-gray-900">{item.shop_products?.name}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    item.fulfillment_status === 'delivered' ? 'bg-green-100 text-green-600' :
                                    item.fulfillment_status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {item.fulfillment_status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2">
                                    <img src={item.shop_products?.main_image} alt="" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Quantity:</span>
                                        <span className="font-bold">{item.quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Price:</span>
                                        <span className="font-bold">₹{item.price}</span>
                                    </div>
                                    {isAdmin && item.admin_margin_amount && (
                                        <div className="flex justify-between text-xs text-primary">
                                            <span className="font-bold">Admin Margin:</span>
                                            <span className="font-black">₹{item.admin_margin_amount}</span>
                                        </div>
                                    )}
                                    {!isAdmin && item.admin_margin_amount && (
                                        <div className="flex justify-between text-xs text-green-600">
                                            <span className="font-bold">Your Earnings:</span>
                                            <span className="font-black">₹{(item.price * item.quantity - item.admin_margin_amount).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer & Delivery Details */}
                            <div className="pt-3 border-t border-gray-50 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-sm text-blue-600">person</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">{item.orders?.users?.name || 'Guest'}</p>
                                        <p className="text-xs text-gray-500">{item.orders?.users?.phone || 'No phone'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</p>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                                            item.orders?.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                            {item.orders?.payment_status || 'pending'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-sm text-orange-600">location_on</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping Address</p>
                                        <p className="text-[11px] text-gray-600 leading-relaxed">
                                            {item.orders?.addresses ? (
                                                <>
                                                    {item.orders.addresses.flat_number}, {item.orders.addresses.street}<br/>
                                                    {item.orders.addresses.landmark && `${item.orders.addresses.landmark}, `}
                                                    {item.orders.addresses.city}, {item.orders.addresses.state} {item.orders.addresses.pincode}
                                                </>
                                            ) : (
                                                'Address not available'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Map Preview & Navigate Button */}
                                {item.orders?.addresses?.latitude && item.orders?.addresses?.longitude && (
                                    <div className="space-y-2">
                                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                style={{ border: 0 }}
                                                src={`https://www.google.com/maps?q=${item.orders.addresses.latitude},${item.orders.addresses.longitude}&z=15&output=embed`}
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${item.orders.addresses.latitude},${item.orders.addresses.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">navigation</span>
                                            Navigate to Location
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                                {item.fulfillment_status === 'pending' && (
                                    <button 
                                        onClick={() => updateStatus(item.id, 'confirmed')}
                                        className="bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                    >
                                        Confirm
                                    </button>
                                )}
                                {item.fulfillment_status === 'confirmed' && (
                                    <button 
                                        onClick={() => updateStatus(item.id, 'shipped')}
                                        className="bg-primary text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                    >
                                        Ship Order
                                    </button>
                                )}
                                {item.fulfillment_status === 'shipped' && (
                                    <button 
                                        onClick={() => updateStatus(item.id, 'delivered')}
                                        className="bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                    >
                                        Mark Delivered
                                    </button>
                                )}
                                {['pending', 'confirmed'].includes(item.fulfillment_status) && (
                                    <button 
                                        onClick={() => updateStatus(item.id, 'cancelled')}
                                        className="bg-red-50 text-red-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )))
                }
            </main>

            {/* Order Details Modal Overlay */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <header className="px-6 py-6 flex items-center justify-between border-b border-gray-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Order Details</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{selectedOrder.order_number}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                            {/* Customer Section */}
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Information</h4>
                                <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-gray-100">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{selectedOrder.users?.name || 'Guest User'}</p>
                                        <p className="text-xs text-gray-500 font-bold">{selectedOrder.users?.phone || 'No phone provided'}</p>
                                        <p className="text-[10px] text-gray-400">{selectedOrder.users?.email}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Address Section */}
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Address</h4>
                                <div className="bg-gray-50 rounded-3xl p-4 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm border border-gray-100">
                                            <span className="material-symbols-outlined">location_on</span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                            {selectedOrder.addresses ? (
                                                <>
                                                    {selectedOrder.addresses.flat_number}, {selectedOrder.addresses.street}<br/>
                                                    {selectedOrder.addresses.landmark && `${selectedOrder.addresses.landmark}, `}
                                                    {selectedOrder.addresses.city}, {selectedOrder.addresses.state} {selectedOrder.addresses.pincode}
                                                </>
                                            ) : 'No address info'}
                                        </p>
                                    </div>
                                    
                                    {selectedOrder.addresses?.latitude && (
                                        <div className="space-y-2">
                                            <div className="w-full h-32 rounded-2xl overflow-hidden border border-white">
                                                <iframe
                                                    width="100%" height="100%" frameBorder="0"
                                                    src={`https://www.google.com/maps?q=${selectedOrder.addresses.latitude},${selectedOrder.addresses.longitude}&z=15&output=embed`}
                                                ></iframe>
                                            </div>
                                            <a 
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.addresses.latitude},${selectedOrder.addresses.longitude}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="w-full py-3 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100"
                                            >
                                                <span className="material-symbols-outlined text-sm">navigation</span>
                                                Get Directions
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Items Section */}
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Items</h4>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl p-1 flex-shrink-0">
                                                <img src={item.shop_products?.main_image} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h5 className="text-xs font-black text-gray-900 truncate">{item.shop_products?.name}</h5>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-[10px] font-bold text-gray-500">Qty: {item.quantity}</span>
                                                    <span className="text-[10px] font-black text-gray-900">₹{item.price}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                                        {item.fulfillment_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Summary Section */}
                            <section className="bg-gray-900 text-white rounded-3xl p-6 space-y-3">
                                <div className="flex justify-between text-xs font-bold opacity-60">
                                    <span>Subtotal</span>
                                    <span>₹{selectedOrder.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold opacity-60">
                                    <span>Delivery Fee</span>
                                    <span>₹{selectedOrder.delivery_fee}</span>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-green-400">
                                        <span>Discount</span>
                                        <span>-₹{selectedOrder.discount}</span>
                                    </div>
                                )}
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Amount</span>
                                    <span className="text-2xl font-black tracking-tighter">₹{selectedOrder.total}</span>
                                </div>
                                <div className="pt-2 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Payment Status</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                        selectedOrder.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                        {selectedOrder.payment_status}
                                    </span>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
