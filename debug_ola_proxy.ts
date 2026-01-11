
const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const DOMAIN = 'eduleadconnect.vercel.app';

async function testEndpoint(name, url) {
    console.log(`\nTesting ${name}...`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Referer': `https://${DOMAIN}/`,
                'Origin': `https://${DOMAIN}`
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const body = await response.text();
        if (response.ok) {
            console.log(`✅ SUCCESS for ${name}`);
            console.log(`Body Snippet: ${body.substring(0, 100)}`);
        } else {
            console.log(`❌ FAILED for ${name}`);
            console.log(`Body: ${body}`);
        }
    } catch (error) {
        console.error(`❌ ERROR for ${name}:`, error.message);
    }
}

async function runTests() {
    // 1. Vector Styles List
    await testEndpoint('Styles List', `https://api.olamaps.io/tiles/vector/v1/styles.json?api_key=${API_KEY}`);

    // 2. Vector Style (Official Doc Path)
    await testEndpoint('Vector Style (Standard)', `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${API_KEY}`);

    // 3. Raster Tile (Places API - as seen in AdminMap)
    await testEndpoint('Raster Tile (Places)', `https://api.olamaps.io/places/v1/tiles/default-light-standard/12/2859/1739.png?api_key=${API_KEY}`);

    // 4. Raster Tile (Direct Tiles API)
    await testEndpoint('Raster Tile (Direct)', `https://api.olamaps.io/tiles/vector/v1/tiles/default-light-standard/12/2859/1739.png?api_key=${API_KEY}`);
}

runTests();
