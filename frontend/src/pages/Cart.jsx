import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CONFIG } from '../utils/constants';
import axios from 'axios';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, 
  MapPin, Phone, IndianRupee, ShoppingBag, Loader 
} from 'lucide-react';

const Cart = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { 
    cartItems, removeFromCart, updateQuantity, clearCart, cartTotal 
  } = useCart();

  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  const discountSavings = originalTotal - cartTotal;

  const [shippingAddress, setShippingAddress] = useState(
    user?.address || (user?.village ? `${user.village}, ${user.district || ''}, ${user.state || ''}` : '')
  );
  const [contactNumber, setContactNumber] = useState(user?.mobile || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Geolocation States
  const [coordinates, setCoordinates] = useState(null); // { lat, lng }
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.gpsError') || "Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          if (res.data && res.data.display_name) {
            setShippingAddress(res.data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(t('location.error') || "Could not detect location. Please check browser permissions and try again.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!token) {
      alert(t('cart.pleaseLogin') || 'Please log in to complete checkout.');
      return;
    }
    if (cartItems.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const itemsPayload = cartItems.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.discountedPrice,
        quantity: item.quantity,
        unit: item.unit
      }));

      const locationPayload = coordinates ? {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat]
      } : undefined;

      await axios.post(
        `${CONFIG.API_BASE_URL}/api/market/orders`,
        {
          items: itemsPayload,
          shippingAddress,
          contactNumber,
          location: locationPayload
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearCart();
      setSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || (locale === 'hi' ? 'ऑर्डर देने में विफल।' : 'Failed to place order.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center space-y-6 flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800">🎉 {t('cart.orderPlacedSuccess')}</h2>
        <p className="text-gray-500 text-lg max-w-md">
          {t('cart.orderPlacedSuccessDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-8 rounded-3xl text-white shadow-xl flex items-center gap-4">
        <ShoppingCart className="w-10 h-10 text-amber-200" />
        <div>
          <h1 className="text-3xl font-bold">{t('cart.title')}</h1>
          <p className="text-amber-100 opacity-90">{t('cart.subtitle')}</p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-1">{t('cart.emptyCart')}</h3>
          <p className="text-gray-500 mb-6">{t('cart.emptyCartDesc')}</p>
          <Link 
            to="/marketplace" 
            className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-md flex items-center gap-2"
          >
            {t('cart.goToMarketplace')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {t('cart.cartItems')} ({cartItems.length})
            </h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item._id} 
                  className="glass-card bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-150">
                      <img 
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop'} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{item.name}</h3>
                      <p className="text-xs text-gray-400 font-semibold capitalize mb-1">{item.category}</p>
                      <p className="text-xs text-gray-500">{t('cart.shopLabel')}: {item.businessId?.name || t('cart.localStore')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-6 mt-4 md:mt-0">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
                      <button 
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item._id);
                          } else {
                            updateQuantity(item._id, item.quantity - 1);
                          }
                        }}
                        className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price Info */}
                    <div className="text-right">
                      <div className="flex items-center text-gray-800 font-extrabold text-base justify-end gap-1.5 flex-wrap">
                        {item.discount > 0 && (
                          <span className="text-xs line-through text-gray-400 font-semibold">
                            ₹{item.price * item.quantity}
                          </span>
                        )}
                        <span className="flex items-center text-amber-700 font-extrabold">
                          <IndianRupee className="w-4 h-4" />
                          {item.discountedPrice * item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          ₹{item.discountedPrice} / {item.unit}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            {item.discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl border border-red-100 transition-colors"
                      title={t('cart.removeTitle')}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{t('cart.checkoutSummary')}</h2>
            <div className="glass-card bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Header title */}
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
                  {locale === 'hi' ? 'मूल्य विवरण' : 'Price Details'}
                </h3>
                
                {/* Price (items count) */}
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>
                    {locale === 'hi' 
                      ? `मूल्य (${cartItems.length} आइटम)` 
                      : `Price (${cartItems.length} item${cartItems.length > 1 ? 's' : ''})`}
                  </span>
                  <span className="flex items-center font-semibold text-gray-800">
                    <IndianRupee className="w-3.5 h-3.5" /> {originalTotal}
                  </span>
                </div>

                {/* Discount savings */}
                {discountSavings > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{locale === 'hi' ? 'छूट' : 'Discount'}</span>
                    <span className="flex items-center font-bold text-emerald-600">
                      - <IndianRupee className="w-3.5 h-3.5" /> {discountSavings}
                    </span>
                  </div>
                )}

                {/* Delivery Charges */}
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>{t('cart.deliveryCharges') || 'Delivery Charges'}</span>
                  <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">
                    {t('cart.freeDelivery') || 'FREE'}
                  </span>
                </div>

                <hr className="border-gray-100" />

                {/* Total amount */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-base">{t('cart.totalAmount') || 'Total Amount'}</span>
                  <span className="flex items-center font-black text-amber-600 text-2xl">
                    <IndianRupee className="w-5 h-5" /> {cartTotal}
                  </span>
                </div>

                {/* Green savings message */}
                {discountSavings > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl text-xs text-emerald-850 font-bold text-center">
                    🎉 {locale === 'hi' 
                      ? `आप इस ऑर्डर पर ₹${discountSavings} बचाएंगे!` 
                      : `You will save ₹${discountSavings} on this order!`}
                  </div>
                )}
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {t('cart.deliveryAddress')}
                    </label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detecting}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border-0 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      {detecting ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          {t('cart.detecting')}
                        </>
                      ) : (
                        <>
                          📍 {t('cart.detectLocation')}
                        </>
                      )}
                    </button>
                  </div>
                  <textarea 
                    required
                    rows="3"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={t('cart.addressPlaceholder')}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-semibold text-gray-800"
                  />
                  
                  {coordinates && (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-2.5 space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                        <span>📍 {t('cart.locationDetected')}</span>
                        <span className="truncate max-w-[200px]" title={shippingAddress}>{shippingAddress || t('cart.gpsLocked')}</span>
                      </div>
                      <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-200 relative">
                        <iframe
                          title="Delivery Location Preview"
                          width="100%"
                          height="100%"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.003}%2C${coordinates.lat - 0.003}%2C${coordinates.lng + 0.003}%2C${coordinates.lat + 0.003}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
                          className="border-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoordinates(null)}
                        className="text-[10px] text-red-500 hover:text-red-655 font-bold border-0 bg-transparent cursor-pointer block text-left"
                      >
                        ❌ {t('cart.clearGps')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    {t('cart.contactLabel')}
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength="10"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder={t('cart.contactPlaceholder')}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold text-gray-800"
                  />
                </div>

                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl text-[11px] text-amber-800 leading-relaxed">
                  📢 <b>{t('cart.codNotice')}</b>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-75"
                >
                  {loading && <Loader className="animate-spin w-5 h-5" />}
                  {t('cart.placeOrder')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
