// Node.js/Express.js version of the provided PHP check_availability.php script.
// Assumes you have express-session, body-parser, and a Database utility with a select method.

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const Database = require('../config'); // Should export a Database class

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400 * 30 * 1000,
    httpOnly: true,
    secure: false // set to true with HTTPS
  }
}));

router.post('/check_availability', async (req, res) => {
  const db = new Database();
  let response = { exists: false };

  if (req.body.email) {
    const email = req.body.email;
    const email_check = await db.select('users', ['email'], 'email = ?', [email]);
    if (email_check && email_check.length > 0) {
      response.exists = true;
    }
  }

  if (req.body.username) {
    const username = req.body.username;
    const username_check = await db.select('users', ['username'], 'username = ?', [username]);
    if (username_check && username_check.length > 0) {
      response.exists = true;
    }
  }

  res.json(response);
});

module.exports = router;

// To use in your app:
// const checkAvailabilityRouter = require('./check_availability.js');
// app.use('/', checkAvailabilityRouter);
