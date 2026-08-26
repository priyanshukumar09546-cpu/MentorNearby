const { isValidAadhaar } = require('../utils/aadhaarValidator');

function generateValidAadhaar(base11) {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]
  ];
  const p = [
    [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,7,2,5],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
  ];

  // Try digits 0-9 to find checksum digit that yields c === 0
  for (let check = 0; check <= 9; check++) {
    const candidate = base11 + String(check);
    if (isValidAadhaar(candidate)) return candidate;
  }
  return null;
}

const validSample = generateValidAadhaar('23456789012');
console.log('Generated Valid Aadhaar:', validSample);
console.log('Is Valid?', isValidAadhaar(validSample));

console.log('Is 111111111111 valid?', isValidAadhaar('111111111111'));
console.log('Is 012345678912 valid?', isValidAadhaar('012345678912'));
