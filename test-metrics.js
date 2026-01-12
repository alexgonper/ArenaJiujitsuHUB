const fetch = require('node-fetch');

async function testFetch() {
    try {
        const response = await fetch('https://lazy-geese-wash.loca.lt/api/v1/metrics/network/summary?months=12', {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await response.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (error) {
        console.error(error);
    }
}

testFetch();
