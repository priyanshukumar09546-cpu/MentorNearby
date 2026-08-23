// ============================================================
// seeds/studyResourcesSeed.js
// Seed catalog for Classes 9, 10, 11, 12
// Formula Sheets Combo (₹119 / ₹149 / ₹150)
// Important Q&A Combo (₹249 / ₹349 / ₹429)
// Unit 1 Formula Sheet + Q&A are FREE DEMO (₹0)
// Unit 2+ Formula Sheets (₹19) & Important Q&A (₹29)
// ============================================================

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');

const CATALOG_DATA = [
  // ==================== CLASS 9 ====================
  {
    classLevel: '9',
    subject: 'Science',
    formulaComboPrice: 50,
    qaComboPrice: 100,
    chapters: [
      { num: 1, unit: 'Unit 1: Matter', title: 'Matter in Our Surroundings' },
      { num: 2, unit: 'Unit 1: Matter', title: 'Is Matter Around Us Pure' },
      { num: 3, unit: 'Unit 1: Matter', title: 'Atoms and Molecules' },
      { num: 4, unit: 'Unit 1: Matter', title: 'Structure of the Atom' },
      { num: 5, unit: 'Unit 2: Organization in Living World', title: 'The Fundamental Unit of Life' },
      { num: 6, unit: 'Unit 2: Organization in Living World', title: 'Tissues' },
      { num: 7, unit: 'Unit 3: Motion, Force & Work', title: 'Motion' },
      { num: 8, unit: 'Unit 3: Motion, Force & Work', title: 'Force and Laws of Motion' },
      { num: 9, unit: 'Unit 3: Motion, Force & Work', title: 'Gravitation' },
      { num: 10, unit: 'Unit 3: Motion, Force & Work', title: 'Work and Energy' },
      { num: 11, unit: 'Unit 3: Motion, Force & Work', title: 'Sound' },
      { num: 12, unit: 'Unit 4: Food Production', title: 'Improvement in Food Resources' },
    ],
  },
  {
    classLevel: '9',
    subject: 'Mathematics',
    formulaComboPrice: 50,
    qaComboPrice: 100,
    chapters: [
      { num: 1, unit: 'Unit 1: Number Systems', title: 'Number Systems' },
      { num: 2, unit: 'Unit 2: Algebra', title: 'Polynomials' },
      { num: 3, unit: 'Unit 3: Coordinate Geometry', title: 'Coordinate Geometry' },
      { num: 4, unit: 'Unit 2: Algebra', title: 'Linear Equations in Two Variables' },
      { num: 5, unit: 'Unit 4: Geometry', title: 'Lines and Angles' },
      { num: 6, unit: 'Unit 4: Geometry', title: 'Triangles' },
      { num: 7, unit: 'Unit 4: Geometry', title: 'Quadrilaterals' },
      { num: 8, unit: 'Unit 4: Geometry', title: 'Circles' },
      { num: 9, unit: 'Unit 5: Mensuration', title: "Heron's Formula" },
      { num: 10, unit: 'Unit 5: Mensuration', title: 'Surface Areas and Volumes' },
      { num: 11, unit: 'Unit 6: Statistics', title: 'Statistics' },
    ],
  },

  // ==================== CLASS 10 ====================
  {
    classLevel: '10',
    subject: 'Science',
    formulaComboPrice: 50,
    qaComboPrice: 100,
    chapters: [
      { num: 1, unit: 'Unit 1: Chemical Substances', title: 'Chemical Reactions and Equations' },
      { num: 2, unit: 'Unit 1: Chemical Substances', title: 'Acids, Bases and Salts' },
      { num: 3, unit: 'Unit 1: Chemical Substances', title: 'Metals and Non-metals' },
      { num: 4, unit: 'Unit 1: Chemical Substances', title: 'Carbon and its Compounds' },
      { num: 5, unit: 'Unit 2: World of Living', title: 'Life Processes' },
      { num: 6, unit: 'Unit 2: World of Living', title: 'Control and Coordination' },
      { num: 7, unit: 'Unit 2: World of Living', title: 'How do Organisms Reproduce?' },
      { num: 8, unit: 'Unit 2: World of Living', title: 'Heredity' },
      { num: 9, unit: 'Unit 3: Natural Phenomena', title: 'Light – Reflection and Refraction' },
      { num: 10, unit: 'Unit 3: Natural Phenomena', title: 'The Human Eye and the Colourful World' },
      { num: 11, unit: 'Unit 4: Effects of Current', title: 'Electricity' },
      { num: 12, unit: 'Unit 4: Effects of Current', title: 'Magnetic Effects of Electric Current' },
      { num: 13, unit: 'Unit 5: Natural Resources', title: 'Our Environment' },
    ],
  },
  {
    classLevel: '10',
    subject: 'Mathematics',
    formulaComboPrice: 50,
    qaComboPrice: 100,
    chapters: [
      { num: 1, unit: 'Unit 1: Number Systems', title: 'Real Numbers' },
      { num: 2, unit: 'Unit 2: Algebra', title: 'Polynomials' },
      { num: 3, unit: 'Unit 2: Algebra', title: 'Pair of Linear Equations in Two Variables' },
      { num: 4, unit: 'Unit 2: Algebra', title: 'Quadratic Equations' },
      { num: 5, unit: 'Unit 2: Algebra', title: 'Arithmetic Progressions' },
      { num: 6, unit: 'Unit 4: Geometry', title: 'Triangles' },
      { num: 7, unit: 'Unit 3: Coordinate Geometry', title: 'Coordinate Geometry' },
      { num: 8, unit: 'Unit 5: Trigonometry', title: 'Introduction to Trigonometry' },
      { num: 9, unit: 'Unit 5: Trigonometry', title: 'Some Applications of Trigonometry' },
      { num: 10, unit: 'Unit 4: Geometry', title: 'Circles' },
      { num: 11, unit: 'Unit 6: Mensuration', title: 'Areas Related to Circles' },
      { num: 12, unit: 'Unit 6: Mensuration', title: 'Surface Areas and Volumes' },
      { num: 13, unit: 'Unit 7: Statistics & Probability', title: 'Statistics' },
      { num: 14, unit: 'Unit 7: Statistics & Probability', title: 'Probability' },
    ],
  },

  // ==================== CLASS 11 ====================
  {
    classLevel: '11',
    subject: 'Physics',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Units and Measurements', title: 'Units and Measurements' },
      { num: 2, unit: 'Unit 2: Kinematics', title: 'Motion in a Straight Line' },
      { num: 3, unit: 'Unit 2: Kinematics', title: 'Motion in a Plane' },
      { num: 4, unit: 'Unit 3: Laws of Motion', title: 'Laws of Motion' },
      { num: 5, unit: 'Unit 4: Work, Energy & Power', title: 'Work, Energy and Power' },
      { num: 6, unit: 'Unit 5: Rotational Motion', title: 'System of Particles and Rotational Motion' },
      { num: 7, unit: 'Unit 6: Gravitation', title: 'Gravitation' },
      { num: 8, unit: 'Unit 7: Properties of Matter', title: 'Mechanical Properties of Solids' },
      { num: 9, unit: 'Unit 7: Properties of Matter', title: 'Mechanical Properties of Fluids' },
      { num: 10, unit: 'Unit 7: Thermal Physics', title: 'Thermal Properties of Matter' },
      { num: 11, unit: 'Unit 8: Thermodynamics', title: 'Thermodynamics' },
      { num: 12, unit: 'Unit 9: Kinetic Theory', title: 'Kinetic Theory of Gases' },
      { num: 13, unit: 'Unit 10: Oscillations & Waves', title: 'Oscillations' },
      { num: 14, unit: 'Unit 10: Oscillations & Waves', title: 'Waves' },
    ],
  },
  {
    classLevel: '11',
    subject: 'Chemistry',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Basic Concepts', title: 'Some Basic Concepts of Chemistry' },
      { num: 2, unit: 'Unit 2: Structure of Atom', title: 'Structure of Atom' },
      { num: 3, unit: 'Unit 3: Classification of Elements', title: 'Classification of Elements and Periodicity in Properties' },
      { num: 4, unit: 'Unit 4: Chemical Bonding', title: 'Chemical Bonding and Molecular Structure' },
      { num: 5, unit: 'Unit 5: Thermodynamics', title: 'Chemical Thermodynamics' },
      { num: 6, unit: 'Unit 6: Equilibrium', title: 'Equilibrium' },
      { num: 7, unit: 'Unit 7: Redox Reactions', title: 'Redox Reactions' },
      { num: 8, unit: 'Unit 8: Organic Chemistry', title: 'Organic Chemistry: Basic Principles and Techniques' },
      { num: 9, unit: 'Unit 9: Hydrocarbons', title: 'Hydrocarbons' },
    ],
  },
  {
    classLevel: '11',
    subject: 'Mathematics',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Sets and Functions', title: 'Sets' },
      { num: 2, unit: 'Unit 1: Sets and Functions', title: 'Relations and Functions' },
      { num: 3, unit: 'Unit 1: Sets and Functions', title: 'Trigonometric Functions' },
      { num: 4, unit: 'Unit 2: Algebra', title: 'Complex Numbers and Quadratic Equations' },
      { num: 5, unit: 'Unit 2: Algebra', title: 'Linear Inequalities' },
      { num: 6, unit: 'Unit 2: Algebra', title: 'Permutations and Combinations' },
      { num: 7, unit: 'Unit 2: Algebra', title: 'Binomial Theorem' },
      { num: 8, unit: 'Unit 2: Algebra', title: 'Sequences and Series' },
      { num: 9, unit: 'Unit 3: Coordinate Geometry', title: 'Straight Lines' },
      { num: 10, unit: 'Unit 3: Coordinate Geometry', title: 'Conic Sections' },
      { num: 11, unit: 'Unit 3: Coordinate Geometry', title: 'Introduction to Three Dimensional Geometry' },
      { num: 12, unit: 'Unit 4: Calculus', title: 'Limits and Derivatives' },
      { num: 13, unit: 'Unit 5: Statistics & Probability', title: 'Statistics' },
      { num: 14, unit: 'Unit 5: Statistics & Probability', title: 'Probability' },
    ],
  },
  {
    classLevel: '11',
    subject: 'Biology',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Diversity in Living World', title: 'The Living World' },
      { num: 2, unit: 'Unit 1: Diversity in Living World', title: 'Biological Classification' },
      { num: 3, unit: 'Unit 1: Diversity in Living World', title: 'Plant Kingdom' },
      { num: 4, unit: 'Unit 1: Diversity in Living World', title: 'Animal Kingdom' },
      { num: 5, unit: 'Unit 2: Structural Organisation', title: 'Morphology of Flowering Plants' },
      { num: 6, unit: 'Unit 2: Structural Organisation', title: 'Anatomy of Flowering Plants' },
      { num: 7, unit: 'Unit 2: Structural Organisation', title: 'Structural Organisation in Animals' },
      { num: 8, unit: 'Unit 3: Cell: Structure & Functions', title: 'Cell: The Unit of Life' },
      { num: 9, unit: 'Unit 3: Cell: Structure & Functions', title: 'Biomolecules' },
      { num: 10, unit: 'Unit 3: Cell: Structure & Functions', title: 'Cell Cycle and Cell Division' },
      { num: 11, unit: 'Unit 4: Plant Physiology', title: 'Photosynthesis in Higher Plants' },
      { num: 12, unit: 'Unit 4: Plant Physiology', title: 'Respiration in Plants' },
      { num: 13, unit: 'Unit 4: Plant Physiology', title: 'Plant Growth and Development' },
      { num: 14, unit: 'Unit 5: Human Physiology', title: 'Breathing and Exchange of Gases' },
      { num: 15, unit: 'Unit 5: Human Physiology', title: 'Body Fluids and Circulation' },
      { num: 16, unit: 'Unit 5: Human Physiology', title: 'Excretory Products and their Elimination' },
      { num: 17, unit: 'Unit 5: Human Physiology', title: 'Locomotion and Movement' },
      { num: 18, unit: 'Unit 5: Human Physiology', title: 'Neural Control and Coordination' },
      { num: 19, unit: 'Unit 5: Human Physiology', title: 'Chemical Coordination and Integration' },
    ],
  },

  // ==================== CLASS 12 ====================
  {
    classLevel: '12',
    subject: 'Physics',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Electrostatics', title: 'Electric Charges and Fields' },
      { num: 2, unit: 'Unit 1: Electrostatics', title: 'Electrostatic Potential and Capacitance' },
      { num: 3, unit: 'Unit 2: Current Electricity', title: 'Current Electricity' },
      { num: 4, unit: 'Unit 3: Magnetic Effects', title: 'Moving Charges and Magnetism' },
      { num: 5, unit: 'Unit 3: Magnetic Effects', title: 'Magnetism and Matter' },
      { num: 6, unit: 'Unit 4: Electromagnetic Induction', title: 'Electromagnetic Induction' },
      { num: 7, unit: 'Unit 4: Alternating Current', title: 'Alternating Current' },
      { num: 8, unit: 'Unit 5: Electromagnetic Waves', title: 'Electromagnetic Waves' },
      { num: 9, unit: 'Unit 6: Optics', title: 'Ray Optics and Optical Instruments' },
      { num: 10, unit: 'Unit 6: Optics', title: 'Wave Optics' },
      { num: 11, unit: 'Unit 7: Dual Nature', title: 'Dual Nature of Radiation and Matter' },
      { num: 12, unit: 'Unit 8: Atoms & Nuclei', title: 'Atoms' },
      { num: 13, unit: 'Unit 8: Atoms & Nuclei', title: 'Nuclei' },
      { num: 14, unit: 'Unit 9: Electronic Devices', title: 'Semiconductor Electronics: Materials, Devices and Simple Circuits' },
    ],
  },
  {
    classLevel: '12',
    subject: 'Chemistry',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Solutions', title: 'Solutions' },
      { num: 2, unit: 'Unit 2: Electrochemistry', title: 'Electrochemistry' },
      { num: 3, unit: 'Unit 3: Chemical Kinetics', title: 'Chemical Kinetics' },
      { num: 4, unit: 'Unit 4: d and f Block Elements', title: 'The d-and f-Block Elements' },
      { num: 5, unit: 'Unit 5: Coordination Compounds', title: 'Coordination Compounds' },
      { num: 6, unit: 'Unit 6: Haloalkanes and Haloarenes', title: 'Haloalkanes and Haloarenes' },
      { num: 7, unit: 'Unit 7: Alcohols, Phenols and Ethers', title: 'Alcohols, Phenols and Ethers' },
      { num: 8, unit: 'Unit 8: Aldehydes, Ketones & Carboxylic Acids', title: 'Aldehydes, Ketones and Carboxylic Acids' },
      { num: 9, unit: 'Unit 9: Amines', title: 'Amines' },
      { num: 10, unit: 'Unit 10: Biomolecules', title: 'Biomolecules' },
    ],
  },
  {
    classLevel: '12',
    subject: 'Mathematics',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Relations and Functions', title: 'Relations and Functions' },
      { num: 2, unit: 'Unit 1: Inverse Trigonometric Functions', title: 'Inverse Trigonometric Functions' },
      { num: 3, unit: 'Unit 2: Algebra', title: 'Matrices' },
      { num: 4, unit: 'Unit 2: Algebra', title: 'Determinants' },
      { num: 5, unit: 'Unit 3: Calculus', title: 'Continuity and Differentiability' },
      { num: 6, unit: 'Unit 3: Calculus', title: 'Application of Derivatives' },
      { num: 7, unit: 'Unit 3: Calculus', title: 'Integrals' },
      { num: 8, unit: 'Unit 3: Calculus', title: 'Application of Integrals' },
      { num: 9, unit: 'Unit 3: Calculus', title: 'Differential Equations' },
      { num: 10, unit: 'Unit 4: Vectors and 3D Geometry', title: 'Vector Algebra' },
      { num: 11, unit: 'Unit 4: Vectors and 3D Geometry', title: 'Three Dimensional Geometry' },
      { num: 12, unit: 'Unit 5: Linear Programming', title: 'Linear Programming' },
      { num: 13, unit: 'Unit 6: Probability', title: 'Probability' },
    ],
  },
  {
    classLevel: '12',
    subject: 'Biology',
    formulaComboPrice: 60,
    qaComboPrice: 120,
    chapters: [
      { num: 1, unit: 'Unit 1: Reproduction', title: 'Sexual Reproduction in Flowering Plants' },
      { num: 2, unit: 'Unit 1: Reproduction', title: 'Human Reproduction' },
      { num: 3, unit: 'Unit 1: Reproduction', title: 'Reproductive Health' },
      { num: 4, unit: 'Unit 2: Genetics and Evolution', title: 'Principles of Inheritance and Variation' },
      { num: 5, unit: 'Unit 2: Genetics and Evolution', title: 'Molecular Basis of Inheritance' },
      { num: 6, unit: 'Unit 2: Genetics and Evolution', title: 'Evolution' },
      { num: 7, unit: 'Unit 3: Biology in Human Welfare', title: 'Human Health and Disease' },
      { num: 8, unit: 'Unit 3: Biology in Human Welfare', title: 'Microbes in Human Welfare' },
      { num: 9, unit: 'Unit 4: Biotechnology', title: 'Biotechnology: Principles and Processes' },
      { num: 10, unit: 'Unit 4: Biotechnology', title: 'Biotechnology and its Applications' },
      { num: 11, unit: 'Unit 5: Ecology and Environment', title: 'Organisms and Populations' },
      { num: 12, unit: 'Unit 5: Ecology and Environment', title: 'Ecosystem' },
      { num: 13, unit: 'Unit 5: Ecology and Environment', title: 'Biodiversity and Conservation' },
    ],
  },
];

async function seedStudyResources() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in environment');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Drop indexes on StudyResourceBundle if any old unique indexes exist
    try {
      await StudyResourceBundle.collection.dropIndexes();
      console.log('Reset indexes on StudyResourceBundle collection.');
    } catch (idxErr) {
      console.log('Index reset notice:', idxErr.message);
    }

    console.log('Clearing existing study resources & bundles...');
    await StudyResource.deleteMany({});
    await StudyResourceBundle.deleteMany({});

    let totalResourcesCreated = 0;
    let totalBundlesCreated = 0;

    // ==========================================
    // SEED PRINT PROVIDERS
    // ==========================================
    const PrintProvider = require('../models/PrintProvider');
    await PrintProvider.deleteMany({});
    await PrintProvider.insertMany([
      {
        name: 'Blinkit Print',
        code: 'BLINKIT',
        tagline: '⚡ Delivered in 10-15 minutes',
        description: 'Instant document & notes printing with superfast doorstep delivery across Delhi NCR, Bengaluru, Mumbai, and all major cities.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838895.png',
        externalUrl: 'https://blinkit.com/prn',
        type: 'EXTERNAL_QUICK_COMMERCE',
        enabled: true,
        priority: 1,
        badge: '⚡ 10-Min Delivery',
      },
      {
        name: 'Zepto Print',
        code: 'ZEPTO',
        tagline: '🛵 Instant printing & doorstep delivery',
        description: 'Convenient high-quality color or black & white printouts delivered in minutes directly to your home or library.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png',
        externalUrl: 'https://www.zeptonow.com',
        type: 'EXTERNAL_QUICK_COMMERCE',
        enabled: true,
        priority: 2,
        badge: '🛵 Quick Delivery',
      },
    ]);
    console.log('✅ Seeded Print Providers (Blinkit & Zepto)');

    for (const item of CATALOG_DATA) {
      // 1. Create Formula Sheets Combo
      await StudyResourceBundle.create({
        title: `Class ${item.classLevel} ${item.subject} Formula Sheets Combo`,
        description: `Get all Chapter Formula Sheets from Chapter 1 to Chapter ${item.chapters.length} for Class ${item.classLevel} ${item.subject}. Free to read online; lifetime PDF downloads included.`,
        classLevel: item.classLevel,
        subject: item.subject,
        comboType: 'FORMULA_COMBO',
        resourceType: 'FORMULA_SHEET',
        price: item.formulaComboPrice,
        published: true,
      });
      totalBundlesCreated++;

      // 2. Create Important Questions + Answers Combo
      await StudyResourceBundle.create({
        title: `Class ${item.classLevel} ${item.subject} Important Questions + Answers Combo`,
        description: `Get all Important Questions + Answers from Chapter 1 to Chapter ${item.chapters.length} for Class ${item.classLevel} ${item.subject}. Free to read online; lifetime PDF downloads included.`,
        classLevel: item.classLevel,
        subject: item.subject,
        comboType: 'QA_COMBO',
        resourceType: 'IMPORTANT_QUESTIONS_ANSWERS',
        price: item.qaComboPrice,
        published: true,
      });
      totalBundlesCreated++;

      // 3. Create Individual Study Resources (Free to Read Online, Paid to Download)
      for (const ch of item.chapters) {
        const isFreeDemo = ch.num <= 2;
        const isSenior = item.classLevel === '11' || item.classLevel === '12';
        const formulaSinglePrice = isSenior ? 8 : 7;
        const notesSinglePrice = isSenior ? 14 : 12;

        // A) Formula Sheet (Free to read, Paid download: ₹7 for 9/10, ₹8 for 11/12)
        await StudyResource.create({
          title: `Chapter ${ch.num} Formula Sheet — ${ch.title}`,
          description: `Exam-ready master formula sheet with all definitions, standard equations, SI units, and key derivations for ${ch.title}.`,
          classLevel: item.classLevel,
          subject: item.subject,
          chapter: `Chapter ${ch.num}`,
          unit: ch.unit,
          chapterNumber: ch.num,
          chapterTitle: ch.title,
          resourceType: 'FORMULA_SHEET',
          isFreeDemo: isFreeDemo,
          readingEnabled: true,
          downloadEnabled: true,
          originalPrice: 49,
          downloadPrice: formulaSinglePrice,
          salePrice: formulaSinglePrice,
          published: true,
          order: 1,
          fileReference: {
            url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
            filename: `Class_${item.classLevel}_${item.subject}_Ch${ch.num}_Formula_Sheet.pdf`,
          },
        });
        totalResourcesCreated++;

        // B) Notes / PPT (Free to read, Paid download: ₹12 for 9/10, ₹14 for 11/12)
        await StudyResource.create({
          title: `Chapter ${ch.num} Notes & PPT — ${ch.title}`,
          description: `Curated high-frequency exam questions, presentation notes, CBSE marking-scheme solutions, and short/long answer models for ${ch.title}.`,
          classLevel: item.classLevel,
          subject: item.subject,
          chapter: `Chapter ${ch.num}`,
          unit: ch.unit,
          chapterNumber: ch.num,
          chapterTitle: ch.title,
          resourceType: 'IMPORTANT_QUESTIONS_ANSWERS',
          isFreeDemo: isFreeDemo,
          readingEnabled: true,
          downloadEnabled: true,
          originalPrice: 79,
          downloadPrice: notesSinglePrice,
          salePrice: notesSinglePrice,
          published: true,
          order: 2,
          fileReference: {
            url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
            filename: `Class_${item.classLevel}_${item.subject}_Ch${ch.num}_Notes_PPT.pdf`,
          },
        });
        totalResourcesCreated++;
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ SEED COMPLETED SUCCESSFULLY!`);
    console.log(`📦 Created ${totalBundlesCreated} Combo Bundles (12 Formula Combos + 12 QA Combos)`);
    console.log(`📄 Created ${totalResourcesCreated} Individual Study Resources (Free to Read Online, Paid to Download)`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedStudyResources();
