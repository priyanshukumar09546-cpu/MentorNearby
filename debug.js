const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/login');
  
  // Need to login as tutor
  await page.type('input[placeholder*="Email"]', 'priyanshu@example.com');
  await page.type('input[placeholder*="Password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  console.log('Logged in, navigating to profile edit');
  
  await page.goto('http://localhost:5173/tutor/profile/edit');
  
  // Wait a bit for the page to render
  await new Promise(r => setTimeout(r, 2000));
  console.log('Done waiting. HTML check:');
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (!bodyHTML.includes('MentorNearby')) {
     console.log('PAGE MIGHT BE BLANK. HTML:', bodyHTML.substring(0, 300));
  } else {
     console.log('Page loaded successfully');
  }
  
  await browser.close();
})();
