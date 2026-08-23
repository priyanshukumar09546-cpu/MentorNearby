// ============================================================
// seeders/seedStudyBooks.js
// Production Seeder for MentorNearby Free Study Resources & Books Portal
// Comprehensive Coverage for Classes 9, 10, 11, 12 across CBSE, ICSE,
// UP Board (English Medium) & UP Board (Hindi Medium)
// 100% FREE Online Reading & 100% FREE Downloads
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

const seedStudyBooks = async () => {
  try {
    console.log('========================================================');
    console.log('MENTORNEARBY: SEEDING 100% FREE STUDY RESOURCES & BOOKS');
    console.log('========================================================\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Update existing resources with board: CBSE, medium: English where undefined
    const updateResult = await StudyResource.updateMany(
      { board: { $exists: false } },
      { $set: { board: 'CBSE', medium: 'English' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} existing resources with default board/medium.\n`);

    // Complete Board Books & Textbooks Collection Definitions
    const boardBooks = [
      // -------------------------------------------------------------
      // 1. CBSE NCERT TEXTBOOKS & PYQS
      // -------------------------------------------------------------
      {
        title: 'NCERT Book — Class 10 Mathematics',
        classLevel: '10',
        subject: 'Mathematics',
        board: 'CBSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 15,
        description: 'Complete NCERT Class 10 Mathematics textbook covering Real Numbers, Polynomials, Linear Equations, Triangles, Trigonometry, Statistics & Probability.',
        chapterTitle: 'Complete NCERT Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class10_Maths_NCERT_Book.pdf',
        fileName: 'CBSE_Class10_Mathematics_NCERT_Book.pdf',
      },
      {
        title: 'NCERT Book — Class 10 Science',
        classLevel: '10',
        subject: 'Science',
        board: 'CBSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 16,
        description: 'Official NCERT Class 10 Science book covering Chemical Reactions, Acids Bases & Salts, Life Processes, Light, Electricity & Magnetic Effects.',
        chapterTitle: 'Complete NCERT Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class10_Science_NCERT_Book.pdf',
        fileName: 'CBSE_Class10_Science_NCERT_Book.pdf',
      },
      {
        title: 'NCERT Book — Class 12 Biology',
        classLevel: '12',
        subject: 'Biology',
        board: 'CBSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 16,
        description: 'Official NCERT Class 12 Biology textbook covering Reproduction, Genetics & Evolution, Biotechnology, Ecology & Environment.',
        chapterTitle: 'Complete NCERT Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class12_Biology_NCERT_Book.pdf',
        fileName: 'CBSE_Class12_Biology_NCERT_Book.pdf',
      },
      {
        title: 'NCERT Book — Class 12 Physics',
        classLevel: '12',
        subject: 'Physics',
        board: 'CBSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 14,
        description: 'Complete NCERT Class 12 Physics textbook with detailed diagrams and formulas for Electrostatics, Magnetism, Wave Optics, and Modern Physics.',
        chapterTitle: 'Complete NCERT Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class12_Physics_NCERT_Book.pdf',
        fileName: 'CBSE_Class12_Physics_NCERT_Book.pdf',
      },
      {
        title: 'NCERT Book — Class 9 Mathematics',
        classLevel: '9',
        subject: 'Mathematics',
        board: 'CBSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 12,
        description: 'Official NCERT Class 9 Mathematics textbook covering Number Systems, Polynomials, Coordinate Geometry, Lines & Angles, Triangles, Quadrilaterals.',
        chapterTitle: 'Complete NCERT Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class9_Maths_NCERT_Book.pdf',
        fileName: 'CBSE_Class9_Mathematics_NCERT_Book.pdf',
      },
      {
        title: '10 Years PYQ Papers — Class 10 Mathematics',
        classLevel: '10',
        subject: 'Mathematics',
        board: 'CBSE',
        medium: 'English',
        category: 'PYQ',
        resourceType: 'PYQ_PAPERS',
        chaptersCount: 10,
        description: '10 Years of CBSE Class 10 Mathematics solved board question papers with official marking scheme breakdown.',
        chapterTitle: '10 Years Solved Papers',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class10_Maths_10Yr_PYQ.pdf',
        fileName: 'CBSE_Class10_Maths_10Yr_PYQ.pdf',
      },
      {
        title: '10 Years PYQ Papers — Class 12 Physics',
        classLevel: '12',
        subject: 'Physics',
        board: 'CBSE',
        medium: 'English',
        category: 'PYQ',
        resourceType: 'PYQ_PAPERS',
        chaptersCount: 10,
        description: '10 Years of CBSE Class 12 Physics solved board question papers with 5-mark derivations and numerical solutions.',
        chapterTitle: '10 Years Solved Papers',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/CBSE_Class12_Physics_10Yr_PYQ.pdf',
        fileName: 'CBSE_Class12_Physics_10Yr_PYQ.pdf',
      },

      // -------------------------------------------------------------
      // 2. ICSE BOOKS & RESOURCES
      // -------------------------------------------------------------
      {
        title: 'ICSE Book — Class 9 Physics',
        classLevel: '9',
        subject: 'Physics',
        board: 'ICSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 15,
        description: 'Comprehensive ICSE Class 9 Physics textbook covering Measurements, Motion in One Dimension, Laws of Motion, Fluids, Heat & Light.',
        chapterTitle: 'Complete ICSE Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/ICSE_Class9_Physics_Book.pdf',
        fileName: 'ICSE_Class9_Physics_Book.pdf',
      },
      {
        title: 'ICSE Book — Class 9 Chemistry',
        classLevel: '9',
        subject: 'Chemistry',
        board: 'ICSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 14,
        description: 'Official ICSE Class 9 Chemistry textbook covering Language of Chemistry, Chemical Changes, Water, Atomic Structure, and Periodic Table.',
        chapterTitle: 'Complete ICSE Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/ICSE_Class9_Chemistry_Book.pdf',
        fileName: 'ICSE_Class9_Chemistry_Book.pdf',
      },
      {
        title: 'ICSE Book — Class 10 Mathematics',
        classLevel: '10',
        subject: 'Mathematics',
        board: 'ICSE',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 18,
        description: 'Complete ICSE Class 10 Mathematics textbook covering Commercial Mathematics, Algebra, Geometry, Mensuration, Trigonometry, and Statistics.',
        chapterTitle: 'Complete ICSE Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/ICSE_Class10_Mathematics_Book.pdf',
        fileName: 'ICSE_Class10_Mathematics_Book.pdf',
      },
      {
        title: '10 Years PYQ Papers — Class 10 ICSE Physics',
        classLevel: '10',
        subject: 'Physics',
        board: 'ICSE',
        medium: 'English',
        category: 'PYQ',
        resourceType: 'PYQ_PAPERS',
        chaptersCount: 10,
        description: '10 Years of ICSE Class 10 Physics board papers with complete solutions, ray diagrams, and numerical proofs.',
        chapterTitle: '10 Years Solved Papers',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/ICSE_Class10_Physics_10Yr_PYQ.pdf',
        fileName: 'ICSE_Class10_Physics_10Yr_PYQ.pdf',
      },

      // -------------------------------------------------------------
      // 3. UP BOARD (ENGLISH MEDIUM)
      // -------------------------------------------------------------
      {
        title: 'UP Board Book — Class 11 Chemistry (English Medium)',
        classLevel: '11',
        subject: 'Chemistry',
        board: 'UP_BOARD_ENGLISH',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 20,
        description: 'Official UP Board Class 11 Chemistry textbook (English Medium) covering Physical, Inorganic and Organic chemistry principles.',
        chapterTitle: 'Complete Board Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_EM_Class11_Chemistry.pdf',
        fileName: 'UPBoard_EM_Class11_Chemistry_Book.pdf',
      },
      {
        title: 'UP Board Book — Class 10 English (English Medium)',
        classLevel: '10',
        subject: 'English',
        board: 'UP_BOARD_ENGLISH',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 18,
        description: 'UP Board Class 10 English textbook covering Prose, Poetry, Supplementary Reader, Grammar, and Composition.',
        chapterTitle: 'Complete Board Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_EM_Class10_English.pdf',
        fileName: 'UPBoard_EM_Class10_English_Book.pdf',
      },
      {
        title: 'UP Board Book — Class 12 Physics (English Medium)',
        classLevel: '12',
        subject: 'Physics',
        board: 'UP_BOARD_ENGLISH',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 14,
        description: 'UP Board Class 12 Physics textbook (English Medium) covering Electrostatics, Current, Optics, and Semiconductors.',
        chapterTitle: 'Complete Board Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_EM_Class12_Physics.pdf',
        fileName: 'UPBoard_EM_Class12_Physics_Book.pdf',
      },
      {
        title: 'UP Board Book — Class 10 Mathematics (English Medium)',
        classLevel: '10',
        subject: 'Mathematics',
        board: 'UP_BOARD_ENGLISH',
        medium: 'English',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 15,
        description: 'UP Board Class 10 Mathematics textbook (English Medium) with step-by-step solved examples and exercises.',
        chapterTitle: 'Complete Board Textbook',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_EM_Class10_Maths.pdf',
        fileName: 'UPBoard_EM_Class10_Mathematics_Book.pdf',
      },

      // -------------------------------------------------------------
      // 4. UP BOARD (HINDI MEDIUM)
      // -------------------------------------------------------------
      {
        title: 'यूपी बोर्ड पुस्तक — कक्षा 12 भौतिक विज्ञान (हिंदी माध्यम)',
        classLevel: '12',
        subject: 'Physics',
        board: 'UP_BOARD_HINDI',
        medium: 'Hindi',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 18,
        description: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद (UPMSP) कक्षा 12 भौतिक विज्ञान संपूर्ण पाठ्यपुस्तक — स्थिर वैद्युतिकी, प्रकाशिकी, चुंबकत्व एवं आधुनिक भौतिकी।',
        chapterTitle: 'संपूर्ण पाठ्यपुस्तक',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_HM_Class12_Physics.pdf',
        fileName: 'UPBoard_HM_Class12_Bhautik_Vigyan.pdf',
      },
      {
        title: 'यूपी बोर्ड पुस्तक — कक्षा 9 गणित (हिंदी माध्यम)',
        classLevel: '9',
        subject: 'Mathematics',
        board: 'UP_BOARD_HINDI',
        medium: 'Hindi',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 16,
        description: 'यूपी बोर्ड कक्षा 9 गणित पाठ्यपुस्तक (हिंदी माध्यम) — संख्या पद्धति, बहुपद, निर्देशांक ज्यामिति, रेखाएँ और कोण, त्रिभुज, वृत्त।',
        chapterTitle: 'संपूर्ण पाठ्यपुस्तक',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_HM_Class9_Maths.pdf',
        fileName: 'UPBoard_HM_Class9_Ganit.pdf',
      },
      {
        title: 'यूपी बोर्ड पुस्तक — कक्षा 10 गणित (हिंदी माध्यम)',
        classLevel: '10',
        subject: 'Mathematics',
        board: 'UP_BOARD_HINDI',
        medium: 'Hindi',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 15,
        description: 'यूपी बोर्ड कक्षा 10 गणित संपूर्ण पाठ्यपुस्तक (हिंदी माध्यम) — वास्तविक संख्याएँ, बहुपद, दो चर वाले रैखिक समीकरण, द्विघात समीकरण, त्रिकोणमिति।',
        chapterTitle: 'संपूर्ण पाठ्यपुस्तक',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_HM_Class10_Maths.pdf',
        fileName: 'UPBoard_HM_Class10_Ganit.pdf',
      },
      {
        title: 'यूपी बोर्ड पुस्तक — कक्षा 10 विज्ञान (हिंदी माध्यम)',
        classLevel: '10',
        subject: 'Science',
        board: 'UP_BOARD_HINDI',
        medium: 'Hindi',
        category: 'TEXTBOOK',
        resourceType: 'BOOK',
        chaptersCount: 16,
        description: 'यूपी बोर्ड कक्षा 10 विज्ञान (भौतिक, रसायन एवं जीव विज्ञान) पाठ्यपुस्तक (हिंदी माध्यम) — रासायनिक अभिक्रियाएँ, अम्ल-क्षार, जैव प्रक्रम, प्रकाश, विद्युत।',
        chapterTitle: 'संपूर्ण पाठ्यपुस्तक',
        fileUrl: 'https://res.cloudinary.com/tutornearby/raw/upload/UPBoard_HM_Class10_Science.pdf',
        fileName: 'UPBoard_HM_Class10_Vigyan.pdf',
      },
    ];

    console.log(`Seeding ${boardBooks.length} real board textbooks & collections across CBSE, ICSE, and UP Board (EM & HM)...\n`);

    for (const book of boardBooks) {
      await StudyResource.create({
        title: book.title,
        description: book.description,
        classLevel: book.classLevel,
        subject: book.subject,
        board: book.board,
        medium: book.medium,
        resourceType: book.resourceType,
        chaptersCount: book.chaptersCount,
        chapter: 'Complete Book',
        chapterNumber: 1,
        chapterTitle: book.chapterTitle,
        fileUrl: book.fileUrl,
        fileName: book.fileName,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileFormat: 'pdf',
        isFree: true,
        isFreeDemo: true,
        readingEnabled: true,
        downloadEnabled: true,
        downloadPrice: 0,
        salePrice: 0,
        originalPrice: 0,
        published: true,
        fileReference: {
          url: book.fileUrl,
          filename: book.fileName,
          fileSize: 1048576,
          mimeType: 'application/pdf',
          fileType: 'pdf',
        },
      });
      console.log(`  ✓ Seeded [${book.board}] [${book.medium}] Class ${book.classLevel} ${book.subject}: "${book.title}"`);
    }

    console.log('\n========================================================');
    console.log('✅ ALL BOARD BOOKS & FREE RESOURCES SEEDED SUCCESSFULLY!');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedStudyBooks();
