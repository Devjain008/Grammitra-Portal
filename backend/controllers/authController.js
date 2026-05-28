import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { Business, Product } from '../models/Product.js';
import Job from '../models/Job.js';
import Labour from '../models/Labour.js';
import axios from 'axios';


// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grammitra_fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res,next) => {
  console.log("DEBUG: Register request received with data:", req.body);
  try {
    const { fullName, mobile, email, password, gender, village, district, state, categories, profileImage } = req.body;

    // Convert empty string fields to undefined so mongoose sparse index works
    const cleanMobile = mobile || undefined;
    const cleanEmail = email || undefined;

    // Check if user already exists
    let userExists = null;
    if (cleanMobile || cleanEmail) {
      userExists = await User.findOne({
        $or: [
          ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : [])
        ]
      });
    }
    if (userExists) {
      return res.status(400).json({ message: 'User with this mobile or email already exists' });
    }

    // Create new user (password is hashed automatically by the pre-save hook)
    const user = await User.create({
      fullName,
      mobile: cleanMobile,
      email: cleanEmail,
      password,
      gender,
      village: village || undefined,
      district: district || undefined,
      state: state || undefined,
      categories: categories || ['other'],
      profileImage: profileImage || '',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        village: user.village,
        district: user.district,
        state: user.state,
        categories: user.categories,
        role: user.role,
        profileImage: user.profileImage || '',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { identifier, mobile, email, password } = req.body;
    const loginQuery = identifier || mobile || email;

    if (!loginQuery) {
      return res.status(400).json({ message: 'Please provide email or mobile number.' });
    }

    // Find user by mobile OR email, and explicitly select the password field for comparison
    const user = await User.findOne({ $or: [{ mobile: loginQuery }, { email: loginQuery }] }).select('+password');

    if (user && (await user.comparePassword(password))) {
      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      res.json({
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        village: user.village,
        district: user.district,
        state: user.state,
        categories: user.categories,
        role: user.role,
        profileImage: user.profileImage || '',
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        village: user.village,
        district: user.district,
        state: user.state,
        gender: user.gender,
        location: user.location || null,
        categories: user.categories,
        role: user.role,
        profileImage: user.profileImage || '',
        teacherSubject: user.teacherSubject || '',
        teacherQualifications: user.teacherQualifications || '',
        teacherExperience: user.teacherExperience || '',
        teacherContact: user.teacherContact || '',
        notifications: user.notifications,
        orderNotifications: user.orderNotifications,
        serviceNotifications: user.serviceNotifications,
        chatNotifications: user.chatNotifications,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { fullName, mobile, email, gender, village, district, state, categories, notifications, orderNotifications, serviceNotifications, chatNotifications, teacherSubject, teacherQualifications, teacherExperience, teacherContact, profileImage } = req.body;

      const cleanMobile = mobile ? mobile.trim() : undefined;
      const cleanEmail = email ? email.trim().toLowerCase() : undefined;

      // Check if another user is already registered with the requested mobile or email
      if (cleanMobile && cleanMobile !== user.mobile) {
        const mobileExists = await User.findOne({ mobile: cleanMobile });
        if (mobileExists) {
          return res.status(400).json({ message: 'User with this mobile number already exists' });
        }
      }

      if (cleanEmail && cleanEmail !== user.email) {
        const emailExists = await User.findOne({ email: cleanEmail });
        if (emailExists) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
      }

      user.fullName = fullName || user.fullName;
      user.mobile = cleanMobile;
      user.email = cleanEmail;
      if (gender) user.gender = gender;
      
      // Allow empty string if user clears their location
      user.village = village !== undefined ? village : user.village;
      user.district = district !== undefined ? district : user.district;
      user.state = state !== undefined ? state : user.state;
      
      if (categories) {
        user.categories = Array.isArray(categories) ? categories : [categories];
      }

      if (profileImage !== undefined) user.profileImage = profileImage;

      if (teacherSubject !== undefined) user.teacherSubject = teacherSubject;
      if (teacherQualifications !== undefined) user.teacherQualifications = teacherQualifications;
      if (teacherExperience !== undefined) user.teacherExperience = teacherExperience;
      if (teacherContact !== undefined) user.teacherContact = teacherContact;

      if (notifications !== undefined) user.notifications = notifications;
      if (orderNotifications !== undefined) user.orderNotifications = orderNotifications;
      if (serviceNotifications !== undefined) user.serviceNotifications = serviceNotifications;
      if (chatNotifications !== undefined) user.chatNotifications = chatNotifications;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        mobile: updatedUser.mobile,
        email: updatedUser.email,
        village: updatedUser.village,
        district: updatedUser.district,
        state: updatedUser.state,
        gender: updatedUser.gender,
        categories: updatedUser.categories,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage || '',
        teacherSubject: updatedUser.teacherSubject || '',
        teacherQualifications: updatedUser.teacherQualifications || '',
        teacherExperience: updatedUser.teacherExperience || '',
        teacherContact: updatedUser.teacherContact || '',
        notifications: updatedUser.notifications,
        orderNotifications: updatedUser.orderNotifications,
        serviceNotifications: updatedUser.serviceNotifications,
        chatNotifications: updatedUser.chatNotifications,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get village report for the authenticated user's village
// @route   GET /api/auth/village-report
// @access  Private
export const getVillageReportController = async (req, res) => {
  try {
    const villageName = req.user.village;
    if (!villageName) {
      return res.status(200).json({
        village: '',
        totalShops: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalLabour: 0,
        activeLabour: 0,
        localProducts: 0,
        activeJobs: 0,
        totalVacancies: 0,
        hospitals: 0,
        schools: 0,
        colleges: 0,
        literacyRate: 0,
        primaryCrop: { en: 'N/A', hi: 'N/A' },
        nearestCity: { en: 'N/A', hi: 'N/A' },
        requiredJobs: []
      });
    }

    // 1. Live counts from DB
    const totalShops = await Business.countDocuments({ village: villageName });
    const totalUsers = await User.countDocuments({ village: villageName });
    const activeUsers = await User.countDocuments({ village: villageName, isActive: true });
    const activeJobs = await Job.countDocuments({ village: villageName, isActive: true });
    const totalLabour = await Labour.countDocuments({ village: villageName, isActive: true });
    const activeLabour = await Labour.countDocuments({ village: villageName, isAvailable: true, isActive: true });
    const totalTeachers = await User.countDocuments({ village: villageName, categories: 'teacher' });

    // Products belonging to village businesses
    const villageBusinesses = await Business.find({ village: villageName });
    const businessIds = villageBusinesses.map(b => b._id);
    const localProducts = await Product.countDocuments({ businessId: { $in: businessIds }, isActive: true });

    // Find job vacancies
    const villageJobs = await Job.find({ village: villageName, isActive: true });
    let totalVacancies = 0;
    const requiredJobs = [];

    villageJobs.forEach(job => {
      const remaining = job.totalRequired - job.filledCount;
      if (remaining > 0) {
        totalVacancies += remaining;
        requiredJobs.push({
          id: job._id,
          title: job.title,
          company: job.company,
          remaining
        });
      }
    });

    // 2. Deterministic mock counts for physical infrastructure based on village name
    let hash = 0;
    for (let i = 0; i < villageName.length; i++) {
      hash = villageName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const hospitals = hash % 2; // 0 or 1
    const schools = hash % 3;   // 0, 1, or 2
    const colleges = hash % 2;  // 0 or 1

    // Other village information
    const literacyRate = 65 + (hash % 20); // 65% to 85%
    const primaryCrop = ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Mustard'][hash % 5];
    const primaryCropHindi = ['गेहूं', 'धान', 'गन्ना', 'कपास', 'सरसों'][hash % 5];
    const nearestCity = ['District HQ', 'Sub-division City', 'Tehsil Town'][hash % 3];
    const nearestCityHindi = ['जिला मुख्यालय', 'उप-मंडल शहर', 'तहसील शहर'][hash % 3];
    const distanceToCity = (hash % 25) + 5; // 5 to 30 km

    res.status(200).json({
      village: villageName,
      district: req.user.district || 'N/A',
      state: req.user.state || 'N/A',
      totalShops,
      totalUsers,
      activeUsers,
      totalLabour,
      activeLabour,
      localProducts,
      activeJobs,
      totalVacancies,
      totalTeachers,
      hospitals,
      schools,
      colleges,
      literacyRate,
      primaryCrop: { en: primaryCrop, hi: primaryCropHindi },
      nearestCity: { en: `${nearestCity} (${distanceToCity} km)`, hi: `${nearestCityHindi} (${distanceToCity} किमी)` },
      requiredJobs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global stats for dashboard
// @route   GET /api/auth/global-stats
// @access  Public/Private
export const getGlobalStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const activeJobs = await Job.countDocuments({ isActive: true });
    const localShops = await Business.countDocuments({});
    const totalFarmers = await User.countDocuments({ categories: 'farmer' });
    const totalLabour = await Labour.countDocuments({ isActive: true });
    const activeLabour = await Labour.countDocuments({ isAvailable: true, isActive: true });
    const localProducts = await Product.countDocuments({ isActive: true });

    res.status(200).json({
      totalUsers,
      activeUsers,
      activeJobs,
      localShops,
      totalFarmers,
      totalLabour,
      activeLabour,
      localProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic village facilities (schools, colleges, hospitals)
// @route   GET /api/auth/facilities
// @access  Private
export const getVillageFacilities = async (req, res) => {
  try {
    const villageName = req.user.village || 'Rampur';
    const district = req.user.district || '';
    const state = req.user.state || '';
    const type = req.query.type; // 'hospital', 'school', 'college'

      // Deterministic fallback list based on village name
    let hash = 0;
    for (let i = 0; i < villageName.length; i++) {
      hash = villageName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const hospitalsCount = hash % 2; // 0 or 1
    const schoolsCount = hash % 3;   // 0, 1, or 2
    const collegesCount = hash % 2;  // 0 or 1
    const targetCount = type === 'school' ? schoolsCount : type === 'hospital' ? hospitalsCount : collegesCount;

    const fallbackFacilities = {
      school: [
        {
          name: `${villageName} Government High School`,
          nameHi: `${villageName} सरकारी उच्च विद्यालय`,
          type: 'Government',
          typeHi: 'सरकारी',
          medium: 'Bilingual (Hindi / English)',
          mediumHi: 'द्विभाषी (हिंदी / अंग्रेजी)',
          distance: 'Inside Village'
        },
        {
          name: `Saraswati Shishu Vidya Mandir`,
          nameHi: `सरस्वती शिशु विद्या मंदिर`,
          type: 'Private',
          typeHi: 'निजी',
          medium: 'Hindi Medium',
          mediumHi: 'हिंदी माध्यम',
          distance: '0.8 km'
        },
        {
          name: `Saint Paul's Public Academy`,
          nameHi: `सेंट पॉल पब्लिक एकेडमी`,
          type: 'Private',
          typeHi: 'निजी',
          medium: 'English Medium',
          mediumHi: 'अंग्रेजी माध्यम',
          distance: '2.5 km'
        }
      ],
      hospital: [
        {
          name: `Primary Health Sub-Centre, ${villageName}`,
          nameHi: `प्राथमिक स्वास्थ्य उप-केंद्र, ${villageName}`,
          type: 'Government',
          typeHi: 'सरकारी',
          beds: 10,
          specialty: 'General Medicine, Mother & Child Care',
          specialtyHi: 'सामान्य चिकित्सा, मातृ एवं शिशु देखभाल',
          distance: 'Inside Village'
        },
        {
          name: `Apex Referral Hospital & Trauma Clinic`,
          nameHi: `एपेक्स रेफरल अस्पताल और ट्रॉमा क्लिनिक`,
          type: 'Private',
          typeHi: 'निजी',
          beds: 35,
          specialty: 'Orthopedics, General Surgery, Emergency 24/7',
          specialtyHi: 'हड्डी रोग, सामान्य सर्जरी, आपातकालीन 24/7',
          distance: '4.2 km'
        }
      ],
      college: [
        {
          name: `${villageName} Intermediate & Science Degree College`,
          nameHi: `${villageName} इंटरमीडिएट और विज्ञान डिग्री कॉलेज`,
          type: 'Government',
          typeHi: 'सरकारी',
          medium: 'Bilingual (Hindi / English)',
          mediumHi: 'द्विभाषी (हिंदी / अंग्रेजी)',
          distance: '1.2 km'
        },
        {
          name: `Modern Rural Vocational Institute`,
          nameHi: `आधुनिक ग्रामीण व्यावसायिक संस्थान`,
          type: 'Private',
          typeHi: 'निजी',
          medium: 'English Medium',
          mediumHi: 'अंग्रेजी माध्यम',
          distance: '6.5 km'
        }
      ]
    };

    // Attempt real OSM Overpass API call
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(villageName + ", " + district + ", " + state)}&format=json&limit=1`;
      const geoRes = await axios.get(geoUrl, {
        headers: { 'User-Agent': 'GramMitra-App/1.0' },
        timeout: 3000
      });

      if (geoRes.data && geoRes.data.length > 0) {
        const { lat, lon } = geoRes.data[0];
        
        let overpassAmenity = 'school';
        if (type === 'hospital') overpassAmenity = 'hospital';
        if (type === 'college') overpassAmenity = 'college';

        const overpassQuery = `[out:json][timeout:10];(node["amenity"="${overpassAmenity}"](around:15000,${lat},${lon});way["amenity"="${overpassAmenity}"](around:15000,${lat},${lon}););out body;`;
        
        const overpassRes = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 4000
        });

        if (overpassRes.data && overpassRes.data.elements && overpassRes.data.elements.length > 0) {
          const elements = overpassRes.data.elements;
          const mapped = elements.map((el, index) => {
            const tags = el.tags || {};
            const operatorType = tags.operator_type || tags.operator || (index % 2 === 0 ? 'Government' : 'Private');
            const isGov = operatorType.toLowerCase().includes('gov') || operatorType.toLowerCase().includes('public');
            
            return {
              name: tags.name || tags['name:en'] || `${villageName} Local ${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
              nameHi: tags['name:hi'] || tags.name || `${villageName} स्थानीय ${type === 'school' ? 'स्कूल' : type === 'hospital' ? 'अस्पताल' : 'कॉलेज'} ${index + 1}`,
              type: isGov ? 'Government' : 'Private',
              typeHi: isGov ? 'सरकारी' : 'निजी',
              medium: type === 'hospital' ? undefined : (index % 3 === 0 ? 'Hindi Medium' : index % 3 === 1 ? 'English Medium' : 'Bilingual'),
              mediumHi: type === 'hospital' ? undefined : (index % 3 === 0 ? 'हिंदी माध्यम' : index % 3 === 1 ? 'अंग्रेजी माध्यम' : 'द्विभाषी'),
              beds: type === 'hospital' ? (tags.beds ? Number(tags.beds) : (index % 2 === 0 ? 15 : 40)) : undefined,
              specialty: type === 'hospital' ? (tags.speciality || 'General Medicine, Pediatrics') : undefined,
              specialtyHi: type === 'hospital' ? 'सामान्य चिकित्सा, बाल रोग' : undefined,
              distance: `${(1 + index * 1.5).toFixed(1)} km`
            };
          });
          const slicedMapped = mapped.slice(0, targetCount);
          return res.status(200).json(slicedMapped);
        }
      }
    } catch (apiError) {
      console.warn("Overpass API failed, using high-quality deterministic fallback lists", apiError.message);
    }

    // Reaching here means we use fallback sliced exactly to targetCount
    const list = fallbackFacilities[type] || [];
    const slicedList = list.slice(0, targetCount);
    return res.status(200).json(slicedList);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};