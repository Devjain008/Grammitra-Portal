
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCall } from '../context/CallContext';
import { CONFIG } from '../utils/constants';
import {
  ShoppingBag, Search, MapPin, IndianRupee, Phone,
  ShieldCheck, MessageCircle, AlertTriangle,
  Package, X, Store, RefreshCw, Languages,
  Minus, Plus, Star
} from 'lucide-react';

/* ══════════════════════════════════════════════
   ALL TRANSLATIONS — every UI string in EN + HI
══════════════════════════════════════════════ */
const TR = {
  en: {
    badge:          'Local Bazaar · स्थानीय बाज़ार',
    heroTitle:      'Your Local Bazaar',
    heroSubtitle:   'Buy & sell everything — groceries, crops, tools, livestock and more from sellers near you.',
    statProducts:   (n) => `${n} Listings`,
    statVerified:   'Verified Sellers',
    statLocation:   'Location-Aware',
    statCommunity:  'Community-Driven',
    searchPlaceholder: 'Search products, shops, categories…',
    nearestFirst:   'Nearest First',
    sortBy:         'Sort By',
    sortPopularity: 'Popularity',
    sortDistance:   'Distance',
    sortPriceLow:   'Price: Low to High',
    sortPriceHigh:  'Price: High to Low',
    switchLang:     'हिंदी में देखें',
    categories: {
      all: 'All', crops: 'Crops', seeds: 'Seeds', machinery: 'Machinery',
      livestock: 'Livestock', fertilizer: 'Fertilizers', grocery: 'Grocery',
      dairy: 'Dairy', healthcare: 'Medicines & Health', other: 'Other',
    },
    resultsNone:    'No products found',
    resultsCount:   (n) => `${n} product${n !== 1 ? 's' : ''} available`,
    verified:       'Verified',
    outOfStock:     'Out of Stock',
    onlyLeft:       (n) => `Only ${n} left!`,
    nearby:         'Nearby',
    sameVillage:    'Same Village',
    sameDistrict:   'Same District',
    sameState:      'Same State',
    call:           'Call',
    chat:           'Chat',
    addToCart:      'Add to Cart',
    clearFilters:   'Clear Filters',
    tryAgain:       'Try Again',
    fetchError:     'Failed to load products. Please try again.',
    emptyTitle:     'No products found',
    emptyDesc:      'Try a different search or browse another category.',
    loginRequired:  'Please log in first.',
    sellerMissing:  'Seller information not available.',
    ownProduct:     'This is your own product!',
    chatFail:       'Could not start chat. Try again.',
    noContact:      'Vendor contact not available. Try live chat.',
    addedToCart:    (name) => `${name} added to cart!`,
    localStore:     'Local Store',
    selectQuantity: 'Select Quantity',
    confirmAdd: 'Add to Cart',
    subtotal: 'Subtotal',
    stockLimit: (qty) => `Only ${qty} left in stock!`,
    cancel: 'Cancel',
    addedToCartWithQty: (name, qty) => `Added ${qty} x ${name} to cart!`,
    ticker: [
      '🛍️ Local Bazaar — Buy & Sell Near You',
      '🌾 Fresh produce from nearby villages',
      '🔒 Verified sellers only',
      '📍 Distance-aware listings',
      '💬 Chat directly with sellers',
      '🛒 Add to cart & order online',
      '🎉 Best deals from your community',
    ],
  },

  hi: {
    badge:          'स्थानीय बाज़ार · Local Bazaar',
    heroTitle:      'आपका अपना बाज़ार',
    heroSubtitle:   'किराना, फसल, औज़ार, पशु और बहुत कुछ — पास के दुकानदारों से सीधे खरीदें और बेचें।',
    statProducts:   (n) => `${n} उत्पाद`,
    statVerified:   'सत्यापित विक्रेता',
    statLocation:   'स्थान-आधारित',
    statCommunity:  'सामुदायिक',
    searchPlaceholder: 'उत्पाद, दुकान या श्रेणी खोजें…',
    nearestFirst:   'नज़दीकी पहले',
    sortBy:         'क्रमबद्ध करें',
    sortPopularity: 'लोकप्रियता',
    sortDistance:   'दूरी',
    sortPriceLow:   'कीमत: कम से अधिक',
    sortPriceHigh:  'कीमत: अधिक से कम',
    switchLang:     'View in English',
    categories: {
      all: 'सभी', crops: 'फसल', seeds: 'बीज', machinery: 'मशीनरी',
      livestock: 'पशुधन', fertilizer: 'खाद', grocery: 'किराना',
      dairy: 'डेयरी', healthcare: 'दवाइयाँ और स्वास्थ्य', other: 'अन्य',
    },
    resultsNone:    'कोई उत्पाद नहीं मिला',
    resultsCount:   (n) => `${n} उत्पाद उपलब्ध हैं`,
    verified:       'सत्यापित',
    outOfStock:     'स्टॉक खत्म',
    onlyLeft:       (n) => `केवल ${n} बचे!`,
    nearby:         'पास में',
    sameVillage:    'एक ही गाँव',
    sameDistrict:   'एक ही जिला',
    sameState:      'एक ही राज्य',
    call:           'कॉल करें',
    chat:           'चैट करें',
    addToCart:      'कार्ट में डालें',
    clearFilters:   'फ़िल्टर हटाएँ',
    tryAgain:       'पुनः प्रयास करें',
    fetchError:     'उत्पाद लोड करने में विफल। कृपया पुनः प्रयास करें।',
    emptyTitle:     'कोई उत्पाद नहीं मिला',
    emptyDesc:      'अलग खोज करें या दूसरी श्रेणी चुनें।',
    loginRequired:  'कृपया पहले लॉगिन करें।',
    sellerMissing:  'विक्रेता की जानकारी उपलब्ध नहीं।',
    ownProduct:     'यह आपका खुद का उत्पाद है!',
    chatFail:       'चैट शुरू नहीं हो सकी। पुनः प्रयास करें।',
    noContact:      'विक्रेता का नंबर उपलब्ध नहीं। लाइव चैट आज़माएँ।',
    addedToCart:    (name) => `${name} कार्ट में जोड़ा गया!`,
    localStore:     'स्थानीय दुकान',
    selectQuantity: 'मात्रा चुनें',
    confirmAdd: 'कार्ट में डालें',
    subtotal: 'कुल राशि',
    stockLimit: (qty) => `स्टॉक में केवल ${qty} ही बचे हैं!`,
    cancel: 'रद्द करें',
    addedToCartWithQty: (name, qty) => `कार्ट में ${qty} x ${name} जोड़ा गया!`,
    ticker: [
      '🛍️ स्थानीय बाज़ार — खरीदें और बेचें',
      '🌾 पास के गाँव से ताज़ा उत्पाद',
      '🔒 केवल सत्यापित विक्रेता',
      '📍 स्थान-आधारित सूची',
      '💬 विक्रेता से सीधे चैट करें',
      '🛒 कार्ट में जोड़ें और ऑर्डर करें',
      '🎉 आपके समुदाय के सर्वोत्तम सौदे',
    ],
  },
};

const CATEGORY_EMOJI = {
  all: '🛒', crops: '🌾', seeds: '🌱', machinery: '🔧',
  livestock: '🐄', fertilizer: '🧪', grocery: '🧺', dairy: '🥛', healthcare: '💊', other: '📦',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop';

/* ─── Distance badge ─── */
const DistanceBadge = ({ info, tr }) => {
  if (!info || info.val === 9999) return null;
  const { val, type } = info;
  let color = '#d97706';
  let label = info.label;
  if (type === 'gps') {
    if (val < 1)        color = '#059669';
    else if (val <= 10) color = '#0891b2';
    else if (val <= 25) color = '#d97706';
    else                color = '#dc2626';
  } else if (type === 'text') {
    if (val === 0.1)    { color = '#059669'; label = tr.sameVillage; }
    else if (val === 10){ color = '#0891b2'; label = tr.sameDistrict; }
    else                { color = '#7c3aed'; label = tr.sameState; }
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background:`${color}18`, color, border:`1px solid ${color}28` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const Marketplace = () => {
  /*
    We read `locale` from LanguageContext and treat it as the source of truth.
    The local toggle calls the context's changeLanguage / setLocale / toggleLocale —
    whichever your context exposes — AND keeps a local mirror so we re-render immediately
    even if the context update is async.
  */
  const langCtx = useLanguage();           // full context object
  const ctxLocale = langCtx?.locale ?? langCtx?.language ?? 'en';

  // Local mirror — stays in sync with context
  const [lang, setLang] = useState(() => (ctxLocale === 'hi' ? 'hi' : 'en'));

  // Sync when context locale changes from outside (e.g. a global header toggle)
  useEffect(() => {
    setLang(ctxLocale === 'hi' ? 'hi' : 'en');
  }, [ctxLocale]);

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    // Try every common setter name your context might expose
    if (typeof langCtx?.setLocale === 'function')         langCtx.setLocale(next);
    if (typeof langCtx?.changeLanguage === 'function')    langCtx.changeLanguage(next);
    if (typeof langCtx?.setLanguage === 'function')       langCtx.setLanguage(next);
    if (typeof langCtx?.toggleLocale === 'function')      langCtx.toggleLocale();
    if (typeof langCtx?.toggleLanguage === 'function')    langCtx.toggleLanguage();
  };

  const tr = TR[lang];   // active translation object

  const { token, user } = useAuth();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { startCall } = useCall();
  const [searchParams]  = useSearchParams();
  const villageParam    = searchParams.get('village');
  const navigate        = useNavigate();

  const [products, setProducts]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy]                     = useState('default');
  const filterNearest = sortBy === 'distance';
  const [userCoords, setUserCoords]             = useState(null);
  const [inlineQtySelect, setInlineQtySelect]   = useState({});
  const [priceFilter, setPriceFilter]           = useState('all');
  const [inStockOnly, setInStockOnly]           = useState(false);
  const [verifiedOnly, setVerifiedOnly]         = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  /* Reviews state */
  const [submitRatings,   setSubmitRatings]   = useState({});
  const [submitComments,  setSubmitComments]  = useState({});

  const handleAddProductReview = async (e, productId) => {
    e.preventDefault();
    if (!token) return;
    const rating = submitRatings[productId] || 5;
    const comment = submitComments[productId] || '';

    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/market/products/${productId}/review`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;
      setProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p));
      setSelectedProductDetails(updatedProduct);
      setSubmitComments(prev => ({ ...prev, [productId]: '' }));
      setSubmitRatings(prev => ({ ...prev, [productId]: 5 }));
    } catch (err) {
      alert(err.response?.data?.message || (lang === 'hi' ? 'समीक्षा सबमिट करने में विफल।' : 'Failed to submit review.'));
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
        () => {
          if (user?.location?.coordinates?.length === 2)
            setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] });
        }
      );
    } else if (user?.location?.coordinates?.length === 2) {
      setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] });
    }
  }, [user]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/market/products`);
      setProducts(res.data);
      setError(null);
    } catch {
      setError(tr.fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, []);

  const handleContactSeller = (p) => {
    if (!token) return alert(tr.loginRequired);
    const sellerId = p.businessId?.ownerId;
    const sellerName = p.businessId?.name || 'Seller';
    const sellerImage = p.images?.[0];

    if (sellerId) {
      if (sellerId === user?._id) return alert(tr.ownProduct);
      startCall({
        id: sellerId,
        name: sellerName,
        image: sellerImage
      }, 'audio');
    } else {
      const ph = p.businessId?.contactNumber;
      if (ph && ph.trim() && ph !== 'Contact Vendor') window.location.href = `tel:${ph}`;
      else alert(tr.noContact);
    }
  };

  const handleAddToCartClick = (p) => {
    setInlineQtySelect(prev => ({ ...prev, [p._id]: 1 }));
  };

  const handleChatWithSeller = async (p) => {
    if (!token) return alert(tr.loginRequired);
    const sid = p.businessId?.ownerId;
    if (!sid) return alert(tr.sellerMissing);
    if (sid === user?._id) return alert(tr.ownProduct);
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: sid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch { alert(tr.chatFail); }
  };

  const calculateDistance = useCallback((product) => {
    const biz = product.businessId;
    if (!biz) return { val: 9999, label: tr.nearby, type: 'unknown' };
    if (userCoords && biz.location?.coordinates?.length === 2) {
      const [bLng, bLat] = biz.location.coordinates;
      const R = 6371;
      const dLat = (bLat - userCoords.lat) * Math.PI / 180;
      const dLon = (bLng  - userCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 +
        Math.cos(userCoords.lat * Math.PI/180) * Math.cos(bLat * Math.PI/180) * Math.sin(dLon/2)**2;
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return { val: d, label: `${d.toFixed(1)} km`, type: 'gps' };
    }
    if (user) {
      const uV = (user.village  || '').toLowerCase(), bV = (biz.village  || '').toLowerCase();
      const uD = (user.district || '').toLowerCase(), bD = (biz.district || '').toLowerCase();
      const uS = (user.state    || '').toLowerCase(), bS = (biz.state    || '').toLowerCase();
      if (uV && bV && uV === bV) return { val: 0.1, label: tr.sameVillage,  type: 'text' };
      if (uD && bD && uD === bD) return { val: 10,  label: tr.sameDistrict, type: 'text' };
      if (uS && bS && uS === bS) return { val: 100, label: tr.sameState,    type: 'text' };
    }
    return { val: 9999, label: biz.village || tr.nearby, type: 'unknown' };
  }, [userCoords, user, lang]);  // re-run when lang changes so labels update

  const processedProducts = React.useMemo(() => {
    let result = products
      .filter((p) => {
        const s = searchTerm.toLowerCase();
        return (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s);
      })
      .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
      .filter((p) => !villageParam || (p.businessId?.village || '').toLowerCase() === villageParam.toLowerCase())
      .filter((p) => !verifiedOnly || p.businessId?.isVerified)
      .filter((p) => !inStockOnly || p.stock > 0)
      .filter((p) => {
        if (priceFilter === 'all') return true;
        const pPrice = p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
        if (priceFilter === 'under100') return pPrice < 100;
        if (priceFilter === '100to500') return pPrice >= 100 && pPrice <= 500;
        if (priceFilter === 'above500') return pPrice > 500;
        return true;
      })
      .map((p) => ({ ...p, _dist: calculateDistance(p) }));
    
    if (sortBy === 'distance') {
      result.sort((a, b) => a._dist.val - b._dist.val);
    } else if (sortBy === 'price_low_high') {
      result.sort((a, b) => {
        const priceA = a.discount > 0 ? Math.round(a.price * (1 - a.discount / 100)) : a.price;
        const priceB = b.discount > 0 ? Math.round(b.price * (1 - b.discount / 100)) : b.price;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_high_low') {
      result.sort((a, b) => {
        const priceA = a.discount > 0 ? Math.round(a.price * (1 - a.discount / 100)) : a.price;
        const priceB = b.discount > 0 ? Math.round(b.price * (1 - b.discount / 100)) : b.price;
        return priceB - priceA;
      });
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => {
        const popA = (a.totalSold || 0) * 10 + (a.views || 0);
        const popB = (b.totalSold || 0) * 10 + (b.views || 0);
        return popB - popA;
      });
    }
    return result;
  }, [products, searchTerm, selectedCategory, sortBy, verifiedOnly, inStockOnly, priceFilter, calculateDistance, villageParam]);

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border:'1px solid #ecdcc6' }}>
      <div className="h-44" style={{ background:'#f5ede0' }} />
      <div className="p-4 space-y-3">
        {[3/4, 1/2, 1, 1].map((w, i) => (
          <div key={i} className="h-3 rounded-lg" style={{ background:'#f0e4d0', width:`${w*100}%` }} />
        ))}
        <div className="h-9 rounded-xl mt-2" style={{ background:'#f0e4d0' }} />
      </div>
    </div>
  );

  const tickerItems = [...tr.ticker, ...tr.ticker]; // doubled for seamless loop

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@600;700;900&display=swap');

        .bz-root    { font-family:'Sora',sans-serif; background:#f1f3f6; color:#212121; }
        .bz-serif   { font-family:'Noto Serif Devanagari',serif; }

        /* ticker */
        .bz-ticker  { overflow:hidden; white-space:nowrap; }
        .bz-tick-in { display:inline-flex; animation:bzTick 34s linear infinite; }
        @keyframes bzTick { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* dot pattern */
        .bz-dots {
          background-image:radial-gradient(circle at 1px 1px,rgba(40,116,240,.1) 1px,transparent 0);
          background-size:22px 22px;
        }

        /* hero gradient */
        .bz-hero { background:linear-gradient(135deg,#1e3a8a 0%,#2874f0 60%,#4f46e5 100%); }

        /* card */
        .bz-card { border:1px solid #e0e0e0; transition:box-shadow .22s ease,transform .22s ease,border-color .22s ease; }
        .bz-card:hover { box-shadow:0 12px 30px -6px rgba(0,0,0,0.1); transform:translateY(-4px); border-color:#2874f050; }
        .bz-card:hover .bz-img { transform:scale(1.05); }
        .bz-img { transition:transform .5s ease; }

        /* chips */
        .bz-chips { overflow-x:auto; scrollbar-width:none; }
        .bz-chips::-webkit-scrollbar { display:none; }
        .bz-chip  { transition:all .15s ease; border:1.5px solid #e0e0e0; white-space:nowrap; cursor:pointer; }
        .bz-chip-on  { background:#2874f0; color:#fff; border-color:#2874f0; box-shadow:0 4px 14px rgba(40,116,240,.3); }
        .bz-chip-off { background:#fff; color:#212121; }
        .bz-chip-off:hover { background:#f8fafc; border-color:#2874f050; color:#2874f0; }

        /* search */
        .bz-search { font-family:'Sora',sans-serif; transition:border-color .15s,box-shadow .15s; }
        .bz-search:focus { outline:none; border-color:#2874f0; box-shadow:0 0 0 3px rgba(40,116,240,.12); }

        /* buttons */
        .bz-btn-cart { background:#ff9f00; transition:all .2s ease; font-family:'Sora',sans-serif; }
        .bz-btn-cart:hover:not(:disabled) { background:#f39200; box-shadow:0 4px 12px rgba(255,159,0,.35); transform:translateY(-1px); }
        .bz-btn-cart:disabled { opacity:.45; cursor:not-allowed; }
        .bz-btn-cart:active:not(:disabled) { transform:scale(.97); }

        .bz-btn-call { background:#fff; border:1.5px solid #e0e0e0; color:#212121; transition:all .15s ease; font-family:'Sora',sans-serif; }
        .bz-btn-call:hover { background:#f8fafc; border-color:#cbd5e1; }
        .bz-btn-call:active { transform:scale(.97); }

        .bz-btn-chat { background:#f0f7ff; border:1.5px solid #d0e7ff; color:#2874f0; transition:all .15s ease; font-family:'Sora',sans-serif; }
        .bz-btn-chat:hover { background:#e0f0ff; border-color:#2874f080; }
        .bz-btn-chat:active { transform:scale(.97); }

        /* lang toggle */
        .bz-lang { transition:all .18s ease; border:1.5px solid rgba(255,255,255,.25); font-family:'Sora',sans-serif; }
        .bz-lang:hover { background:rgba(255,255,255,.2); }
        .bz-lang:active { transform:scale(.96); }

        /* nearest toggle */
        .bz-near-on  { background:#2874f0; color:#fff; border:1.5px solid #2874f0; box-shadow:0 4px 14px rgba(40,116,240,.28); }
        .bz-near-off { background:#fff; color:#212121; border:1.5px solid #e0e0e0; }
        .bz-near-off:hover { background:#f8fafc; border-color:#2874f050; }

        /* Devanagari specific adjustments */
        .bz-hi .bz-serif { letter-spacing:0; }
        .bz-hi .bz-chip  { font-size:11px; padding-top:9px; padding-bottom:9px; }

        /* utilities */
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .scrollbar-none { scrollbar-width:none; }
      `}</style>

      <div className={`bz-root min-h-screen pb-16 ${lang === 'hi' ? 'bz-hi' : ''}`}>

        {/* ── TICKER STRIP ── */}
        <div className="bz-ticker py-1.5 text-white text-[11px] font-semibold tracking-wide"
          style={{ background:'#172554' }}>
          <div className="bz-tick-in">
            {tickerItems.map((txt, i) => (
              <span key={i} className="mx-10 opacity-90">{txt}</span>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-5 pt-5">

          {/* ── HERO ── */}
          <motion.div
            initial={{ opacity:0, y:-14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
            className="bz-hero relative overflow-hidden rounded-3xl"
          >
            <div className="bz-dots absolute inset-0 opacity-25 pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-2 border-white/10" />
            <div className="absolute -right-6  -top-6  w-44 h-44 rounded-full border   border-white/8" />
            <div className="absolute right-24 bottom-0 w-36 h-36 rounded-full"
              style={{ background:'radial-gradient(circle,rgba(245,166,35,.3) 0%,transparent 70%)' }} />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-8 py-10">
              {/* Left */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.22)' }}>
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                    {tr.badge}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.h1 key={`title-${lang}`}
                    initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-6 }} transition={{ duration:0.2 }}
                    className="bz-serif text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                    {tr.heroTitle}
                  </motion.h1>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p key={`sub-${lang}`}
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    exit={{ opacity:0 }} transition={{ duration:0.18 }}
                    className="text-white/55 text-sm max-w-sm leading-relaxed">
                    {tr.heroSubtitle}
                  </motion.p>
                </AnimatePresence>

                {/* Stat pills */}
                <AnimatePresence mode="wait">
                  <motion.div key={`stats-${lang}`}
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    exit={{ opacity:0 }} transition={{ duration:0.18 }}
                    className="flex flex-wrap gap-2 mt-5">
                    {[
                      ['🏪', tr.statProducts(products.length)],
                      ['✅', tr.statVerified],
                      ['📍', tr.statLocation],
                      ['🤝', tr.statCommunity],
                    ].map(([emoji, label]) => (
                      <span key={label}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/90"
                        style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.16)' }}>
                        {emoji} {label}
                      </span>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: badge */}
              <div className="flex flex-col items-end gap-4 shrink-0">
                <div className="hidden md:flex items-center justify-center w-28 h-28 rounded-full flex-col gap-1"
                  style={{ border:'2px dashed rgba(255,255,255,.25)', background:'rgba(255,255,255,.08)' }}>
                  <span className="text-3xl">🛍️</span>
                  <span className="text-[10px] text-white/55 font-bold tracking-wider">BAZAAR</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── FILTERS ── */}
          <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.1 }}
            className="space-y-3"
          >
            {/* Search + Nearest */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                <input
                  type="text"
                  placeholder={tr.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bz-search w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm border"
                  style={{ background:'#fff', borderColor: '#e0e0e0', color:'#212121' }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button type="button"
                onClick={() => setSortBy(prev => prev === 'distance' ? 'default' : 'distance')}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                  sortBy === 'distance' ? 'bz-near-on' : 'bz-near-off'
                }`}>
                <MapPin className="w-4 h-4"
                  style={{ color: sortBy === 'distance' ? '#fff' : '#2874f0' }} />
                <AnimatePresence mode="wait">
                  <motion.span key={`near-${lang}`}
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    exit={{ opacity:0 }} transition={{ duration:0.13 }}>
                    {tr.nearestFirst}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>

            {/* Sort + Category Dropdowns Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sort By Dropdown */}
              <div className="relative flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{tr.sortBy}</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bz-search w-full pl-4 pr-10 py-3 rounded-2xl text-sm font-semibold border appearance-none cursor-pointer"
                    style={{ background: '#fff', borderColor: '#e0e0e0', color: '#212121' }}
                  >
                    <option value="default">{lang === 'hi' ? 'डिफ़ॉल्ट' : 'Default'}</option>
                    <option value="popularity">{tr.sortPopularity}</option>
                    <option value="price_low_high">{tr.sortPriceLow}</option>
                    <option value="price_high_low">{tr.sortPriceHigh}</option>
                    <option value="distance">{tr.sortDistance}</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                  </span>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="relative flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {lang === 'hi' ? 'श्रेणी' : 'Category'}
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bz-search w-full pl-4 pr-10 py-3 rounded-2xl text-sm font-semibold border appearance-none cursor-pointer"
                    style={{ background: '#fff', borderColor: '#e0e0e0', color: '#212121' }}
                  >
                    {Object.keys(CATEGORY_EMOJI).map((v) => (
                      <option key={v} value={v}>
                        {CATEGORY_EMOJI[v]} {tr.categories[v]}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border text-xs font-semibold" style={{ borderColor: '#e0e0e0' }}>
              <span className="text-gray-500 font-bold">{lang === 'hi' ? 'फ़िल्टर:' : 'Filters:'}</span>
              
              {/* Price filter dropdown */}
              <div className="relative">
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl px-3 py-2 cursor-pointer font-bold focus:outline-none"
                >
                  <option value="all">{lang === 'hi' ? 'सभी कीमतें' : 'Price: All'}</option>
                  <option value="under100">{lang === 'hi' ? '₹100 से कम' : 'Price: Under ₹100'}</option>
                  <option value="100to500">{lang === 'hi' ? '₹100 - ₹500' : 'Price: ₹100 - ₹500'}</option>
                  <option value="above500">{lang === 'hi' ? '₹500 से अधिक' : 'Price: Over ₹500'}</option>
                </select>
              </div>

              {/* Verified Sellers Toggle */}
              <button
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  verifiedOnly
                    ? 'bg-blue-50 border-[#2874f0] text-[#2874f0]'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'सत्यापित विक्रेता' : 'Verified Sellers'}
              </button>

              {/* In Stock Only Toggle */}
              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  inStockOnly
                    ? 'bg-green-50 border-[#388e3c] text-[#388e3c]'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'स्टॉक में उपलब्ध' : 'In Stock Only'}
              </button>

              {/* Clear filters button if active */}
              {(priceFilter !== 'all' || verifiedOnly || inStockOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceFilter('all');
                    setVerifiedOnly(false);
                    setInStockOnly(false);
                  }}
                  className="text-red-500 hover:text-red-650 ml-auto font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  {lang === 'hi' ? 'रीसेट फ़िल्टर' : 'Reset Filters'}
                </button>
              )}
            </div>

            {/* Results summary */}
            {!loading && (
              <AnimatePresence mode="wait">
                <motion.p key={`rc-${lang}-${processedProducts.length}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }}
                  exit={{ opacity:0 }} transition={{ duration:0.13 }}
                  className="text-xs font-medium" style={{ color:'#b08050' }}>
                  {processedProducts.length === 0
                    ? tr.resultsNone
                    : tr.resultsCount(processedProducts.length)}
                  {selectedCategory !== 'all' && ` · ${tr.categories[selectedCategory]}`}
                  {searchTerm && ` · "${searchTerm}"`}
                </motion.p>
              </AnimatePresence>
            )}
          </motion.div>

          {/* ── PRODUCT GRID ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <motion.div initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }}
              className="rounded-2xl p-8 text-center flex flex-col items-center gap-3"
              style={{ background:'#fff5f5', border:'1px solid #fecaca', color:'#991b1b' }}>
              <AlertTriangle className="w-8 h-8 opacity-60" />
              <p className="text-sm font-semibold">{error}</p>
              <button onClick={fetchProducts}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background:'#fee2e2', color:'#991b1b' }}>
                <RefreshCw className="w-3.5 h-3.5" />
                {tr.tryAgain}
              </button>
            </motion.div>
          ) : processedProducts.length === 0 ? (
            <motion.div initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background:'#f5ede0' }}>
                <Package className="w-9 h-9" style={{ color:'#c8a882' }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.h3 key={`et-${lang}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:.15 }}
                  className="bz-serif text-xl font-black mb-2" style={{ color:'#2c1810' }}>
                  {tr.emptyTitle}
                </motion.h3>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p key={`ed-${lang}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:.15 }}
                  className="text-sm max-w-xs" style={{ color:'#9c7c5a' }}>
                  {tr.emptyDesc}
                </motion.p>
              </AnimatePresence>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSortBy('default');
                  setPriceFilter('all');
                  setVerifiedOnly(false);
                  setInStockOnly(false);
                }}
                className="bz-btn-cart mt-5 px-5 py-2.5 rounded-xl font-bold text-xs text-white">
                {tr.clearFilters}
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              <AnimatePresence>
                {processedProducts.map((product, i) => {
                  const hasDiscount = product.discount > 0;
                  const displayPrice = hasDiscount
                    ? Math.round(product.price * (1 - product.discount / 100))
                    : product.price;
                  const isLow = product.stock > 0 && product.stock <= 5;
                  const isOut = product.stock <= 0;

                  return (
                    <motion.div key={product._id}
                      initial={{ opacity:0, y:18 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, scale:.97 }}
                      transition={{ delay:Math.min(i*0.04,0.28), duration:.35, ease:[0.22,1,0.36,1] }}
                      className="bz-card bg-white rounded-2xl overflow-hidden flex flex-col group text-left">

                      <div className="cursor-pointer flex flex-col flex-1" onClick={() => setSelectedProductDetails(product)}>
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden" style={{ background:'#f5ede0' }}>
                        <img
                          src={product.images?.[0] || FALLBACK_IMG}
                          alt={product.name}
                          className="bz-img w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.businessId?.isVerified && (
                            <span className="flex items-center gap-1 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                              style={{ background:'rgba(37,99,235,.88)', backdropFilter:'blur(4px)' }}>
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              {tr.verified}
                            </span>
                          )}
                          {isOut && (
                            <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                              style={{ background:'rgba(220,38,38,.88)', backdropFilter:'blur(4px)' }}>
                              {tr.outOfStock}
                            </span>
                          )}
                          {isLow && !isOut && (
                            <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
                              style={{ background:'rgba(234,88,12,.88)', backdropFilter:'blur(4px)' }}>
                              {tr.onlyLeft(product.stock)}
                            </span>
                          )}
                        </div>

                        {hasDiscount && (
                          <div className="absolute top-3 right-3 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-lg"
                            style={{ background:'linear-gradient(135deg,#e8620a,#f5a623)' }}>
                            -{product.discount}%
                          </div>
                        )}

                        {/* Category pill */}
                        <div className="absolute bottom-3 left-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-white/90 px-2 py-1 rounded-md"
                            style={{ background:'rgba(0,0,0,.38)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,.12)' }}>
                            {CATEGORY_EMOJI[product.category] || '📦'}
                            {' '}
                            {tr.categories[product.category] || product.category}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="bz-serif font-black text-base leading-snug line-clamp-1 mb-1 text-gray-900">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="text-xs line-clamp-2 leading-relaxed mb-3 text-gray-500">
                            {product.description}
                          </p>
                        )}

                        {/* Price */}
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <span className="flex items-center gap-0.5 font-extrabold text-xl text-gray-900">
                            <IndianRupee className="w-4.5 h-4.5 mt-0.5 shrink-0 text-gray-700" />
                            {displayPrice}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-xs line-through text-gray-400">
                                ₹{product.price}
                              </span>
                              <span className="text-xs font-bold text-[#388e3c]">
                                {product.discount}% off
                              </span>
                            </>
                          )}
                          <span className="text-[11px] font-medium text-gray-500 ml-auto">
                            / {product.unit || 'Kg'}
                          </span>
                        </div>

                        {/* Seller info */}
                        <div className="rounded-xl p-3 mb-4 space-y-2 border border-gray-100 bg-gray-50/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs truncate text-gray-800">
                              {product.businessId?.name || tr.localStore}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0 text-gray-500">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2874f0]" />
                              {product.businessId?.village || tr.nearby}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {product._dist?.val !== 9999 && (
                              <DistanceBadge info={product._dist} tr={tr} />
                            )}
                            {product.businessId?.type && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md capitalize"
                                style={{ background:'#e0f2fe', color:'#0369a1', border:'1px solid rgba(14,165,233,.2)' }}>
                                {product.businessId.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                        <div className="flex flex-col gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button"
                              onClick={() => handleContactSeller(product)}
                              className="bz-btn-call flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-[#2874f0]" />
                              {tr.call}
                            </button>
                            <button type="button"
                              onClick={() => handleChatWithSeller(product)}
                              className="bz-btn-chat flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl">
                              <MessageCircle className="w-3.5 h-3.5 shrink-0 text-[#2874f0]" />
                              {tr.chat}
                            </button>
                          </div>
                          
                          {(() => {

                            // Inline quantity selection mode (before confirming)
                            const selectQty = inlineQtySelect[product._id];
                            if (selectQty !== undefined) {
                              return (
                                <div className="flex items-center justify-between gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 h-[40px] w-full">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setInlineQtySelect(prev => ({ ...prev, [product._id]: Math.max(1, selectQty - 1) }))}
                                      disabled={selectQty <= 1}
                                      className="w-6 h-6 rounded-lg flex items-center justify-center font-black transition-all hover:bg-white text-[#2874f0] disabled:opacity-30"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-extrabold text-sm text-[#212121] w-6 text-center">
                                      {selectQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setInlineQtySelect(prev => ({ ...prev, [product._id]: Math.min(product.stock, selectQty + 1) }))}
                                      disabled={selectQty >= product.stock}
                                      className="w-6 h-6 rounded-lg flex items-center justify-center font-black transition-all hover:bg-white text-[#2874f0] disabled:opacity-30"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addToCart(product, selectQty);
                                      setInlineQtySelect(prev => {
                                        const copy = { ...prev };
                                        delete copy[product._id];
                                        return copy;
                                      });
                                    }}
                                    className="bz-btn-cart text-white font-bold px-3 py-1 rounded-lg text-[10px] flex items-center gap-1 h-[32px] shrink-0"
                                  >
                                    {lang === 'hi' ? 'कन्फर्म' : 'Confirm'}
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button type="button"
                                onClick={() => {
                                  if (!token) {
                                    alert(tr.loginRequired);
                                    return;
                                  }
                                  if (product.businessId?.ownerId === user?._id) {
                                    alert(tr.ownProduct);
                                    return;
                                  }
                                  handleAddToCartClick(product);
                                }}
                                disabled={isOut}
                                className="bz-btn-cart w-full text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 h-[40px]">
                                <ShoppingBag className="w-4 h-4 shrink-0 text-white/80" />
                                {tr.addToCart}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>



      {/* ── FLIPKART-STYLE PRODUCT DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProductDetails && (() => {
          const product = selectedProductDetails;
          const hasDiscount = product.discount > 0;
          const displayPrice = hasDiscount
            ? Math.round(product.price * (1 - product.discount / 100))
            : product.price;
          const isLow = product.stock > 0 && product.stock <= 5;
          const isOut = product.stock <= 0;
          const cartItem = cartItems?.find(item => item._id === product._id);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-6 relative w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col gap-4 border border-gray-100 overflow-hidden"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedProductDetails(null)}
                  className="absolute right-6 top-6 text-gray-400 hover:text-gray-650 transition-colors z-20 p-1.5 rounded-full bg-white hover:bg-gray-100 shadow-md border border-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  {/* Image/Emoji Header */}
                  <div className="relative aspect-video rounded-2xl flex items-center justify-center text-6xl shadow-inner border border-gray-100 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #fbf7f0 0%, #f3ede2 100%)' }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{CATEGORY_EMOJI[product.category] || '📦'}</span>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#e8620a,#f5a623)' }}>
                        -{product.discount}%
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-bold text-white/90 px-2.5 py-1 rounded-md"
                      style={{ background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(4px)' }}>
                      {tr.categories[product.category] || product.category}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="bz-serif font-black text-2xl text-gray-900 leading-snug">
                      {product.name}
                    </h2>

                    {/* Rating placeholder to look like Flipkart */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-[#388e3c] text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-0.5">
                        {product.rating > 0 ? product.rating : '0'} ★
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">
                        {lang === 'hi'
                          ? `${product.totalRatings || 0} रेटिंग और ${product.reviews?.length || 0} समीक्षाएं`
                          : `${product.totalRatings || 0} Ratings & ${product.reviews?.length || 0} Reviews`}
                      </span>
                      {product.businessId?.isVerified && (
                        <span className="flex items-center gap-1 text-[#2874f0] text-[10px] font-bold px-2 py-0.5 bg-blue-50 rounded border border-blue-100 ml-auto">
                          <ShieldCheck className="w-3 h-3" />
                          {tr.verified}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price strip */}
                  <div className="flex items-center flex-wrap gap-2.5 mt-4 border-y py-3.5 border-gray-100">
                    <span className="flex items-center text-3xl font-extrabold text-gray-900">
                      <IndianRupee className="w-5.5 h-5.5 mt-0.5 shrink-0 text-gray-700" />
                      {displayPrice}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-sm line-through text-gray-400 font-semibold">
                          ₹{product.price}
                        </span>
                        <span className="text-sm font-bold text-[#388e3c]">
                          {product.discount}% off
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-500 font-semibold ml-auto">
                      / {product.unit || 'Kg'}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 mt-4">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{lang === 'hi' ? 'उत्पाद विवरण' : 'Product Description'}</span>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border">
                      {product.description || (lang === 'hi' ? 'इस उत्पाद के लिए कोई अतिरिक्त विवरण उपलब्ध नहीं है।' : 'No additional details are available for this product.')}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{lang === 'hi' ? 'विशेष विवरण' : 'Specifications'}</span>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-400 font-semibold">{lang === 'hi' ? 'पैकेज मात्रा' : 'Package Weight'}</div>
                      <div className="text-gray-700 font-bold">1 {product.unit || 'Kg'}</div>
                      <div className="text-gray-400 font-semibold">{lang === 'hi' ? 'श्रेणी' : 'Category'}</div>
                      <div className="text-gray-700 font-bold capitalize">{product.category}</div>
                      <div className="text-gray-400 font-semibold">{lang === 'hi' ? 'स्टॉक स्थिति' : 'Stock Status'}</div>
                      <div className="text-gray-700 font-bold">
                        {isOut ? (
                          <span className="text-red-500">{tr.outOfStock}</span>
                        ) : isLow ? (
                          <span className="text-orange-500">{tr.onlyLeft(product.stock)}</span>
                        ) : (
                          <span className="text-[#388e3c]">{lang === 'hi' ? 'स्टॉक में है' : 'In Stock'} ({product.stock})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller details */}
                  <div className="rounded-xl p-3 border border-gray-150 bg-gray-50/50 mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-gray-800">
                        {lang === 'hi' ? 'विक्रेता: ' : 'Seller: '}{product.businessId?.name || tr.localStore}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#2874f0]" />
                        {product.businessId?.village || tr.nearby}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {product._dist?.val !== 9999 && (
                        <DistanceBadge info={product._dist} tr={tr} />
                      )}
                      {product.businessId?.type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md capitalize"
                          style={{ border: '1px solid rgba(40,116,240,0.1)' }}>
                          {product.businessId.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="space-y-2 mt-4 border-t pt-4 border-gray-150">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                      {lang === 'hi' ? 'ग्राहक समीक्षाएं' : 'Customer Reviews'}
                    </span>
                    
                    {/* Reviews List */}
                    {product.reviews && product.reviews.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {product.reviews.map((rev) => (
                          <div key={rev._id || rev.createdAt} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-800 text-xs">{rev.name}</span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-[11px] leading-normal">{rev.comment}</p>
                            <span className="text-[9px] text-gray-450 block mt-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic text-center py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {lang === 'hi' ? 'कोई समीक्षा नहीं है। पहली समीक्षा लिखें!' : 'No reviews yet. Be the first to review!'}
                      </p>
                    )}

                    {/* Review Form */}
                    {token && product.sellerId !== user?._id && !product.reviews?.some(r => r.userId?.toString() === user?._id?.toString() || r.userId === user?._id) && (
                      <form onSubmit={(e) => handleAddProductReview(e, product._id)} className="mt-3 pt-3 border-t border-gray-150 text-left space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-gray-600 font-sans">{lang === 'hi' ? 'आपकी रेटिंग:' : 'Your Rating:'}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <button
                                key={stars}
                                type="button"
                                onClick={() => setSubmitRatings(prev => ({ ...prev, [product._id]: stars }))}
                                className="p-0 border-0 bg-transparent cursor-pointer flex items-center"
                              >
                                <Star className={`w-4 h-4 transition-colors ${stars <= (submitRatings[product._id] || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={submitComments[product._id] || ''}
                            onChange={(e) => setSubmitComments(prev => ({ ...prev, [product._id]: e.target.value }))}
                            placeholder={lang === 'hi' ? 'समीक्षा लिखें…' : 'Write a review…'}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-[#2874f0] hover:bg-[#1a5ecb] text-white font-bold text-xs px-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center shrink-0 border-0 cursor-pointer"
                          >
                            {lang === 'hi' ? 'पोस्ट' : 'Post'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Actions footer block */}
                <div className="space-y-2 border-t pt-4 mt-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => handleContactSeller(product)}
                      className="bz-btn-call flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-[#2874f0]" />
                      {tr.call}
                    </button>
                    <button type="button"
                      onClick={() => handleChatWithSeller(product)}
                      className="bz-btn-chat flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl">
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 text-[#2874f0]" />
                      {tr.chat}
                    </button>
                  </div>

                  {(() => {

                    // Inline quantity selection mode (before confirming)
                    const selectQty = inlineQtySelect[product._id];
                    if (selectQty !== undefined) {
                      return (
                        <div className="flex items-center justify-between gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 h-[40px] w-full">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInlineQtySelect(prev => ({ ...prev, [product._id]: Math.max(1, selectQty - 1) }))}
                              disabled={selectQty <= 1}
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all hover:bg-white text-[#2874f0] disabled:opacity-30"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-extrabold text-lg text-gray-900">
                              {selectQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setInlineQtySelect(prev => ({ ...prev, [product._id]: Math.min(product.stock, selectQty + 1) }))}
                              disabled={selectQty >= product.stock}
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all hover:bg-white text-[#2874f0] disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(product, selectQty);
                              setInlineQtySelect(prev => {
                                const copy = { ...prev };
                                delete copy[product._id];
                                return copy;
                              });
                            }}
                            className="bz-btn-cart text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 h-[36px] shrink-0"
                          >
                            {lang === 'hi' ? 'कन्फर्म' : 'Confirm'}
                          </button>
                        </div>
                      );
                    }

                     return (
                      <button type="button"
                        onClick={() => {
                          if (!token) {
                            alert(tr.loginRequired);
                            return;
                          }
                          handleAddToCartClick(product);
                        }}
                        disabled={isOut}
                        className="bz-btn-cart w-full text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 h-[40px]">
                        <ShoppingBag className="w-4 h-4 shrink-0 text-white/80" />
                        {tr.addToCart}
                      </button>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
};

export default Marketplace;
