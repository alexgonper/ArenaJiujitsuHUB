
const http = require('http');

http.get('http://localhost:5000/api/v1/students/696ea84d6aa1df5c5e08e6d4/dashboard', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json.data.payment, null, 2));
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
