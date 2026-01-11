
const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const DOMAIN = 'eduleadconnect.vercel.app';

async function run() {
    const url = `https://api.olamaps.io/tiles/vector/v1/data/planet.json?api_key=${API_KEY}`;
    const response = await fetch(url, {
        headers: {
            'Referer': `https://${DOMAIN}/`,
            'Origin': `https://${DOMAIN}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Planet.json Tiles Array:");
        console.log(data.tiles);
    } else {
        console.log("Failed to fetch planet.json:", response.status);
    }
}
run();
