import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CONFIG } from '../utils/constants';
import { 
  Store, PlusCircle, Trash2, MapPin, Phone, IndianRupee, Tag, 
  Clock, ShieldCheck, Loader, X, ClipboardList, MessageSquare, XCircle,
  Search, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRODUCT_IMAGE_PRESETS = [
  { id: 'crops', name: 'Green Crops', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop' },
  { id: 'tomato', name: 'Fresh Tomatoes', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=400&auto=format&fit=crop' },
  { id: 'potato', name: 'Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400&auto=format&fit=crop' },
  { id: 'seeds', name: 'Seeds', url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e3a9?q=80&w=400&auto=format&fit=crop' },
  { id: 'fertilizer', name: 'Fertilizer', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
  { id: 'machinery', name: 'Tractor', url: 'https://images.unsplash.com/photo-1530263118208-8f82314fb536?q=80&w=400&auto=format&fit=crop' },
  { id: 'livestock', name: 'Livestock (Cows)', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop' },
  { id: 'grocery', name: 'Grocery Shop', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop' },
  { id: 'dairy', name: 'Dairy Products', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop' },
  { id: 'healthcare', name: 'Medicines & Health', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop' }
];

const YourShop = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleChatWithBuyer = async (buyerId) => {
    if (!token) return alert(locale === 'hi' ? 'कृपया लॉगइन करें।' : 'Please log in.');
    if (!buyerId) return alert(locale === 'hi' ? 'खरीदार का विवरण नहीं मिला।' : 'Buyer details missing.');
    if (buyerId.toString() === user?._id?.toString()) {
      return alert(locale === 'hi' ? 'आप खुद से चैट नहीं कर सकते।' : 'You cannot chat with yourself.');
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: buyerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'खरीदार के साथ चैट शुरू करने में विफल।' : 'Failed to start chat with the buyer.');
    }
  };

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Multiple businesses states
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);

  // Text-based Location Geocoding States
  const [locationName, setLocationName] = useState('');
  const [resolvedCoords, setResolvedCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);

  // Tabs and Orders states
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const socket = useSocket();
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('all');
  const [prodStockFilter, setProdStockFilter] = useState('all');

  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const processedProducts = React.useMemo(() => {
    return products
      .filter(p => {
        const s = prodSearchTerm.toLowerCase();
        return (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s);
      })
      .filter(p => prodCatFilter === 'all' || p.category === prodCatFilter)
      .filter(p => {
        if (prodStockFilter === 'all') return true;
        if (prodStockFilter === 'inStock') return p.stock > 0;
        if (prodStockFilter === 'lowStock') return p.stock > 0 && p.stock <= 5;
        if (prodStockFilter === 'outOfStock') return p.stock <= 0;
        return true;
      });
  }, [products, prodSearchTerm, prodCatFilter, prodStockFilter]);

  const processedOrders = React.useMemo(() => {
    return incomingOrders
      .filter(o => {
        const s = orderSearchTerm.toLowerCase();
        const buyerName = (o.buyerId?.fullName || '').toLowerCase();
        const contactNum = (o.contactNumber || '').toLowerCase();
        const regMobile = (o.buyerId?.mobile || '').toLowerCase();
        return buyerName.includes(s) || contactNum.includes(s) || regMobile.includes(s);
      })
      .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter);
  }, [incomingOrders, orderSearchTerm, orderStatusFilter]);

  // Business type mapping labels
  const getBusinessTypeLabel = (type) => {
    const mapping = {
      agri_equipment: locale === 'hi' ? 'कृषि उपकरण' : 'Agri Equipment',
      fertilizer: locale === 'hi' ? 'उर्वरक और बीज' : 'Fertilizers & Seeds',
      grocery: locale === 'hi' ? 'किराना दुकान' : 'Grocery Shop',
      dairy: locale === 'hi' ? 'डेयरी' : 'Dairy',
      medical: locale === 'hi' ? 'दवा की दुकान' : 'Medical Store',
      clinic: locale === 'hi' ? 'क्लिनिक / अस्पताल' : 'Clinic / Hospital',
      electronics: locale === 'hi' ? 'इलेक्ट्रॉनिक्स स्टोर' : 'Electronics Store',
      mobile_repair: locale === 'hi' ? 'मोबाइल रिपेयरिंग' : 'Mobile Repairing',
      cyber_cafe: locale === 'hi' ? 'इंटरनेट कैफे' : 'Cyber Cafe',
      restaurant: locale === 'hi' ? 'होटल / भोजन स्टोर' : 'Hotel / Food Store',
      hardware: locale === 'hi' ? 'हार्डवेयर दुकान' : 'Hardware Shop',
      salon: locale === 'hi' ? 'सैलून / पार्लर' : 'Salon / Parlour',
      other: locale === 'hi' ? 'अन्य व्यवसाय' : 'Other Business'
    };
    return mapping[type] || type;
  };

  // Product category mapping labels
  const getProductCategoryLabel = (cat) => {
    const mapping = {
      crops: locale === 'hi' ? 'ताजी फसलें' : 'Fresh Crops',
      seeds: locale === 'hi' ? 'बीज' : 'Seeds',
      machinery: locale === 'hi' ? 'मशीनरी' : 'Machinery',
      livestock: locale === 'hi' ? 'पशुधन' : 'Livestock',
      fertilizer: locale === 'hi' ? 'उर्वरक/खाद' : 'Fertilizers',
      grocery: locale === 'hi' ? 'किराना' : 'Grocery',
      dairy: locale === 'hi' ? 'डेयरी' : 'Dairy',
      healthcare: locale === 'hi' ? 'दवाइयाँ और स्वास्थ्य' : 'Medicines & Health',
      other: locale === 'hi' ? 'अन्य' : 'Other'
    };
    return mapping[cat] || cat;
  };

  // Reverse-geocode coordinates to locationName via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (response.data) {
        if (response.data.display_name) {
          return response.data.display_name;
        }
        const address = response.data.address;
        const parts = [];
        if (address.village || address.suburb || address.town || address.city) {
          parts.push(address.village || address.suburb || address.town || address.city);
        }
        if (address.county || address.district) {
          parts.push(address.county || address.district);
        }
        if (address.state) {
          parts.push(address.state);
        }
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      return `${lat}, ${lng}`;
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return `${lat}, ${lng}`;
    }
  };

  // Forward-geocode locationName to coordinates via OpenStreetMap Nominatim
  const forwardGeocode = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      if (response.data && response.data.length > 0) {
        const item = response.data[0];
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      }
      return null;
    } catch (err) {
      console.error("Forward geocoding failed:", err);
      return null;
    }
  };

  // Fetch live geolocation dynamically & reverse lookup to parse address parts
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.gpsError') || "Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoSuccess(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setResolvedCoords({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const villageName = addr.village || addr.suburb || addr.town || addr.city_district || addr.locality || '';
            const districtName = addr.district || addr.county || addr.city || '';
            const stateName = addr.state || '';
            const combined = [villageName, districtName, stateName].filter(Boolean).join(', ');
            
            setBusinessForm(prev => ({
              ...prev,
              village: combined || prev.village,
              district: '',
              state: ''
            }));
            setGeoSuccess(true);
            alert(t('location.success') || "Location details resolved successfully!");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert(t('location.error') || "Failed to resolve address name. Please fill manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error.message || error);
        alert(t('location.gpsError') || "Failed to retrieve live location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lng: position.coords.longitude,
            lat: position.coords.latitude
          });
        },
        (error) => {
          if (user?.location?.coordinates?.length === 2) {
            setUserCoords({
              lng: user.location.coordinates[0],
              lat: user.location.coordinates[1]
            });
          }
        }
      );
    } else if (user?.location?.coordinates?.length === 2) {
      setUserCoords({
        lng: user.location.coordinates[0],
        lat: user.location.coordinates[1]
      });
    }
  }, [user]);

  // Pre-populate registration fields from logged-in user profile
  useEffect(() => {
    if (user && !shop) {
      const combined = [user.village, user.district, user.state].filter(Boolean).join(', ');
      setBusinessForm(prev => ({
        ...prev,
        whatsapp: prev.whatsapp || user.mobile || '',
        village: prev.village || combined || '',
        district: '',
        state: ''
      }));
      if (user.location?.coordinates?.length === 2) {
        setResolvedCoords({
          lng: user.location.coordinates[0],
          lat: user.location.coordinates[1]
        });
      }
    }
  }, [user, shop]);

  // Business Form Data
  const [businessForm, setBusinessForm] = useState({
    name: '',
    type: 'fertilizer',
    description: '',
    address: '',
    whatsapp: '',
    timing: '9 AM - 6 PM',
    village: '',
    district: '',
    state: '',
  });

  // Product Form Data
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'crops',
    price: '',
    originalPrice: '',
    discount: 0,
    stock: 1,
    unit: 'Kg',
    imageUrl: PRODUCT_IMAGE_PRESETS[0].url,
  });

  // Load Shop and Products
  const loadShopData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      // Get all user's businesses
      const busRes = await axios.get(`${CONFIG.API_BASE_URL}/api/market/my-businesses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bizList = busRes.data || [];
      setBusinesses(bizList);

      if (bizList.length > 0) {
        let activeBiz = bizList[0];
        if (selectedBusinessId) {
          const found = bizList.find(b => b._id === selectedBusinessId);
          if (found) activeBiz = found;
        }

        setSelectedBusinessId(activeBiz._id);
        setShop(activeBiz);
        setIsRegisteringNew(false);

        // Fetch all products to filter shopkeeper's products
        const prodRes = await axios.get(`${CONFIG.API_BASE_URL}/api/market/products`);
        const filtered = prodRes.data.filter(
          p => p.businessId?._id === activeBiz._id
        );
        setProducts(filtered);
        await fetchIncomingOrders(activeBiz._id); // Fetch orders too
      } else {
        setShop(null);
        setProducts([]);
        setIsRegisteringNew(true);
      }
    } catch (err) {
      console.error(err);
      setError(t('yourShop.loadShopFail'));
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingOrders = async (bizId) => {
    if (!token) return;
    const activeBizId = bizId || selectedBusinessId;
    if (!activeBizId) return;
    try {
      setOrdersLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/market/orders/shopkeeper?businessId=${activeBizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomingOrders(res.data);
    } catch (err) {
      console.error("Failed to load incoming orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [token, selectedBusinessId]);

  // Live order updates via socket
  useEffect(() => {
    if (socket) {
      const handleLiveOrder = (data) => {
        if (data.type === 'NEW_ORDER') {
          // Verify if new order belongs to selected business
          if (data.order && data.order.businessId === selectedBusinessId) {
            setIncomingOrders(prev => [data.order, ...prev]);
          }
        }
      };
      socket.on('notification', handleLiveOrder);
      return () => {
        socket.off('notification', handleLiveOrder);
      };
    }
  }, [socket, selectedBusinessId]);

  // Pre-select healthcare category for clinics & medical stores
  useEffect(() => {
    if (modalOpen && shop) {
      if (shop.type === 'clinic' || shop.type === 'medical') {
        setProductForm(prev => ({
          ...prev,
          category: 'healthcare',
          imageUrl: PRODUCT_IMAGE_PRESETS.find(p => p.id === 'healthcare')?.url || prev.imageUrl
        }));
      }
    }
  }, [modalOpen, shop]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/market/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncomingOrders(prev => prev.map(o => o._id === orderId ? res.data : o));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('yourShop.updateOrderFail'));
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!cancelOrderId) return;
    try {
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/market/orders/${cancelOrderId}/status`,
        { status: 'cancelled', cancelReason: cancelReasonText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncomingOrders(prev => prev.map(o => o._id === cancelOrderId ? res.data : o));
      setCancelOrderId(null);
      setCancelReasonText('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('yourShop.updateOrderFail'));
    }
  };

  // Handle Business Registration
  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    try {
      const parts = businessForm.village.split(',').map(p => p.trim());
      const villageVal = parts[0] || '';
      const districtVal = parts[1] || '';
      const stateVal = parts.slice(2).join(', ') || '';

      const payload = {
        ...businessForm,
        village: villageVal,
        district: districtVal,
        state: stateVal,
        contactNumber: businessForm.whatsapp
      };

      // Forward-geocode locationName if we don't have resolvedCoords
      let finalCoords = resolvedCoords;
      if (!finalCoords && businessForm.village) {
        const query = businessForm.village;
        const geocoded = await forwardGeocode(query);
        if (geocoded) {
          finalCoords = geocoded;
        }
      }

      if (finalCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [finalCoords.lng, finalCoords.lat]
        };
      }

      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/market/business`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBusinessForm({
        name: '',
        type: 'fertilizer',
        description: '',
        address: '',
        whatsapp: '',
        timing: '9 AM - 6 PM',
        village: '',
        district: '',
        state: '',
      });
      setResolvedCoords(null);
      setGeoSuccess(false);

      setSelectedBusinessId(res.data._id);
      setIsRegisteringNew(false);
      await loadShopData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || t('yourShop.registerFail'));
    } finally {
      setActionLoading(false);
    }
  };

  // Pricing calculations
  const handlePriceChange = (priceVal) => {
    const price = parseFloat(priceVal) || 0;
    const originalPrice = parseFloat(productForm.originalPrice) || 0;
    let discount = productForm.discount;
    if (originalPrice > 0) {
      if (price >= originalPrice) {
        discount = 0;
      } else {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }
    }
    setProductForm(prev => ({ ...prev, price: priceVal, discount }));
  };

  const handleOriginalPriceChange = (origPriceVal) => {
    const originalPrice = parseFloat(origPriceVal) || 0;
    const price = parseFloat(productForm.price) || 0;
    let discount = productForm.discount;
    if (originalPrice > 0) {
      if (price > 0) {
        if (price >= originalPrice) {
          discount = 0;
        } else {
          discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        }
      } else if (discount > 0) {
        const calculatedPrice = Math.round(originalPrice * (1 - discount / 100));
        setProductForm(prev => ({
          ...prev,
          originalPrice: origPriceVal,
          price: calculatedPrice.toString()
        }));
        return;
      }
    } else {
      discount = 0;
    }
    setProductForm(prev => ({ ...prev, originalPrice: origPriceVal, discount }));
  };

  const handleDiscountChange = (discountVal) => {
    const discount = parseFloat(discountVal) || 0;
    const originalPrice = parseFloat(productForm.originalPrice) || 0;
    if (originalPrice > 0) {
      const calculatedPrice = Math.round(originalPrice * (1 - discount / 100));
      setProductForm(prev => ({
        ...prev,
        discount: discountVal,
        price: calculatedPrice.toString()
      }));
    } else {
      setProductForm(prev => ({ ...prev, discount: discountVal }));
    }
  };

  const handleCategoryChange = (category) => {
    const matchingPreset = PRODUCT_IMAGE_PRESETS.find(p => p.id === category);
    setProductForm(prev => ({
      ...prev,
      category,
      imageUrl: prev.imageUrl && !PRODUCT_IMAGE_PRESETS.some(p => p.url === prev.imageUrl) 
        ? prev.imageUrl 
        : (matchingPreset ? matchingPreset.url : prev.imageUrl)
    }));
  };

  // Handle Local Image Upload with compression and optional Cloudinary upload
  const handleLocalImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_SIZE = 500;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        
        // Cloudinary upload if config is present
        if (CONFIG.CLOUDINARY_CLOUD_NAME && CONFIG.CLOUDINARY_UPLOAD_PRESET) {
          setImageUploading(true);
          try {
            const formData = new FormData();
            formData.append('file', compressedBase64);
            formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`,
              {
                method: 'POST',
                body: formData
              }
            );
            
            if (!response.ok) {
              throw new Error('Cloudinary response error');
            }
            
            const data = await response.json();
            setProductForm(prev => ({
              ...prev,
              imageUrl: data.secure_url
            }));
          } catch (err) {
            console.error('Cloudinary upload failed, falling back to base64:', err);
            setProductForm(prev => ({
              ...prev,
              imageUrl: compressedBase64
            }));
          } finally {
            setImageUploading(false);
          }
        } else {
          setProductForm(prev => ({
            ...prev,
            imageUrl: compressedBase64
          }));
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    try {
      const origPriceNum = parseFloat(productForm.originalPrice) || 0;
      const priceNum = parseFloat(productForm.price) || 0;
      const discountNum = parseFloat(productForm.discount) || 0;
      const submitPrice = (origPriceNum > 0 && discountNum > 0) ? origPriceNum : priceNum;

      await axios.post(
        `${CONFIG.API_BASE_URL}/api/market/product`,
        {
          ...productForm,
          price: submitPrice,
          originalPrice: origPriceNum > 0 ? origPriceNum : undefined,
          discount: discountNum,
          businessId: shop?._id,
          images: [productForm.imageUrl || PRODUCT_IMAGE_PRESETS[0].url]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalOpen(false);
      setProductForm({
        name: '',
        description: '',
        category: 'crops',
        price: '',
        originalPrice: '',
        discount: 0,
        stock: 1,
        unit: 'Kg',
        imageUrl: PRODUCT_IMAGE_PRESETS[0].url,
      });
      await loadShopData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || t('yourShop.addProductFail'));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(t('yourShop.deleteConfirm'))) return;
    try {
      await axios.delete(`${CONFIG.API_BASE_URL}/api/market/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove product locally
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('yourShop.deleteProductFail'));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-emerald-200" />
            {t('yourShop.title')}
          </h1>
          <p className="text-emerald-100 text-lg opacity-90">
            {shop && !isRegisteringNew ? t('yourShop.manageDetails').replace('{{name}}', shop.name) : t('yourShop.registerDesc')}
          </p>
        </div>
        {shop && !isRegisteringNew && (
          <button 
            onClick={() => {
              setModalError('');
              setModalOpen(true);
            }}
            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-lg transform hover:-translate-y-1"
          >
            <PlusCircle className="w-5 h-5" />
            {t('yourShop.addProduct')}
          </button>
        )}
      </div>

      {/* Business Switcher & Add Button Bar */}
      {businesses.length > 0 && !isRegisteringNew && (
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <Store className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
              {t('yourBusiness.selectBusiness')}
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="flex-1 sm:flex-none p-2.5 rounded-xl bg-gray-50 border border-gray-250 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-450 font-bold text-gray-800"
            >
              {businesses.map((biz) => (
                <option key={biz._id} value={biz._id}>
                  {biz.name} ({getBusinessTypeLabel(biz.type)})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsRegisteringNew(true)}
            className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-emerald-150 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            {t('yourBusiness.registerAnotherBusiness')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-emerald-600 w-12 h-12" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 font-semibold">{error}</div>
      ) : isRegisteringNew ? (
        /* SHOP REGISTRATION CARD FORM */
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto glass-card bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="text-center mb-6">
            <Store className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800">{t('yourShop.registerTitle')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('yourShop.registerSubtitle')}</p>
          </div>

          {modalError && (
            <div className="bg-red-50 text-red-650 border border-red-200 p-3 rounded-xl text-sm font-medium mb-4">
              {modalError}
            </div>
          )}

          <form onSubmit={handleRegisterBusiness} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.shopName')}</label>
              <input 
                type="text" 
                required
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                placeholder={t('yourShop.shopNamePlaceholder')}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.businessType')}</label>
                <select
                  value={businessForm.type}
                  onChange={(e) => setBusinessForm({ ...businessForm, type: e.target.value })}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 font-medium"
                >
                  <option value="agri_equipment" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('agri_equipment')}</option>
                  <option value="fertilizer" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('fertilizer')}</option>
                  <option value="grocery" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('grocery')}</option>
                  <option value="dairy" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('dairy')}</option>
                  <option value="medical" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('medical')}</option>
                  <option value="clinic" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('clinic')}</option>
                  <option value="electronics" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('electronics')}</option>
                  <option value="mobile_repair" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('mobile_repair')}</option>
                  <option value="cyber_cafe" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('cyber_cafe')}</option>
                  <option value="restaurant" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('restaurant')}</option>
                  <option value="hardware" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('hardware')}</option>
                  <option value="salon" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('salon')}</option>
                  <option value="other" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('other')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-655 text-left block">{t('yourShop.contactNumber')}</label>
                <input 
                  type="text" 
                  required
                  maxLength="10"
                  value={businessForm.whatsapp}
                  onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })}
                  placeholder={t('yourShop.contactPlaceholder')}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.workingHours')}</label>
                <input 
                  type="text" 
                  value={businessForm.timing}
                  onChange={(e) => setBusinessForm({ ...businessForm, timing: e.target.value })}
                  placeholder={t('yourShop.workingHoursPlaceholder')}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.shopAddress')}</label>
                <input 
                  type="text" 
                  required
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  placeholder={t('yourShop.addressPlaceholder')}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Geolocation Section */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-700">{t('location.title') || "Location Name details"}</span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-75 cursor-pointer border-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {geoLoading ? (t('location.detecting') || 'Detecting...') : (t('location.detectBtn') || 'Detect Location Name')}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.singleLabel')}</label>
                <input 
                  type="text" 
                  required
                  value={businessForm.village}
                  onChange={(e) => setBusinessForm({ ...businessForm, village: e.target.value })}
                  placeholder={t('location.villagePlaceholder') || "e.g. Village, District, State"}
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.aboutBusiness')}</label>
              <textarea 
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                placeholder={t('yourShop.aboutPlaceholder')}
                rows="3"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-left"
              ></textarea>
            </div>

            <div className="flex gap-4">
              {businesses.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setIsRegisteringNew(false)}
                  className="flex-1 bg-gray-150 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-250 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button 
                type="submit" 
                disabled={actionLoading}
                className="flex-1 bg-emerald-500 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-75"
              >
                {actionLoading && <Loader className="animate-spin w-5 h-5" />}
                {t('yourShop.registerBtn')}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* SHOP PRODUCTS DASHBOARD */
        <div className="space-y-6">
          {/* Shop Info Card */}
          <div className="glass-card bg-white p-6 rounded-3xl border border-gray-100 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-800">{shop.name}</h2>
                {shop.isVerified && (
                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('yourShop.verified')}
                  </span>
                )}
                <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 capitalize">
                  {getBusinessTypeLabel(shop.type)}
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-2xl">{shop.description || (locale === 'hi' ? 'कोई विवरण नहीं जोड़ा गया।' : 'No description added yet.')}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-500" /> {shop.address}, {shop.village}</span>
                {shop.timing && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-500" /> {t('yourShop.hours')}{shop.timing}
                  </span>
                )}
                {shop.whatsapp && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-emerald-500" /> {t('yourShop.whatsapp')}{shop.whatsapp}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-4 border-b border-gray-200 pb-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'products'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('yourShop.listedProducts').replace('{{count}}', products.length)}
            </button>
            <button
              onClick={() => {
                setActiveTab('orders');
                fetchIncomingOrders();
              }}
              className={`px-4 py-2 font-bold text-sm transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('yourShop.incomingOrders').replace('{{count}}', incomingOrders.filter(o => o.status === 'pending' || o.status === 'accepted').length)}
            </button>
          </div>

          {/* Tab 1: Products */}
          {activeTab === 'products' && (
            products.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                <Store className="w-16 h-16 text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700 mb-1">{t('yourShop.noProducts')}</h4>
                <p className="text-gray-505 text-sm mb-4">{t('yourShop.noProductsDesc')}</p>
                <button 
                  onClick={() => setModalOpen(true)}
                  className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-md"
                >
                  <PlusCircle className="w-4 h-4" /> {t('yourShop.addProductNow')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Products Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm text-xs font-semibold text-left">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={isEn ? 'Search products by name or desc...' : 'उत्पाद का नाम या विवरण खोजें...'}
                      value={prodSearchTerm}
                      onChange={e => setProdSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-205 focus:outline-none focus:ring-2 focus:ring-emerald-450 shadow-xs text-xs font-semibold"
                    />
                    {prodSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setProdSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 border-0 bg-transparent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={prodCatFilter}
                      onChange={e => setProdCatFilter(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">{isEn ? 'All Categories' : 'सभी श्रेणियां'}</option>
                      <option value="crops">{getProductCategoryLabel('crops')}</option>
                      <option value="seeds">{getProductCategoryLabel('seeds')}</option>
                      <option value="machinery">{getProductCategoryLabel('machinery')}</option>
                      <option value="livestock">{getProductCategoryLabel('livestock')}</option>
                      <option value="fertilizer">{getProductCategoryLabel('fertilizer')}</option>
                      <option value="grocery">{getProductCategoryLabel('grocery')}</option>
                      <option value="dairy">{getProductCategoryLabel('dairy')}</option>
                      <option value="other">{getProductCategoryLabel('other')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={prodStockFilter}
                      onChange={e => setProdStockFilter(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">{isEn ? 'All Stock Levels' : 'सभी स्टॉक स्तर'}</option>
                      <option value="inStock">{isEn ? 'In Stock' : 'स्टॉक में उपलब्ध'}</option>
                      <option value="lowStock">{isEn ? 'Low Stock (<= 5)' : 'कम स्टॉक (<= 5)'}</option>
                      <option value="outOfStock">{isEn ? 'Out of Stock' : 'स्टॉक खत्म'}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {(prodSearchTerm || prodCatFilter !== 'all' || prodStockFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setProdSearchTerm('');
                        setProdCatFilter('all');
                        setProdStockFilter('all');
                      }}
                      className="text-red-500 hover:text-red-650 font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      {isEn ? 'Clear' : 'साफ करें'}
                    </button>
                  )}
                </div>

                {processedProducts.length === 0 ? (
                  <div className="glass-card p-12 text-center text-gray-405 font-bold border border-gray-150 rounded-2xl bg-white">
                    {isEn ? 'No products match your filters.' : 'कोई उत्पाद आपके फ़िल्टर से मेल नहीं खाता।'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {processedProducts.map((product) => {
                      const hasDiscount = product.discount > 0;
                      const discountedPrice = hasDiscount 
                        ? Math.round(product.price * (1 - product.discount / 100))
                        : product.price;

                      return (
                        <div key={product._id} className="glass-card bg-white flex flex-col overflow-hidden rounded-2xl border border-gray-150 shadow-sm relative group hover:shadow-lg transition-all text-left">
                          {/* Image */}
                          <div className="relative h-44 overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img 
                              src={product.images?.[0] || PRODUCT_IMAGE_PRESETS[0].url} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {hasDiscount && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {product.discount}% OFF
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                            <div className="text-[10px] text-gray-455 font-bold uppercase tracking-wider mb-2">{getProductCategoryLabel(product.category)}</div>
                            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">{product.description || (locale === 'hi' ? 'कोई विवरण नहीं।' : 'No description.')}</p>
                            
                            {/* Stock Indicator */}
                            <div className="mb-4 text-xs font-semibold">
                              {product.stock <= 0 ? (
                                <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{isEn ? 'Out of Stock' : 'स्टॉक खत्म'}</span>
                              ) : product.stock <= 5 ? (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{isEn ? `Low Stock (${product.stock})` : `कम स्टॉक (${product.stock})`}</span>
                              ) : (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{isEn ? `In Stock (${product.stock})` : `स्टॉक में (${product.stock})`}</span>
                              )}
                            </div>

                            <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-gray-400 block">{locale === 'hi' ? 'कीमत' : 'Price'}</span>
                                <div className="flex items-center text-emerald-600 font-bold text-lg">
                                  <IndianRupee className="w-4 h-4" />
                                  {discountedPrice}
                                  <span className="text-xs text-gray-400 font-normal ml-0.5">/{product.unit}</span>
                                  {hasDiscount && (
                                    <span className="text-xs text-gray-300 line-through ml-1.5 font-normal">₹{product.price}</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                className="bg-red-50 hover:bg-red-100 text-red-650 p-2.5 rounded-xl transition-colors border border-red-150 cursor-pointer"
                                title={locale === 'hi' ? 'उत्पाद हटाएं' : 'Delete Product'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {/* Tab 2: Incoming Orders */}
          {activeTab === 'orders' && (
            ordersLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader className="animate-spin text-emerald-600 w-12 h-12" />
              </div>
            ) : incomingOrders.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700 mb-1">{t('yourShop.noOrders')}</h4>
                <p className="text-gray-550 text-sm">{t('yourShop.noOrdersDesc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orders Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm text-xs font-semibold text-left">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={isEn ? 'Search orders by buyer name, contact...' : 'खरीदार का नाम या संपर्क खोजें...'}
                      value={orderSearchTerm}
                      onChange={e => setOrderSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-205 focus:outline-none focus:ring-2 focus:ring-emerald-450 shadow-xs text-xs font-semibold"
                    />
                    {orderSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 border-0 bg-transparent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={orderStatusFilter}
                      onChange={e => setOrderStatusFilter(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">{isEn ? 'All Statuses' : 'सभी स्थितियां'}</option>
                      <option value="pending">{t('yourShop.orderStatus.pending')}</option>
                      <option value="accepted">{t('yourShop.orderStatus.accepted')}</option>
                      <option value="completed">{t('yourShop.orderStatus.completed')}</option>
                      <option value="cancelled">{t('yourShop.orderStatus.cancelled')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {(orderSearchTerm || orderStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderSearchTerm('');
                        setOrderStatusFilter('all');
                      }}
                      className="text-red-500 hover:text-red-650 font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      {isEn ? 'Clear' : 'साफ करें'}
                    </button>
                  )}
                </div>

                {processedOrders.length === 0 ? (
                  <div className="glass-card p-12 text-center text-gray-405 font-bold border border-gray-150 rounded-2xl bg-white">
                    {isEn ? 'No orders match your filters.' : 'कोई ऑर्डर आपके फ़िल्टर से मेल नहीं खाता।'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {processedOrders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
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
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-50 pb-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-800">
                            {locale === 'hi' ? 'खरीदार:' : 'Buyer:'} {order.buyerId?.fullName || (locale === 'hi' ? 'अनाम ग्रामीण' : 'Anonymous Villager')}
                          </h4>
                          <div className="flex gap-4 text-xs text-gray-400 mt-0.5">
                            <span>{locale === 'hi' ? 'समय:' : 'Placed:'} {orderDate}</span>
                            <span>{locale === 'hi' ? 'ऑर्डर आईडी:' : 'Order ID:'} <b className="text-gray-600 font-mono">{order._id.substring(order._id.length - 8).toUpperCase()}</b></span>
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                            order.status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : order.status === 'accepted'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {t('yourShop.orderStatus.' + order.status)}
                          </span>
                        </div>
                      </div>

                      {order.status === 'cancelled' && order.cancelReason && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-700 space-y-1 text-left">
                          <div>
                            <span className="font-bold text-red-800">{locale === 'hi' ? 'रद्द होने का कारण: ' : 'Cancellation Reason: '}</span>
                            <span className="font-medium">{order.cancelReason}</span>
                          </div>
                          {order.cancelledBy && (
                            <span className="block text-[10px] text-gray-500 italic">
                              {order.cancelledBy === 'seller' 
                                ? (locale === 'hi' ? '*आपके द्वारा रद्द किया गया' : '*Cancelled by you')
                                : (locale === 'hi' ? '*खरीदार द्वारा रद्द किया गया' : '*Cancelled by buyer')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm py-1">
                            <span className="text-gray-700 font-medium">
                              {item.name} <span className="text-xs text-gray-400 ml-1">x {item.quantity} {item.unit}</span>
                            </span>
                            <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Info & Contacts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-500">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-600 block">🚚 {locale === 'hi' ? 'वितरण का पता' : 'Delivery Address'}</span>
                          <p className="leading-relaxed">{order.shippingAddress}</p>
                          {order.location?.coordinates && order.location.coordinates.length === 2 && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${order.location.coordinates[1]},${order.location.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                            >
                              📍 {locale === 'hi' ? 'मानचित्र नेविगेशन देखें' : 'View Map Navigation'}
                            </a>
                          )}
                        </div>
                        <div className="space-y-1 md:border-l md:border-gray-200 md:pl-4">
                          <span className="font-bold text-gray-600 block">📞 {locale === 'hi' ? 'संपर्क जानकारी' : 'Contact Information'}</span>
                          <p>{locale === 'hi' ? 'खरीदार संपर्क:' : 'Buyer Contact:'} <a href={`tel:${order.contactNumber}`} className="text-emerald-600 font-bold hover:underline">{order.contactNumber}</a></p>
                          {order.buyerId?.mobile && order.buyerId.mobile !== order.contactNumber && (
                            <p>{locale === 'hi' ? 'पंजीकृत फोन:' : 'Buyer Register Phone:'} <a href={`tel:${order.buyerId.mobile}`} className="text-emerald-600 hover:underline">{order.buyerId.mobile}</a></p>
                          )}
                          {order.buyerId?._id && order.buyerId._id !== user?._id && (
                            <button
                              type="button"
                              onClick={() => handleChatWithBuyer(order.buyerId._id)}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-205 text-[10px] font-bold mt-2 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> {locale === 'hi' ? 'खरीदार के साथ चैट करें' : 'Chat with Buyer'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Revenue and Status Updates */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2">
                        <div className="flex items-end gap-1.5">
                          <span className="text-xs text-gray-400">{locale === 'hi' ? 'कुल आय:' : 'Total Revenue:'}</span>
                          <span className="text-lg font-extrabold text-amber-600 flex items-center">
                            <IndianRupee className="w-4 h-4" /> {order.totalAmount}
                          </span>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setCancelOrderId(order._id);
                                  setCancelReasonText(locale === 'hi' ? 'लंबी दूरी / डिलीवरी क्षेत्र से बाहर' : 'Delivery address too far / Long distance');
                                }}
                                className="flex-1 md:flex-none bg-red-50 hover:bg-red-150 text-red-600 border border-red-150 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                              >
                                {locale === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order._id, 'accepted')}
                                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                              >
                                {locale === 'hi' ? 'ऑर्डर स्वीकार करें' : 'Accept Order'}
                              </button>
                            </>
                          )}

                          {order.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => {
                                  setCancelOrderId(order._id);
                                  setCancelReasonText(locale === 'hi' ? 'लंबी दूरी / डिलीवरी क्षेत्र से बाहर' : 'Delivery address too far / Long distance');
                                }}
                                className="flex-1 md:flex-none bg-red-50 hover:bg-red-150 text-red-600 border border-red-150 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                              >
                                {locale === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order._id, 'completed')}
                                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                              >
                                {locale === 'hi' ? 'पूर्ण मार्क करें' : 'Mark Completed'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Modal - Add Product */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-gray-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-200" />
                    {locale === 'hi' ? 'बेचने के लिए उत्पाद जोड़ें' : 'Add Product to Sell'}
                  </h3>
                  <p className="text-xs text-emerald-100 opacity-95">{locale === 'hi' ? 'दुकान:' : 'Store:'} {shop?.name}</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {modalError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-sm font-medium mb-4">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.productName')}</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. Organic Seeds"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.category')}</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 font-medium"
                      >
                        <option value="crops" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('crops')}</option>
                        <option value="seeds" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('seeds')}</option>
                        <option value="machinery" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('machinery')}</option>
                        <option value="livestock" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('livestock')}</option>
                        <option value="fertilizer" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('fertilizer')}</option>
                        <option value="grocery" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('grocery')}</option>
                        <option value="dairy" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('dairy')}</option>
                        <option value="healthcare" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('healthcare')}</option>
                        <option value="other" className="bg-white text-gray-800 font-medium">{getProductCategoryLabel('other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.price')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={productForm.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="150"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.unitBasis')}</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        placeholder="e.g. Kg, Litre"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.stockCount')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="10"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.originalPrice')}</label>
                      <input 
                        type="number" 
                        value={productForm.originalPrice}
                        onChange={(e) => handleOriginalPriceChange(e.target.value)}
                        placeholder="MRP / Original"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourShop.discount')}</label>
                      <input 
                        type="number" 
                        min="0"
                        max="99"
                        value={productForm.discount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('yourShop.productDesc')}</label>
                    <textarea 
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder={t('yourShop.productDescPlaceholder')}
                      rows="3"
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">{t('yourShop.imageSelection')}</label>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-150">
                      {PRODUCT_IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, imageUrl: preset.url })}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            productForm.imageUrl === preset.url
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[8px] text-white text-center truncate px-1">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{t('yourShop.browseLocal')}</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLocalImageUpload}
                          className="w-full p-1 bg-gray-50 border border-gray-200 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{t('yourShop.orCustomUrl')}</label>
                        <input 
                          type="url" 
                          value={productForm.imageUrl}
                          onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                    {productForm.imageUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                          <img
                            src={productForm.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = PRODUCT_IMAGE_PRESETS[0].url; }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {imageUploading ? (
                            <span className="text-blue-500 font-semibold flex items-center gap-1 animate-pulse">
                              {locale === 'hi' ? '⏳ क्लाउड में सहेज रहे हैं...' : '⏳ Storing in Cloud...'}
                            </span>
                          ) : productForm.imageUrl.startsWith('data:') ? (
                            locale === 'hi' ? 'स्थानीय छवि लोड की गई (डेटाबेस स्टोरेज)' : 'Local Image Loaded (Database Storage)'
                          ) : productForm.imageUrl.includes('cloudinary') ? (
                            locale === 'hi' ? '🟢 क्लाउड में सफलतापूर्वक सहेजा गया' : '🟢 Cloud Stored Successfully'
                          ) : (
                            productForm.imageUrl
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={actionLoading || imageUploading}
                    className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-75"
                  >
                    {actionLoading && <Loader className="animate-spin w-5 h-5" />}
                    {t('yourShop.listProductBtn')}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {cancelOrderId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-gray-100 p-6 space-y-4 text-left"
            >
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                {locale === 'hi' ? 'ऑर्डर रद्द करने का कारण चुनें' : 'Select Cancellation Reason'}
              </h3>
              
              <div className="space-y-3 pt-2">
                {[
                  { id: 'distance', label: locale === 'hi' ? 'लंबी दूरी / डिलीवरी क्षेत्र से बाहर' : 'Delivery address too far / Long distance' },
                  { id: 'busy', label: locale === 'hi' ? 'दुकानदार व्यस्त है / उपलब्ध नहीं है' : 'Seller busy / Not free' },
                  { id: 'stock', label: locale === 'hi' ? 'स्टॉक अनुपलब्ध है / उत्पाद समाप्त' : 'Product out of stock / Stock unavailable' },
                  { id: 'pricing', label: locale === 'hi' ? 'कीमत में त्रुटि / गलती से सूचीबद्ध' : 'Pricing error / Listed by mistake' },
                  { id: 'other', label: locale === 'hi' ? 'अन्य कारण' : 'Other' }
                ].map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setCancelReasonText(reason.label)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                      cancelReasonText === reason.label
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {(cancelReasonText.startsWith('Other') || cancelReasonText.startsWith('अन्य')) && (
                <input
                  type="text"
                  placeholder={locale === 'hi' ? 'कारण लिखें...' : 'Type reason...'}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              )}

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setCancelOrderId(null); setCancelReasonText(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs"
                >
                  {locale === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrderSubmit}
                  className="flex-1 bg-red-500 hover:bg-red-650 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  {locale === 'hi' ? 'पुष्टि करें' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YourShop;
