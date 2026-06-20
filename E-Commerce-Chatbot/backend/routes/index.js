var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({ title: 'Express' });
});

// Simple chatbot API endpoint
router.post('/api/chat', function(req, res) {
  const userMessage = req.body.message;
  // Simple bot logic (echo with prefix)
  const reply = `Bot: You said, "${userMessage}"`;
  res.json({ reply });
});

module.exports = router;
