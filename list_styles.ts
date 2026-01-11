
const API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const DOMAIN = 'eduleadconnect.vercel.app';

async function run() {
    const url = `https://api.olamaps.io/tiles/vector/v1/styles.json?api_key=${API_KEY}`;
    const response = await fetch(url, {
        headers: {
            'Referer': `https://${DOMAIN}/`,
            'Origin': `https://${DOMAIN}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Available Styles:");
        data.forEach(s => console.log(`- ID: ${s.id}, Name: ${s.name}`));
    } else {
        console.log("Failed to fetch styles:", response.status);
    }
}
run();
