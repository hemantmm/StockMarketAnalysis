const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ It works!');
});

app.listen(4000, () => {
  console.log('🚀 Test server running on http://localhost:5000');
});
