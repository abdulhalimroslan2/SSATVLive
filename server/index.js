import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/authorize', async (req, res) => {
  const { contentId } = req.body;
  console.log(`[PROXY] Received request for contentId: ${contentId}`);
  
  if (!contentId) {
    return res.status(400).json({ error: 'contentId is required' });
  }

  try {
    // Read the LATEST freshly captured token directly from the file system.
    const CAPTURED_REQUEST = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'latest_auth.json'), 'utf-8')
    );

    // Clone the headers and post data we captured from the real browser
    const headers = { ...CAPTURED_REQUEST.headers };
    const postData = { ...CAPTURED_REQUEST.postData };
    
    // Inject the requested contentId
    postData.contentId = contentId;

    const response = await axios.post(
      'https://playback-auth-service.api.tm.quickplay.com/media/content/authorize',
      postData,
      { headers }
    );

    // The response contains the DASH manifest URL (.mpd) and the Widevine license URL
    res.json(response.data);
  } catch (error) {
    console.error('Error authorizing playback:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authorize playback', details: error.response?.data });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
