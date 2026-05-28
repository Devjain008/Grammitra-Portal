import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Sprout, CloudSun, Droplets, Wind, ThermometerSun, Bot, Send, AlertTriangle, Leaf, FlaskConical, Loader, AlertCircle } from 'lucide-react';
import { CONFIG } from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CROP_METRICS = {
  rice: {
    natural: { yield: 17, cost: 5000, price: 2900 },
    organic: { yield: 18, cost: 11000, price: 2800 },
    chemical: { yield: 22, cost: 16000, price: 2200 }
  },
  wheat: {
    natural: { yield: 15, cost: 4500, price: 3100 },
    organic: { yield: 16, cost: 9000, price: 3000 },
    chemical: { yield: 20, cost: 14000, price: 2300 }
  },
  maize: {
    natural: { yield: 18, cost: 4000, price: 2600 },
    organic: { yield: 20, cost: 8000, price: 2500 },
    chemical: { yield: 25, cost: 12000, price: 2000 }
  },
  mustard: {
    natural: { yield: 6, cost: 3000, price: 6800 },
    organic: { yield: 6.5, cost: 6000, price: 6500 },
    chemical: { yield: 8, cost: 9000, price: 5500 }
  },
  cotton: {
    natural: { yield: 7.5, cost: 7000, price: 8800 },
    organic: { yield: 8, cost: 14000, price: 8500 },
    chemical: { yield: 10, cost: 20000, price: 7000 }
  },
  sugarcane: {
    natural: { yield: 280, cost: 12000, price: 450 },
    organic: { yield: 300, cost: 25000, price: 420 },
    chemical: { yield: 350, cost: 35000, price: 350 }
  },
  tomato: {
    natural: { yield: 120, cost: 15000, price: 1000 },
    organic: { yield: 130, cost: 28000, price: 1200 },
    chemical: { yield: 160, cost: 38000, price: 900 }
  },
  potato: {
    natural: { yield: 100, cost: 12000, price: 900 },
    organic: { yield: 110, cost: 22000, price: 1100 },
    chemical: { yield: 130, cost: 32000, price: 800 }
  },
  chickpea: {
    natural: { yield: 6, cost: 4000, price: 5200 },
    organic: { yield: 6.5, cost: 7500, price: 5400 },
    chemical: { yield: 8.5, cost: 11000, price: 4800 }
  },
  moong: {
    natural: { yield: 3.5, cost: 3000, price: 7200 },
    organic: { yield: 4, cost: 5500, price: 7500 },
    chemical: { yield: 5.5, cost: 8500, price: 6800 }
  }
};

const CROP_INSTRUCTIONS = {
  rice: {
    natural: {
      en: {
        stepLandPrep: "Deep summer plowing. Apply Jeevamrit to soil before transplanting.",
        stepSowing: "Treat seeds with Beejamrit. Nursery sowing, transplant seedlings at 21-25 days.",
        stepNutrition: "Apply 200L Jeevamrit per acre with irrigation water every 14 days.",
        stepWater: "Maintain alternate wetting and drying instead of constant deep flooding.",
        stepPest: "Use Neemastra/Agniastra sprays for stem borer and leaf folder control.",
        stepHarvest: "Harvest when 80-85% of grains turn golden yellow. Dry to 14% moisture."
      },
      hi: {
        stepLandPrep: "गर्मियों में गहरी जुताई। रोपाई से पहले मिट्टी में जीवामृत डालें।",
        stepSowing: "बीजामृत से बीजों का उपचार करें। नर्सरी तैयार कर 21-25 दिनों में रोपाई करें।",
        stepNutrition: "हर 14 दिन में सिंचाई के पानी के साथ प्रति एकड़ 200 लीटर जीवामृत डालें।",
        stepWater: "लगातार गहरे जलभराव के बजाय वैकल्पिक रूप से गीला और सूखा रखें।",
        stepPest: "तना छेदक और पत्ता लपेटक नियंत्रण के लिए नीमअस्त्र/अग्निअस्त्र का छिड़काव करें।",
        stepHarvest: "80-85% दाने सुनहरे पीले होने पर कटाई करें। 14% नमी तक सुखाएं।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate green manure crops like Dhaincha. Add vermicompost (2 tonnes/acre).",
        stepSowing: "Seed treatment with Trichoderma. Transplant healthy 21-day-old seedlings.",
        stepNutrition: "Apply neem cake (100kg/acre) and biofertilizers Azospirillum and PSB.",
        stepWater: "System of Rice Intensification (SRI) irrigation - moist soil, no flooding.",
        stepPest: "Pheromone traps for stem borer. Spray Pseudomonas fluorescens for blast.",
        stepHarvest: "Harvest when grain moisture drops to 20-22%. Thresh immediately."
      },
      hi: {
        stepLandPrep: "ढैंचा जैसी हरी खाद मिलाएँ। केंचुआ खाद (2 टन/एकड़) डालें।",
        stepSowing: "ट्राइकोडर्मा के साथ बीजोपचार। 21 दिन पुराने स्वस्थ पौधों की रोपाई करें।",
        stepNutrition: "नीम की खली (100 किग्रा/एकड़) और जैव उर्वरक एज़ोस्पिरिलम और पीएसबी डालें।",
        stepWater: "श्री (SRI) विधि से सिंचाई करें - मिट्टी नम रखें, जलभराव न करें।",
        stepPest: "तना छेदक के लिए फेरोमोन ट्रैप। झुलसा रोग के लिए स्यूडोमोनास का छिड़काव करें।",
        stepHarvest: "दाने में नमी 20-22% होने पर कटाई करें। तुरंत मड़ाई करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Tillage with tractor. Apply basal dose of NPK (50:50:50 kg/hectare).",
        stepSowing: "Treat seeds with Carbendazim. Standard transplanting spacing 20x15 cm.",
        stepNutrition: "Top dress Urea (in 3 split doses) and Zinc Sulphate (25kg/hectare).",
        stepWater: "Keep standing water of 2-5 cm depth throughout the tillering phase.",
        stepPest: "Apply Cartap Hydrochloride granules for stem borer, Tricyclazole for blast.",
        stepHarvest: "Harvest at maturity. Machine threshing and mechanical drying."
      },
      hi: {
        stepLandPrep: "ट्रैक्टर से जुताई। एनपीके (50:50:50 किग्रा/हेक्टेयर) की आधार खुराक डालें।",
        stepSowing: "कार्बेंडाजिम से बीज उपचार। मानक रोपाई दूरी 20x15 सेमी रखें।",
        stepNutrition: "यूरिया (3 विभाजित खुराकों में) और जिंक सल्फेट (25 किग्रा/हेक्टेयर) का प्रयोग करें।",
        stepWater: "कल्ले निकलने के चरण के दौरान 2-5 सेमी गहराई तक पानी खड़ा रखें।",
        stepPest: "तना छेदक के लिए कार्टाप हाइड्रोक्लोराइड, झुलसा के लिए ट्राइसाइक्लाजोल डालें।",
        stepHarvest: "परिपक्वता पर कटाई करें। थ्रेशर या कंबाइन हार्वेस्टर से मड़ाई करें।"
      }
    }
  },
  wheat: {
    natural: {
      en: {
        stepLandPrep: "Disc harrowing followed by planking. Soil application of Ghanajeevamrit.",
        stepSowing: "Treat seeds with Beejamrit. Sow in lines at 22.5 cm row spacing.",
        stepNutrition: "Apply Jeevamrit with irrigation water at crown root initiation and flowering.",
        stepWater: "Irrigate at critical stages: CRI (21 days), Tillering, Jointing, flowering.",
        stepPest: "Use Dashparni Ark spray for aphid control. Hand weeding or mulching.",
        stepHarvest: "Harvest when spikes turn golden and straw is dry. Moisture 12-14%."
      },
      hi: {
        stepLandPrep: "हैरो और पाटा चलाकर मिट्टी तैयार करें। घनजीवामृत का प्रयोग करें।",
        stepSowing: "बीजामृत से बीजोपचार। 22.5 सेमी की दूरी पर कतारों में बुआई करें।",
        stepNutrition: "ताज मूल दीक्षा (CRI) और पुष्पन के समय सिंचाई के साथ जीवामृत दें।",
        stepWater: "क्रांतिक चरणों पर सिंचाई करें: मुकुट जड़ (21 दिन), कल्ले निकलना, पुष्पन।",
        stepPest: "माहू (चेपा) नियंत्रण के लिए दशपर्णी अर्क का छिड़काव। निराई-गुड़ाई करें।",
        stepHarvest: "जब बालियां सुनहरी हो जाएं और भूसा सूख जाए तब कटाई करें। नमी 12-14%।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate FYM (6 tonnes/acre) during land preparation.",
        stepSowing: "Seed treatment with Azotobacter and PSB cultures (200g/10kg seed).",
        stepNutrition: "Apply Vermicompost (2 tonnes/acre) and Rock Phosphate for phosphorus.",
        stepWater: "Irrigate at 4-6 critical growth stages depending on soil type.",
        stepPest: "Spray Neem Oil (1500 ppm) for rusts and foliar diseases. Use pheromones.",
        stepHarvest: "Harvest when crop reaches physiological maturity and grains are hard."
      },
      hi: {
        stepLandPrep: "तैयारी के दौरान गोबर की खाद (6 टन/एकड़) मिलाएं।",
        stepSowing: "एज़ोटोबैक्टर और पीएसबी कल्चर (200 ग्राम/10 किग्रा बीज) से बीज उपचार करें।",
        stepNutrition: "केंचुआ खाद (2 टन/एकड़) और फास्फोरस के लिए रॉक फास्फेट डालें।",
        stepWater: "मिट्टी के प्रकार के आधार पर 4-6 क्रांतिक चरणों पर सिंचाई करें।",
        stepPest: "गेरूई (रस्ट) और पत्ती रोगों के लिए नीम तेल (1500 पीपीएम) का छिड़काव करें।",
        stepHarvest: "शारीरिक परिपक्वता पर कटाई करें जब दाने पूरी तरह सख्त हो जाएं।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Fine seedbed preparation. Apply basal NPK (120:60:40 kg/ha).",
        stepSowing: "Treat seeds with Thiram or Carboxin. Sow using seed drill.",
        stepNutrition: "Top dress Urea in two equal splits after first and second irrigations.",
        stepWater: "Provide 5 to 6 irrigations at interval of 20-25 days.",
        stepPest: "Spray Sulfosulfuron for weed control, Propiconazole for yellow rust.",
        stepHarvest: "Combine harvester operation when grain moisture content is around 15%."
      },
      hi: {
        stepLandPrep: "महीन क्यारी तैयार करें। आधार एनपीके (120:60:40 किग्रा/हेक्टेयर) डालें।",
        stepSowing: "थिरम या कार्बोक्सिन से बीज उपचार। सीड ड्रिल का उपयोग करके बोएं।",
        stepNutrition: "पहली और दूसरी सिंचाई के बाद यूरिया को दो बराबर भागों में टॉप ड्रेस करें।",
        stepWater: "20-25 दिनों के अंतराल पर 5 से 6 सिंचाइयां प्रदान करें।",
        stepPest: "खरपतवार नियंत्रण के लिए सल्फोसल्फ्यूरॉन, पीला रस्ट के लिए प्रोपिकोनाजोल।",
        stepHarvest: "जब दाने की नमी लगभग 15% हो तो कंबाइन हार्वेस्टर का उपयोग करें।"
      }
    }
  },
  maize: {
    natural: {
      en: {
        stepLandPrep: "Plow field twice. Incorporate well-rotted FYM and Ghanajeevamrit.",
        stepSowing: "Treat seeds with Beejamrit. Sow in rows 60cm apart, 20cm plant distance.",
        stepNutrition: "Spray liquid Jeevamrit (10% solution) at 21, 45, and 60 days after sowing.",
        stepWater: "Irrigate at critical stages: knee-high, tasseling, and silking.",
        stepPest: "Apply Neemi seed kernel extract or Agniastra for fall armyworm control.",
        stepHarvest: "Harvest when cob sheaths turn paper-like dry and grains are hard."
      },
      hi: {
        stepLandPrep: "खेत की दो बार जुताई करें। अच्छी तरह से सड़ी हुई गोबर की खाद और घनजीवामृत मिलाएं।",
        stepSowing: "बीजामृत से बीजोपचार करें। 60 सेमी कतार और 20 सेमी पौधे की दूरी पर बोएं।",
        stepNutrition: "बुआई के 21, 45 और 60 दिन बाद तरल जीवामृत (10% घोल) का छिड़काव करें।",
        stepWater: "क्रांतिक चरणों पर सिंचाई करें: घुटने की ऊंचाई, नर मंजरी निकलना और मक्का बाल बनना।",
        stepPest: "फॉल्स आर्मीवर्म नियंत्रण के लिए नीम बीज अर्क या अग्निअस्त्र का प्रयोग करें।",
        stepHarvest: "मक्के की फसल की कटाई तब करें जब भुट्टे के छिलके कागज की तरह सूख जाएं।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate green manure. Apply compost (4 tonnes/acre) and neem cake.",
        stepSowing: "Seed treatment with Azotobacter. Maintain plant population of 24,000/acre.",
        stepNutrition: "Apply vermicompost at earthing up. Use liquid fish amino acids.",
        stepWater: "Maintain optimum moisture; irrigate every 10-12 days during dry spells.",
        stepPest: "Release Trichogramma egg parasitoids for stem borer. Set up light traps.",
        stepHarvest: "Harvest when grain moisture drops to 20%. Sun-dry cobs to 12% moisture."
      },
      hi: {
        stepLandPrep: "हरी खाद मिलाएँ। खाद (4 टन/एकड़) और नीम की खली डालें।",
        stepSowing: "एज़ोटोबैक्टर के साथ बीजोपचार। प्रति एकड़ 24,000 पौधों की आबादी बनाए रखें।",
        stepNutrition: "मिट्टी चढ़ाते समय केंचुआ खाद डालें। तरल मछली अमीनो एसिड का प्रयोग करें।",
        stepWater: "इष्टतम नमी बनाए रखें; सूखे के दौरान हर 10-12 दिनों में सिंचाई करें।",
        stepPest: "तना छेदक के लिए ट्राइकोकार्ड का उपयोग करें। प्रकाश प्रपंच लगाएं।",
        stepHarvest: "अनाज की नमी 20% तक गिरने पर कटाई करें। भुट्टों को 12% नमी तक धूप में सुखाएं।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Deep plowing followed by rotavator. Apply basal NPK (80:40:40 kg/ha).",
        stepSowing: "Treat seeds with Metalaxyl. Use seed drill for uniform depth.",
        stepNutrition: "Top dress Nitrogen (Urea) in splits: knee-high and tasseling stages.",
        stepWater: "Ensure no water stress during flowering and grain filling stages.",
        stepPest: "Spray Atrazine for early weed control. Use Chlorantraniliprole for armyworm.",
        stepHarvest: "Harvest when black layer forms at the grain base. Use mechanical sheller."
      },
      hi: {
        stepLandPrep: "गहरी जुताई के बाद रोटावेटर चलाएं। आधार एनपीके (80:40:40 किग्रा/हेक्टेयर) डालें।",
        stepSowing: "मेटालैक्सिल से बीज उपचार। समान गहराई के लिए सीड ड्रिल का उपयोग करें।",
        stepNutrition: "नाइट्रोजन (यूरिया) का विभाजित भागों में प्रयोग करें: घुटने की ऊंचाई और मंजरी चरण।",
        stepWater: "पुष्पन और दाने भरने के चरणों के दौरान पानी की कमी न होने दें।",
        stepPest: "शुरुआती खरपतवार नियंत्रण के लिए एट्राजीन। आर्मीवर्म के लिए कोराजन का छिड़काव करें।",
        stepHarvest: "जब दाने के आधार पर काला धब्बा बन जाए तो कटाई करें। थ्रेशर का प्रयोग करें।"
      }
    }
  },
  mustard: {
    natural: {
      en: {
        stepLandPrep: "Fine tilth preparation. Spread 5 tonnes/acre compost mixed with Ghanajeevamrit.",
        stepSowing: "Seed treatment with Beejamrit. Line sowing at 30cm spacing.",
        stepNutrition: "Spray Jeevamrit (10% solution) at flowering and pod filling stages.",
        stepWater: "Give first irrigation at 30 days (pre-flowering) and second at pod formation.",
        stepPest: "Spray Agniastra or Dashparni Ark for mustard aphid and white rust.",
        stepHarvest: "Harvest when pods turn golden yellow. Avoid late harvesting to prevent shattering."
      },
      hi: {
        stepLandPrep: "अच्छी जुताई कर क्यारी बनाएं। घनजीवामृत मिश्रित 5 टन/एकड़ खाद बिखेरें।",
        stepSowing: "बीजामृत से बीजोपचार। 30 सेमी की दूरी पर कतारों में बुआई करें।",
        stepNutrition: "पुष्पन और फली बनते समय जीवामृत (10% घोल) का छिड़काव करें।",
        stepWater: "पहली सिंचाई 30 दिन (फूल आने से पहले) और दूसरी सिंचाई फली बनते समय करें।",
        stepPest: "सरसों के चेपा और सफेद गेरूई के लिए अग्निअस्त्र या दशपर्णी अर्क का छिड़काव करें।",
        stepHarvest: "जब फलियां सुनहरी पीली हो जाएं तो कटाई करें। झड़ने से बचाने के लिए समय पर कटाई करें।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate FYM and Neem cake (150kg/acre). Ensure proper drainage.",
        stepSowing: "Seed treatment with Trichoderma. Sow at depth of 3-5 cm.",
        stepNutrition: "Apply bio-fertilizer Azotobacter. Use mustard oil cake compost.",
        stepWater: "Irrigate at critical flower initiation (35 days) and silique filling stages.",
        stepPest: "Spray Neem oil (3000 ppm) for aphids. Pick and destroy infested twigs.",
        stepHarvest: "Harvest early morning when 75% siliquae turn yellow. Sun-dry for 4-5 days."
      },
      hi: {
        stepLandPrep: "गोबर की खाद और नीम की खली (150 किग्रा/एकड़) मिलाएं। जल निकासी सुनिश्चित करें।",
        stepSowing: "ट्राइकोडर्मा के साथ बीजोपचार। 3-5 सेमी की गहराई पर बोएं।",
        stepNutrition: "जैव उर्वरक एज़ोटोबैक्टर का प्रयोग करें। सरसों की खली की खाद डालें।",
        stepWater: "पुष्पन शुरुआत (35 दिन) और फली भरने के महत्वपूर्ण चरणों पर सिंचाई करें।",
        stepPest: "चेपा के लिए नीम तेल (3000 ppm) का छिड़काव करें। ग्रसित टहनियों को तोड़कर नष्ट करें।",
        stepHarvest: "सुबह के समय कटाई करें जब 75% फलियां पीली हो जाएं। 4-5 दिन सुखाएं।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Prepare fine seedbed. Apply basal Sulphur (20kg/ha) and NPK (80:40:40).",
        stepSowing: "Treat seeds with Metalaxyl or Thiram. Maintain sowing rate 1.5-2kg/acre.",
        stepNutrition: "Top dress Urea at 30 days after sowing. Ensure Zinc application.",
        stepWater: "Provide 2 irrigations at critical stages: pre-flowering and pod filling.",
        stepPest: "Spray Oxydemeton-methyl for aphids. Apply Mancozeb for Alternaria blight.",
        stepHarvest: "Harvest when plants show yellowing. Thresh using mechanical thresher."
      },
      hi: {
        stepLandPrep: "महीन क्यारी तैयार करें। आधार सल्फर (20 किग्रा/हेक्टेयर) और एनपीके (80:40:40) डालें।",
        stepSowing: "मेटालैक्सिल या थिरम से बीज उपचार। बुआई दर 1.5-2 किग्रा/एकड़ रखें।",
        stepNutrition: "बुआई के 30 दिन बाद यूरिया का प्रयोग करें। जिंक का प्रयोग सुनिश्चित करें।",
        stepWater: "दो सिंचाइयां दें: फूल आने से पहले और फलियों में दाना भरते समय।",
        stepPest: "चेपा के लिए ऑक्सीडेमेटान-मिथाइल, अल्टरनेरिया ब्लाइट के लिए मैंकोजेब का छिड़काव करें।",
        stepHarvest: "पौधे पीले होने पर कटाई करें। यांत्रिक थ्रेशर से मड़ाई करें।"
      }
    }
  },
  cotton: {
    natural: {
      en: {
        stepLandPrep: "Deep plowing in summer. Apply Ghanajeevamrit (200kg/acre) during tillage.",
        stepSowing: "Treat seeds with Beejamrit. Sow in ridges at 90x60 cm spacing.",
        stepNutrition: "Apply Jeevamrit every 15 days. Spray buttermilk and pulse flour mix.",
        stepWater: "Maintain moisture through mulching; irrigate at boll formation stage.",
        stepPest: "Use Neemastra, Agniastra for bollworms. Plant trap crops like okra/marigold.",
        stepHarvest: "Pick cotton bolls manually during dry mornings. Sort clean cotton."
      },
      hi: {
        stepLandPrep: "गर्मियों में गहरी जुताई। जुताई के दौरान घनजीवामृत (200 किग्रा/एकड़) डालें।",
        stepSowing: "बीजामृत से बीजोपचार। मेड़ों पर 90x60 सेमी की दूरी पर बोएं।",
        stepNutrition: "हर 15 दिन में जीवामृत दें। खट्टी छाछ और दाल के आटे के घोल का छिड़काव करें।",
        stepWater: "मल्चिंग द्वारा नमी बनाए रखें; डोडे बनते समय सिंचाई करें।",
        stepPest: "इल्लियों के लिए नीमअस्त्र, अग्निअस्त्र का प्रयोग करें। भिंडी/गेंदा जैसी जाल फसलें लगाएं।",
        stepHarvest: "सूखी सुबह के दौरान कपास के डोडों की मैन्युअल रूप से चुनाई करें। साफ रुई अलग करें।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Spread FYM (5 tonnes/acre) and Vermicompost. Deep plowing.",
        stepSowing: "Seed treatment with Azotobacter and Trichoderma. Use Bt-free organic seeds.",
        stepNutrition: "Apply Neem cake (200kg/acre). Spray Panchagavya at flowering.",
        stepWater: "Provide drip irrigation at 10-15 day intervals depending on dry spells.",
        stepPest: "Deploy pheromone traps. Release Trichogramma wasps for bollworm management.",
        stepHarvest: "Harvest in 3-4 pickings as bolls mature and burst fully."
      },
      hi: {
        stepLandPrep: "गोबर की खाद (5 टन/एकड़) और केंचुआ खाद बिखेरें। गहरी जुताई करें।",
        stepSowing: "एज़ोटोबैक्टर और ट्राइकोडर्मा से बीजोपचार। बीटी-मुक्त जैविक बीजों का उपयोग करें।",
        stepNutrition: "नीम की खली (200 किग्रा/एकड़) डालें। फूल आने पर पंचगव्य का छिड़काव करें।",
        stepWater: "सूखे के आधार पर 10-15 दिनों के अंतराल पर ड्रिप सिंचाई प्रदान करें।",
        stepPest: "फेरोमोन ट्रैप लगाएं। डोडे की इल्ली प्रबंधन के लिए ट्राइकोकार्ड छोड़ें।",
        stepHarvest: "डोडों के पकने और पूरी तरह से फटने पर 3-4 बार में मैन्युअल चुनाई करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Tractor plowing. Apply basal fertilizer NPK (120:60:60 kg/ha).",
        stepSowing: "Sow Bt Cotton seeds. Maintain spacing of 90x60 cm or 120x60 cm.",
        stepNutrition: "Top dress nitrogen in two split doses at square formation and flowering.",
        stepWater: "Irrigate at critical stages: square formation, flowering, and boll development.",
        stepPest: "Spray Imidacloprid for sucking pests. Apply Profenofos for bollworms.",
        stepHarvest: "Clean hand picking of fully opened bolls. Keep cotton free of dry leaves."
      },
      hi: {
        stepLandPrep: "ट्रैक्टर से जुताई। आधार उर्वरक एनपीके (120:60:60 किग्रा/हेक्टेयर) डालें।",
        stepSowing: "बीटी कपास के बीज बोएं। 90x60 सेमी या 120x60 सेमी की दूरी रखें।",
        stepNutrition: "कलियां बनते समय और पुष्पन के दौरान दो विभाजित खुराकों में नाइट्रोजन दें।",
        stepWater: "क्रांतिक चरणों पर सिंचाई करें: कली बनना, फूल आना और डोडे का विकास।",
        stepPest: "रस चूसक कीटों के लिए इमिडाक्लोप्रिड, इल्लियों के लिए प्रोफेनोफॉस का छिड़काव करें।",
        stepHarvest: "पूरी तरह से खुले डोडों की साफ चुनाई। कपास को सूखी पत्तियों से मुक्त रखें।"
      }
    }
  },
  sugarcane: {
    natural: {
      en: {
        stepLandPrep: "Deep plowing, prepare ridges. Apply Ghanajeevamrit (300kg/acre).",
        stepSowing: "Treat setts with Beejamrit. Plant 2-3 budded setts in furrows.",
        stepNutrition: "Irrigate with Jeevamrit (500L/acre) monthly. Apply trash mulching.",
        stepWater: "Regular watering; ensure trash mulching to reduce soil moisture evaporation.",
        stepPest: "Use Dashparni Ark for early shoot borer. Release local natural predators.",
        stepHarvest: "Harvest at 10-12 months when lower leaves dry and brix reading is 18-20%."
      },
      hi: {
        stepLandPrep: "गहरी जुताई करें, मेड़ें बनाएं। घनजीवामृत (300 किग्रा/एकड़) डालें।",
        stepSowing: "टुकड़ों (सेट्स) को बीजामृत से उपचारित करें। नालियों में 2-3 आंख वाले टुकड़े बोएं।",
        stepNutrition: "हर महीने जीवामृत (500 लीटर/एकड़) के साथ सिंचाई करें। गन्ने की सूखी पत्ती बिछाएं।",
        stepWater: "नियमित सिंचाई करें; नमी वाष्पीकरण को कम करने के लिए पत्ती की मल्चिंग अवश्य करें।",
        stepPest: "अग्र प्ररोह छेदक के लिए दशपर्णी अर्क का प्रयोग करें। स्थानीय मित्र कीटों को बढ़ावा दें।",
        stepHarvest: "10-12 महीने पर कटाई करें जब निचली पत्तियां सूख जाएं और ब्रिक्स रीडिंग 18-20% हो।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Apply compost (10 tonnes/acre) and neem cake. Deep tillage.",
        stepSowing: "Treat setts with Trichoderma and Azotobacter liquid solution.",
        stepNutrition: "Apply vermicompost (3 tonnes/acre) at earthing up. Use pressmud cake.",
        stepWater: "Irrigate at 10-15 day intervals. Recommend drip irrigation.",
        stepPest: "Deploy pheromone traps. Biological control of pyrilla using Epiricania.",
        stepHarvest: "Harvest close to ground level using sharp sugarcane knives. Remove trash."
      },
      hi: {
        stepLandPrep: "खाद (10 टन/एकड़) और नीम की खली डालें। गहरी जुताई करें।",
        stepSowing: "ट्राइकोडर्मा और एज़ोटोबैक्टर तरल घोल से गन्ने के टुकड़ों का उपचार करें।",
        stepNutrition: "मिट्टी चढ़ाते समय केंचुआ खाद (3 टन/एकड़) और प्रेसमड डालें।",
        stepWater: "10-15 दिनों के अंतराल पर सिंचाई करें। ड्रिप सिंचाई की सिफारिश की जाती है।",
        stepPest: "कली छेदक के लिए फेरोमोन ट्रैप लगाएं। एपिरिकैनिया का उपयोग करके पायरिला का जैविक नियंत्रण करें।",
        stepHarvest: "तेज दरांती का उपयोग करके जमीन की सतह के पास से कटाई करें। पत्तियां अलग करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Deep plowing using disc plow, rotavator. Apply basal NPK (150:80:80 kg/ha).",
        stepSowing: "Treat setts with Carbendazim. Setts rate: 35,000-40,000 buds per hectare.",
        stepNutrition: "Top dress nitrogen in three splits. Apply Sulphur and Micronutrients.",
        stepWater: "High water requirement. Irrigate every 10-12 days during summer.",
        stepPest: "Apply Chlorpyriphos for termites. Spray Cartap for shoot borer.",
        stepHarvest: "Cut cane at ground level. Transport to sugar mill within 24 hours of cutting."
      },
      hi: {
        stepLandPrep: "डिस्क हल, रोटावेटर से गहरी जुताई। आधार एनपीके (150:80:80 किग्रा/हेक्टेयर) डालें।",
        stepSowing: "कार्बेंडाजिम से टुकड़ों का उपचार। दर: 35,000-40,000 आंख प्रति हेक्टेयर।",
        stepNutrition: "नाइट्रोजन को तीन भागों में टॉप ड्रेस करें। सल्फर और सूक्ष्म पोषक तत्व डालें।",
        stepWater: "अत्यधिक जल की आवश्यकता। गर्मियों में हर 10-12 दिनों में सिंचाई करें।",
        stepPest: "दीमक के लिए क्लोरपायरीफॉस, तना छेदक के लिए कार्टाप का प्रयोग करें।",
        stepHarvest: "गन्ने को जमीनी स्तर से काटें। कटाई के 24 घंटे के भीतर चीनी मिल में परिवहन करें।"
      }
    }
  },
  tomato: {
    natural: {
      en: {
        stepLandPrep: "Prepare raised beds. Mix soil with well-aged compost and Ghanajeevamrit.",
        stepSowing: "Seed treatment with Beejamrit. Grow seedlings in trays, transplant at 25-30 days.",
        stepNutrition: "Spray Jeevamrit (10% solution) every 10 days. Apply straw mulch.",
        stepWater: "Drip irrigate or water weekly. Avoid overhead watering to prevent blight.",
        stepPest: "Spray Agniastra for fruit borers. Use yellow sticky traps for whiteflies.",
        stepHarvest: "Harvest at breaker/pink stage for market, fully ripe for self-consumption."
      },
      hi: {
        stepLandPrep: "उठी हुई क्यारियां तैयार करें। मिट्टी में सड़ी हुई खाद और घनजीवामृत मिलाएं।",
        stepSowing: "बीजामृत से बीजोपचार। ट्रे में पौधे उगाएं, 25-30 दिनों में रोपाई करें।",
        stepNutrition: "हर 10 दिन में जीवामृत (10% घोल) का छिड़काव करें। पुआल की मल्चिंग करें।",
        stepWater: "ड्रिप सिंचाई या साप्ताहिक पानी दें। झुलसा से बचने के लिए पत्तियों पर पानी छिड़कने से बचें।",
        stepPest: "फल छेदक के लिए अग्निअस्त्र का छिड़काव करें। सफेद मक्खी के लिए पीले चिपचिपे जाल लगाएं।",
        stepHarvest: "बाजार के लिए गुलाबी/हल्के लाल चरण में और घर के उपयोग के लिए पूरी तरह पकने पर तोड़ें।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate Vermicompost (2 tonnes/acre) and Neem Cake (150kg/acre).",
        stepSowing: "Treat seeds with Trichoderma. Transplant on mulched raised beds.",
        stepNutrition: "Apply biofertilizers (Azotobacter, PSB). Spray Panchagavya during flowering.",
        stepWater: "Irrigate regularly, maintain even soil moisture to prevent blossom end rot.",
        stepPest: "Spray Neem oil (1500 ppm). Release Trichogramma for fruit borer control.",
        stepHarvest: "Pick tomatoes every 2-3 days. Grade according to size and color."
      },
      hi: {
        stepLandPrep: "केंचुआ खाद (2 टन/एकड़) और नीम की खली (150 किग्रा/एकड़) मिलाएं।",
        stepSowing: "ट्राइकोडर्मा के साथ बीजोपचार। मल्चिंग लगी उठी हुई क्यारियों पर रोपाई करें।",
        stepNutrition: "जैव उर्वरक (एज़ोटोबैक्टर, पीएसबी) डालें। फूल आने के दौरान पंचगव्य का छिड़काव करें।",
        stepWater: "नियमित रूप से सिंचाई करें, ब्लॉसम एंड रॉट से बचने के लिए मिट्टी में समान नमी रखें।",
        stepPest: "नीम तेल (1500 ppm) छिड़कें। फल छेदक नियंत्रण के लिए ट्राइकोकार्ड का उपयोग करें।",
        stepHarvest: "हर 2-3 दिन में टमाटर तोड़ें। आकार और रंग के अनुसार ग्रेडिंग करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Fine field tillage, prepare raised beds. Apply basal NPK (60:80:60 kg/ha).",
        stepSowing: "Buy certified F1 hybrid seeds. Transplant at 4-leaf stage.",
        stepNutrition: "Apply top dressing of Urea and MOP. Foliar spray of Calcium Nitrate.",
        stepWater: "Maintain regular drip irrigation (every 2-3 days in dry summer).",
        stepPest: "Spray Coragen for fruit borer, Ridomil for early and late blight control.",
        stepHarvest: "Manual harvesting when fruit turns red. Sort, pack in crates for transport."
      },
      hi: {
        stepLandPrep: "खेत की अच्छी जुताई करें, उठी हुई क्यारियां बनाएं। आधार एनपीके (60:80:60) डालें।",
        stepSowing: "प्रमाणित F1 हाइब्रिड बीज खरीदें। 4-पत्ती वाले चरण में रोपाई करें।",
        stepNutrition: "यूरिया और एमओपी की टॉप ड्रेसिंग करें। कैल्शियम नाइट्रेट का पर्णीय छिड़काव करें।",
        stepWater: "नियमित ड्रिप सिंचाई बनाए रखें (गर्मियों में हर 2-3 दिनों में)।",
        stepPest: "फल छेदक के लिए कोराजन, अगेती और पछेती झुलसा के लिए रिडोमिल का छिड़काव करें।",
        stepHarvest: "फल लाल होने पर हाथ से तोड़ें। परिवहन के लिए बक्से में छांटकर पैक करें।"
      }
    }
  },
  potato: {
    natural: {
      en: {
        stepLandPrep: "Deep loose soil preparation. Apply Ghanajeevamrit (250kg/acre) during earthing.",
        stepSowing: "Treat seed tubers with Beejamrit. Plant in ridges 50-60cm apart.",
        stepNutrition: "Irrigate with Jeevamrit. Apply thick dry leaf mulching for weed control.",
        stepWater: "Light watering; keep soil moist but never waterlogged to prevent rot.",
        stepPest: "Spray Neemastra or sour buttermilk mix for late blight prevention.",
        stepHarvest: "Harvest 90-110 days after planting. Let tubers dry in shade before storing."
      },
      hi: {
        stepLandPrep: "गहरी भुरभुरी मिट्टी तैयार करें। मिट्टी चढ़ाते समय घनजीवामृत (250 किग्रा/एकड़) डालें।",
        stepSowing: "बीज कंदों का बीजामृत से उपचार करें। 50-60 सेमी की दूरी पर मेड़ों में लगाएं।",
        stepNutrition: "जीवामृत के साथ सिंचाई करें। खरपतवार नियंत्रण के लिए सूखी पत्तियों की मोटी मल्चिंग करें।",
        stepWater: "हल्की सिंचाई; मिट्टी को नम रखें लेकिन सड़न से बचाने के लिए जलभराव न होने दें।",
        stepPest: "पछेती झुलसा की रोकथाम के लिए नीमअस्त्र या खट्टी छाछ के घोल का छिड़काव करें।",
        stepHarvest: "रोपाई के 90-110 दिन बाद खुदाई करें। भंडारण से पहले कंदों को छाया में सुखाएं।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Apply compost (8 tonnes/acre) and neem cake. Ensure loose sandy-loam soil.",
        stepSowing: "Treat tubers with Trichoderma. Plant sprouted tubers at 10-15cm depth.",
        stepNutrition: "Apply bio-fertilizer Azotobacter. Earthing up at 30 days with vermicompost.",
        stepWater: "Provide regular sprinkler/drip irrigation. Stop watering 10 days before harvest.",
        stepPest: "Spray Copper Oxychloride (organic source) for early blight. Use pheromone traps.",
        stepHarvest: "Dehalming (cutting top vines) 10 days before harvest to harden skin. Dig out tubers."
      },
      hi: {
        stepLandPrep: "गोबर की खाद (8 टन/एकड़) और नीम की खली डालें। भुरभुरी बलुई दोमट मिट्टी रखें।",
        stepSowing: "ट्राइकोडर्मा से कंदों का उपचार। 10-15 सेमी गहराई पर अंकुरित कंद लगाएं।",
        stepNutrition: "एज़ोटोबैक्टर जैव उर्वरक डालें। 30 दिन में केंचुआ खाद के साथ मिट्टी चढ़ाएं।",
        stepWater: "नियमित फव्वारा/ड्रिप सिंचाई दें। कटाई से 10 दिन पहले पानी देना बंद कर दें।",
        stepPest: "अगेती झुलसा के लिए कॉपर ऑक्सीक्लोराइड का छिड़काव। फेरोमोन ट्रैप लगाएं।",
        stepHarvest: "छिलका सख्त करने के लिए कटाई से 10 दिन पहले बेलें काटें (डीहॉलमिंग)। आलू खोदें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Plow twice, rotavator tillage. Apply basal NPK (80:60:100 kg/ha).",
        stepSowing: "Treat seed tubers with Mancozeb. Plant using potato planter machine.",
        stepNutrition: "Apply Urea at earthing up. Spray Zinc and Boron for tuber quality.",
        stepWater: "Irrigate immediately after planting, then at 7-10 day intervals.",
        stepPest: "Spray Imidacloprid for aphids, Metalaxyl for late blight control.",
        stepHarvest: "Harvest using tractor potato digger. Grade tubers by size (AAA, AA, A, B)."
      },
      hi: {
        stepLandPrep: "दो बार जुताई, रोटावेटर चलाएं। आधार एनपीके (80:60:100 किग्रा/हेक्टेयर) डालें।",
        stepSowing: "बीज कंदों का मैंकोजेब से उपचार। पोटैटो प्लांटर मशीन से बुआई करें।",
        stepNutrition: "मिट्टी चढ़ाते समय यूरिया डालें। कंद की गुणवत्ता के लिए जिंक और बोरॉन छिड़कें।",
        stepWater: "बुआई के तुरंत बाद सिंचाई करें, फिर 7-10 दिनों के अंतराल पर पानी दें।",
        stepPest: "माहू के लिए इमिडाक्लोप्रिड, पछेती झुलसा के लिए मेटालैक्सिल का छिड़काव करें।",
        stepHarvest: "ट्रैक्टर पोटैटो डिगर से खुदाई करें। आकार के अनुसार कंदों की छंटाई (ग्रेडिंग) करें।"
      }
    }
  },
  chickpea: {
    natural: {
      en: {
        stepLandPrep: "Plow once after rains. Apply Ghanajeevamrit (150kg/acre) to conserve moisture.",
        stepSowing: "Treat seeds with Beejamrit. Sow in rows 30cm apart at 10cm plant distance.",
        stepNutrition: "Spray 10% Jeevamrit at pre-flowering and pod-initiation stage.",
        stepWater: "Mainly rainfed; if needed, give one light irrigation at pod-development stage.",
        stepPest: "Nip top shoots at 30 days to promote branching. Spray Agniastra for pod borer.",
        stepHarvest: "Harvest when leaves turn yellow and pods dry out. Sun-dry crop in field."
      },
      hi: {
        stepLandPrep: "बारिश के बाद एक बार जुताई। नमी संरक्षण के लिए घनजीवामृत (150 किग्रा/एकड़) डालें।",
        stepSowing: "बीजामृत से बीजोपचार। 30 सेमी कतार और 10 सेमी पौधे की दूरी पर बुआई करें।",
        stepNutrition: "फूल आने से पहले और फली बनने के चरण में 10% जीवामृत का छिड़काव करें।",
        stepWater: "मुख्य रूप से वर्षा आधारित; यदि आवश्यक हो, फली विकास चरण में एक हल्की सिंचाई दें।",
        stepPest: "शाखाओं को बढ़ावा देने के लिए 30 दिन में शीर्ष पत्तियां तोड़ें (निपिंग)। फली छेदक के लिए अग्निअस्त्र छिड़कें।",
        stepHarvest: "पत्तियां पीली होने और फलियां सूखने पर कटाई करें। धूप में सुखाएं।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Incorporate FYM (3 tonnes/acre) during tillage. Clean weeds completely.",
        stepSowing: "Inoculate seeds with Rhizobium and PSB cultures (200g/10kg seed).",
        stepNutrition: "Apply Rock Phosphate (100kg/acre) and Vermicompost. Spray vermiwash.",
        stepWater: "Provide pre-sowing irrigation. Irrigate once at pod-development stage.",
        stepPest: "Install bird perches for natural caterpillar predation. Spray Neem oil (3000 ppm).",
        stepHarvest: "Harvest manually when 90% of pods turn straw color. Thresh with tractor."
      },
      hi: {
        stepLandPrep: "जुताई के दौरान गोबर की खाद (3 टन/एकड़) मिलाएं। खरपतवार पूरी तरह साफ करें।",
        stepSowing: "राइजोबियम और पीएसबी कल्चर (200 ग्राम/10 किग्रा बीज) से बीजों को उपचारित करें।",
        stepNutrition: "रॉक फास्फेट (100 किग्रा/एकड़) और केंचुआ खाद डालें। वर्मीवॉश छिड़कें।",
        stepWater: "बुआई से पहले सिंचाई (पलेवा) करें। फली बनने के समय एक बार सिंचाई करें।",
        stepPest: "चिड़ियों के बैठने के लिए खूंटे (बर्ड पर्च) लगाएं। नीम तेल (3000 ppm) छिड़कें।",
        stepHarvest: "90% फलियां भूसे के रंग की होने पर हाथ से कटाई करें। ट्रैक्टर से गहाई करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Prepare medium fine seedbed. Apply basal NPK (20:50:20 kg/ha) + Sulphur.",
        stepSowing: "Treat seeds with Carbendazim. Sow at 5-8cm depth to prevent wilt.",
        stepNutrition: "Foliar spray of 2% Urea at flowering to boost yields.",
        stepWater: "Provide 2 critical irrigations: branching stage (30-35 days) and pod filling.",
        stepPest: "Spray Chlorpyriphos for cutworms, Indoxacarb or Coragen for pod borer.",
        stepHarvest: "Harvest with combine harvester when grains are hard and dry."
      },
      hi: {
        stepLandPrep: "मध्यम क्यारी तैयार करें। आधार एनपीके (20:50:20 किग्रा/हेक्टेयर) + सल्फर डालें।",
        stepSowing: "उकठा (विल्ट) से बचाव के लिए कार्बेंडाजिम से बीज उपचार। 5-8 सेमी गहराई पर बोएं।",
        stepNutrition: "उपज बढ़ाने के लिए फूल आने पर 2% यूरिया का पर्णीय छिड़काव करें।",
        stepWater: "दो सिंचाइयां दें: शाखाएं निकलते समय (30-35 दिन) और फली बनते समय।",
        stepPest: "कटवर्म के लिए क्लोरपायरीफॉस, फली छेदक के लिए इंडोक्साकार्ब या कोराजन का छिड़काव करें।",
        stepHarvest: "दाना सख्त और सूखा होने पर कंबाइन हार्वेस्टर से कटाई करें।"
      }
    }
  },
  moong: {
    natural: {
      en: {
        stepLandPrep: "Minimum tillage. Apply Ghanajeevamrit (100kg/acre) to dry sandy-loam soil.",
        stepSowing: "Treat seeds with Beejamrit. Line sowing at 30x10 cm spacing.",
        stepNutrition: "Spray liquid Jeevamrit (5% solution) at flowering and pod filling.",
        stepWater: "Irrigate every 12-15 days. No water accumulation during vegetative growth.",
        stepPest: "Spray Neemi seed kernel extract or Dashparni Ark for sucking pests.",
        stepHarvest: "Harvest pods in 2-3 pickings as they turn blackish-brown and dry."
      },
      hi: {
        stepLandPrep: "न्यूनतम जुताई। सूखी बलुई दोमट मिट्टी में घनजीवामृत (100 किग्रा/एकड़) डालें।",
        stepSowing: "बीजामृत से बीजोपचार। 30x10 सेमी की दूरी पर कतारों में बुआई करें।",
        stepNutrition: "फूल आने और फलियां बनते समय तरल जीवामृत (5% घोल) का छिड़काव करें।",
        stepWater: "हर 12-15 दिन में सिंचाई करें। वानस्पतिक वृद्धि के दौरान जलभराव न होने दें।",
        stepPest: "रस चूसक कीटों के लिए नीम बीज अर्क या दशपर्णी अर्क का छिड़काव करें।",
        stepHarvest: "फलियों के काले-भूरे होने और सूखने पर 2-3 बार में तोड़ाई करें।"
      }
    },
    organic: {
      en: {
        stepLandPrep: "Apply compost (2 tonnes/acre). Prepare clean fields free of stubble.",
        stepSowing: "Rhizobium and PSB seed inoculation. Set sowing rate 8-10kg/acre.",
        stepNutrition: "Use organic liquid manure or Vermiwash spray at vegetative phase.",
        stepWater: "Irrigate at critical flower initiation and pod filling stages.",
        stepPest: "Spray Neem oil (1500 ppm) for whitefly. Deploy yellow sticky traps.",
        stepHarvest: "Harvest when 85% of pods mature. Sun-dry crop, thresh, and store."
      },
      hi: {
        stepLandPrep: "खाद (2 टन/एकड़) डालें। ठूंठ से मुक्त साफ खेत तैयार करें।",
        stepSowing: "राइजोबियम और पीएसबी से बीज उपचार। बुआई दर 8-10 किग्रा/एकड़ रखें।",
        stepNutrition: "वानस्पतिक अवस्था में जैविक तरल खाद या वर्मीवॉश छिड़काव का प्रयोग करें।",
        stepWater: "फूल आने और फली बनते समय महत्वपूर्ण चरणों में सिंचाई करें।",
        stepPest: "सफेद मक्खी के लिए नीम तेल (1500 ppm) का छिड़काव करें। पीले चिपचिपे जाल लगाएं।",
        stepHarvest: "85% फलियां पकने पर कटाई करें। फसल को धूप में सुखाएं, मड़ाई कर भंडारण करें।"
      }
    },
    chemical: {
      en: {
        stepLandPrep: "Prepare fine seedbed. Apply basal NPK (20:40:20 kg/ha) + Gypsum.",
        stepSowing: "Treat seeds with Thiram + Carbendazim. Use seed drill machine.",
        stepNutrition: "Foliar spray of DAP (2% solution) at flowering stage for high yield.",
        stepWater: "Provide 3 irrigations: branching, flowering, and pod development.",
        stepPest: "Spray Imidacloprid for whitefly (vector of yellow mosaic), Coragen for pod borer.",
        stepHarvest: "Combine harvesting or manual cutting. Thresh using power thresher."
      },
      hi: {
        stepLandPrep: "महीन क्यारी तैयार करें। आधार एनपीके (20:40:20 किग्रा/हेक्टेयर) + जिप्सम डालें।",
        stepSowing: "थिरम + कार्बेंडाजिम से बीज उपचार। सीड ड्रिल मशीन का उपयोग करें।",
        stepNutrition: "अधिक उपज के लिए फूल आने पर डीएपी (2% घोल) का छिड़काव करें।",
        stepWater: "तीन सिंचाइयां दें: शाखा निकलते समय, फूल आते समय और फली विकास के समय।",
        stepPest: "सफेद मक्खी (पीला मोज़ेक वाहक) के लिए इमिडाक्लोप्रिड, फली छेदक के लिए कोराजन छिड़कें।",
        stepHarvest: "कंबाइन हार्वेस्टिंग या मैन्युअल कटाई। पावर थ्रेशर से मड़ाई करें।"
      }
    }
  }
};

const FarmerAI = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const isFarmer = user?.categories?.includes('farmer');
  
  // ─── STATES ───
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const [soil, setSoil] = useState('');
  const [region, setRegion] = useState('');
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [cropResult, setCropResult] = useState(null);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: locale === 'en' ? "Namaste! I am your GramMitra Farming AI. How can I help you increase your yield today?" : "नमस्ते! मैं आपका ग्राममित्र कृषि AI हूँ। आज मैं आपकी उपज बढ़ाने में कैसे मदद कर सकता हूँ?" }
  ]);
  const chatEndRef = useRef(null);

  const [activeTab, setActiveTab] = useState('weather'); // 'weather' or 'estimator'
  const [selectedCrop, setSelectedCrop] = useState('');
  const [landArea, setLandArea] = useState('1');
  const [selectedMethodForInstructions, setSelectedMethodForInstructions] = useState('natural');

  // Scroll chat to bottom automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Estimator Calculations
  const area = parseFloat(landArea) || 0;
  const cropData = selectedCrop ? CROP_METRICS[selectedCrop] : null;

  const calculateMethodData = (methodKey) => {
    if (!cropData) return { yield: 0, cost: 0, revenue: 0, netProfit: 0 };
    const metrics = cropData[methodKey];
    const totalYield = metrics.yield * area;
    const totalCost = metrics.cost * area;
    const grossRevenue = totalYield * metrics.price;
    const netProfit = grossRevenue - totalCost;

    return {
      yield: totalYield.toFixed(1),
      cost: totalCost.toFixed(0),
      revenue: grossRevenue.toFixed(0),
      netProfit: netProfit.toFixed(0)
    };
  };

  const naturalData = calculateMethodData('natural');
  const organicData = calculateMethodData('organic');
  const chemicalData = calculateMethodData('chemical');

  const chartData = selectedCrop ? [
    {
      name: locale === 'en' ? 'Natural' : 'प्राकृतिक',
      [locale === 'en' ? 'Input Cost' : 'कृषि लागत']: parseFloat(naturalData.cost),
      [locale === 'en' ? 'Gross Revenue' : 'कुल राजस्व']: parseFloat(naturalData.revenue),
      [locale === 'en' ? 'Net Profit' : 'शुद्ध लाभ']: parseFloat(naturalData.netProfit)
    },
    {
      name: locale === 'en' ? 'Organic' : 'जैविक',
      [locale === 'en' ? 'Input Cost' : 'कृषि लागत']: parseFloat(organicData.cost),
      [locale === 'en' ? 'Gross Revenue' : 'कुल राजस्व']: parseFloat(organicData.revenue),
      [locale === 'en' ? 'Net Profit' : 'शुद्ध लाभ']: parseFloat(organicData.netProfit)
    },
    {
      name: locale === 'en' ? 'Chemical' : 'रासायनिक',
      [locale === 'en' ? 'Input Cost' : 'कृषि लागत']: parseFloat(chemicalData.cost),
      [locale === 'en' ? 'Gross Revenue' : 'कुल राजस्व']: parseFloat(chemicalData.revenue),
      [locale === 'en' ? 'Net Profit' : 'शुद्ध लाभ']: parseFloat(chemicalData.netProfit)
    }
  ] : [];

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/farmer/weather?village=Gwalior`);
      setWeatherData(res.data);
    } catch (error) {
      console.error("Weather fetch error", error);
      setWeatherData({
        temperature: 30,
        humidity: 60,
        windSpeed: 12,
        condition: locale === 'en' ? 'Sunny' : 'धूपदार',
        farmingAlert: locale === 'en' ? 'No immediate weather warning.' : 'कोई तात्कालिक मौसम चेतावनी नहीं है।'
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    setLoadingCrops(true);
    try {
      const month = new Date().toLocaleString('default', { month: 'long' });
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/ai/crops`, {
        month,
        weather: weatherData?.condition || "Sunny",
        soilType: soil,
        region: region,
        language: locale
      });
      setCropResult(res.data.recommendations || res.data.recommendation);
    } catch (error) {
      console.error("Crop recommendations error", error);
      setCropResult(
        locale === 'en'
          ? "Unable to fetch recommendations. Please check your network connectivity."
          : "सिफारिशें प्राप्त करने में असमर्थ। कृपया अपना नेटवर्क कनेक्शन जांचें।"
      );
    } finally {
      setLoadingCrops(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/ai/ask`, {
        prompt: `Farming Context: ${userMessage}`,
        language: locale
      });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: locale === 'en' 
          ? "I am sorry, but I am unable to connect to the assistant right now. Please try again." 
          : "मुझे खेद है, लेकिन मैं अभी सहायक से नहीं जुड़ पा रहा हूँ। कृपया पुनः प्रयास करें।" 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-village-darkGreen to-village-emerald p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Sprout className="w-8 h-8 text-village-lightMint" />
            {t('farmer.title')}
          </h1>
          <p className="text-village-lightMint text-lg opacity-90">{t('farmer.subtitle')}</p>
        </div>
      </div>

      {/* FALLBACK: IF USER IS NOT FARMER */}
      {!isFarmer && (
        <div className="glass-card p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {locale === 'en' ? 'Farmer Profile Required' : 'किसान प्रोफाइल आवश्यक है'}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {locale === 'en'
              ? 'This section is only available for users registered as farmers. Please update your profile categories to gain access.'
              : 'यह अनुभाग केवल किसान के रूप में पंजीकृत उपयोगकर्ताओं के लिए उपलब्ध है। पहुंच प्राप्त करने के लिए कृपया अपनी प्रोफ़ाइल श्रेणियों को अपडेट करें।'}
          </p>
        </div>
      )}

      {isFarmer && (
        <div className="space-y-6">
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'weather'
                  ? 'bg-village-emerald text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CloudSun className="w-4 h-4 shrink-0" />
              {t('farmer.tabWeather')}
            </button>
            <button
              onClick={() => setActiveTab('estimator')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'estimator'
                  ? 'bg-village-emerald text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              {t('farmer.tabEstimator')}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-village-emerald text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              {t('farmer.tabGuide')}
            </button>
          </div>

          {activeTab === 'weather' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Weather & Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Weather Widget */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-l-4 border-village-mint">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CloudSun className="text-village-emerald w-6 h-6" /> {t('farmer.weather')}
                </h2>
                
                {loadingWeather ? (
                  <div className="flex justify-center p-6"><Loader className="animate-spin text-village-mint w-8 h-8" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                        <ThermometerSun className="w-8 h-8 text-orange-500 mb-2" />
                        <span className="text-2xl font-bold text-gray-800">{weatherData?.temperature}°C</span>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                        <Droplets className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-lg font-bold text-gray-800">{weatherData?.humidity}%</span>
                        <span className="text-xs text-gray-500">{t('farmer.humidity')}</span>
                      </div>
                      <div className="bg-teal-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                        <Wind className="w-8 h-8 text-teal-500 mb-2" />
                        <span className="text-lg font-bold text-gray-800">{weatherData?.windSpeed} km/h</span>
                        <span className="text-xs text-gray-500">{t('farmer.wind')}</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="font-semibold text-gray-700 capitalize">{weatherData?.condition}</span>
                      </div>
                    </div>
                    
                    {/* Alert Banner */}
                    {weatherData?.farmingAlert && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-700">{t('farmer.alert')}</h4>
                          <p className="text-sm text-red-600 mt-1">{weatherData.farmingAlert}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>

              {/* AI Crop Recommendations Form */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bot className="text-village-emerald w-6 h-6" /> {t('farmer.cropRec')}
                </h2>
                
                <form onSubmit={handleGetRecommendations} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <select required value={soil} onChange={e => setSoil(e.target.value)} className="p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-village-mint text-gray-800 font-medium">
                    <option value="" className="bg-white text-gray-800 font-medium">{t('farmer.soilType')}</option>
                    <option value="black" className="bg-white text-gray-800 font-medium">{t('farmer.soils.black')}</option>
                    <option value="alluvial" className="bg-white text-gray-800 font-medium">{t('farmer.soils.alluvial')}</option>
                    <option value="red" className="bg-white text-gray-800 font-medium">{t('farmer.soils.red')}</option>
                  </select>
                  <select required value={region} onChange={e => setRegion(e.target.value)} className="p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-village-mint text-gray-800 font-medium">
                    <option value="" className="bg-white text-gray-800 font-medium">{t('farmer.region')}</option>
                    <option value="north" className="bg-white text-gray-800 font-medium">{t('farmer.regions.north')}</option>
                    <option value="central" className="bg-white text-gray-800 font-medium">{t('farmer.regions.central')}</option>
                    <option value="south" className="bg-white text-gray-800 font-medium">{t('farmer.regions.south')}</option>
                  </select>
                  <button type="submit" disabled={loadingCrops} className="btn-primary w-full h-full flex justify-center items-center">
                    {loadingCrops ? <Loader className="animate-spin w-5 h-5" /> : t('farmer.getRec')}
                  </button>
                </form>

                {/* AI Results (Renders Gemini Markdown output nicely) */}
                {cropResult && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-gradient-to-br from-village-cream to-village-lightMint p-5 rounded-2xl border border-village-mint/30 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {cropResult}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right Column: AI Farming Assistant Chat */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card flex flex-col h-[600px] lg:h-auto border-t-4 border-village-emerald">
              <div className="p-4 border-b border-gray-100 bg-white/50 rounded-t-2xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-village-emerald" /> {t('farmer.askAI')}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user' 
                      ? 'bg-village-emerald text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-village-mint rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-village-mint rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-village-mint rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white/80 rounded-b-2xl border-t border-gray-100 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('farmer.typeMessage')}
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-village-mint disabled:opacity-50"
                />
                <button type="submit" disabled={chatLoading} className="bg-village-emerald text-white p-2.5 rounded-xl hover:bg-village-darkGreen transition-colors disabled:opacity-50">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>

          </div>
          )}

          {activeTab === 'estimator' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left Column: Form Controls */}
              <div className="glass-card p-6 h-fit space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Leaf className="text-village-emerald w-6 h-6" />
                  {t('farmer.estimatorTitle')}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('farmer.estimatorSubtitle')}
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      {t('farmer.selectCrop')}
                    </label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-village-mint text-gray-800 font-medium"
                    >
                      <option value="" className="bg-white text-gray-800 font-medium">-- {t('farmer.selectCrop')} --</option>
                      <option value="rice" className="bg-white text-gray-800 font-medium">{t('farmer.crops.rice')}</option>
                      <option value="wheat" className="bg-white text-gray-800 font-medium">{t('farmer.crops.wheat')}</option>
                      <option value="maize" className="bg-white text-gray-800 font-medium">{t('farmer.crops.maize')}</option>
                      <option value="mustard" className="bg-white text-gray-800 font-medium">{t('farmer.crops.mustard')}</option>
                      <option value="cotton" className="bg-white text-gray-800 font-medium">{t('farmer.crops.cotton')}</option>
                      <option value="sugarcane" className="bg-white text-gray-800 font-medium">{t('farmer.crops.sugarcane')}</option>
                      <option value="tomato" className="bg-white text-gray-800 font-medium">{t('farmer.crops.tomato')}</option>
                      <option value="potato" className="bg-white text-gray-800 font-medium">{t('farmer.crops.potato')}</option>
                      <option value="chickpea" className="bg-white text-gray-800 font-medium">{t('farmer.crops.chickpea')}</option>
                      <option value="moong" className="bg-white text-gray-800 font-medium">{t('farmer.crops.moong')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      {t('farmer.enterArea')}
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-village-mint text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Right Columns: Projections and Visualization */}
              <div className="lg:col-span-2 space-y-6">
                {!selectedCrop ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                      <Sprout className="w-8 h-8 text-village-emerald" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {locale === 'en' ? 'Select a Crop to Start' : 'शुरू करने के लिए एक फसल चुनें'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      {locale === 'en'
                        ? 'Choose a crop and specify land area in acres to view comparative projections and yield charts.'
                        : 'तुलनात्मक अनुमान और उपज चार्ट देखने के लिए एक फसल चुनें और एकड़ में भूमि क्षेत्र निर्दिष्ट करें।'}
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-800">
                      {t('farmer.resultsTitle').replace('{{area}}', landArea)}
                    </h3>

                    {/* Method Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Natural card */}
                      <div className="glass-card p-5 border-t-4 border-emerald-500 bg-gradient-to-b from-emerald-50/20 to-white flex flex-col justify-between shadow-sm">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                              {t('farmer.methods.natural.name')}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.yield')}</span>
                              <strong className="text-base text-gray-800">{naturalData.yield} {locale === 'en' ? 'Quintals' : 'कुंतल'}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.cost')}</span>
                              <strong className="text-base text-gray-800">₹{parseFloat(naturalData.cost).toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.revenue')}</span>
                              <strong className="text-base text-gray-700">₹{parseFloat(naturalData.revenue).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-gray-500 block text-xs font-semibold">{t('farmer.netProfit')}</span>
                              <strong className="text-xl text-emerald-600 font-extrabold">₹{parseFloat(naturalData.netProfit).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                          <div>
                            <strong>{t('farmer.soilImpact')}:</strong> {t('farmer.methods.natural.impact')}
                          </div>
                          <div>
                            <strong>{t('farmer.keyInputs')}:</strong> {t('farmer.methods.natural.inputs')}
                          </div>
                        </div>
                      </div>

                      {/* Organic card */}
                      <div className="glass-card p-5 border-t-4 border-amber-500 bg-gradient-to-b from-amber-50/20 to-white flex flex-col justify-between shadow-sm">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
                              {t('farmer.methods.organic.name')}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.yield')}</span>
                              <strong className="text-base text-gray-800">{organicData.yield} {locale === 'en' ? 'Quintals' : 'कुंतल'}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.cost')}</span>
                              <strong className="text-base text-gray-800">₹{parseFloat(organicData.cost).toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.revenue')}</span>
                              <strong className="text-base text-gray-700">₹{parseFloat(organicData.revenue).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-gray-500 block text-xs font-semibold">{t('farmer.netProfit')}</span>
                              <strong className="text-xl text-amber-600 font-extrabold">₹{parseFloat(organicData.netProfit).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                          <div>
                            <strong>{t('farmer.soilImpact')}:</strong> {t('farmer.methods.organic.impact')}
                          </div>
                          <div>
                            <strong>{t('farmer.keyInputs')}:</strong> {t('farmer.methods.organic.inputs')}
                          </div>
                        </div>
                      </div>

                      {/* Chemical card */}
                      <div className="glass-card p-5 border-t-4 border-blue-500 bg-gradient-to-b from-blue-50/20 to-white flex flex-col justify-between shadow-sm">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
                              {t('farmer.methods.chemical.name')}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.yield')}</span>
                              <strong className="text-base text-gray-800">{chemicalData.yield} {locale === 'en' ? 'Quintals' : 'कुंतल'}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.cost')}</span>
                              <strong className="text-base text-gray-800">₹{parseFloat(chemicalData.cost).toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{t('farmer.revenue')}</span>
                              <strong className="text-base text-gray-700">₹{parseFloat(chemicalData.revenue).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-gray-500 block text-xs font-semibold">{t('farmer.netProfit')}</span>
                              <strong className="text-xl text-blue-600 font-extrabold">₹{parseFloat(chemicalData.netProfit).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                          <div>
                            <strong>{t('farmer.soilImpact')}:</strong> {t('farmer.methods.chemical.impact')}
                          </div>
                          <div>
                            <strong>{t('farmer.keyInputs')}:</strong> {t('farmer.methods.chemical.inputs')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Chart */}
                    <div className="glass-card p-6 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FlaskConical className="text-village-emerald w-5 h-5" />
                        {t('farmer.chartTitle')}
                      </h4>
                      <div className="relative w-full h-[320px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} />
                            <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`]}
                              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', pt: 2 }} />
                            <Bar dataKey={locale === 'en' ? 'Input Cost' : 'कृषि लागत'} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={45} />
                            <Bar dataKey={locale === 'en' ? 'Gross Revenue' : 'कुल राजस्व'} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                            <Bar dataKey={locale === 'en' ? 'Net Profit' : 'शुद्ध लाभ'} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cultivation Steps & Guide */}
                    {(() => {
                      if (!selectedCrop || !CROP_INSTRUCTIONS[selectedCrop]) return null;
                      const cropInstr = CROP_INSTRUCTIONS[selectedCrop][selectedMethodForInstructions];
                      if (!cropInstr) return null;
                      const steps = cropInstr[locale === 'en' ? 'en' : 'hi'] || cropInstr['en'];
                      if (!steps) return null;

                      return (
                        <div className="glass-card p-6 shadow-sm mt-6 animate-fadeIn">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                            <div>
                              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Sprout className="text-village-emerald w-5 h-5 animate-pulse" />
                                {t('farmer.instructionsTitle')}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {t('farmer.instructionsSubtitle').replace('{{crop}}', t(`farmer.crops.${selectedCrop}`))}
                              </p>
                            </div>
                            {/* Method Switcher inside the guide */}
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit self-start md:self-center">
                              {['natural', 'organic', 'chemical'].map((mKey) => (
                                <button
                                  key={mKey}
                                  onClick={() => setSelectedMethodForInstructions(mKey)}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ${
                                    selectedMethodForInstructions === mKey
                                      ? 'bg-village-emerald text-white shadow-sm'
                                      : 'text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {t(`farmer.methods.${mKey}.name`)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative border-l-2 border-village-emerald/30 ml-4 pl-6 md:pl-8 py-2 space-y-6">
                            {[
                              { key: 'stepLandPrep', label: t('farmer.stepLandPrep') },
                              { key: 'stepSowing', label: t('farmer.stepSowing') },
                              { key: 'stepNutrition', label: t('farmer.stepNutrition') },
                              { key: 'stepWater', label: t('farmer.stepWater') },
                              { key: 'stepPest', label: t('farmer.stepPest') },
                              { key: 'stepHarvest', label: t('farmer.stepHarvest') }
                            ].map((step, idx) => (
                              <div key={step.key} className="relative">
                                {/* Dot indicator */}
                                <span className="absolute -left-[35px] md:-left-[43px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-village-emerald text-white font-bold text-xs shadow-md border-2 border-white">
                                  {idx + 1}
                                </span>
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200/50">
                                  <h5 className="font-bold text-sm text-gray-800 mb-1">{step.label}</h5>
                                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                                    {steps[step.key] || "No instructions provided."}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
              {/* Left Column: Crop Selector List */}
              <div className="glass-card p-5 h-fit space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base border-b border-gray-100 pb-3">
                  <Leaf className="text-village-emerald w-5 h-5" />
                  {locale === 'en' ? 'Select a Crop' : 'फसल चुनें'}
                </h3>
                
                {/* Group 1: Cereals */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                    {locale === 'en' ? 'Cereals' : 'अनाज'}
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {['rice', 'wheat', 'maize'].map((cKey) => (
                      <button
                        key={cKey}
                        onClick={() => setSelectedCrop(cKey)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          selectedCrop === cKey
                            ? 'bg-village-lightMint text-village-darkGreen border border-village-mint/30 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span>{t(`farmer.crops.${cKey}`)}</span>
                        <span className="text-xs opacity-60"></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group 2: Cash & Oilseeds */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                    {locale === 'en' ? 'Cash & Oilseeds' : 'नकदी व तिलहन'}
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {['mustard', 'cotton', 'sugarcane'].map((cKey) => (
                      <button
                        key={cKey}
                        onClick={() => setSelectedCrop(cKey)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          selectedCrop === cKey
                            ? 'bg-village-lightMint text-village-darkGreen border border-village-mint/30 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span>{t(`farmer.crops.${cKey}`)}</span>
                        <span className="text-xs opacity-60"></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group 3: Vegetables */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                    {locale === 'en' ? 'Vegetables' : 'सब्जियां'}
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {['tomato', 'potato'].map((cKey) => (
                      <button
                        key={cKey}
                        onClick={() => setSelectedCrop(cKey)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          selectedCrop === cKey
                            ? 'bg-village-lightMint text-village-darkGreen border border-village-mint/30 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span>{t(`farmer.crops.${cKey}`)}</span>
                        <span className="text-xs opacity-60"></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group 4: Pulses */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                    {locale === 'en' ? 'Pulses' : 'दालें'}
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {['chickpea', 'moong'].map((cKey) => (
                      <button
                        key={cKey}
                        onClick={() => setSelectedCrop(cKey)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          selectedCrop === cKey
                            ? 'bg-village-lightMint text-village-darkGreen border border-village-mint/30 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span>{t(`farmer.crops.${cKey}`)}</span>
                        <span className="text-xs opacity-60"></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Cultivation Steps */}
              <div className="lg:col-span-3">
                {!selectedCrop ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                      <Sprout className="w-8 h-8 text-village-emerald" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {locale === 'en' ? 'Select a Crop for Cultivation Guide' : 'कृषि निर्देशिका के लिए एक फसल चुनें'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      {locale === 'en'
                        ? 'Choose any crop from the categories on the left to read complete, method-specific cultivation steps.'
                        : 'बायें हाथ की श्रेणियों में से कोई भी फसल चुनें ताकि आप उसकी विधि-वार पूर्ण कृषि निर्देशिका पढ़ सकें।'}
                    </p>
                  </div>
                ) : (
                  (() => {
                    const cropInstr = CROP_INSTRUCTIONS[selectedCrop]?.[selectedMethodForInstructions];
                    if (!cropInstr) return null;
                    const steps = cropInstr[locale === 'en' ? 'en' : 'hi'] || cropInstr['en'];
                    if (!steps) return null;

                    return (
                      <div className="glass-card p-6 shadow-sm animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <Sprout className="text-village-emerald w-5 h-5 animate-pulse" />
                              {t('farmer.instructionsTitle')}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('farmer.instructionsSubtitle').replace('{{crop}}', t(`farmer.crops.${selectedCrop}`))}
                            </p>
                          </div>
                          {/* Method Switcher inside the guide */}
                          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit self-start md:self-center">
                            {['natural', 'organic', 'chemical'].map((mKey) => (
                              <button
                                key={mKey}
                                onClick={() => setSelectedMethodForInstructions(mKey)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ${
                                  selectedMethodForInstructions === mKey
                                    ? 'bg-village-emerald text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t(`farmer.methods.${mKey}.name`)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="relative border-l-2 border-village-emerald/30 ml-4 pl-6 md:pl-8 py-2 space-y-6">
                          {[
                            { key: 'stepLandPrep', label: t('farmer.stepLandPrep') },
                            { key: 'stepSowing', label: t('farmer.stepSowing') },
                            { key: 'stepNutrition', label: t('farmer.stepNutrition') },
                            { key: 'stepWater', label: t('farmer.stepWater') },
                            { key: 'stepPest', label: t('farmer.stepPest') },
                            { key: 'stepHarvest', label: t('farmer.stepHarvest') }
                          ].map((step, idx) => (
                            <div key={step.key} className="relative">
                              {/* Dot indicator */}
                              <span className="absolute -left-[35px] md:-left-[43px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-village-emerald text-white font-bold text-xs shadow-md border-2 border-white">
                                {idx + 1}
                              </span>
                              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl hover:shadow-md transition-all duration-200 border border-gray-200/50">
                                <h5 className="font-bold text-sm text-gray-800 mb-1">{step.label}</h5>
                                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                                  {steps[step.key] || "No instructions provided."}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FarmerAI;