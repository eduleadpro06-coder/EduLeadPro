
const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const DOMAIN = 'eduleadconnect.vercel.app';

async function testTile() {
    // Picking a random tile coordinate (zoom 12 near Bangalore)
    const url = `https://api.olamaps.io/tiles/vector/v1/data/planet/12/2859/1739.pbf?api_key=${API_KEY}`;

    console.log("Testing Title URL:", url);

    const response = await fetch(url, {
        headers: {
            'Referer': `https://${DOMAIN}/`,
            'Origin': `https://${DOMAIN}`
        }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);

    if (response.ok) {
        const buffer = await response.arrayBuffer();
        console.log(`✅ SUCCESS! Body length: ${buffer.byteLength}`);
    } else {
        const body = await response.text();
        console.log(`❌ FAILED: ${body}`);
    }
}

testTile();
