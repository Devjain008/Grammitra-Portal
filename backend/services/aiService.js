import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Helper to get the correct model
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Translation mapping for bilingual outputs
const translationMap = {
  months: {
    january: 'जनवरी',
    february: 'फरवरी',
    march: 'मार्च',
    april: 'अप्रैल',
    may: 'मई',
    june: 'जून',
    july: 'जुलाई',
    august: 'अगस्त',
    september: 'सितंबर',
    october: 'अक्टूबर',
    november: 'नवंबर',
    december: 'दिसंबर'
  },
  soils: {
    black: 'काली मिट्टी',
    alluvial: 'जलोढ़ मिट्टी',
    red: 'लाल मिट्टी'
  },
  regions: {
    north: 'उत्तर भारत',
    central: 'मध्य भारत',
    south: 'दक्षिण भारत'
  },
  weather: {
    sunny: 'धूप / साफ',
    clear: 'साफ मौसम',
    rainy: 'बारिश',
    rain: 'बारिश',
    cloudy: 'बादल छाए हुए',
    clouds: 'बादल छाए हुए',
    'partly cloudy': 'आंशिक रूप से बादल',
    haze: 'धुंध',
    mist: 'कोहरा',
    fog: 'धुंध / कोहरा',
    thunderstorm: 'आंधी-तूफान',
    drizzle: 'बूंदाबांदी',
    snow: 'बर्फबारी',
    heatwave: 'लू / अत्यधिक गर्मी'
  }
};

const translateToHindi = (value, category) => {
  if (!value) return '';
  const valLower = value.toString().toLowerCase().trim();
  
  if (translationMap[category] && translationMap[category][valLower]) {
    return translationMap[category][valLower];
  }
  
  // Partial matches for weather
  if (category === 'weather') {
    for (const key of Object.keys(translationMap.weather)) {
      if (valLower.includes(key)) {
        return translationMap.weather[key];
      }
    }
  }
  
  return value; // fallback
};

/**
 * Base AI Assistant for general queries (Healthcare, Education, Business)
 */
export const generateGeneralAdvice = async (prompt, language = 'en') => {
  try {
    const model = getModel();
    const langInstruction = language === 'hi' 
      ? 'Respond strictly in clear, simple Hindi.' 
      : 'Respond strictly in simple, easy-to-understand English.';

    const systemContext = `
      You are GramMitra AI, an intelligent, respectful, and helpful assistant for a smart village ecosystem in India.
      Answer the user's query clearly and concisely. If it is about healthcare, provide awareness but remind them to see a doctor.
      ${langInstruction}
      
      User Query: ${prompt}
    `;

    const result = await model.generateContent(systemContext);
    return result.response.text();
  } catch (error) {
    console.warn("Gemini API call failed, using intelligent fallback system:", error.message);
    return getAdviceFallback(prompt, language);
  }
};

/**
 * Specialized Farming AI for Crop Recommendations
 */
export const generateCropRecommendations = async (month, weather, soilType, region, language = 'en') => {
  try {
    const model = getModel();
    const isHindi = language === 'hi';

    let displayMonth = month;
    let displayWeather = weather;
    let displaySoil = soilType;
    let displayRegion = region;

    if (isHindi) {
      displayMonth = translateToHindi(month, 'months');
      displayWeather = translateToHindi(weather, 'weather');
      displaySoil = translateToHindi(soilType, 'soils');
      displayRegion = translateToHindi(region, 'regions');
    }

    const systemContext = isHindi 
      ? `आप ग्राममित्र के विशेषज्ञ कृषि AI हैं।
निम्नलिखित डेटा के आधार पर फसल की सिफारिशें प्रदान करें:
- महीना: ${displayMonth}
- मौसम: ${displayWeather}
- मिट्टी का प्रकार: ${displaySoil}
- क्षेत्र: ${displayRegion}

अपनी प्रतिक्रिया को इस प्रारूप में व्यवस्थित करें:
1. अभी उगाने के लिए शीर्ष 2 सर्वोत्तम फसलें।
2. अपेक्षित विकास अवधि और पानी की आवश्यकता।
3. इन फसलों के लिए प्राकृतिक बनाम रासायनिक खेती की संक्षिप्त तुलना (लागत, मिट्टी पर प्रभाव)।

प्रतिक्रिया पूरी तरह से स्पष्ट और सरल हिंदी में होनी चाहिए। इसे भारतीय किसानों के लिए व्यावहारिक रखें।`
      : `You are GramMitra's Expert Agricultural AI.
Provide crop recommendations based on the following data:
- Month: ${displayMonth}
- Weather: ${displayWeather}
- Soil Type: ${displaySoil}
- Region: ${displayRegion}

Format your response with:
1. Top 2 best crops to grow right now.
2. Expected growth duration & water requirement.
3. A brief comparison of Natural vs Chemical farming for these crops (cost, soil impact).

Keep it practical for Indian farmers. Respond in English.`;

    const result = await model.generateContent(systemContext);
    return result.response.text();
  } catch (error) {
    console.warn("Farming AI API failed, using intelligent fallback system:", error.message);
    return getCropRecommendationsFallback(month, weather, soilType, region, language);
  }
};

/**
 * Local Fallback Handler for Advice Prompts (Bilingual)
 */
function getAdviceFallback(prompt, language) {
  const p = prompt.toLowerCase();
  const isHindi = language === 'hi';

  // 1. Agriculture / Farming Questions
  if (p.includes('crop') || p.includes('fertilizer') || p.includes('farming') || p.includes('yield') || p.includes('profit') || 
      p.includes('फसल') || p.includes('खेती') || p.includes('खाद') || p.includes('पैदावार') || p.includes('कृषि')) {
    if (isHindi) {
      return `नमस्ते! फसल की पैदावार बढ़ाने और खाद के सही उपयोग के लिए मुख्य सुझाव:

1. मिट्टी का परीक्षण (Soil Test): खाद डालने से पहले अपनी मिट्टी की जांच कराएं ताकि नाइट्रोजन, फास्फोरस और पोटाश के स्तर का पता चल सके।
2. संतुलित खाद: गोबर की खाद या केंचुआ खाद (कंपोस्ट) के साथ उचित अनुपात में NPK रासायनिक खादों का प्रयोग करें।
3. जैव उर्वरक (Biofertilizers): मिट्टी की प्राकृतिक ताकत बढ़ाने के लिए राइजोबियम या एजोटोबैक्टर कल्चर का उपयोग करें।
4. फसल चक्र (Crop Rotation): मिट्टी की उर्वरता बनाए रखने के लिए अनाज के बाद दलहन (जैसे मूंग, उड़द) की फसलें उगाएं।

क्या आपके पास कोई विशेष फसल से संबंधित सवाल है? आप पूछ सकते हैं!`;
    } else {
      return `Namaste! Here are some key recommendations to increase crop yield and optimize fertilizer use:

1. Soil Testing: Before applying fertilizers, test your soil to check nitrogen, phosphorus, and potassium levels.
2. Balanced Fertilization: Use a combination of organic compost (cow dung, vermicompost) and chemical NPK fertilizer in the ratio recommended for your specific crop.
3. Biofertilizers: Use Azotobacter or Rhizobium cultures to naturally enrich the soil with nitrogen.
4. Crop Rotation: Rotate cereals with legumes (e.g., moong, urad) to restore soil fertility naturally.

Feel free to ask if you have questions about a specific crop!`;
    }
  }

  // 2. Education / Careers / Coding
  if (p.includes('career') || p.includes('study') || p.includes('code') || p.includes('learn') || p.includes('exam') || p.includes('student') || 
      p.includes('पढ़ाई') || p.includes('परीक्षा') || p.includes('कोडिंग') || p.includes('नौकरी') || p.includes('छात्र')) {
    if (isHindi) {
      return `नमस्ते! ग्रामीण छात्रों के लिए कोडिंग और आधुनिक तकनीक में करियर बनाने के मुख्य सुझाव:

1. कोडिंग सीखें: W3Schools, freeCodeCamp या YouTube से मुफ़्त में HTML, CSS और JavaScript सीखें।
2. कृषि तकनीक (Agri-Tech): स्मार्ट खेती और मौसम की भविष्यवाणी करने वाले ऐप्स बनाने वाले डेवलपर्स की आज बाजार में भारी मांग है।
3. सरकारी परीक्षाएँ: यदि आप SSC या बैंक परीक्षा की तैयारी कर रहे हैं, तो गणित, सामान्य ज्ञान और तार्किक क्षमता (Reasoning) के लिए रोज़ 4 घंटे का समय दें।
4. स्थानीय प्रोजेक्ट्स: अपने गाँव की समस्याओं को हल करने वाले छोटे ऐप्स या वेबसाइट्स बनाकर अभ्यास करें।

आप किस विषय या सरकारी परीक्षा के बारे में विस्तार से जानना चाहते हैं?`;
    } else {
      return `Hello! For rural students looking to build a career in Coding or Modern Technology:

1. Learn Coding Basics: Start with free online resources like W3Schools, freeCodeCamp, or YouTube. Learn HTML, CSS, and basic JavaScript.
2. Agriculture Technology: There is a high demand for developers who can build apps for smart farming, weather tracking, and marketplace solutions.
3. Government Exams: If you are preparing for SSC or Bank exams, allocate 4 hours daily to Quantitative Aptitude, General Knowledge, and Reasoning.
4. Build Projects: Create small websites or apps that solve local problems in your village to stand out in interviews.

Let me know if you want a detailed roadmap for a specific field!`;
    }
  }

  // 3. Business / Store / Marketplace
  if (p.includes('business') || p.includes('shop') || p.includes('sell') || p.includes('marketplace') || p.includes('price') || 
      p.includes('व्यापार') || p.includes('दुकान') || p.includes('बिक्री') || p.includes('ग्राहक')) {
    if (isHindi) {
      return `नमस्ते! अपने गाँव के व्यवसाय को बढ़ाने के लिए मुख्य रणनीतियाँ:

1. माँग को समझें: ऐसी चीजों की पहचान करें जिनकी गाँव में ज़रूरत है लेकिन उन्हें लेने के लिए शहर जाना पड़ता है (जैसे मोबाइल रिपेयर, खाद की नई किस्में)।
2. डिजिटल माध्यम: अपने व्यवसाय को ग्राममित्र मार्केटप्लेस पर पंजीकृत करें ताकि लोग घर बैठे उत्पाद देख सकें और सीधे संपर्क कर सकें।
3. अच्छी ग्राहक सेवा: नियमित ग्राहकों को होम डिलीवरी या आसान भुगतान की सुविधा दें ताकि वे आपके पास ही आएं।
4. मौसमी स्टॉक: त्यौहारों या खेती के सीजन से पहले ही जरूरी सामानों का स्टॉक रखें।

आपके पास किस तरह की दुकान या व्यवसाय का विचार है?`;
    } else {
      return `Namaste! Here is a strategy to grow your local village business:

1. Identify Demand: Analyze what products are in high demand in your village but require traveling to the town (e.g., electronics repair, specialized seed supply).
2. Digital Presence: Register your shop on the GramMitra marketplace to allow villagers to browse products online and call you.
3. Customer Service: Offer home delivery or flexible credit options to regular customers to build trust.
4. Seasonal Inventory: Keep stocks of items ahead of their season (e.g., fertilizers before monsoon, clothing before festivals).

Tell me about your business idea and we can plan details!`;
    }
  }

  // 4. Healthcare / Illness / Fever
  if (p.includes('health') || p.includes('fever') || p.includes('dengue') || p.includes('cough') || p.includes('doctor') || p.includes('medicine') || 
      p.includes('बीमारी') || p.includes('बुखार') || p.includes('दवा') || p.includes('डॉक्टर') || p.includes('इलाज')) {
    if (isHindi) {
      return `*महत्वपूर्ण अस्वीकरण: मैं एक एआई सहायक हूँ, डॉक्टर नहीं। किसी भी गंभीर स्थिति या बीमारी में कृपया तुरंत डॉक्टर से संपर्क करें।*

सामान्य स्वास्थ्य और प्राथमिक उपचार के मुख्य सुझाव:

1. पानी की कमी न होने दें (Keep Hydrated): ओआरएस (ORS) या साफ उबले हुए पानी का खूब सेवन करें।
2. बुखार प्रबंधन: आराम करें और शरीर का तापमान नियंत्रित रखने के लिए माथे पर ठंडी पट्टियां रखें। पैरासिटामोल जैसी दवाएं डॉक्टर की सलाह से ही लें।
3. बचाव के उपाय: मच्छरों से बचने के लिए आसपास पानी जमा न होने दें और पूरी बाजू के कपड़े पहनें।
4. आपातकालीन चेतावनी: सांस लेने में कठिनाई या बेहोशी होने पर बिना देर किए अस्पताल जाएं।

क्या आप किसी विशेष बीमारी के लक्षण जानना चाहते हैं?`;
    } else {
      return `*Disclaimer: I am an AI assistant, not a medical professional. Please consult a qualified doctor for any serious health conditions.*

For general health and recovery tips:

1. Keep Hydrated: Drink plenty of clean, boiled water or ORS (Oral Rehydration Salts).
2. Fever Management: Take rest and use cold damp cloths on the forehead to keep body temperature down. Consult a doctor before taking medications.
3. Preventive Care: Keep surroundings clean, clear stagnant water to avoid mosquito-borne diseases (dengue/malaria), and wear full clothing.
4. Seek Emergency Care if you experience difficulty breathing, chest pain, or loss of consciousness.

Please let me know if you want symptoms for a specific seasonal disease!`;
    }
  }

  // 5. Default General Response
  if (isHindi) {
    return `नमस्ते! मैं ग्राममित्र एआई (GramMitra AI) हूँ, आपका ग्रामीण सहायक। 

मैं आपकी निम्नलिखित विषयों में मदद कर सकता हूँ:
- 🌾 खेती-बाड़ी और फसलों की जानकारी
- 📚 करियर मार्गदर्शन और पढ़ाई के टिप्स
- 💼 व्यापार विकास और ग्रामीण मार्केटप्लेस
- 🏥 स्वास्थ्य जागरूकता और प्राथमिक उपचार
- 🏛️ सरकारी योजनाओं की जानकारी

आप मुझसे कोई भी सवाल पूछ सकते हैं!`;
  } else {
    return `Namaste! I am GramMitra AI, your smart village companion.

I can assist you with:
- 🌾 Agriculture & Crop Suggestions
- 📚 Career Roadmaps & Study Tips
- 💼 Business Growth & Local Marketplace
- 🏥 Healthcare Awareness & First Aid
- 🏛️ Government Schemes Information

Feel free to ask me anything!`;
  }
}

/**
 * Local Fallback Handler for Crop Recommendations (Bilingual)
 */
function getCropRecommendationsFallback(month, weather, soilType, region, language) {
  const isHindi = language === 'hi';
  
  // Decide crops based on Month
  const m = month.toLowerCase();
  let crop1 = "Rice (Paddy)";
  let crop2 = "Maize (Corn)";
  let crop1Hi = "धान (चावल)";
  let crop2Hi = "मक्का";
  let duration1 = "120-150 days";
  let duration2 = "90-110 days";
  let water1 = "High (Requires stagnant water/heavy rainfall)";
  let water1Hi = "अधिक (खड़े पानी और भारी वर्षा की आवश्यकता)";
  let water2 = "Moderate (Regular irrigation needed)";
  let water2Hi = "मध्यम (नियमित सिंचाई की आवश्यकता)";

  if (m.includes('oct') || m.includes('nov') || m.includes('dec') || m.includes('jan') || m.includes('feb') || m.includes('mar')) {
    // Rabi Season
    crop1 = "Wheat (Gehun)";
    crop2 = "Mustard (Sarson)";
    crop1Hi = "गेहूँ";
    crop2Hi = "सरसों";
    duration1 = "110-130 days";
    duration2 = "100-120 days";
    water1 = "Moderate (3-4 irrigations)";
    water1Hi = "मध्यम (3-4 सिंचाई)";
    water2 = "Low (Requires dry weather and cool climate)";
    water2Hi = "कम (सूखे और ठंडे मौसम की आवश्यकता)";
  } else if (m.includes('apr') || m.includes('may') || m.includes('jun')) {
    // Zaid Season
    crop1 = "Moong Dal (Green Gram)";
    crop2 = "Cucumber / Watermelon";
    crop1Hi = "मूंग दाल";
    crop2Hi = "खीरा / तरबूज";
    duration1 = "60-70 days";
    duration2 = "70-90 days";
    water1 = "Low to Moderate";
    water1Hi = "कम से मध्यम";
    water2 = "Moderate (Regular light watering)";
    water2Hi = "मध्यम (हल्की और नियमित सिंचाई)";
  }

  if (isHindi) {
    const displayMonth = translateToHindi(month, 'months');
    const displayWeather = translateToHindi(weather, 'weather');
    const displaySoil = translateToHindi(soilType, 'soils');
    const displayRegion = translateToHindi(region, 'regions');

    return `ग्राममित्र कृषि विशेषज्ञ AI के अनुसार फसल सिफारिशें:

मौसम: ${displayWeather}
मिट्टी का प्रकार: ${displaySoil}
क्षेत्र: ${displayRegion}
महीना: ${displayMonth}

1. सर्वोत्तम अनुशंसित फसलें:
- **प्रथम फसल: ${crop1Hi}**
  - विकास अवधि: ${duration1}
  - पानी की आवश्यकता: ${water1Hi}
- **द्वितीय फसल: ${crop2Hi}**
  - विकास अवधि: ${duration2}
  - पानी की आवश्यकता: ${water2Hi}

2. प्राकृतिक बनाम रासायनिक खेती की तुलना:
- **प्राकृतिक खेती (जीवामृत/नीमास्त्र):**
  - लागत: बहुत कम (घर पर बने खाद का उपयोग)।
  - मिट्टी पर प्रभाव: मिट्टी की उपजाऊ शक्ति और सूक्ष्मजीवों में वृद्धि।
  - पानी की बचत: मल्चिंग के कारण नमी बनी रहती है, 30% कम पानी लगता है।
- **रासायनिक खेती (यूरिया/DAP):**
  - लागत: अधिक (बाजार से महंगे उर्वरक और कीटनाशक खरीदना)।
  - मिट्टी पर प्रभाव: मिट्टी धीरे-धीरे बंजर हो जाती है, उपजाऊ तत्व नष्ट होते हैं।
  - पानी की आवश्यकता: रासायनिक तत्वों को घोलने के लिए बार-बार अधिक पानी की आवश्यकता होती है।

*सुझाव: मिट्टी की अच्छी सेहत और टिकाऊ मुनाफे के लिए प्राकृतिक खेती अपनाएं।*`;
  } else {
    return `GramMitra Agricultural Expert AI - Crop Recommendations:

Weather: ${weather}
Soil Type: ${soilType}
Region: ${region}
Month: ${month}

1. Top Recommended Crops:
- **Crop 1: ${crop1}**
  - Growth Duration: ${duration1}
  - Water Requirement: ${water1}
- **Crop 2: ${crop2}**
  - Growth Duration: ${duration2}
  - Water Requirement: ${water2}

2. Natural vs Chemical Farming Comparison:
- **Natural Farming (Using Jeevamrit / Neemastra):**
  - Cost: Very Low (uses zero-cost home-made bio-inputs).
  - Soil Impact: Enriches soil organic carbon, enhances beneficial microbes, improves fertility long-term.
  - Water Usage: Requires around 30% less water due to enhanced soil moisture retention.
- **Chemical Farming (Using Urea / DAP / Pesticides):**
  - Cost: High (requires purchasing synthetic fertilizers & pesticides from market).
  - Soil Impact: Leads to soil acidification and degradation of soil structure over time.
  - Water Usage: High water demand to dissolve chemical fertilizers and maintain moisture.

*Recommendation: Transitioning to Organic/Natural farming will lower your expenses and increase your net profit sustainably.*`;
  }
}