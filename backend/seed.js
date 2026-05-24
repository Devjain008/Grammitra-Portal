import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { Business, Product } from './models/Product.js';
import Job from './models/Job.js';
import Announcement from './models/Announcement.js';
import Scheme from './models/Scheme.js';
import Health from './models/Health.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grammitra';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Clean existing collections
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Business.deleteMany({});
    await Product.deleteMany({});
    await Job.deleteMany({});
    await Announcement.deleteMany({});
    await Scheme.deleteMany({});
    await Health.deleteMany({});
    console.log('Collections cleared.');

    // 2. Create Users
    console.log('Creating seed users...');
    
    // Admin
    const admin = await User.create({
      fullName: 'System Admin',
      email: 'admin@example.com',
      mobile: '9876543210',
      password: 'password123',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      categories: ['other'],
      role: 'admin',
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });

    // Teacher
    const teacher = await User.create({
      fullName: 'Teacher Ram',
      email: 'teacher@example.com',
      mobile: '9876543211',
      password: 'password123',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      categories: ['teacher'],
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });

    // Student
    const student = await User.create({
      fullName: 'Student Shyam',
      email: 'student@example.com',
      mobile: '9876543212',
      password: 'password123',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      categories: ['student'],
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });

    // Businessman / Shopkeeper
    const merchant = await User.create({
      fullName: 'Merchant Lal',
      email: 'merchant@example.com',
      mobile: '9876543213',
      password: 'password123',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      categories: ['shopkeeper', 'businessman'],
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });

    // Farmer
    const farmer = await User.create({
      fullName: 'Farmer Hari',
      email: 'farmer@example.com',
      mobile: '9876543214',
      password: 'password123',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      categories: ['farmer'],
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });

    console.log(`Created accounts: Teacher, Student, Merchant, Farmer.`);

    // 3. Create Business / Shop
    console.log('Creating seed business...');
    const business = await Business.create({
      ownerId: merchant._id,
      name: 'Kisan Fertilizers & Seeds',
      type: 'fertilizer',
      description: 'Quality hybrid seeds, organic fertilizers, and modern farming tools for high-yield agriculture.',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      address: 'Main Bazaar, near Shiv Mandir',
      contactNumber: '9876543213',
      whatsapp: '9876543213',
      timing: '8 AM - 8 PM',
      isVerified: true,
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });
    console.log(`Created Business: ${business.name}`);

    // 4. Create Products
    console.log('Creating seed products...');
    const seedProduct1 = await Product.create({
      businessId: business._id,
      sellerId: merchant._id,
      name: 'High Yield Mustard Seeds',
      description: 'Pure hybrid mustard seeds, highly resistant to common pests. Ideal for winter cropping and high oil yield.',
      category: 'seeds',
      price: 220,
      originalPrice: 220,
      discount: 18,
      stock: 50,
      unit: 'Kg',
      images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=400&auto=format&fit=crop']
    });

    const seedProduct2 = await Product.create({
      businessId: business._id,
      sellerId: merchant._id,
      name: 'Organic Compost Fertilizer',
      description: '100% natural organic compost manure to enrich soil micro-nutrients and promote sustainable plant growth.',
      category: 'fertilizer',
      price: 450,
      originalPrice: 450,
      discount: 22,
      stock: 100,
      unit: '50Kg Bag',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop']
    });
    console.log(`Created products: ${seedProduct1.name}, ${seedProduct2.name}`);

    // 5. Create Jobs
    console.log('Creating seed jobs...');
    const job1 = await Job.create({
      title: 'Wheat Harvest Assistant',
      company: 'Hari Farms',
      description: 'Need 5 workers for harvesting wheat crops. Daily wages paid, lunch and tea provided on site.',
      category: 'agriculture',
      salaryMin: 400,
      salaryMax: 450,
      salaryType: 'daily',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      totalRequired: 5,
      filledCount: 1,
      postedBy: farmer._id,
      contactNumber: '9876543214',
      isActive: true,
      location: { type: 'Point', coordinates: [85.1376, 25.5941] },
      applicants: [
        {
          userId: student._id,
          name: student.fullName,
          mobile: student.mobile,
          appliedAt: new Date(),
          status: 'applied'
        }
      ]
    });

    const job2 = await Job.create({
      title: 'Retail Shop Assistant',
      company: 'Kisan Fertilizers & Seeds',
      description: 'Need an energetic shop helper to manage stock inventory, assist customers, and handle cash billing.',
      category: 'retail',
      salaryMin: 8000,
      salaryMax: 10000,
      salaryType: 'monthly',
      village: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      totalRequired: 2,
      filledCount: 0,
      postedBy: merchant._id,
      contactNumber: '9876543213',
      isActive: true,
      location: { type: 'Point', coordinates: [85.1376, 25.5941] }
    });
    console.log(`Created jobs: ${job1.title}, ${job2.title}`);

    // 6. Create Announcements
    console.log('Creating seed announcements...');
    const ann1 = await Announcement.create({
      teacherId: teacher._id,
      teacherName: teacher.fullName,
      content: 'Attention Students: The special mathematics tutoring class will start this Saturday at 9:00 AM in the village community hall.',
      village: 'Rampur'
    });

    const ann2 = await Announcement.create({
      teacherId: teacher._id,
      teacherName: teacher.fullName,
      content: 'Annual State Scholarship applications are now open. Please submit your academic documents to the school coordinator before next Friday.',
      village: 'Rampur'
    });
    console.log(`Created announcements: "${ann1.content.slice(0, 30)}...", "${ann2.content.slice(0, 30)}..."`);

    // 7. Seed Schemes
    console.log('Creating seed government schemes...');
    const schemesData = [
      {
        title: { en: 'PM Kisan Samman Nidhi', hi: 'पीएम किसान सम्मान निधि' },
        description: { en: 'Direct income support of ₹6,000 per year to farmer families.', hi: 'किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता।' },
        category: ['farmer'],
        state: 'Central',
        benefits: { en: '₹2000 transferred directly every 4 months.', hi: 'हर 4 महीने में सीधे ₹2000 ट्रांसफर किए जाते हैं।' },
        eligibility: { en: ['Must be a landholding farmer', 'Name must be in land records'], hi: ['जमीन के मालिक किसान होने चाहिए', 'जमीन के रिकॉर्ड में नाम होना चाहिए'] },
        requiredDocuments: { en: ['Aadhar Card', 'Bank Passbook', 'Land Records'], hi: ['आधार कार्ड', 'बैंक पासबुक', 'जमीन के दस्तावेज'] },
        applicationProcess: { en: 'Apply online on the PM Kisan portal or visit nearest CSC center.', hi: 'पीएम किसान पोर्टल पर ऑनलाइन आवेदन करें या निकटतम सीएससी केंद्र पर जाएं।' },
        department: { en: 'Ministry of Agriculture and Farmers Welfare', hi: 'कृषि एवं किसान कल्याण मंत्रालय' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://pmkisan.gov.in',
        isActive: true
      },
      {
        title: { en: 'Chief Minister Ladli Behna Yojana', hi: 'मुख्यमंत्री लाडली बहना योजना' },
        description: { en: 'Financial empowerment for women in Madhya Pradesh.', hi: 'मध्य प्रदेश में महिलाओं के लिए वित्तीय सशक्तिकरण।' },
        category: ['women', 'general'],
        state: 'Madhya Pradesh',
        benefits: { en: '₹1250 per month directly to bank account.', hi: 'प्रति माह ₹1250 सीधे बैंक खाते में।' },
        eligibility: { en: ['Resident of MP', 'Age 21-60 years'], hi: ['एमपी की निवासी', 'आयु 21-60 वर्ष'] },
        requiredDocuments: { en: ['Samagra ID', 'Aadhar Card', 'DBT enabled Bank Account'], hi: ['समग्र आईडी', 'आधार कार्ड', 'DBT चालू बैंक खाता'] },
        applicationProcess: { en: 'Submit application through local Gram Panchayat or Ward office.', hi: 'स्थानीय ग्राम पंचायत या वार्ड कार्यालय के माध्यम से आवेदन जमा करें।' },
        department: { en: 'Women and Child Development Department', hi: 'महिला एवं बाल विकास विभाग' },
        deadline: new Date('2026-08-15'),
        officialLink: 'https://cmladlibahna.mp.gov.in',
        isActive: true
      },
      {
        title: { en: 'PM Vishwakarma Yojana', hi: 'पीएम विश्वकर्मा योजना' },
        description: { en: 'Support for traditional artisans and craftspeople.', hi: 'पारंपरिक कारीगरों और शिल्पकारों के लिए समर्थन।' },
        category: ['labour', 'businessman'],
        state: 'Central',
        benefits: { en: 'Collateral-free loan up to ₹3 Lakhs, Skill training.', hi: '₹3 लाख तक का बिना गारंटी का लोन, कौशल प्रशिक्षण।' },
        eligibility: { en: ['Must be engaged in traditional trades (carpenter, tailor, etc.)'], hi: ['पारंपरिक व्यापार (बढ़ई, दर्जी, आदि) में शामिल होना चाहिए'] },
        requiredDocuments: { en: ['Aadhar Card', 'Ration Card', 'Skill Certificate (if any)'], hi: ['आधार कार्ड', 'राशन कार्ड', 'कौशल प्रमाण पत्र (यदि कोई हो)'] },
        applicationProcess: { en: 'Register online at PM Vishwakarma portal or CSC centers.', hi: 'पीएम विश्वकर्मा पोर्टल या सीएससी केंद्रों पर ऑनलाइन पंजीकरण करें।' },
        department: { en: 'Ministry of Micro, Small and Medium Enterprises', hi: 'सूक्ष्म, लघु और मध्यम उद्यम मंत्रालय' },
        deadline: new Date('2026-10-30'),
        officialLink: 'https://pmvishwakarma.gov.in',
        isActive: true
      },
      {
        title: { en: 'PM Fasal Bima Yojana', hi: 'प्रधानमंत्री फसल बीमा योजना' },
        description: { en: 'Financial support to farmers suffering crop loss/damage arising out of natural calamities.', hi: 'प्राकृतिक आपदाओं से फसल नुकसान/क्षति झेलने वाले किसानों को वित्तीय सहायता।' },
        category: ['farmer'],
        state: 'Central',
        benefits: { en: 'Insurance coverage and financial support for crop failures.', hi: 'फसल खराब होने पर बीमा कवर और वित्तीय सहायता।' },
        eligibility: { en: ['All farmers including sharecroppers and tenant farmers growing notified crops'], hi: ['अधिसूचित फसलें उगाने वाले सभी बटाईदार और काश्तकार किसान'] },
        requiredDocuments: { en: ['Land Record Documents', 'Sowing Certificate', 'Aadhar Card', 'Bank details'], hi: ['भूमि रिकॉर्ड दस्तावेज', 'बुवाई प्रमाण पत्र', 'आधार कार्ड', 'बैंक विवरण'] },
        applicationProcess: { en: 'Register via PMFBY portal, banks, or nearest CSC center.', hi: 'पीएमएफबीवाई पोर्टल, बैंकों या निकटतम सीएससी केंद्र के माध्यम से पंजीकरण करें।' },
        department: { en: 'Ministry of Agriculture and Farmers Welfare', hi: 'कृषि एवं किसान कल्याण मंत्रालय' },
        deadline: new Date('2026-07-31'),
        officialLink: 'https://pmfby.gov.in',
        isActive: true
      },
      {
        title: { en: 'PM Awas Yojana - Gramin', hi: 'प्रधानमंत्री आवास योजना - ग्रामीण' },
        description: { en: 'Financial assistance for construction of a pucca house for houseless households.', hi: 'बेघर परिवारों के लिए पक्के मकान के निर्माण के लिए वित्तीय सहायता।' },
        category: ['general', 'labour'],
        state: 'Central',
        benefits: { en: 'Assistance of ₹1.2 Lakh in plains and ₹1.3 Lakh in hilly areas.', hi: 'मैदानी क्षेत्रों में ₹1.2 लाख और पहाड़ी क्षेत्रों में ₹1.3 लाख की सहायता।' },
        eligibility: { en: ['Houseless families or families living in kutcha houses according to SECC data'], hi: ['एसईसीसी डेटा के अनुसार बेघर परिवार या कच्चे घरों में रहने वाले परिवार'] },
        requiredDocuments: { en: ['Aadhar Card', 'Bank Account details', 'Swachh Bharat Mission registration number'], hi: ['आधार कार्ड', 'बैंक खाता विवरण', 'स्वच्छ भारत मिशन पंजीकरण संख्या'] },
        applicationProcess: { en: 'Apply through local Gram Sabha or block-level development officers.', hi: 'स्थानीय ग्राम सभा या ब्लॉक-स्तरीय विकास अधिकारियों के माध्यम से आवेदन करें।' },
        department: { en: 'Ministry of Rural Development', hi: 'ग्रामीण विकास मंत्रालय' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://pmayg.nic.in',
        isActive: true
      },
      {
        title: { en: 'Ayushman Bharat PM-JAY', hi: 'आयुष्मान भारत पीएम-जेएवाई' },
        description: { en: 'Free healthcare coverage for secondary and tertiary care hospitalization.', hi: 'माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए मुफ्त स्वास्थ्य सेवा कवरेज।' },
        category: ['health', 'general'],
        state: 'Central',
        benefits: { en: 'Health cover of up to ₹5 Lakh per family per year.', hi: 'प्रति परिवार प्रति वर्ष ₹5 लाख तक का स्वास्थ्य कवर।' },
        eligibility: { en: ['Identified poor and vulnerable families based on SECC 2011 index'], hi: ['एसईसीसी 2011 सूचकांक के आधार पर पहचाने गए गरीब और कमजोर परिवार'] },
        requiredDocuments: { en: ['Aadhar Card', 'Ration Card', 'PMJAY Letter or Golden Card'], hi: ['आधार कार्ड', 'राशन कार्ड', 'पीएमजेएवाई पत्र या गोल्डन कार्ड'] },
        applicationProcess: { en: 'Check eligibility online or visit nearest empanelled hospital or CSC.', hi: 'ऑनलाइन पात्रता की जांच करें या निकटतम सूचीबद्ध अस्पताल या सीएससी पर जाएं।' },
        department: { en: 'National Health Authority', hi: 'राष्ट्रीय स्वास्थ्य प्राधिकरण' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://pmjay.gov.in',
        isActive: true
      },
      {
        title: { en: 'PM Kisan Maandhan Yojana', hi: 'पीएम किसान मानधन योजना' },
        description: { en: 'Old age protection and social security pension scheme for Small and Marginal Farmers.', hi: 'छोटे और सीमांत किसानों के लिए वृद्धावस्था सुरक्षा और सामाजिक सुरक्षा पेंशन योजना।' },
        category: ['farmer', 'senior_citizen'],
        state: 'Central',
        benefits: { en: 'Minimum assured pension of ₹3,000 per month after attaining age 60.', hi: '60 वर्ष की आयु प्राप्त करने के बाद प्रति माह न्यूनतम ₹3,000 की सुनिश्चित पेंशन।' },
        eligibility: { en: ['Small and marginal farmers aged 18 to 40 years with cultivable land up to 2 hectares'], hi: ['2 हेक्टेयर तक कृषि योग्य भूमि वाले 18 से 40 वर्ष की आयु के छोटे और सीमांत किसान'] },
        requiredDocuments: { en: ['Aadhar Card', 'Bank Account details', 'Landholding documents'], hi: ['आधार कार्ड', 'बैंक खाता विवरण', 'भूमि जोत दस्तावेज'] },
        applicationProcess: { en: 'Apply through nearest Common Service Centre (CSC) or self-enrollment.', hi: 'निकटतम कॉमन सर्विस सेंटर (सीएससी) या स्व-नामांकन के माध्यम से आवेदन करें।' },
        department: { en: 'Ministry of Agriculture and Farmers Welfare', hi: 'कृषि एवं किसान कल्याण मंत्रालय' },
        deadline: new Date('2026-11-30'),
        officialLink: 'https://maandhan.in',
        isActive: true
      },
      {
        title: { en: 'Pradhan Mantri Mudra Yojana', hi: 'प्रधानमंत्री मुद्रा योजना' },
        description: { en: 'Collateral-free loans to micro and small enterprises to set up or expand businesses.', hi: 'व्यवसाय स्थापित करने या विस्तार करने के लिए सूक्ष्म और लघु उद्यमों को बिना गारंटी का ऋण।' },
        category: ['businessman'],
        state: 'Central',
        benefits: { en: 'Loans up to ₹10 Lakh in categories Shishu, Kishore, and Tarun.', hi: 'शिशु, किशोर और तरुण श्रेणियों में ₹10 लाख तक का ऋण।' },
        eligibility: { en: ['Non-farm, non-corporate micro enterprises and individuals starting new businesses'], hi: ['गैर-कृषि, गैर-कॉर्पोरेट सूक्ष्म उद्यम और नया व्यवसाय शुरू करने वाले व्यक्ति'] },
        requiredDocuments: { en: ['Mudra Application form', 'Business Plan', 'ID proof', 'Address proof'], hi: ['मुद्रा आवेदन पत्र', 'बिजनेस प्लान', 'पहचान पत्र', 'पता प्रमाण पत्र'] },
        applicationProcess: { en: 'Apply at any commercial bank, RRB, cooperative bank, or online on Udyam Mitra portal.', hi: 'किसी भी वाणिज्यिक बैंक, आरआरबी, सहकारी बैंक या उद्यम मित्र पोर्टल पर ऑनलाइन आवेदन करें।' },
        department: { en: 'Department of Financial Services', hi: 'वित्तीय सेवा विभाग' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://www.mudra.org.in',
        isActive: true
      },
      {
        title: { en: 'Post Matric Scholarship Scheme', hi: 'पोस्ट मैट्रिक छात्रवृत्ति योजना' },
        description: { en: 'Scholarships to students belonging to weaker sections for post-matriculation courses.', hi: 'कमजोर वर्गों के छात्रों को मैट्रिक के बाद के पाठ्यक्रमों के लिए छात्रवृत्ति।' },
        category: ['student'],
        state: 'Central',
        benefits: { en: 'Tuition fee reimbursement and monthly maintenance allowance.', hi: 'शिक्षण शुल्क प्रतिपूर्ति और मासिक रखरखाव भत्ता।' },
        eligibility: { en: ['Students belonging to SC/ST/OBC categories with family income below ₹2.5 Lakhs per annum'], hi: ['वार्षिक पारिवारिक आय ₹2.5 लाख से कम वाले एससी/एसटी/ओबीसी श्रेणियों के छात्र'] },
        requiredDocuments: { en: ['Caste Certificate', 'Income Certificate', 'Previous Year Marksheet', 'Aadhar Card'], hi: ['जाति प्रमाण पत्र', 'आय प्रमाण पत्र', 'पिछले वर्ष की मार्कशीट', 'आधार कार्ड'] },
        applicationProcess: { en: 'Apply online on the National Scholarship Portal (NSP).', hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) पर ऑनलाइन आवेदन करें।' },
        department: { en: 'Ministry of Social Justice and Empowerment', hi: 'सामाजिक न्याय और अधिकारिता मंत्रालय' },
        deadline: new Date('2026-10-31'),
        officialLink: 'https://scholarships.gov.in',
        isActive: true
      },
      {
        title: { en: 'PM-KUSUM Scheme', hi: 'पीएम-कुसुम योजना' },
        description: { en: 'Installation of solar agricultural pumps to provide energy security to farmers.', hi: 'किसानों को ऊर्जा सुरक्षा प्रदान करने के लिए सौर कृषि पंपों की स्थापना।' },
        category: ['farmer'],
        state: 'Central',
        benefits: { en: 'Up to 60% subsidy on solar pump installation and option to sell surplus power.', hi: 'सौर पंप स्थापना पर 60% तक की सब्सिडी और अतिरिक्त बिजली बेचने का विकल्प।' },
        eligibility: { en: ['Individual farmers, groups of farmers, panchayats, or cooperatives'], hi: ['व्यक्तिगत किसान, किसानों के समूह, पंचायतें या सहकारी समितियां'] },
        requiredDocuments: { en: ['Land Ownership Document', 'Aadhar Card', 'Bank details', 'Mobile Number'], hi: ['भूमि स्वामित्व दस्तावेज', 'आधार कार्ड', 'बैंक विवरण', 'मोबाइल नंबर'] },
        applicationProcess: { en: 'Apply online on state-specific DISCOM/Energy portal or solar department.', hi: 'राज्य-विशिष्ट डिस्कॉम/ऊर्जा पोर्टल या सौर विभाग पर ऑनलाइन आवेदन करें।' },
        department: { en: 'Ministry of New and Renewable Energy', hi: 'नवीन और नवीकरणीय ऊर्जा मंत्रालय' },
        deadline: new Date('2026-09-30'),
        officialLink: 'https://mnre.gov.in',
        isActive: true
      },
      {
        title: { en: 'Pradhan Mantri Suraksha Bima Yojana', hi: 'प्रधानमंत्री सुरक्षा बीमा योजना' },
        description: { en: 'Accident insurance scheme offering high coverage at a negligible premium.', hi: 'नगण्य प्रीमियम पर उच्च कवरेज प्रदान करने वाली दुर्घटना बीमा योजना।' },
        category: ['general', 'labour'],
        state: 'Central',
        benefits: { en: 'Accidental death and full disability cover of ₹2 Lakhs for only ₹20 premium per year.', hi: 'प्रति वर्ष केवल ₹20 के प्रीमियम पर ₹2 लाख का दुर्घटना मृत्यु और पूर्ण विकलांगता कवर।' },
        eligibility: { en: ['Individuals aged 18 to 70 years with a bank account and auto-debit consent'], hi: ['बैंक खाते और ऑटो-डेबिट सहमति वाले 18 से 70 वर्ष की आयु के व्यक्ति'] },
        requiredDocuments: { en: ['Aadhar Card', 'Bank Passbook', 'PMSBY consent form'], hi: ['आधार कार्ड', 'बैंक पासबुक', 'पीएमएसबीवाई सहमति पत्र'] },
        applicationProcess: { en: 'Submit form to your saving bank branch or register via net banking.', hi: 'अपने बचत बैंक शाखा में फॉर्म जमा करें या नेट बैंकिंग के माध्यम से पंजीकरण करें।' },
        department: { en: 'Ministry of Finance', hi: 'वित्त मंत्रालय' },
        deadline: new Date('2026-05-31'),
        officialLink: 'https://jansuraksha.gov.in',
        isActive: true
      },
      {
        title: { en: 'Atal Pension Yojana', hi: 'अटल पेंशन योजना' },
        description: { en: 'Pension scheme focused on the unorganized sector workers to guarantee retirement income.', hi: 'सेवानिवृत्ति आय की गारंटी के लिए असंगठित क्षेत्र के श्रमिकों पर केंद्रित पेंशन योजना।' },
        category: ['general', 'labour', 'senior_citizen'],
        state: 'Central',
        benefits: { en: 'Guaranteed pension of ₹1,000 to ₹5,000 per month after age 60 depending on contribution.', hi: 'योगदान के आधार पर 60 वर्ष की आयु के बाद प्रति माह ₹1,000 से ₹5,000 की गारंटीकृत पेंशन।' },
        eligibility: { en: ['Citizens of India aged 18 to 40 years with a savings bank account'], hi: ['बचत बैंक खाते वाले 18 से 40 वर्ष की आयु के भारत के नागरिक'] },
        requiredDocuments: { en: ['Aadhar Card', 'Bank account linked mobile number', 'APY registration form'], hi: ['आधार कार्ड', 'बैंक खाते से लिंक मोबाइल नंबर', 'एपीवाई पंजीकरण फॉर्म'] },
        applicationProcess: { en: 'Visit your local bank branch where your savings account is held and apply.', hi: 'अपने स्थानीय बैंक शाखा में जाएं जहां आपका बचत खाता है और आवेदन करें।' },
        department: { en: 'Pension Fund Regulatory and Development Authority', hi: 'पेंशन फंड नियामक और विकास प्राधिकरण' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://www.npscra.nsdl.co.in',
        isActive: true
      },
      {
        title: { en: 'Sukanya Samriddhi Yojana', hi: 'सुकन्या समृद्धि योजना' },
        description: { en: 'A small deposit savings scheme for the girl child under "Beti Bachao Beti Padhao" campaign.', hi: '"बेटी बचाओ बेटी पढ़ाओ" अभियान के तहत बालिकाओं के लिए एक छोटी बचत योजना।' },
        category: ['women', 'student'],
        state: 'Central',
        benefits: { en: 'High interest rate (8.2% current) and tax benefits on savings for the girl child.', hi: 'बालिका के लिए बचत पर उच्च ब्याज दर (वर्तमान में 8.2%) और कर लाभ।' },
        eligibility: { en: ['Parents/Guardians of a girl child below 10 years of age (max 2 accounts per family)'], hi: ['10 वर्ष से कम आयु की बालिका के माता-पिता/अभिभावक (प्रति परिवार अधिकतम 2 खाते)'] },
        requiredDocuments: { en: ['Girl child Birth Certificate', 'Guardian ID proof', 'Address proof'], hi: ['बालिका का जन्म प्रमाण पत्र', 'अभिभावक का पहचान पत्र', 'पता प्रमाण पत्र'] },
        applicationProcess: { en: 'Open account at any post office or authorized commercial bank branch.', hi: 'किसी भी डाकघर या अधिकृत वाणिज्यिक बैंक शाखा में खाता खोलें।' },
        department: { en: 'Ministry of Women and Child Development', hi: 'महिला एवं बाल विकास विभाग' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://www.indiapost.gov.in',
        isActive: true
      },
      {
        title: { en: 'Janani Suraksha Yojana', hi: 'जननी सुरक्षा योजना' },
        description: { en: 'Safe motherhood intervention providing financial assistance for promoting institutional delivery.', hi: 'संस्थागत प्रसव को बढ़ावा देने के लिए वित्तीय सहायता प्रदान करने वाली सुरक्षित मातृत्व योजना।' },
        category: ['women', 'health'],
        state: 'Central',
        benefits: { en: 'Direct cash assistance to pregnant mothers for delivering in public health facilities.', hi: 'सरकारी स्वास्थ्य सुविधाओं में प्रसव कराने के लिए गर्भवती माताओं को प्रत्यक्ष नकद सहायता।' },
        eligibility: { en: ['All pregnant women delivering in government health centers or accredited private hospitals'], hi: ['सरकारी स्वास्थ्य केंद्रों या मान्यता प्राप्त निजी अस्पतालों में प्रसव कराने वाली सभी गर्भवती महिलाएं'] },
        requiredDocuments: { en: ['MCP Card (Mamta Card)', 'Aadhar Card', 'Bank Passbook', 'Delivery certificate'], hi: ['एमसीपी कार्ड (ममता कार्ड)', 'आधार कार्ड', 'बैंक पासबुक', 'प्रसव प्रमाण पत्र'] },
        applicationProcess: { en: 'Register with local ASHA worker or at nearest Government hospital.', hi: 'स्थानीय आशा कार्यकर्ता के साथ या निकटतम सरकारी अस्पताल में पंजीकरण करें।' },
        department: { en: 'Ministry of Health and Family Welfare', hi: 'स्वास्थ्य और परिवार कल्याण मंत्रालय' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://nhm.gov.in',
        isActive: true
      },
      {
        title: { en: 'National Old Age Pension Scheme (IGNOAPS)', hi: 'राष्ट्रीय वृद्धावस्था पेंशन योजना (IGNOAPS)' },
        description: { en: 'Monthly pension to elderly citizens living below the poverty line.', hi: 'गरीबी रेखा से नीचे रहने वाले वृद्ध नागरिकों को मासिक पेंशन।' },
        category: ['senior_citizen'],
        state: 'Central',
        benefits: { en: 'Monthly pension of ₹200 (for age 60-79) and ₹500 (for age 80+).', hi: 'मासिक पेंशन ₹200 (60-79 वर्ष की आयु के लिए) और ₹500 (80+ वर्ष की आयु के लिए)।' },
        eligibility: { en: ['Citizens aged 60 years or above belonging to BPL household'], hi: ['बीपीएल परिवार से संबंधित 60 वर्ष या उससे अधिक आयु के नागरिक'] },
        requiredDocuments: { en: ['BPL Ration Card', 'Age proof', 'Aadhar Card', 'Bank Passbook'], hi: ['बीपीएल राशन कार्ड', 'आयु प्रमाण पत्र', 'आधार कार्ड', 'बैंक पासबुक'] },
        applicationProcess: { en: 'Apply through local Janpad Panchayat, Ward office, or Social Justice department.', hi: 'स्थानीय जनपद पंचायत, वार्ड कार्यालय या सामाजिक न्याय विभाग के माध्यम से आवेदन करें।' },
        department: { en: 'Ministry of Rural Development', hi: 'ग्रामीण विकास मंत्रालय' },
        deadline: new Date('2026-12-31'),
        officialLink: 'https://nsap.nic.in',
        isActive: true
      }
    ];
    await Scheme.insertMany(schemesData);
    console.log(`Created ${schemesData.length} Government Schemes.`);

    // 8. Seed Health Awareness Cards
    console.log('Creating seed seasonal health tips...');
    const healthData = [
      {
        diseaseName: { en: 'Heatstroke (Loo)', hi: 'हीटस्ट्रोक (लू)' },
        season: 'summer',
        description: { en: 'A condition caused by your body overheating due to prolonged exposure to high temperatures.', hi: 'उच्च तापमान के लंबे समय तक संपर्क के कारण शरीर का अत्यधिक गर्म होना।' },
        symptoms: { en: ['High body temp (103°F+)', 'Hot, red, dry skin', 'Fast, strong pulse', 'Dizziness or nausea'], hi: ['तेज बुखार (103°F+)', 'गर्म, लाल, सूखी त्वचा', 'तेज नाड़ी', 'चक्कर या मतली'] },
        preventionTips: { en: ['Drink ORS/water frequently', 'Stay indoors 12 PM – 4 PM', 'Wear loose cotton clothes'], hi: ['खूब ORS/पानी पिएं', 'दोपहर 12-4 बजे घर रहें', 'ढीले सूती कपड़े पहनें'] },
        medicineSuggestions: { en: 'Paracetamol for fever, ORS for hydration.', hi: 'बुखार के लिए पैरासिटामोल, हाइड्रेशन के लिए ओआरएस।' },
        precautions: { en: 'Avoid caffeine or direct exposure to sun during peak hours.', hi: 'पीक आवर्स के दौरान कैफीन या सीधे धूप में जाने से बचें।' },
        emergencyWarnings: { en: ['Fainting / loss of consciousness', 'Confusion or slurred speech'], hi: ['बेहोशी', 'भ्रम या बोलने में कठिनाई'] },
        isActive: true
      },
      {
        diseaseName: { en: 'Dengue Fever', hi: 'डेंगू बुखार' },
        season: 'monsoon',
        description: { en: 'A mosquito-borne viral disease prevalent in tropical areas during monsoon season.', hi: 'मानसून में मच्छरों से फैलने वाला वायरल रोग।' },
        symptoms: { en: ['Sudden high fever', 'Severe joint & muscle pain', 'Pain behind eyes', 'Skin rash'], hi: ['अचानक तेज बुखार', 'जोड़ों में दर्द', 'आँखों के पीछे दर्द', 'त्वचा पर दाने'] },
        preventionTips: { en: ['Use mosquito nets & repellents', 'Clear stagnant water', 'Wear full-sleeved clothes'], hi: ['मच्छरदानी का प्रयोग करें', 'जमा पानी साफ करें', 'पूरी बांह के कपड़े पहनें'] },
        medicineSuggestions: { en: 'Paracetamol (Avoid Ibuprofen/Aspirin due to bleeding risk).', hi: 'पैरासिटामोल (रक्तस्राव के जोखिम के कारण इबुप्रोफेन/एस्पिरिन से बचें)।' },
        precautions: { en: 'Monitor platelet counts closely.', hi: 'प्लेटलेट काउंट की बारीकी से निगरानी करें।' },
        emergencyWarnings: { en: ['Bleeding from gums/nose', 'Severe abdominal pain', 'Persistent vomiting'], hi: ['मसूड़ों से खून', 'पेट में तेज दर्द', 'लगातार उल्टी'] },
        isActive: true
      },
      {
        diseaseName: { en: 'Common Cold & Flu', hi: 'सर्दी और फ्लू' },
        season: 'winter',
        description: { en: 'Viral respiratory illness spread by contact with an infected person or contaminated surfaces.', hi: 'वायरल श्वसन संक्रमण जो छींकने या संपर्क से फैलता है।' },
        symptoms: { en: ['Runny nose', 'Sore throat', 'Cough & sneezing', 'Mild fever & body ache'], hi: ['नाक बहना', 'गले में दर्द', 'खांसी और छींक', 'हल्का बुखार'] },
        preventionTips: { en: ['Wash hands frequently', 'Wear warm clothes', 'Avoid crowded places when sick'], hi: ['बार-बार हाथ धोएं', 'गर्म कपड़े पहनें', 'बीमार होने पर भीड़ से बचें'] },
        medicineSuggestions: { en: 'Anti-histamines, cough syrup, warm fluids.', hi: 'एंटी-हिस्टामाइन, कफ सिरप, गर्म तरल पदार्थ।' },
        precautions: { en: 'Cover nose and mouth when coughing or sneezing.', hi: 'खांसते या छींकते समय नाक और मुंह ढकें।' },
        emergencyWarnings: { en: ['Difficulty breathing', 'Chest pain', 'High fever above 104°F'], hi: ['सांस लेने में कठिनाई', 'सीने में दर्द', '104°F से अधिक बुखार'] },
        isActive: true
      },
      {
        diseaseName: { en: 'Malaria', hi: 'मलेरिया' },
        season: 'monsoon',
        description: { en: 'A life-threatening disease caused by parasites transmitted through the bites of infected female Anopheles mosquitoes.', hi: 'मादा एनोफेलीज मच्छर के काटने से फैलने वाला जानलेवा रोग।' },
        symptoms: { en: ['Cyclic fever & chills', 'Sweating', 'Headache', 'Vomiting & fatigue'], hi: ['बुखार और कंपकंपी', 'पसीना', 'सिरदर्द', 'उल्टी और थकान'] },
        preventionTips: { en: ['Sleep under insecticide-treated nets', 'Take antimalarial pills if travelling', 'Eliminate standing water'], hi: ['कीटनाशक जाल के नीचे सोएं', 'सफर में मलेरियारोधी दवाएं लें', 'खड़े पानी को हटाएं'] },
        medicineSuggestions: { en: 'Antimalarial drugs as prescribed by a qualified doctor.', hi: 'योग्य डॉक्टर द्वारा बताए अनुसार मलेरिया-रोधी दवाएं।' },
        precautions: { en: 'Do not self-medicate with antibiotics.', hi: 'एंटीबायोटिक्स के साथ खुद का इलाज न करें।' },
        emergencyWarnings: { en: ['Severe shaking/chills', 'High fever with confusion', 'Jaundice or dark urine'], hi: ['तेज कंपकंपी', 'बुखार के साथ भ्रम', 'पीलिया या गहरे रंग का मूत्र'] },
        isActive: true
      }
    ];
    await Health.insertMany(healthData);
    console.log(`Created ${healthData.length} Health Tips/Diseases.`);

    console.log('🎉 Seeding successfully completed!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDB();
