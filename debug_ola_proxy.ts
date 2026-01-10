
import axios from 'axios';
import fs from 'fs';

const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
// Trying the Vector Style URL from docs
const URL = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${API_KEY}`;

async function testOla() {
    console.log("Testing Ola Maps Tile Fetch...");
    console.log("URL:", URL);

    try {
        const response = await axios.get(URL, {
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'http://localhost:5000', // Spoof headers just in case
                'Origin': 'http://localhost:5000'
            }
        });

        console.log("Status:", response.status);
        console.log("Content-Type:", response.headers['content-type']);
        console.log("Size:", response.data.length);

        if (response.headers['content-type'].includes('image')) {
            console.log("✅ SUCCESS! We got an image.");
            fs.writeFileSync('test_tile.png', response.data);
            console.log("Saved to test_tile.png");
        } else {
            console.log("❌ FAILED. Response is not an image.");
            console.log("Body Preview:", response.data.toString().substring(0, 200));
        }

    } catch (error: any) {
        console.log("❌ ERROR fetching tile:");
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data.toString());
        } else {
            console.log(error.message);
        }
    }
}

testOla();
