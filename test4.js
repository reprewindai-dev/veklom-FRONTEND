const http = require('http');
const req = http.request('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.write(JSON.stringify({ email: "test@example.com", password: "password" }));
req.end();
