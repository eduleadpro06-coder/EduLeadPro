
const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const DOMAIN = 'eduleadconnect.vercel.app';

async function run() {
    const url = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${API_KEY}`;
    const response = await fetch(url, {
        headers: {
            'Referer': `https://${DOMAIN}/`,
            'Origin': `https://${DOMAIN}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Style JSON Sources:");
        console.log(JSON.stringify(data.sources, null, 2));
    } else {
        console.log("Failed to fetch style JSON:", response.status);
    }
}
run();
