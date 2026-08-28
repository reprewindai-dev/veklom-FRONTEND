const http = require('http');
const req = http.request('http://localhost:3002/api/demo/governed-machine/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.write(JSON.stringify({ scenario_id: "normal_allowed_action" }));
req.end();
