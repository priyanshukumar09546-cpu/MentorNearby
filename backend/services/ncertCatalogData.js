// ============================================================
// services/ncertCatalogData.js
// Canonical Official NCERT Publications, Solutions, Notes & Papers Catalog
// ============================================================

const getResources = () => {
  const list = [];

  // Helper to generate chapter objects with official NCERT links
  const createChapters = (bookCode, titles, baseIndex = 1) => {
    return titles.map((title, idx) => {
      const unitNum = baseIndex + idx;
      const formattedNum = unitNum < 10 ? `0${unitNum}` : `${unitNum}`;
      return {
        unitNumber: unitNum,
        title: title,
        openUrl: `https://ncert.nic.in/textbook/pdf/${bookCode}${formattedNum}.pdf`,
        downloadUrl: `https://ncert.nic.in/textbook/pdf/${bookCode}${formattedNum}.pdf`,
        contentType: 'PDF',
        isAvailable: true,
        sourceUrl: `https://ncert.nic.in/textbook.php?${bookCode}=${formattedNum}-${titles.length}`,
      };
    });
  };

  // Helper to create full book resource
  const addBook = (data) => {
    const defaultOfficial = data.officialUrl || (data.bookCode ? `https://ncert.nic.in/textbook.php?${data.bookCode}=0-${data.chapters ? data.chapters.length : 10}` : 'https://ncert.nic.in/textbook.php');
    const defaultDownload = data.downloadUrl || (data.bookCode ? `https://ncert.nic.in/textbook/pdf/${data.bookCode}dd.zip` : null);

    list.push({
      title: data.title,
      description: data.description || `Official NCERT textbook for ${data.classLevel} ${data.subject} (${data.medium} Medium).`,
      category: data.category || 'NCERT_BOOK',
      medium: data.medium || 'English',
      classLevel: data.classLevel,
      subject: data.subject,
      resourceType: data.resourceType || 'BOOK',
      publisher: 'NCERT',
      officialUrl: defaultOfficial,
      downloadUrl: defaultDownload,
      coverImageUrl: data.coverImageUrl || `/assets/covers/${data.bookCode || 'ncert'}.jpg`,
      chapters: data.chapters || [],
      sourceId: data.sourceId,
      order: data.order || 0,
    });
  };

  // ============================================================
  // CLASS 12 — ENGLISH MEDIUM
  // ============================================================
  addBook({
    sourceId: 'ncert-book-12-math-1-en',
    title: 'Mathematics Part-I',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'lemh1',
    order: 1,
    chapters: createChapters('lemh1', [
      'Relations and Functions',
      'Inverse Trigonometric Functions',
      'Matrices',
      'Determinants',
      'Continuity and Differentiability',
      'Application of Derivatives',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-math-2-en',
    title: 'Mathematics Part-II',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'lemh2',
    order: 2,
    chapters: createChapters('lemh2', [
      'Integrals',
      'Application of Integrals',
      'Differential Equations',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Linear Programming',
      'Probability',
    ], 7),
  });

  addBook({
    sourceId: 'ncert-book-12-physics-1-en',
    title: 'Physics Part-I',
    classLevel: 'Class 12',
    subject: 'Physics',
    medium: 'English',
    bookCode: 'leph1',
    order: 3,
    chapters: createChapters('leph1', [
      'Electric Charges and Fields',
      'Electrostatic Potential and Capacitance',
      'Current Electricity',
      'Moving Charges and Magnetism',
      'Magnetism and Matter',
      'Electromagnetic Induction',
      'Alternating Current',
      'Electromagnetic Waves',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-physics-2-en',
    title: 'Physics Part-II',
    classLevel: 'Class 12',
    subject: 'Physics',
    medium: 'English',
    bookCode: 'leph2',
    order: 4,
    chapters: createChapters('leph2', [
      'Ray Optics and Optical Instruments',
      'Wave Optics',
      'Dual Nature of Radiation and Matter',
      'Atoms',
      'Nuclei',
      'Semiconductor Electronics: Materials, Devices and Simple Circuits',
    ], 9),
  });

  addBook({
    sourceId: 'ncert-book-12-chemistry-1-en',
    title: 'Chemistry Part-I',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    medium: 'English',
    bookCode: 'lech1',
    order: 5,
    chapters: createChapters('lech1', [
      'Solutions',
      'Electrochemistry',
      'Chemical Kinetics',
      'The d- and f-Block Elements',
      'Coordination Compounds',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-chemistry-2-en',
    title: 'Chemistry Part-II',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    medium: 'English',
    bookCode: 'lech2',
    order: 6,
    chapters: createChapters('lech2', [
      'Haloalkanes and Haloarenes',
      'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids',
      'Amines',
      'Biomolecules',
    ], 6),
  });

  addBook({
    sourceId: 'ncert-book-12-biology-en',
    title: 'Biology',
    classLevel: 'Class 12',
    subject: 'Biology',
    medium: 'English',
    bookCode: 'lebo1',
    order: 7,
    chapters: createChapters('lebo1', [
      'Sexual Reproduction in Flowering Plants',
      'Human Reproduction',
      'Reproductive Health',
      'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance',
      'Evolution',
      'Human Health and Disease',
      'Microbes in Human Welfare',
      'Biotechnology: Principles and Processes',
      'Biotechnology and its Applications',
      'Organisms and Populations',
      'Ecosystem',
      'Biodiversity and Conservation',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-english-flamingo-en',
    title: 'Flamingo (English Core)',
    classLevel: 'Class 12',
    subject: 'English',
    medium: 'English',
    bookCode: 'lefl1',
    order: 8,
    chapters: createChapters('lefl1', [
      'The Last Lesson (Prose)',
      'Lost Spring (Prose)',
      'Deep Water (Prose)',
      'The Rattrap (Prose)',
      'Indigo (Prose)',
      'Poets and Pancakes (Prose)',
      'The Interview (Prose)',
      'Going Places (Prose)',
      'My Mother at Sixty-six (Poetry)',
      'Keeping Quiet (Poetry)',
      'A Thing of Beauty (Poetry)',
      'A Roadside Stand (Poetry)',
      'Aunt Jennifer\'s Tigers (Poetry)',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-english-vistas-en',
    title: 'Vistas (Supplementary Reader)',
    classLevel: 'Class 12',
    subject: 'English',
    medium: 'English',
    bookCode: 'levi1',
    order: 9,
    chapters: createChapters('levi1', [
      'The Third Level',
      'The Tiger King',
      'Journey to the end of the Earth',
      'The Enemy',
      'On the Face of It',
      'Memories of Childhood',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-business-studies-1-en',
    title: 'Business Studies: Principles & Functions of Management',
    classLevel: 'Class 12',
    subject: 'Business Studies',
    medium: 'English',
    bookCode: 'lebs1',
    order: 10,
    chapters: createChapters('lebs1', [
      'Nature and Significance of Management',
      'Principles of Management',
      'Business Environment',
      'Planning',
      'Organising',
      'Staffing',
      'Directing',
      'Controlling',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-macroeconomics-en',
    title: 'Introductory Macroeconomics',
    classLevel: 'Class 12',
    subject: 'Economics',
    medium: 'English',
    bookCode: 'leec2',
    order: 11,
    chapters: createChapters('leec2', [
      'Introduction to Macroeconomics',
      'National Income Accounting',
      'Money and Banking',
      'Determination of Income and Employment',
      'Government Budget and the Economy',
      'Open Economy Macroeconomics',
    ]),
  });

  // ============================================================
  // CLASS 12 — HINDI MEDIUM
  // ============================================================
  addBook({
    sourceId: 'ncert-book-12-ganit-1-hi',
    title: 'गणित भाग-1 (Ganit Part-I)',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    medium: 'Hindi',
    bookCode: 'lhmh1',
    order: 1,
    chapters: createChapters('lhmh1', [
      'संबंध एवं फलन (Relations & Functions)',
      'प्रतिलोम त्रिकोणमितीय फलन (Inverse Trig Functions)',
      'आव्यूह (Matrices)',
      'सारणिक (Determinants)',
      'सांतत्य तथा अवकलनीयता (Continuity & Diff)',
      'अवकलज के अनुप्रयोग (Application of Derivatives)',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-ganit-2-hi',
    title: 'गणित भाग-2 (Ganit Part-II)',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    medium: 'Hindi',
    bookCode: 'lhmh2',
    order: 2,
    chapters: createChapters('lhmh2', [
      'समाकलन (Integrals)',
      'समाकलनों के अनुप्रयोग (Applications of Integrals)',
      'अवकल समीकरण (Differential Equations)',
      'सदिश बीजगणित (Vector Algebra)',
      'त्रि-विमीय ज्यामिति (Three Dimensional Geometry)',
      'रैखिक प्रोग्रामन (Linear Programming)',
      'प्रायिकता (Probability)',
    ], 7),
  });

  addBook({
    sourceId: 'ncert-book-12-bhautiki-1-hi',
    title: 'भौतिकी भाग-1 (Bhautiki Part-I)',
    classLevel: 'Class 12',
    subject: 'Physics',
    medium: 'Hindi',
    bookCode: 'lhph1',
    order: 3,
    chapters: createChapters('lhph1', [
      'वैद्युत आवेश तथा क्षेत्र',
      'स्थिरवैद्युत विभव तथा धारिता',
      'विद्युत धारा',
      'गतिमान आवेश और चुंबकत्व',
      'चुंबकत्व एवं द्रव्य',
      'वैद्युतचुंबकीय प्रेरण',
      'प्रत्यावर्ती धारा',
      'वैद्युतचुंबकीय तरंगें',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-rasayan-1-hi',
    title: 'रसायन विज्ञान भाग-1 (Rasayan Part-I)',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    medium: 'Hindi',
    bookCode: 'lhch1',
    order: 4,
    chapters: createChapters('lhch1', [
      'विलयन (Solutions)',
      'वैद्युतरसायन (Electrochemistry)',
      'रासायनिक बलगतिकी (Chemical Kinetics)',
      'd- एवं f- ब्लॉक के तत्व',
      'उपसहसंयोजन यौगिक',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-12-hindi-aroh-hi',
    title: 'आरोह भाग-2 (Aroh Core Hindi)',
    classLevel: 'Class 12',
    subject: 'Hindi',
    medium: 'Hindi',
    bookCode: 'lhar1',
    order: 5,
    chapters: createChapters('lhar1', [
      'आत्मपरिचय / एक गीत (हरिवंश राय बच्चन)',
      'पतंग (आलोक धन्वा)',
      'कविता के बहाने / बात सीधी थी पर (कुंवर नारायण)',
      'कैमरे में बंद अपाहिज (रघुवीर सहाय)',
      'उषा (शमशेर बहादुर सिंह)',
      'बादल राग (सूर्यकांत त्रिपाठी निराला)',
      'कवितावली / लक्ष्मण मूर्छा (तुलसीदास)',
      'रुबाइयां (फ़िराक़ गोरखपुरी)',
      'छोटा मेरा खेत / बगुलों के पंख (उमाशंकर जोशी)',
      'भक्तिन (महादेवी वर्मा)',
      'बाज़ार दर्शन (जैनेंद्र कुमार)',
      'काले मेघा पानी दे (धर्मवीर भारती)',
      'पहलवान की ढोलक (फणीश्वर नाथ रेणु)',
      'शिरीष के फूल (हजारी प्रसाद द्विवेदी)',
      'श्रम विभाजन और जाति प्रथा (डॉ. भीमराव आंबेडकर)',
    ]),
  });

  // ============================================================
  // CLASS 11 — ENGLISH MEDIUM
  // ============================================================
  addBook({
    sourceId: 'ncert-book-11-math-en',
    title: 'Mathematics',
    classLevel: 'Class 11',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'kemh1',
    order: 1,
    chapters: createChapters('kemh1', [
      'Sets',
      'Relations and Functions',
      'Trigonometric Functions',
      'Complex Numbers and Quadratic Equations',
      'Linear Inequalities',
      'Permutations and Combinations',
      'Binomial Theorem',
      'Sequences and Series',
      'Straight Lines',
      'Conic Sections',
      'Introduction to Three Dimensional Geometry',
      'Limits and Derivatives',
      'Statistics',
      'Probability',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-11-physics-1-en',
    title: 'Physics Part-I',
    classLevel: 'Class 11',
    subject: 'Physics',
    medium: 'English',
    bookCode: 'keph1',
    order: 2,
    chapters: createChapters('keph1', [
      'Units and Measurements',
      'Motion in a Straight Line',
      'Motion in a Plane',
      'Laws of Motion',
      'Work, Energy and Power',
      'System of Particles and Rotational Motion',
      'Gravitation',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-11-physics-2-en',
    title: 'Physics Part-II',
    classLevel: 'Class 11',
    subject: 'Physics',
    medium: 'English',
    bookCode: 'keph2',
    order: 3,
    chapters: createChapters('keph2', [
      'Mechanical Properties of Solids',
      'Mechanical Properties of Fluids',
      'Thermal Properties of Matter',
      'Thermodynamics',
      'Kinetic Theory',
      'Oscillations',
      'Waves',
    ], 8),
  });

  addBook({
    sourceId: 'ncert-book-11-chemistry-1-en',
    title: 'Chemistry Part-I',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    medium: 'English',
    bookCode: 'kech1',
    order: 4,
    chapters: createChapters('kech1', [
      'Some Basic Concepts of Chemistry',
      'Structure of Atom',
      'Classification of Elements and Periodicity in Properties',
      'Chemical Bonding and Molecular Structure',
      'Thermodynamics',
      'Equilibrium',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-11-biology-en',
    title: 'Biology',
    classLevel: 'Class 11',
    subject: 'Biology',
    medium: 'English',
    bookCode: 'kebo1',
    order: 5,
    chapters: createChapters('kebo1', [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Animal Kingdom',
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Structural Organisation in Animals',
      'Cell: The Unit of Life',
      'Biomolecules',
      'Cell Cycle and Cell Division',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant Growth and Development',
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-11-english-hornbill-en',
    title: 'Hornbill (English Core)',
    classLevel: 'Class 11',
    subject: 'English',
    medium: 'English',
    bookCode: 'kehb1',
    order: 6,
    chapters: createChapters('kehb1', [
      'The Portrait of a Lady (Prose)',
      'A Photograph (Poem)',
      'We\'re Not Afraid to Die... (Prose)',
      'Discovering Tut: the Saga Continues (Prose)',
      'The Laburnum Top (Poem)',
      'The Voice of the Rain (Poem)',
      'Childhood (Poem)',
      'The Adventure (Prose)',
      'Silk Road (Prose)',
      'Father to Son (Poem)',
    ]),
  });

  // ============================================================
  // CLASS 10 — ENGLISH MEDIUM
  // ============================================================
  addBook({
    sourceId: 'ncert-book-10-math-en',
    title: 'Mathematics',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'jemh1',
    order: 1,
    chapters: createChapters('jemh1', [
      'Real Numbers',
      'Polynomials',
      'Pair of Linear Equations in Two Variables',
      'Quadratic Equations',
      'Arithmetic Progressions',
      'Triangles',
      'Coordinate Geometry',
      'Introduction to Trigonometry',
      'Some Applications of Trigonometry',
      'Circles',
      'Areas Related to Circles',
      'Surface Areas and Volumes',
      'Statistics',
      'Probability',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-science-en',
    title: 'Science',
    classLevel: 'Class 10',
    subject: 'Science',
    medium: 'English',
    bookCode: 'jesc1',
    order: 2,
    chapters: createChapters('jesc1', [
      'Chemical Reactions and Equations',
      'Acids, Bases and Salts',
      'Metals and Non-metals',
      'Carbon and its Compounds',
      'Life Processes',
      'Control and Coordination',
      'How do Organisms Reproduce?',
      'Heredity and Evolution',
      'Light – Reflection and Refraction',
      'The Human Eye and the Colourful World',
      'Electricity',
      'Magnetic Effects of Electric Current',
      'Our Environment',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-history-en',
    title: 'India and the Contemporary World-II (History)',
    classLevel: 'Class 10',
    subject: 'Social Science',
    medium: 'English',
    bookCode: 'jess1',
    order: 3,
    chapters: createChapters('jess1', [
      'The Rise of Nationalism in Europe',
      'Nationalism in India',
      'The Making of a Global World',
      'The Age of Industrialisation',
      'Print Culture and the Modern World',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-geography-en',
    title: 'Contemporary India-II (Geography)',
    classLevel: 'Class 10',
    subject: 'Social Science',
    medium: 'English',
    bookCode: 'jess2',
    order: 4,
    chapters: createChapters('jess2', [
      'Resources and Development',
      'Forest and Wildlife Resources',
      'Water Resources',
      'Agriculture',
      'Minerals and Energy Resources',
      'Manufacturing Industries',
      'Lifelines of National Economy',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-polscience-en',
    title: 'Democratic Politics-II (Political Science)',
    classLevel: 'Class 10',
    subject: 'Social Science',
    medium: 'English',
    bookCode: 'jess3',
    order: 5,
    chapters: createChapters('jess3', [
      'Power Sharing',
      'Federalism',
      'Gender, Religion and Caste',
      'Political Parties',
      'Outcomes of Democracy',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-economics-en',
    title: 'Understanding Economic Development (Economics)',
    classLevel: 'Class 10',
    subject: 'Social Science',
    medium: 'English',
    bookCode: 'jess4',
    order: 6,
    chapters: createChapters('jess4', [
      'Development',
      'Sectors of the Indian Economy',
      'Money and Credit',
      'Globalisation and the Indian Economy',
      'Consumer Rights',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-english-firstflight-en',
    title: 'First Flight (English Language & Literature)',
    classLevel: 'Class 10',
    subject: 'English',
    medium: 'English',
    bookCode: 'jeff1',
    order: 7,
    chapters: createChapters('jeff1', [
      'A Letter to God',
      'Nelson Mandela: Long Walk to Freedom',
      'Two Stories about Flying',
      'From the Diary of Anne Frank',
      'Glimpses of India',
      'Mijbil the Otter',
      'Madam Rides the Bus',
      'The Sermon at Benares',
      'The Proposal',
    ]),
  });

  // ============================================================
  // CLASS 10 — HINDI MEDIUM
  // ============================================================
  addBook({
    sourceId: 'ncert-book-10-ganit-hi',
    title: 'गणित (Ganit)',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    medium: 'Hindi',
    bookCode: 'jhmh1',
    order: 1,
    chapters: createChapters('jhmh1', [
      'वास्तविक संख्याएँ',
      'बहुपद',
      'दो चर वाले रैखिक समीकरण युग्म',
      'द्विघात समीकरण',
      'समांतर श्रेढ़ियाँ',
      'त्रिभुज',
      'निर्देशांक ज्यामिति',
      'त्रिकोणमिति का परिचय',
      'त्रिकोणमिति के कुछ अनुप्रयोग',
      'वृत्त',
      'वृत्तों से संबंधित क्षेत्रफल',
      'पृष्ठीय क्षेत्रफल और आयतन',
      'सांख्यिकी',
      'प्रायिकता',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-vigyan-hi',
    title: 'विज्ञान (Vigyan)',
    classLevel: 'Class 10',
    subject: 'Science',
    medium: 'Hindi',
    bookCode: 'jhsc1',
    order: 2,
    chapters: createChapters('jhsc1', [
      'रासायनिक अभिक्रियाएं एवं समीकरण',
      'अम्ल, क्षारक एवं लवण',
      'धातु एवं अधातु',
      'कार्बन एवं उसके यौगिक',
      'जैव प्रक्रम',
      'नियंत्रण एवं समन्वय',
      'जीव जनन कैसे करते हैं?',
      'आनुवंशिकता एवं जैव विकास',
      'प्रकाश – परावर्तन तथा अपवर्तन',
      'मानव नेत्र तथा रंगबिरंगा संसार',
      'विद्युत',
      'विद्युत धारा के चुंबकीय प्रभाव',
      'हमारा पर्यावरण',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-10-hindi-kshitij-hi',
    title: 'क्षितिज भाग-2 (Kshitij Hindi Course A)',
    classLevel: 'Class 10',
    subject: 'Hindi',
    medium: 'Hindi',
    bookCode: 'jhks1',
    order: 3,
    chapters: createChapters('jhks1', [
      'सूरदास के पद',
      'राम-लक्ष्मण-परशुराम संवाद (तुलसीदास)',
      'आत्मकथ्य (जयशंकर प्रसाद)',
      'उत्साह / अट नहीं रही है (सूर्यकांत त्रिपाठी निराला)',
      'यह दंतुरित मुसकान / फसल (नागार्जुन)',
      'संगतकार (मंगलेश डबराल)',
      'नेताजी का चश्मा (स्वयं प्रकाश)',
      'बालगोबिन भगत (रामवृक्ष बेनीपुरी)',
      'लखनवी अंदाज़ (यशपाल)',
      'एक कहानी यह भी (मन्नू भंडारी)',
      'नौबतखाने में इबादत (यतींद्र मिश्र)',
      'संस्कृति (भदंत आनंद कौसल्यायन)',
    ]),
  });

  // ============================================================
  // CLASS 9 — ENGLISH & HINDI
  // ============================================================
  addBook({
    sourceId: 'ncert-book-9-math-en',
    title: 'Mathematics',
    classLevel: 'Class 9',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'iemh1',
    order: 1,
    chapters: createChapters('iemh1', [
      'Number Systems',
      'Polynomials',
      'Coordinate Geometry',
      'Linear Equations in Two Variables',
      'Introduction to Euclid\'s Geometry',
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Circles',
      'Heron\'s Formula',
      'Surface Areas and Volumes',
      'Statistics',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-9-science-en',
    title: 'Science',
    classLevel: 'Class 9',
    subject: 'Science',
    medium: 'English',
    bookCode: 'iesc1',
    order: 2,
    chapters: createChapters('iesc1', [
      'Matter in Our Surroundings',
      'Is Matter Around Us Pure?',
      'Atoms and Molecules',
      'Structure of the Atom',
      'The Fundamental Unit of Life',
      'Tissues',
      'Motion',
      'Force and Laws of Motion',
      'Gravitation',
      'Work and Energy',
      'Sound',
      'Improvement in Food Resources',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-9-ganit-hi',
    title: 'गणित (Ganit)',
    classLevel: 'Class 9',
    subject: 'Mathematics',
    medium: 'Hindi',
    bookCode: 'ihmh1',
    order: 3,
    chapters: createChapters('ihmh1', [
      'संख्या पद्धति',
      'बहुपद',
      'निर्देशांक ज्यामिति',
      'दो चरों वाले रैखिक समीकरण',
      'यूक्लिड की ज्यामिति का परिचय',
      'रेखाएं और कोण',
      'त्रिभुज',
      'चतुर्भुज',
      'वृत्त',
      'हीरोन का सूत्र',
      'पृष्ठीय क्षेत्रफल और आयतन',
      'सांख्यिकी',
    ]),
  });

  // ============================================================
  // CLASSES 8, 7, 6, 5, 4, 3, 2, 1 (Core Foundation Books)
  // ============================================================
  addBook({
    sourceId: 'ncert-book-8-math-en',
    title: 'Mathematics',
    classLevel: 'Class 8',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'hemh1',
    order: 1,
    chapters: createChapters('hemh1', [
      'Rational Numbers',
      'Linear Equations in One Variable',
      'Understanding Quadrilaterals',
      'Data Handling',
      'Square and Square Roots',
      'Cube and Cube Roots',
      'Comparing Quantities',
      'Algebraic Expressions and Identities',
      'Mensuration',
      'Exponents and Powers',
      'Direct and Inverse Proportions',
      'Factorisation',
      'Introduction to Graphs',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-8-science-en',
    title: 'Science',
    classLevel: 'Class 8',
    subject: 'Science',
    medium: 'English',
    bookCode: 'hesc1',
    order: 2,
    chapters: createChapters('hesc1', [
      'Crop Production and Management',
      'Microorganisms: Friend and Foe',
      'Coal and Petroleum',
      'Combustion and Flame',
      'Conservation of Plants and Animals',
      'Reproduction in Animals',
      'Reaching the Age of Adolescence',
      'Force and Pressure',
      'Friction',
      'Sound',
      'Chemical Effects of Electric Current',
      'Some Natural Phenomena',
      'Light',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-7-math-en',
    title: 'Mathematics',
    classLevel: 'Class 7',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'gemh1',
    order: 1,
    chapters: createChapters('gemh1', [
      'Integers',
      'Fractions and Decimals',
      'Data Handling',
      'Simple Equations',
      'Lines and Angles',
      'The Triangle and its Properties',
      'Comparing Quantities',
      'Rational Numbers',
      'Perimeter and Area',
      'Algebraic Expressions',
      'Exponents and Powers',
      'Symmetry',
      'Visualising Solid Shapes',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-6-math-en',
    title: 'Mathematics',
    classLevel: 'Class 6',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'femh1',
    order: 1,
    chapters: createChapters('femh1', [
      'Knowing Our Numbers',
      'Whole Numbers',
      'Playing with Numbers',
      'Basic Geometrical Ideas',
      'Understanding Elementary Shapes',
      'Integers',
      'Fractions',
      'Decimals',
      'Data Handling',
      'Mensuration',
      'Algebra',
      'Ratio and Proportion',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-5-math-en',
    title: 'Math-Magic',
    classLevel: 'Class 5',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'eemh1',
    order: 1,
    chapters: createChapters('eemh1', [
      'The Fish Tale',
      'Shapes and Angles',
      'How Many Squares?',
      'Parts and Wholes',
      'Does it Look the Same?',
      'Be My Multiple, I\'ll be Your Factor',
      'Can You See the Pattern?',
      'Mapping Your Way',
      'Boxes and Sketches',
      'Tenths and Hundredths',
      'Area and its Boundary',
      'Smart Charts',
      'Ways to Multiply and Divide',
      'How Big? How Heavy?',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-4-math-en',
    title: 'Math-Magic',
    classLevel: 'Class 4',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'demh1',
    order: 1,
    chapters: createChapters('demh1', [
      'Building with Bricks',
      'Long and Short',
      'A Trip to Bhopal',
      'Tick-Tick-Tick',
      'The Way The World Looks',
      'The Junk Seller',
      'Jugs and Mugs',
      'Carts and Wheels',
      'Halves and Quarters',
      'Play with Patterns',
      'Tables and Shares',
      'How Heavy? How Light?',
      'Fields and Fences',
      'Smart Charts',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-3-math-en',
    title: 'Math-Magic',
    classLevel: 'Class 3',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'cemh1',
    order: 1,
    chapters: createChapters('cemh1', [
      'Where to Look From',
      'Fun with Numbers',
      'Give and Take',
      'Long and Short',
      'Shapes and Designs',
      'Fun with Give and Take',
      'Time Goes On',
      'Who is Heavier?',
      'How Many Times?',
      'Play with Patterns',
      'Jugs and Mugs',
      'Can We Share?',
      'Smart Charts',
      'Rupees and Paise',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-2-math-en',
    title: 'Joyful Mathematics',
    classLevel: 'Class 2',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'bemh1',
    order: 1,
    chapters: createChapters('bemh1', [
      'A Day at the Beach (Shapes and Spatial Understanding)',
      'Shapes Around Us',
      'Fun with Numbers (1 to 100)',
      'Shadow Story (Togethe / Counting)',
      'Playing with Lines',
      'Decoration for Festival',
      'Rani\'s Gift (Addition and Subtraction)',
      'Grouping and Sharing',
      'Which Season is It?',
      'Fun at the Fair (Money)',
      'Data Handling',
    ]),
  });

  addBook({
    sourceId: 'ncert-book-1-math-en',
    title: 'Joyful Mathematics',
    classLevel: 'Class 1',
    subject: 'Mathematics',
    medium: 'English',
    bookCode: 'aemh1',
    order: 1,
    chapters: createChapters('aemh1', [
      'Finding the Furry Cat! (Pre-number Concepts)',
      'What is Long? What is Round? (Shapes)',
      'Mango Treat (Numbers 1 to 9)',
      'Making 10 (Numbers 10 to 20)',
      'How Many? (Addition & Subtraction of single digits)',
      'Vegetable Farm (Addition & Subtraction up to 20)',
      'Lina\'s Family (Measurement)',
      'Fun with Numbers (Numbers 21 to 99)',
      'Utsav (Patterns)',
      'How do I Spend my Day? (Time)',
      'How Many Times? (Multiplication)',
      'How Much Can We Spend? (Money)',
      'So Many Toys (Data Handling)',
    ]),
  });

  // ============================================================
  // NCERT SOLUTIONS CATEGORY
  // ============================================================
  addBook({
    sourceId: 'ncert-sol-12-math-en',
    title: 'NCERT Class 12 Mathematics Step-by-Step Solutions',
    description: 'Comprehensive step-by-step solutions for NCERT Class 12 Mathematics exercises with diagrams, theorems, and formulas.',
    category: 'NCERT_SOLUTION',
    resourceType: 'SOLUTION',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    medium: 'English',
    officialUrl: 'https://ncert.nic.in/exemplar-problems.php',
    order: 1,
    chapters: [
      { unitNumber: 1, title: 'Chapter 1: Relations and Functions Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh101.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 2, title: 'Chapter 2: Inverse Trigonometric Functions Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh102.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 3, title: 'Chapter 3: Matrices Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh103.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 4, title: 'Chapter 4: Determinants Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh104.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 5, title: 'Chapter 5: Continuity and Differentiability Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh105.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 6, title: 'Chapter 6: Application of Derivatives Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh106.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 7, title: 'Chapter 7: Integrals Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh201.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 8, title: 'Chapter 8: Application of Integrals Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh202.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 9, title: 'Chapter 9: Differential Equations Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh203.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 10, title: 'Chapter 10: Vector Algebra Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh204.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 11, title: 'Chapter 11: 3D Geometry Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh205.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 12, title: 'Chapter 12: Linear Programming Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh206.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 13, title: 'Chapter 13: Probability Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/lemh207.pdf', contentType: 'PDF', isAvailable: true },
    ],
  });

  addBook({
    sourceId: 'ncert-sol-10-science-en',
    title: 'NCERT Class 10 Science Detailed Solutions',
    description: 'Detailed textbook question solutions, in-text answers, and key concept highlights for Class 10 Science.',
    category: 'NCERT_SOLUTION',
    resourceType: 'SOLUTION',
    classLevel: 'Class 10',
    subject: 'Science',
    medium: 'English',
    officialUrl: 'https://ncert.nic.in/exemplar-problems.php',
    order: 2,
    chapters: [
      { unitNumber: 1, title: 'Chemical Reactions and Equations Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc101.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 2, title: 'Acids, Bases and Salts Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc102.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 3, title: 'Metals and Non-metals Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc103.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 4, title: 'Carbon and its Compounds Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc104.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 5, title: 'Life Processes Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc105.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 6, title: 'Control and Coordination Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc106.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 7, title: 'How do Organisms Reproduce Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc107.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 8, title: 'Heredity Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc108.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 9, title: 'Light Reflection and Refraction Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc109.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 10, title: 'Electricity Solutions', openUrl: 'https://ncert.nic.in/textbook/pdf/jesc111.pdf', contentType: 'PDF', isAvailable: true },
    ],
  });

  // ============================================================
  // NCERT REVISION NOTES CATEGORY
  // ============================================================
  addBook({
    sourceId: 'ncert-notes-12-physics-en',
    title: 'Class 12 Physics Formula Book & Revision Notes',
    description: 'Quick chapter summaries, key derivation outlines, and essential formula sheets for CBSE Class 12 Physics.',
    category: 'NCERT_NOTE',
    resourceType: 'NOTES',
    classLevel: 'Class 12',
    subject: 'Physics',
    medium: 'English',
    officialUrl: 'https://ncert.nic.in/textbook.php',
    order: 1,
    chapters: [
      { unitNumber: 1, title: 'Electrostatics & Current Electricity Summary', openUrl: 'https://ncert.nic.in/textbook/pdf/leph101.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 2, title: 'Magnetism & Electromagnetic Induction Notes', openUrl: 'https://ncert.nic.in/textbook/pdf/leph104.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 3, title: 'Optics & Wave Theory Formula Sheet', openUrl: 'https://ncert.nic.in/textbook/pdf/leph201.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 4, title: 'Modern Physics & Semiconductors Rapid Revision', openUrl: 'https://ncert.nic.in/textbook/pdf/leph203.pdf', contentType: 'PDF', isAvailable: true },
    ],
  });

  addBook({
    sourceId: 'ncert-notes-10-math-en',
    title: 'Class 10 Mathematics Complete Formula Sheet',
    description: 'Comprehensive theorem summaries, algebraic identities, and trigonometric ratios for board preparation.',
    category: 'NCERT_NOTE',
    resourceType: 'NOTES',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    medium: 'English',
    officialUrl: 'https://ncert.nic.in/textbook.php',
    order: 2,
    chapters: [
      { unitNumber: 1, title: 'Algebra & Number Systems Quick Formulas', openUrl: 'https://ncert.nic.in/textbook/pdf/jemh101.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 2, title: 'Trigonometry & Heights and Distances Cheat Sheet', openUrl: 'https://ncert.nic.in/textbook/pdf/jemh108.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 3, title: 'Coordinate Geometry & Mensuration Formulas', openUrl: 'https://ncert.nic.in/textbook/pdf/jemh107.pdf', contentType: 'PDF', isAvailable: true },
      { unitNumber: 4, title: 'Statistics & Probability Summary', openUrl: 'https://ncert.nic.in/textbook/pdf/jemh113.pdf', contentType: 'PDF', isAvailable: true },
    ],
  });

  // ============================================================
  // CBSE PAPERS CATEGORY
  // ============================================================
  addBook({
    sourceId: 'cbse-papers-12-science-en',
    title: 'CBSE Class 12 Official Board Sample Question Papers & Marking Scheme',
    description: 'Official CBSE board examination sample question papers, marking schemes, and exemplar assessment resources.',
    category: 'CBSE_PAPER',
    resourceType: 'QUESTION_PAPER',
    classLevel: 'Class 12',
    subject: 'Science',
    medium: 'English',
    officialUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html',
    order: 1,
    chapters: [
      { unitNumber: 1, title: 'Class 12 Mathematics Official Sample Question Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 2, title: 'Class 12 Physics Official Sample Question Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 3, title: 'Class 12 Chemistry Official Sample Question Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 4, title: 'Class 12 Biology Official Sample Question Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 5, title: 'Class 12 English Core Official Sample Question Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
    ],
  });

  addBook({
    sourceId: 'cbse-papers-10-board-en',
    title: 'CBSE Class 10 Official Board Sample Papers & Solutions',
    description: 'Latest CBSE Class 10 board examination question patterns and official marking guidelines.',
    category: 'CBSE_PAPER',
    resourceType: 'QUESTION_PAPER',
    classLevel: 'Class 10',
    subject: 'All Subjects',
    medium: 'English',
    officialUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html',
    order: 2,
    chapters: [
      { unitNumber: 1, title: 'Class 10 Mathematics Standard Sample Paper & Marking Scheme', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 2, title: 'Class 10 Science Sample Paper & Marking Scheme', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 3, title: 'Class 10 Social Science Sample Paper & Marking Scheme', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 4, title: 'Class 10 English Language & Literature Sample Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
      { unitNumber: 5, title: 'Class 10 Hindi Course A Sample Paper', openUrl: 'https://cbseacademic.nic.in/SQP_CLASSX.html', contentType: 'ONLINE_VIEWER', isAvailable: true },
    ],
  });

  return list;
};

module.exports = {
  getResources,
};
