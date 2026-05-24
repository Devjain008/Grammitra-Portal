import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CONFIG } from '../utils/constants';
import { 
  ClipboardList, Calendar, MapPin, Phone, IndianRupee, 
  Trash2, CheckCircle2, Clock, XCircle, ArrowRight, Loader, ShoppingBag, MessageSquare
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const handleChatWithSeller = async (sellerId) => {
    if (!token) return alert(t('cart.pleaseLogin') || 'Please log in.');
    if (!sellerId) return alert(t('orders.detailsMissing') || 'Shopkeeper details missing.');
    if (sellerId.toString() === user?._id?.toString()) {
      return alert(t('orders.ownShopError') || 'This is your own shop!');
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: sellerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(t('orders.chatFailed') || 'Failed to start chat with the shopkeeper.');
    }
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/market/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(locale === 'hi' ? 'ऑर्डर इतिहास लोड करने में विफल।' : 'Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Listen to live updates if socket notifies us about order state changes
  useEffect(() => {
    if (socket) {
      const handleOrderUpdate = (data) => {
        if (data.type === 'ORDER_UPDATE') {
          // Update the specific order in local state
          setOrders((prev) => 
            prev.map(o => o._id === data.order._id ? { ...o, status: data.order.status } : o)
          );
        }
      };
      socket.on('notification', handleOrderUpdate);
      return () => {
        socket.off('notification', handleOrderUpdate);
      };
    }
  }, [socket]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(t('orders.cancelConfirm') || 'Are you sure you want to cancel this order?')) return;

    try {
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/market/orders/${orderId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update order in list
      setOrders((prev) => 
        prev.map(o => o._id === orderId ? { ...o, status: res.data.status } : o)
      );
      alert(t('orders.cancelSuccess') || 'Order cancelled successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('orders.cancelFailed') || 'Failed to cancel order.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('orders.statusCompleted') || 'Completed'}
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> {t('orders.statusAccepted') || 'Accepted'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <XCircle className="w-3.5 h-3.5" /> {t('orders.statusCancelled') || 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> {t('orders.statusPending') || 'Pending'}
          </span>
        );
    }
  };

  const renderStepper = (status) => {
    const isHi = locale === 'hi';

    if (status === 'cancelled') {
      return (
        <div className="w-full flex items-center justify-between max-w-md mx-auto px-4 py-2 relative">
          <div className="absolute top-[22px] left-[15%] right-[15%] h-[3px] bg-red-100 z-0 pointer-events-none" />
          <div className="flex flex-col items-center relative flex-1 z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 mt-1.5">{isHi ? 'ऑर्डर किया गया' : 'Ordered'}</span>
          </div>
          <div className="flex flex-col items-center relative flex-1 z-10">
            <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-red-600 flex items-center justify-center text-white shadow-md shadow-red-100">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-red-600 mt-1.5">{isHi ? 'रद्द किया गया' : 'Cancelled'}</span>
          </div>
        </div>
      );
    }

    const getStepState = (stepIndex) => {
      if (status === 'completed') return 'completed';
      if (status === 'accepted') {
        if (stepIndex === 0) return 'completed';
        if (stepIndex === 1) return 'completed';
        return 'pending';
      }
      if (stepIndex === 0) return 'completed';
      return 'pending';
    };

    const steps = [
      { key: 'pending', label: isHi ? 'ऑर्डर किया गया' : 'Ordered' },
      { key: 'accepted', label: isHi ? 'स्वीकृत' : 'Approved' },
      { key: 'completed', label: isHi ? 'डिलीवर किया गया' : 'Delivered' }
    ];

    return (
      <div className="w-full flex items-center justify-between max-w-xl mx-auto px-4 py-2 relative">
        <div className="absolute top-[22px] left-[10%] right-[10%] h-[3px] bg-gray-200 rounded-full z-0 pointer-events-none">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
            style={{ 
              width: status === 'completed' ? '100%' : status === 'accepted' ? '50%' : '0%' 
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const state = getStepState(idx);
          const isCurrent = (status === 'pending' && idx === 0) || 
                            (status === 'accepted' && idx === 1) || 
                            (status === 'completed' && idx === 2);

          let circleClass = "";
          let icon = null;
          let labelClass = "";

          if (state === 'completed') {
            circleClass = "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-100";
            icon = <CheckCircle2 className="w-4 h-4 text-white" />;
            labelClass = "text-emerald-600 font-bold";
          } else {
            if (isCurrent) {
              circleClass = "bg-white border-amber-500 text-amber-600 animate-pulse ring-4 ring-amber-100";
              icon = <Clock className="w-4 h-4 text-amber-600" />;
              labelClass = "text-amber-600 font-bold";
            } else {
              circleClass = "bg-white border-gray-200 text-gray-400";
              icon = <Clock className="w-4 h-4 text-gray-300" />;
              labelClass = "text-gray-400 font-semibold";
            }
          }

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${circleClass}`}>
                {icon}
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-1.5 whitespace-nowrap transition-colors duration-300 ${labelClass}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 rounded-3xl text-white shadow-xl flex items-center gap-4">
        <ClipboardList className="w-10 h-10 text-emerald-200" />
        <div>
          <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
          <p className="text-emerald-100 opacity-90">{t('orders.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-emerald-600 w-12 h-12" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 font-semibold">{error}</div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-1">{t('orders.noOrders')}</h3>
          <p className="text-gray-500 mb-6">{t('orders.noOrdersDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={order._id}
                className="glass-card bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4 hover:shadow-lg transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-50 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      {t('cart.shopLabel') || 'Shop'}: {order.businessId?.name || t('cart.localStore') || 'Local Store'}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {orderDate}
                      </span>
                      <span>{t('yourShop.orderIdLabel') || 'Order ID:'} <b className="text-gray-600 font-mono">{order._id.substring(order._id.length - 8).toUpperCase()}</b></span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Visual Stepper */}
                <div className="py-2 border-b border-gray-100">
                  {renderStepper(order.status)}
                </div>

                {order.status === 'cancelled' && order.cancelReason && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-700 space-y-1">
                    <div>
                      <span className="font-bold text-red-800">{locale === 'hi' ? 'रद्द होने का कारण: ' : 'Cancellation Reason: '}</span>
                      <span className="font-medium">{order.cancelReason}</span>
                    </div>
                    {order.cancelledBy && (
                      <span className="block text-[10px] text-gray-500 italic">
                        {order.cancelledBy === 'seller' 
                          ? (locale === 'hi' ? '*विक्रेता द्वारा रद्द किया गया' : '*Cancelled by Shopkeeper')
                          : (locale === 'hi' ? '*आपके द्वारा रद्द किया गया' : '*Cancelled by you')}
                      </span>
                    )}
                  </div>
                )}

                {/* Items grid */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1">
                      <div className="text-gray-700">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <span className="text-xs text-gray-400 ml-2">x {item.quantity} {item.unit}</span>
                      </div>
                      <div className="font-bold text-gray-800 flex items-center">
                        <IndianRupee className="w-3.5 h-3.5" /> {item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info and Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-500">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {t('yourShop.deliveryAddress') || 'Delivery Address'}
                    </div>
                    <p className="leading-relaxed">{order.shippingAddress}</p>
                    {order.location?.coordinates && order.location.coordinates.length === 2 && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${order.location.coordinates[1]},${order.location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                      >
                        📍 {t('yourShop.viewMap') || 'View Map Navigation'}
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5 md:border-l md:border-gray-200 md:pl-4">
                    <div className="flex items-center gap-1.5 font-bold text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> {t('yourShop.contactInfo') || 'Contact Information'}
                    </div>
                    <p>{t('yourShop.buyerLabel') || 'Buyer:'} {order.contactNumber}</p>
                    {order.businessId?.contactNumber && (
                      <p>
                        {locale === 'hi' ? 'दुकानदार फोन:' : 'Shopkeeper Phone:'}{' '}
                        <a href={`tel:${order.businessId.contactNumber}`} className="text-emerald-600 font-bold hover:underline">
                          {order.businessId.contactNumber}
                        </a>
                      </p>
                    )}
                    {order.shopkeeperId && order.shopkeeperId !== user?._id && (
                      <button
                        type="button"
                        onClick={() => handleChatWithSeller(order.shopkeeperId)}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-bold mt-2.5 transition active:scale-95 shadow-sm cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> {t('orders.chatWithSeller') || 'Chat with Seller'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer totals & actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-end gap-1.5">
                    <span className="text-xs text-gray-400">{t('yourShop.totalRevenue') || 'Total Amount:'}</span>
                    <span className="text-lg font-extrabold text-amber-600 flex items-center">
                      <IndianRupee className="w-4 h-4" /> {order.totalAmount}
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('orders.cancelOrder') || 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
