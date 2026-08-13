import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Launching browser for manual login (Request Capture Mode)...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  
  const page = await browser.newPage();
  
  console.log('Navigating to Unifi TV...');
  await page.goto('https://unifitv.com.my', { waitUntil: 'domcontentloaded' });
  
  console.log('Monitoring network traffic for playback authorization requests...');
  console.log('>>> Please log in and play a channel in the browser window. <<<');

  let foundData = false;

  page.on('request', async (request) => {
    const url = request.url();
    
    // Look specifically for the authorize request
    if (url.includes('playback-auth-service.api.tm.quickplay.com/media/content/authorize')) {
      const headers = request.headers();
      const postData = request.postData();
      
      let parsedPostData = null;
      try {
        parsedPostData = postData ? JSON.parse(postData) : null;
      } catch (e) {
        parsedPostData = postData;
      }

      const capture = {
        url,
        method: request.method(),
        headers,
        postData: parsedPostData
      };

      const filename = `latest_auth.json`;
      fs.writeFileSync(filename, JSON.stringify(capture, null, 2));
      console.log(`\n[SUCCESS] Captured Authorization Request payload!`);
      console.log(`Saved to: ${filename}`);
      foundData = true;
    }
  });

  const disconnected = new Promise(resolve => browser.on('disconnected', resolve));
  
  await disconnected;
  
  if (!foundData) {
    console.log('\n[INFO] Session ended. No relevant data was captured.');
  }
  
  if (browser && browser.connected) {
    await browser.close();
  }
  
  console.log('Extraction script finished.');
})();
