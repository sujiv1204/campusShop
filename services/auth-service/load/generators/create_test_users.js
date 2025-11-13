// create_test_users.js
const fs = require('fs');
const N = 10;
const arr = [];
for (let i=1;i<=N;i++){
  const email = `testuser${('0000'+i).slice(-4)}@staging.example.com`;
  const password = `TestPass!${('0000'+i).slice(-4)}`;
  arr.push({ email, password });
}
fs.writeFileSync('tests/load/k6/test_creds.json', JSON.stringify(arr, null, 2));
console.log('Wrote test_creds.json with', N, 'users');
