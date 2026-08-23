const axios = require('axios');

async function test() {
  const r = await axios.get('http://localhost:5173/login');
  console.log('HTTP Status:', r.status);
  console.log('Contains root:', r.data.includes('id="root"'));
  console.log('Contains main.jsx:', r.data.includes('src="/src/main.jsx"'));
}

test();
