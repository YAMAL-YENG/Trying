// Node.js/Express.js version of the provided PHP signup script.
// Assumes you have express-session, cookie-parser, and a Database utility with select, insert, validate, and hashPassword methods.

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('../config'); // Should export a Database class

const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400 * 30 * 1000, // 30 days
    httpOnly: true,
    secure: false // set to true with HTTPS
  }
}));

router.get('/signup', (req, res) => {
  if (req.session.loggedin) {
    return res.redirect('../');
  }
  return res.sendFile(path.join(__dirname, 'signup.html'));
});

router.post('/signup', async (req, res) => {
  const db = new Database();
  // Validate and sanitize all inputs
  const first_name = db.validate((req.body.first_name || '').trim());
  const last_name = db.validate((req.body.last_name || '').trim());
  const email = db.validate((req.body.email || '').trim().toLowerCase());
  const username = db.validate((req.body.username || '').trim().toLowerCase());
  const password = req.body.password || '';
  const terms = req.body.terms === 'on' || req.body.terms === true;

  // Server-side validation
  const errors = [];

  if (!first_name || first_name.length > 30) {
    errors.push("Invalid first name.");
  }
  if (!last_name || last_name.length > 30) {
    errors.push("Invalid last name.");
  }
  if (
    !email ||
    !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email) ||
    email.length > 100
  ) {
    errors.push("Invalid email address.");
  }
  if (
    !username ||
    !/^[a-zA-Z0-9_]+$/.test(username) ||
    username.length > 30
  ) {
    errors.push("Invalid username.");
  }
  if (password.length < 6 || password.length > 255) {
    errors.push("Password must be between 6 and 255 characters.");
  }
  if (!terms) {
    errors.push("You must agree to the Terms & Conditions.");
  }

  // Check if email or username already exists (server-side)
  let email_exists = await db.select('users', ['id'], 'email = ?', [email]);
  let username_exists = await db.select('users', ['id'], 'username = ?', [username]);

  if (email_exists.length > 0) {
    errors.push("This email exists!");
  }
  if (username_exists.length > 0) {
    errors.push("This username exists!");
  }

  if (errors.length === 0) {
    const hashed_password = db.hashPassword(password);

    const data = {
      first_name,
      last_name,
      email,
      username,
      password: hashed_password
    };

    let result = await db.insert('users', data);

    if (result) {
      let user_id_arr = await db.select('users', ['id'], 'username = ?', [username]);
      let user_id = user_id_arr.length > 0 ? user_id_arr[0].id : null;

      req.session.loggedin = true;
      req.session.username = username;
      req.session.user_id = user_id;

      res.cookie('username', username, {
        maxAge: 86400 * 30 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });
      res.cookie('session_token', req.session.id, {
        maxAge: 86400 * 30 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });

      return res.send(`
        <script src="../src/js/sweetalert2.js"></script>
        <script>
          window.onload = function () {
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Registration successful',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              window.location.href = '../';
            });
          };
        </script>
      `);
    } else {
      return res.send(`
        <script src="../src/js/sweetalert2.js"></script>
        <script>
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Registration failed. Please try again later.',
          });
        </script>
        ${renderSignupForm()}
      `);
    }
  } else {
    // Send errors back as a SweetAlert
    return res.send(`
      <script src="../src/js/sweetalert2.js"></script>
      <script>
        Swal.fire({
          icon: 'error',
          title: 'Registration Error',
          html: '${errors.map(e => escapeHtml(e)).join('<br>')}'
        });
      </script>
      ${renderSignupForm()}
    `);
  }
});

// Utility for escaping HTML in error messages
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

// Utility to render the signup form HTML (move your HTML here except the PHP/JS logic)
function renderSignupForm() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
      /* ...styles unchanged... */
    </style>
</head>
<body>
  <!-- ...SVG and form HTML unchanged, see your original file... -->
  <script src="../src/js/sweetalert2.js"></script>
  <script>
    // ...Client-side JS unchanged...
  </script>
</body>
</html>
  `;
}

module.exports = router;

// To use in your app:
// const signupRouter = require('./signup.js');
// app.use('/', signupRouter);
