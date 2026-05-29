import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Helper to get the correct model
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

  // 1. Natural Pest Control Tips
  if (p.includes('pest') || p.includes('insect') || p.includes('कीटनाशक') || p.includes('कीट')) {
    if (isHindi) {
      return `नमस्ते! प्राकृतिक कीट नियंत्रण (Natural Pest Control) के लिए 4 अत्यंत प्रभावी जैविक उपाय निम्नलिखित हैं:

1. **नीमअस्त्र (Neemastra)**: 5 किलो नीम की पत्तियों की चटनी, 5 लीटर गोमूत्र, और 1 किलो ताज़ा गोबर को 100 लीटर पानी में मिलाकर 24 घंटे के लिए रखें। रस चूसक कीटों और छोटी इल्लियों के लिए यह सर्वोत्तम जैविक कीटनाशक है।
2. **अग्निअस्त्र (Agniastra)**: 5 किलो नीम की पत्तियां, 500 ग्राम तंबाकू, 500 ग्राम तीखी हरी मिर्च और 250 ग्राम लहसुन को गोमूत्र में अच्छी तरह उबालें। छानकर पानी में मिलाकर फसलों पर छिड़काव करें। यह तना छेदक और फल छेदक कीटों का पूर्ण नियंत्रण करता है।
3. **दशपर्णी अर्क (Dashparni Ark)**: नीम, करंज, धतूरा, बेल, शरीफा और 5 अन्य प्रकार की कड़वी पत्तियों के अर्क से तैयार यह घोल सभी प्रकार के हानिकारक कीटों का काल है।
4. **नीम तेल छिड़काव (Neem Oil Spray)**: 1 लीटर पानी में 15-20 मिली नीम का तेल और 5-6 बूंदें जैविक तरल साबुन की मिलाकर हर हफ्ते छिड़काव करें।`;
    } else {
      return `Namaste! Here are 4 highly effective natural pest control remedies:

1. **Neemastra**: Mix 5kg neem leaf paste, 5L cow urine, and 1kg fresh cow dung in 100L water. Ferment for 24 hours, stir twice daily. Excellent for controlling sucking pests, aphids, and whiteflies.
2. **Agniastra**: Boil neem leaves, tobacco, spicy green chillies, and garlic paste in cow urine. Filter and dilute with water to spray. Effectively controls stem borer and fruit borer caterpillars.
3. **Dashparni Ark**: Prepared by fermenting extracts from 10 different bitter and medicinal leaves. It is the ultimate organic broad-spectrum botanical pesticide.
4. **Neem Oil Spray**: Mix 15-20ml organic Neem Oil with 5-6 drops of liquid soap in 1L of water. Spray weekly to prevent insect attacks.`;
    }
  }

  // 2. Soil Testing
  if (p.includes('soil test') || p.includes('soil testing') || p.includes('मिट्टी की जांच') || p.includes('मृदा')) {
    if (isHindi) {
      return `नमस्ते! मिट्टी की जांच (Soil Testing) कराने की पूरी प्रक्रिया और लाभ यहाँ दिए गए हैं:

1. **नमूना कैसे लें (How to Collect)**: अपने खेत के 10-15 अलग-अलग स्थानों से ऊपरी घास-फूस हटाकर अंग्रेजी के 'V' आकार में 15 सेमी गहरा गड्ढा खोदें। दोनों तरफ की मिट्टी खुरचकर निकालें। सभी नमूनों को अच्छी तरह मिलाएं और 500 ग्राम मिट्टी एक साफ थैली में रख लें।
2. **कहाँ जमा करें (Where to Submit)**: इस नमूने को अपने नजदीकी सरकारी मृदा परीक्षण प्रयोगशाला या कृषि विज्ञान केंद्र (KVK) में जमा करें।
3. **लाभ (Benefits)**: यह आपकी मिट्टी में नाइट्रोजन, फास्फोरस, पोटाश और जिंक जैसे सूक्ष्म तत्वों की सटीक कमी को बताता है, जिससे अनावश्यक खाद का खर्च 25% तक कम हो जाता है।`;
    } else {
      return `Namaste! Here is your complete guide to Soil Testing:

1. **How to Collect Sample**: Clear the top dry organic matter from 10-15 random spots in your field. Dig a 'V' shaped pit of 15cm depth. Scrap soil from the sides, mix all samples thoroughly, dry in shade, and pack 500g in a clean plastic bag.
2. **Where to Submit**: Take the sample to your nearest Krishi Vigyan Kendra (KVK) or Government Soil Testing Laboratory.
3. **Key Benefits**: It evaluates the exact content of Nitrogen (N), Phosphorus (P), Potassium (K), and micronutrients. Helps you reduce fertilizer costs by up to 25% by applying only what is missing.`;
    }
  }

  // 3. Dengue Symptoms & Treatment
  if (p.includes('dengue') || p.includes('डेंगू')) {
    if (isHindi) {
      return `*महत्वपूर्ण अस्वीकरण: मैं एक एआई हूँ, डॉक्टर नहीं। किसी भी गंभीर स्थिति में कृपया तुरंत डॉक्टर से मिलें।*

**डेंगू बुखार के प्रमुख लक्षण:**
1. अचानक बहुत तेज बुखार आना (104°F तक)।
2. सिर में तेज दर्द होना, विशेष रूप से आंखों के पीछे।
3. हड्डियों, जोड़ों और मांसपेशियों में अत्यधिक असहनीय दर्द (इसे 'हड्डी तोड़ बुखार' भी कहते हैं)।
4. उल्टी आना, जी मिचलाना और त्वचा पर लाल चकत्ते (Rashes) पड़ना।

**प्राथमिक उपचार और सावधानियां:**
- मरीज को पूरी तरह आराम करने दें।
- शरीर में पानी की कमी (Dehydration) न होने दें। नारियल पानी, ओआरएस (ORS) घोल, और पपीते के पत्तों का रस पिएं।
- बुखार के लिए केवल डॉक्टर द्वारा बताई गई दवा (जैसे पैरासिटामोल) लें। आइबुप्रोफेन या एस्पिरिन जैसी दवाओं से बचें।`;
    } else {
      return `*Disclaimer: I am an AI assistant, not a doctor. Seek medical help immediately for serious symptoms.*

**Common Dengue Symptoms include:**
1. High fever (up to 104°F/40°C) with sudden onset.
2. Severe headache, especially painful behind the eyes.
3. Heavy pain in muscles, bones, and joints (often called "break-bone fever").
4. Nausea, vomiting, swollen glands, and red skin rashes.

**Care & Management Tips:**
- Complete physical bed rest is essential.
- Prevent dehydration by drinking plenty of water, coconut water, fresh juices, and ORS solution.
- Take paracetamol for fever as recommended by a doctor. Avoid blood-thinning painkillers like Ibuprofen or Aspirin.`;
    }
  }

  // 4. ORS Preparation
  if (p.includes('ors') || p.includes('ओआरएस') || p.includes('घोल')) {
    if (isHindi) {
      return `घर पर जीवन रक्षक ओआरएस (ORS) घोल बनाने की अत्यंत सरल विधि:

1. **आवश्यक सामग्री**: 1 लीटर साफ पीने का पानी (यदि हो सके तो पानी को उबालकर ठंडा कर लें), 6 छोटी चम्मच चीनी (समान मात्रा में), और आधा छोटी चम्मच नमक।
2. **तैयार करने की विधि**: पानी में चीनी और नमक डालकर पूरी तरह घुलने तक चम्मच से अच्छी तरह मिला लें।
3. **महत्वपूर्ण नियम**: दस्त, उल्टी, लू या कमजोरी होने पर इसे घूंट-घूंट करके पिएं। तैयार किए गए ओआरएस घोल को हमेशा ढककर रखें और 24 घंटे के बाद बचा हुआ घोल फेंककर नया घोल बनाएं।`;
    } else {
      return `Here is the standard recipe to prepare ORS (Oral Rehydration Salts) at home:

1. **Ingredients**: 1 Liter of clean drinking water (boiled and cooled), 6 level teaspoons of Sugar, and 1/2 (half) level teaspoon of Salt.
2. **Preparation**: Stir the sugar and salt into the water thoroughly until they are completely dissolved.
3. **Usage Guidelines**: Drink small sips regularly during diarrhea, vomiting, heat stroke, or dehydration. Keep the container covered. Dispose of any leftover solution after 24 hours.`;
    }
  }

  // 5. Malaria Prevention
  if (p.includes('malaria') || p.includes('मलेरिया')) {
    if (isHindi) {
      return `मलेरिया से बचाव (Malaria Prevention) के 4 प्रमुख सुरक्षात्मक उपाय:

1. **मच्छरों का प्रजनन रोकें**: घर के आसपास, कूलर, गमलों, टायरों या नालियों में पानी जमा न होने दें। यदि पानी जमा है, तो उसमें थोड़ा सा केरोसिन या पुराना तेल डाल दें ताकि मच्छर के लार्वे नष्ट हो जाएं।
2. **मच्छरदानी का प्रयोग**: सोते समय हमेशा कीटनाशक उपचारित मच्छरदानी (Mosquito Net) का प्रयोग करें।
3. **व्यक्तिगत सुरक्षा**: घर से बाहर निकलते समय पूरी बाजू के कपड़े पहनें और त्वचा पर मच्छर भगाने वाली क्रीम का प्रयोग करें।
4. **घरेलू उपाय**: शाम के समय नीम की पत्तियों का धुआं करें या कपूर जलाएं। जालीदार दरवाजे और खिड़कियां बंद रखें।`;
    } else {
      return `Here are the top 4 measures to prevent Malaria in your household:

1. **Eliminate Standing Water**: Do not allow water to collect in pots, tires, coolers, or puddles. Drain stagnant water or spray a few drops of kerosene/oil to kill mosquito larvae.
2. **Use Treated Mosquito Nets**: Sleep under a mosquito net, especially during night and dawn, to block mosquito bites.
3. **Wear Protective Clothing**: Wear long-sleeved shirts, full pants, and apply mosquito repellent cream on exposed skin.
4. **Keep Houses Sealed**: Install mesh screens on doors and windows. Burn camphor or use neem leaf smoke during evenings.`;
    }
  }

  // 6. Weekly Study Plan for SSC Exams
  if (p.includes('ssc') || p.includes('एसएससी') || p.includes('परीक्षा')) {
    if (isHindi) {
      return `एसएससी (SSC) परीक्षा क्रैक करने के लिए एक व्यावहारिक साप्ताहिक टाइम टेबल:

- **गणित (रोज 2 घंटे)**: अंकगणित (प्रतिशत, लाभ-हानि, अनुपात) पर ध्यान दें। शॉर्टकट ट्रिक्स और पिछले साल के सवालों का अभ्यास करें।
- **रीज़निंग (रोज 1 घंटा)**: कोडिंग-डिकोडिंग, रक्त संबंध, और पहेलियों (Puzzles) के प्रश्न रोज हल करें।
- **अंग्रेजी / सामान्य हिंदी (रोज 1.5 घंटे)**: व्याकरण के नियमों को याद करें और रोज 10 नए शब्द सीखें।
- **सामान्य ज्ञान व करंट अफेयर्स (रोज 1.5 घंटे)**: रोज सुबह समाचार पत्र पढ़ें और इतिहास व भूगोल के महत्वपूर्ण नोट्स बनाएं।
- **रविवार का नियम**: रविवार को पूरा एक मॉक टेस्ट (Mock Test) हल करें और अपनी गलतियों का गहराई से विश्लेषण करें।`;
    } else {
      return `Here is a highly effective weekly Study Plan to crack SSC Exams:

- **Quantitative Aptitude (Daily 2 Hours)**: Revise core arithmetic (Percentages, Profit & Loss, Ratios, Speed & Distance). Memorize tables and squares for faster calculations.
- **Reasoning Ability (Daily 1 Hour)**: Practice non-verbal reasoning, series completion, coding-decoding, and puzzle-solving.
- **English Comprehension (Daily 1.5 Hours)**: Memorize 10 new words daily, read editorial columns to improve reading speed, and solve error-spotting exercises.
- **General Awareness (Daily 1.5 Hours)**: Read last 6 months' current affairs. Focus on static GK including Indian Constitution, Geography, and History.
- **Sunday Strategy**: Solve 1 full-length previous year question paper under exam conditions. Spent 2 hours analyzing weak spots.`;
    }
  }

  // 7. Free Coding Roadmaps
  if (p.includes('learn coding') || p.includes('learn code') || p.includes('फ्री में कोडिंग') || p.includes('कोडिंग')) {
    if (isHindi) {
      return `इंटरनेट पर बिल्कुल फ्री में कोडिंग सीखने के 3 सबसे बेहतरीन प्लेटफॉर्म और सही तरीका:

1. **W3Schools**: वेब डेवलपमेंट की शुरुआत करने के लिए सर्वश्रेष्ठ वेबसाइट है। यहाँ आप HTML, CSS और JavaScript के बेसिक प्रैक्टिकल कोड लिखकर सीख सकते हैं।
2. **freeCodeCamp**: यह पूरी दुनिया में मुफ़्त सर्टिफाइड कोर्सेज प्रदान करने वाला सबसे बड़ा प्लेटफॉर्म है। यहाँ आप कोडिंग प्रैक्टिस कर सर्टिफिकेट प्राप्त कर सकते हैं।
3. **YouTube**: हिंदी में सीखने के लिए 'CodeWithHarry' या 'Apna College' और अंग्रेजी के लिए 'Programming with Mosh' के ट्यूटोरियल देखें।

*सही रोडमैप*: सबसे पहले **HTML & CSS** (वेबसाइट डिजाइन) सीखें, फिर **JavaScript** (वेबसाइट लॉजिक) सीखें, और इसके बाद **Python** या **React.js** सीखकर खुद के छोटे प्रोजेक्ट्स बनाएं।`;
    } else {
      return `Here is the perfect step-by-step path to learn Coding completely free online:

1. **W3Schools**: The absolute best resource for beginners. You can write, edit, and run code directly in the browser for HTML, CSS, and basic JavaScript.
2. **freeCodeCamp**: A non-profit certified platform offering over 9,000 completely free coding tutorials. You get professional certificates upon completion.
3. **YouTube Channels**: Follow playlists on channels like 'Programming with Mosh' (English), 'freeCodeCamp.org', or 'CodeWithHarry' (Hindi).

*Recommended Roadmap*: Start with **HTML & CSS** to build website layouts, move to **JavaScript** to learn logical programming, and then learn **React.js** or **Python** to build real-world software.`;
    }
  }

  // 8. Agriculture / Farming Questions (General / Crop yield)
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

  // 9. Education / Careers / Schools
  if (p.includes('career') || p.includes('study') || p.includes('school') || p.includes('college') || p.includes('learn') || p.includes('exam') || p.includes('student') || 
      p.includes('पढ़ाई') || p.includes('परीक्षा') || p.includes('नौकरी') || p.includes('छात्र') || p.includes('स्कूल') || p.includes('शिक्षक')) {
    if (isHindi) {
      return `नमस्ते! ग्रामीण छात्रों के लिए कोडिंग, आधुनिक शिक्षा और करियर बनाने के मुख्य सुझाव:

1. डिजिटल शिक्षा: गूगल और यूट्यूब के माध्यम से निःशुल्क कोर्सेज (जैसे कोडिंग, computer basics) सीखें।
2. स्थानीय स्कूल व कॉलेज: अपने गाँव या ब्लॉक में उपलब्ध सरकारी माध्यमिक विद्यालयों और इंटरमीडिएट कॉलेजों में दाखिला लें।
3. सरकारी परीक्षा तैयारी: यदि आप एसएससी, बैंकिंग या रेलवे की तैयारी कर रहे हैं, तो गणित और सामान्य ज्ञान पर प्रतिदिन 4-5 घंटे ध्यान दें।
4. छात्रवृत्ति योजनाएं: सरकारी योजनाओं (जैसे एनएमएमएस, पोस्ट मैट्रिक स्कॉलरशिप) के लिए ग्राममित्र योजनाएं विभाग पर आवेदन करें।`;
    } else {
      return `Hello! For rural students looking to build a career and access modern education:

1. Digital Learning: Learn computer basics, digital literacy, and coding free on websites like Google, YouTube, and freeCodeCamp.
2. Schools & Colleges: Access government high schools and intermediate colleges in your district directory for quality education.
3. Exam Preparation: If you are preparing for government exams (SSC, banking, railways), dedicate 4-5 hours daily to mathematics, vocabulary, and General Knowledge.
4. Scholarships: Keep track of post-matric and merit-based national scholarships on the schemes dashboard to fund your higher studies.`;
    }
  }

  // 10. Business / Store / Marketplace / Mandi
  if (p.includes('business') || p.includes('shop') || p.includes('sell') || p.includes('marketplace') || p.includes('price') || p.includes('mandi') || 
      p.includes('व्यापार') || p.includes('दुकान') || p.includes('बिक्री') || p.includes('ग्राहक') || p.includes('मंडी')) {
    if (isHindi) {
      return `नमस्ते! अपने गाँव के व्यवसाय को बढ़ाने और मंडी का सही मूल्य पाने के लिए मुख्य रणनीतियाँ:

1. डिजिटल माध्यम: अपने व्यवसाय और उत्पादों को ग्राममित्र मंडी मार्केटप्लेस पर दर्ज करें ताकि लोग घर बैठे उत्पाद देख सकें और आपसे सीधे संपर्क कर सकें।
2. माँग को समझें: ऐसी चीजों की दुकान शुरू करें जिनकी गाँव में ज़रूरत है लेकिन उन्हें लेने के लिए शहर जाना पड़ता है (जैसे मोबाइल रिपेयर, बीज की दुकान)।
3. अच्छी ग्राहक सेवा: अपने ग्राहकों को होम डिलीवरी या आसान भुगतान (डिजिटल यूपीआई) की सुविधा प्रदान करें।
4. मंडी मूल्य ट्रैकिंग: मंडी में जाने से पहले कीमतों का पता लगाएं ताकि आपको अपनी उपज का सही और अधिकतम दाम मिल सके।`;
    } else {
      return `Namaste! Here are the best strategies to grow your local village business and get high Mandi prices:

1. Digital Presence: Register your shop on the GramMitra Marketplace so customers can view catalog online and contact you directly.
2. Local Demand: Identify what products/services are missing in the village (e.g. electrical repair, high-grade seeds) and start catering to them.
3. Customer Loyalty: Offer free home delivery within the village and accept digital UPI payments.
4. Mandi Price Check: Monitor Mandi rates daily before selling crops to secure the maximum market value for your produce.`;
    }
  }

  // 11. Labour / Job Services / Vacancies
  if (p.includes('job') || p.includes('work') || p.includes('hire') || p.includes('labour') || p.includes('vacanc') || 
      p.includes('मजदूर') || p.includes('काम') || p.includes('नौकरी') || p.includes('रोजगार') || p.includes('कामगार')) {
    if (isHindi) {
      return `नमस्ते! ग्राममित्र रोजगार और श्रमिक सेवाओं के अंतर्गत काम खोजने और मजदूर बुलाने की जानकारी:

1. **काम की तलाश**: यदि आप काम की तलाश कर रहे हैं, तो ग्राममित्र श्रम विभाग पर अपना पंजीकरण करें ताकि स्थानीय ठेकेदार आपसे संपर्क कर सकें।
2. **मजदूर बुलाएं (इलेक्ट्रीशियन, ड्राइवर, प्लंबर)**: यदि आपको किसी काम के लिए मजदूर चाहिए, तो आप हमारे डायरेक्टरी से सीधे संपर्क कर उन्हें बुला सकते हैं।
3. **मनरेगा व सरकारी काम**: अपने पंचायत भवन में संपर्क कर सक्रिय जॉब कार्ड के माध्यम से रोजगार प्राप्त करें।`;
    } else {
      return `Namaste! Welcome to GramMitra Labour and Job Directory services:

1. **Find a Local Job**: Register your profile as a skilled/unskilled worker (electrician, driver, painter, mason) on the Labour dashboard so local contractors can hire you.
2. **Hire Services**: You can easily browse and call local professionals (electricians, mechanics, plumbers) directly from our village directory.
3. **MGNREGA Scheme**: Apply for local public works using your MGNREGA Job Card at the local Gram Panchayat office for guaranteed wage employment.`;
    }
  }

  // 12. Default General Response
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