fetch('http://lockerphycer-lockerphycer-api-1:8092/api/v1/workspace/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test', slug: 'test' })
}).then(r => r.text()).then(console.log);
