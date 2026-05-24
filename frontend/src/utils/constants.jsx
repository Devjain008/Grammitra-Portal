/**
 * Global Constants for GramMitra
 * Centralizing these ensures consistency across the entire ecosystem.
 */

// frontend/src/utils/constants.jsx

export const CONFIG = {
  // Use import.meta.env for Vite projects
  // If the variable is undefined, it defaults to the localhost string safely
  API_BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000',
  SOCKET_URL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) || 'http://localhost:5000',
  DEFAULT_LANGUAGE: 'en',
  CLOUDINARY_CLOUD_NAME: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) || '',
  CLOUDINARY_UPLOAD_PRESET: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET) || '',
};

// ... keep the rest of your constants (USER_CATEGORIES, etc.) as they were

// User Categories (The 'DNA' of the personalization engine)
export const USER_CATEGORIES = [
  { id: 'farmer', label: 'Farmer', icon: 'Sprout' },
  { id: 'labour', label: 'Labour', icon: 'Wrench' },
  { id: 'student', label: 'Student', icon: 'GraduationCap' },
  { id: 'teacher', label: 'Teacher', icon: 'BookOpen' },
  { id: 'businessman', label: 'Businessman', icon: 'Store' },
  { id: 'healthcare', label: 'Healthcare Worker', icon: 'Activity' },
  { id: 'shopkeeper', label: 'Shopkeeper', icon: 'ShoppingBag' },
];


// Marketplace Filtering
export const MARKET_CATEGORIES = [
  { id: 'crops', label: 'Crops' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'machinery', label: 'Machinery' },
  { id: 'livestock', label: 'Livestock' },
];

// Education Domains for AI Roadmaps
export const EDUCATION_DOMAINS = [
  'Coding & Software',
  'Artificial Intelligence',
  'Government Exams (UPSC/SSC)',
  'Modern Farming Technology',
  'Business & Commerce'
];

// Status Colors
export const STATUS_COLORS = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-700',
};

/**
 * Returns a Base64-encoded SVG representing the Instagram-style silhouette avatar
 * styled according to gender.
 */
export const getDefaultAvatar = (gender) => {
  const g = (gender || '').toLowerCase();
  let bg, silhouette;
  if (g === 'female') {
    bg = '#FCE7F3'; // pink-100
    silhouette = '#F472B6'; // pink-400
  } else if (g === 'male') {
    bg = '#E0F2FE'; // sky-100
    silhouette = '#38BDF8'; // sky-400
  } else {
    bg = '#F1F5F9'; // slate-100
    silhouette = '#94A3B8'; // slate-400
  }

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${bg}"/><circle cx="50" cy="38" r="16" fill="${silhouette}"/><path d="M50 62c-18 0-32 10-32 22v8h64v-8c0-12-14-22-32-22z" fill="${silhouette}"/></svg>`;

  try {
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${svg.replace(/#/g, '%23')}`;
  }
};