import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../utils/constants';
import { Landmark, Search, Filter, CheckCircle, FileText, Clock, ExternalLink, ChevronDown, ChevronUp, Loader } from 'lucide-react';

// Mock Data (Follows our Backend Bilingual Schema)
const mockSchemes = [
  {
    _id: '1',
    title: { en: 'PM Kisan Samman Nidhi', hi: 'पीएम किसान सम्मान निधि' },
    description: { en: 'Direct income support of ₹6,000 per year to farmer families.', hi: 'किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता।' },
    category: ['farmer'],
    state: 'Central',
    benefits: { en: '₹2000 transferred directly every 4 months.', hi: 'हर 4 महीने में सीधे ₹2000 ट्रांसफर किए जाते हैं।' },
    eligibility: { en: ['Must be a landholding farmer', 'Name must be in land records'], hi: ['जमीन के मालिक किसान होने चाहिए', 'जमीन के रिकॉर्ड में नाम होना चाहिए'] },
    requiredDocuments: { en: ['Aadhar Card', 'Bank Passbook', 'Land Records'], hi: ['आधार कार्ड', 'बैंक पासबुक', 'जमीन के दस्तावेज'] },
    deadline: '2026-12-31',
    officialLink: 'https://pmkisan.gov.in',
    isActive: true
  },
  {
    _id: '2',
    title: { en: 'Chief Minister Ladli Behna Yojana', hi: 'मुख्यमंत्री लाडली बहना योजना' },
    description: { en: 'Financial empowerment for women in Madhya Pradesh.', hi: 'मध्य प्रदेश में महिलाओं के लिए वित्तीय सशक्तिकरण।' },
    category: ['women', 'other'],
    state: 'Madhya Pradesh',
    benefits: { en: '₹1250 per month directly to bank account.', hi: 'प्रति माह ₹1250 सीधे बैंक खाते में।' },
    eligibility: { en: ['Resident of MP', 'Age 21-60 years'], hi: ['एमपी की निवासी', 'आयु 21-60 वर्ष'] },
    requiredDocuments: { en: ['Samagra ID', 'Aadhar Card', 'DBT enabled Bank Account'], hi: ['समग्र आईडी', 'आधार कार्ड', 'DBT चालू बैंक खाता'] },
    deadline: '2026-08-15',
    officialLink: 'https://cmladlibahna.mp.gov.in',
    isActive: true
  },
  {
    _id: '3',
    title: { en: 'PM Vishwakarma Yojana', hi: 'पीएम विश्वकर्मा योजना' },
    description: { en: 'Support for traditional artisans and craftspeople.', hi: 'पारंपरिक कारीगरों और शिल्पकारों के लिए समर्थन।' },
    category: ['labour', 'businessman'],
    state: 'Central',
    benefits: { en: 'Collateral-free loan up to ₹3 Lakhs, Skill training.', hi: '₹3 लाख तक का बिना गारंटी का लोन, कौशल प्रशिक्षण।' },
    eligibility: { en: ['Must be engaged in traditional trades (carpenter, tailor, etc.)'], hi: ['पारंपरिक व्यापार (बढ़ई, दर्जी, आदि) में शामिल होना चाहिए'] },
    requiredDocuments: { en: ['Aadhar Card', 'Ration Card', 'Skill Certificate (if any)'], hi: ['आधार कार्ड', 'राशन कार्ड', 'कौशल प्रमाण पत्र (यदि कोई हो)'] },
    deadline: '2026-10-30',
    officialLink: 'https://pmvishwakarma.gov.in',
    isActive: true
  },
  {
    _id: '4',
    title: { en: 'PM Awas Yojana (Gramin)', hi: 'प्रधानमंत्री आवास योजना (ग्रामीण)' },
    description: { en: 'Financial assistance for constructing pucca houses for rural poor.', hi: 'ग्रामीण गरीबों के लिए पक्का मकान बनाने हेतु वित्तीय सहायता।' },
    category: ['other', 'labour'],
    state: 'Central',
    benefits: { en: 'Financial assistance up to ₹1.2 Lakh for house construction in plains.', hi: '₹1.2 लाख तक आवास निर्माण सहायता (मैदानी क्षेत्र)।' },
    eligibility: { en: ['Must be BPL household', 'No pucca house owned', 'SECC 2011 listed'], hi: ['BPL परिवार होना चाहिए', 'पक्का मकान नहीं होना चाहिए', 'SECC 2011 में सूचीबद्ध'] },
    requiredDocuments: { en: ['Aadhar Card', 'BPL Ration Card', 'Bank Account', 'Job Card'], hi: ['आधार कार्ड', 'BPL राशन कार्ड', 'बैंक खाता', 'जॉब कार्ड'] },
    deadline: '2026-03-31',
    officialLink: 'https://pmayg.nic.in',
    isActive: true
  },
  {
    _id: '5',
    title: { en: 'Pradhan Mantri Fasal Bima Yojana', hi: 'प्रधानमंत्री फसल बीमा योजना' },
    description: { en: 'Crop insurance protection for farmers against natural calamities.', hi: 'प्राकृतिक आपदाओं से फसल नुकसान पर किसानों को बीमा सुरक्षा।' },
    category: ['farmer'],
    state: 'Central',
    benefits: { en: 'Crop insurance cover for losses due to natural calamities, pests, and diseases.', hi: 'प्राकृतिक आपदाओं, कीटों और रोगों से फसल नुकसान पर बीमा कवर।' },
    eligibility: { en: ['Must be a farmer', 'Loan and non-loan farmers both eligible'], hi: ['किसान होना चाहिए', 'ऋण और बिना ऋण दोनों किसान पात्र'] },
    requiredDocuments: { en: ['Aadhar Card', 'Bank Passbook', 'Land Records', 'Sowing Certificate'], hi: ['आधार कार्ड', 'बैंक पासबुक', 'जमीन दस्तावेज', 'बुआई प्रमाण पत्र'] },
    deadline: '2026-12-31',
    officialLink: 'https://pmfby.gov.in',
    isActive: true
  },
  {
    _id: '6',
    title: { en: 'Ayushman Bharat PM-JAY', hi: 'आयुष्मान भारत पीएम-जेएवाई' },
    description: { en: 'Health insurance cover of ₹5 Lakh per family per year for hospitalization.', hi: 'परिवार को प्रति वर्ष ₹5 लाख का स्वास्थ्य बीमा कवर।' },
    category: ['healthcare', 'other'],
    state: 'Central',
    benefits: { en: '₹5 Lakh health insurance for secondary and tertiary hospitalization. Cashless treatment.', hi: '₹5 लाख का स्वास्थ्य बीमा। कैशलेस इलाज की सुविधा।' },
    eligibility: { en: ['Must be in SECC database', 'Economically weaker section families'], hi: ['SECC डेटाबेस में होना चाहिए', 'आर्थिक रूप से कमजोर वर्ग के परिवार'] },
    requiredDocuments: { en: ['Aadhar Card', 'Ration Card', 'Registered Mobile Number'], hi: ['आधार कार्ड', 'राशन कार्ड', 'पंजीकृत मोबाइल नंबर'] },
    deadline: '2026-12-31',
    officialLink: 'https://pmjay.gov.in',
    isActive: true
  },
  {
    _id: '7',
    title: { en: 'PM Mudra Yojana', hi: 'पीएम मुद्रा योजना' },
    description: { en: 'Micro loans up to ₹10 Lakh for non-farm income generating activities.', hi: 'गैर-कृषि आय-सृजन गतिविधियों के लिए ₹10 लाख तक का माइक्रो लोन।' },
    category: ['businessman', 'other'],
    state: 'Central',
    benefits: { en: 'Loan from ₹50,000 to ₹10 Lakh. No collateral required. Three categories: Shishu, Kishore, Tarun.', hi: '₹50,000 से ₹10 लाख तक का लोन। कोई गारंटी नहीं। तीन श्रेणियाँ: शिशु, किशोर, तरुण।' },
    eligibility: { en: ['Non-farm business owners', 'Small and micro enterprises', 'Shopkeepers and artisans'], hi: ['गैर-कृषि व्यवसाय स्वामी', 'लघु और सूक्ष्म उद्यम', 'दुकानदार और कारीगर'] },
    requiredDocuments: { en: ['Aadhar Card', 'PAN Card', 'Business Proof', 'Bank Statements'], hi: ['आधार कार्ड', 'पैन कार्ड', 'व्यवसाय प्रमाण', 'बैंक स्टेटमेंट'] },
    deadline: '2026-09-30',
    officialLink: 'https://mudra.org.in',
    isActive: true
  },
  {
    _id: '8',
    title: { en: 'National Scholarship Portal', hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल' },
    description: { en: 'Central scholarship scheme for meritorious students from economically weaker sections.', hi: 'आर्थिक रूप से कमजोर मेधावी छात्रों के लिए केंद्रीय छात्रवृत्ति योजना।' },
    category: ['student'],
    state: 'Central',
    benefits: { en: 'Financial assistance for education up to ₹20,000 per annum. Covers school to post-graduation.', hi: 'शिक्षा के लिए प्रति वर्ष ₹20,000 तक वित्तीय सहायता। स्कूल से स्नातकोत्तर तक।' },
    eligibility: { en: ['Annual family income below ₹2.5 Lakh', 'Min 50% marks in previous exam', 'Regular student enrollment'], hi: ['वार्षिक पारिवारिक आय ₹2.5 लाख से कम', 'पिछली परीक्षा में न्यूनतम 50% अंक', 'नियमित छात्र नामांकन'] },
    requiredDocuments: { en: ['Aadhar Card', 'Income Certificate', 'Mark Sheet', 'Bank Account', 'Enrollment Certificate'], hi: ['आधार कार्ड', 'आय प्रमाण पत्र', 'अंक पत्र', 'बैंक खाता', 'नामांकन प्रमाण पत्र'] },
    deadline: '2026-11-30',
    officialLink: 'https://scholarships.gov.in',
    isActive: true
  },
  {
    _id: '9',
    title: { en: 'MP CM Kisan Kalyan Yojana', hi: 'मुख्यमंत्री किसान कल्याण योजना (MP)' },
    description: { en: 'Additional income support of ₹4,000 per year for farmers in Madhya Pradesh.', hi: 'MP के किसानों को प्रति वर्ष ₹4,000 की अतिरिक्त आय सहायता।' },
    category: ['farmer'],
    state: 'Madhya Pradesh',
    benefits: { en: '₹2000 sent twice a year in addition to PM Kisan. Total ₹10,000/year with PM Kisan.', hi: 'PM किसान के अतिरिक्त साल में दो बार ₹2000। PM किसान सहित कुल ₹10,000/वर्ष।' },
    eligibility: { en: ['Must be registered under PM Kisan', 'Permanent resident MP farmer', 'Holding land in MP'], hi: ['PM किसान में पंजीकृत होना चाहिए', 'MP के स्थायी निवासी किसान', 'MP में जमीन होना आवश्यक'] },
    requiredDocuments: { en: ['Aadhar Card', 'PM Kisan Registration Number', 'Bank Passbook'], hi: ['आधार कार्ड', 'PM किसान पंजीकरण नंबर', 'बैंक पासबुक'] },
    deadline: '2026-12-31',
    officialLink: 'https://saara.mp.gov.in',
    isActive: true
  },
  {
    _id: '10',
    title: { en: 'MP Mukhyamantri Jan Kalyan (Sambal) Yojana', hi: 'मुख्यमंत्री जन कल्याण (संबल) योजना' },
    description: { en: 'Comprehensive welfare scheme for unorganized workers in Madhya Pradesh.', hi: 'मध्य प्रदेश में असंगठित मजदूरों के लिए व्यापक कल्याण योजना।' },
    category: ['labour', 'other'],
    state: 'Madhya Pradesh',
    benefits: { en: 'Free education for children, ₹2 Lakh accident insurance, free medical treatment, funeral assistance.', hi: 'बच्चों को मुफ्त शिक्षा, ₹2 लाख दुर्घटना बीमा, मुफ्त इलाज, अंत्येष्टि सहायता।' },
    eligibility: { en: ['Unorganized sector worker in MP', 'MP resident', 'Annual income below ₹2 Lakh'], hi: ['MP में असंगठित क्षेत्र का मजदूर', 'MP का निवासी', 'वार्षिक आय ₹2 लाख से कम'] },
    requiredDocuments: { en: ['Aadhar Card', 'Sambal Card', 'Bank Account', 'Residence Proof'], hi: ['आधार कार्ड', 'संबल कार्ड', 'बैंक खाता', 'निवास प्रमाण पत्र'] },
    deadline: '2026-12-31',
    officialLink: 'https://sambal.mp.gov.in',
    isActive: true
  },
  {
    _id: '11',
    title: { en: 'Sukanya Samriddhi Yojana', hi: 'सुकन्या समृद्धि योजना' },
    description: { en: 'Government savings scheme for the girl child offering 8.2% annual interest.', hi: 'बालिकाओं के लिए 8.2% वार्षिक ब्याज वाली सरकारी बचत योजना।' },
    category: ['women', 'student'],
    state: 'Central',
    benefits: { en: '8.2% annual interest rate, Tax exemption under Section 80C, maturity at 21 years.', hi: '8.2% वार्षिक ब्याज, धारा 80C के तहत कर छूट, 21 वर्ष में परिपक्वता।' },
    eligibility: { en: ['Girl child below 10 years of age', 'Parents/guardians must open account', 'Only 2 accounts per family'], hi: ['10 वर्ष से कम आयु की बालिका', 'माता-पिता/अभिभावक खाता खोलें', 'प्रति परिवार केवल 2 खाते'] },
    requiredDocuments: { en: ['Birth Certificate of Girl Child', 'Aadhar Card of Parent/Guardian', 'Bank Account'], hi: ['बालिका का जन्म प्रमाण पत्र', 'माता-पिता/अभिभावक का आधार कार्ड', 'बैंक खाता'] },
    deadline: '2026-12-31',
    officialLink: 'https://www.indiapost.gov.in',
    isActive: true
  },
  {
    _id: '12',
    title: { en: 'Kisan Credit Card Yojana', hi: 'किसान क्रेडिट कार्ड योजना' },
    description: { en: 'Short-term revolving credit for farmers to meet cultivation and allied activities expenses.', hi: 'किसानों को खेती और संबद्ध गतिविधियों के खर्च के लिए अल्पकालिक परिक्रामी ऋण।' },
    category: ['farmer'],
    state: 'Central',
    benefits: { en: 'Revolving credit up to ₹3 Lakh at 4% interest rate. Covers crop, post-harvest, allied activities.', hi: '4% ब्याज दर पर ₹3 लाख तक का परिक्रामी ऋण। फसल, कटाई बाद और संबद्ध गतिविधियाँ शामिल।' },
    eligibility: { en: ['Individual/joint borrower farmer', 'Tenant farmer or sharecropper', 'Self-help groups'], hi: ['व्यक्तिगत/संयुक्त उधारकर्ता किसान', 'किरायेदार या बंटाई किसान', 'स्वयं सहायता समूह'] },
    requiredDocuments: { en: ['Aadhar Card', 'Land Records / Tenancy Agreement', 'Bank Account', 'Passport Photo'], hi: ['आधार कार्ड', 'भूमि दस्तावेज / किरायानामा', 'बैंक खाता', 'पासपोर्ट फोटो'] },
    deadline: '2026-12-31',
    officialLink: 'https://www.nabard.org',
    isActive: true
  }
];

const Schemes = () => {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // Helper to extract the correct language string from bilingual objects
  const loc = (obj) => {
    if (!obj) return '';
    return obj[locale] || obj['en'];
  };

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        // Attempt backend fetch (fallback to mock data if no server is running)
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/schemes`);
        setSchemes(res.data);
      } catch (error) {
        console.warn("Backend not connected, using mock scheme data");
        setSchemes(mockSchemes);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredSchemes = schemes.filter(scheme => {
    const searchMatch = loc(scheme.title).toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = selectedCategory === 'all' || scheme.category.includes(selectedCategory);
    const stateMatch = selectedState === 'all' || scheme.state === selectedState || scheme.state === 'Central';
    return searchMatch && catMatch && stateMatch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-village-clay to-yellow-600 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Landmark className="w-8 h-8 text-yellow-200" />
            {t('schemes.title')}
          </h1>
          <p className="text-yellow-100 text-lg opacity-90">{t('schemes.subtitle')}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('schemes.search')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl glass-card focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
          />
        </div>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-gray-250 shadow-sm px-6 py-3 outline-none focus:ring-2 focus:ring-yellow-500 rounded-2xl text-gray-700 font-medium cursor-pointer"
        >
          <option value="all" className="bg-white text-gray-800 font-medium">{t('schemes.filterCategory')}</option>
          <option value="farmer" className="bg-white text-gray-800 font-medium">{t('categories.farmer')}</option>
          <option value="women" className="bg-white text-gray-800 font-medium">{locale === 'hi' ? 'महिला सशक्तिकरण' : 'Women Empowerment'}</option>
          <option value="labour" className="bg-white text-gray-800 font-medium">{t('categories.labour')}</option>
          <option value="businessman" className="bg-white text-gray-800 font-medium">{t('categories.businessman')}</option>
          <option value="student" className="bg-white text-gray-800 font-medium">{t('categories.student')}</option>
        </select>
        <select 
          value={selectedState} 
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-white border border-gray-250 shadow-sm px-6 py-3 outline-none focus:ring-2 focus:ring-yellow-500 rounded-2xl text-gray-700 font-medium cursor-pointer"
        >
          <option value="all" className="bg-white text-gray-800 font-medium">{t('schemes.filterState')}</option>
          <option value="Central" className="bg-white text-gray-800 font-medium">{t('schemes.central')}</option>
          <option value="Madhya Pradesh" className="bg-white text-gray-800 font-medium">{t('schemes.mp')}</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-10 h-10 animate-spin text-village-clay" />
        </div>
      ) : (
        /* Scheme Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSchemes.map((scheme, index) => (
            <motion.div 
              key={scheme._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card flex flex-col overflow-hidden transition-all hover:shadow-2xl"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-white to-orange-50/30">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    scheme.state === 'Central' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {scheme.state === 'Central' ? t('schemes.central') : t('schemes.mp')}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {t('schemes.deadline')}: {new Date(scheme.deadline).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN')}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{loc(scheme.title)}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{loc(scheme.description)}</p>
              </div>

              {/* Main Info */}
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-village-mint mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{t('schemes.benefits')}</h4>
                    <p className="text-sm text-gray-600">{loc(scheme.benefits)}</p>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === scheme._id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 mt-4 border-t border-gray-100 space-y-4 overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <Filter className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm mb-1">{t('schemes.eligibility')}</h4>
                          <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                            {loc(scheme.eligibility).map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm mb-1">{t('schemes.documents')}</h4>
                          <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                            {loc(scheme.requiredDocuments).map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => toggleExpand(scheme._id)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white border border-village-clay text-village-clay hover:bg-orange-50 transition-colors flex justify-center items-center gap-2"
                >
                  {expandedId === scheme._id ? t('common.cancel') : t('schemes.viewDetails')}
                  {expandedId === scheme._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <a 
                  href={scheme.officialLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-village-clay text-white hover:bg-yellow-700 transition-colors flex justify-center items-center gap-2"
                >
                  {t('schemes.applyNow')} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schemes;