const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/User',
  method: 'HEAD'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
