// Node.js/Express.js version of the provided PHP login script.
// Assumes you have express-session, cookie-parser, and a Database utility similar to the PHP Database class.

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const Database = require('../config'); // Should export a Database class with select/hashPassword methods

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

router.get('/login', async (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session.loggedin) {
    return res.redirect('../dashboard');
  }

  // Check for session cookies
  if (req.cookies.username && req.cookies.session_token) {
    if (req.session.id !== req.cookies.session_token) {
      // Express-session does not support changing session id on the fly like PHP.
      // Instead, you can implement your own session-token logic if needed.
      // For now, just rely on session.
    }

    const db = new Database();
    const result = await db.select(
      'users',
      ['id'],
      'username = ?',
      [req.cookies.username]
    );

    if (result.length) {
      req.session.loggedin = true;
      req.session.username = req.cookies.username;
      req.session.user_id = result[0].id;
      return res.redirect('../dashboard');
    }
  }

  // Render login form
  return res.sendFile(path.join(__dirname, 'login.html'));
});

router.post('/login', async (req, res) => {
  const db = new Database();
  const username = req.body.username.toLowerCase();
  const passwordHash = db.hashPassword(req.body.password);

  const result = await db.select(
    'users',
    ['*'],
    'username = ? AND password = ?',
    [username, passwordHash]
  );

  if (result.length) {
    const user = result[0];
    req.session.loggedin = true;
    req.session.user_id = user.id;
    req.session.username = user.username;

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

    // Send JS to show SweetAlert and redirect
    return res.send(`
      <script src="../src/js/sweetalert2.js"></script>
      <script>
        window.onload = function () {
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Login successful',
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            window.location.href = '../dashboard';
          });
        };
      </script>
    `);
  } else {
    // Incorrect login
    return res.send(`
      <script src="../src/js/sweetalert2.js"></script>
      <script>
        window.onload = function () {
          Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'Incorrect information',
            text: 'Login or password is incorrect',
            showConfirmButton: true
          });
        };
      </script>
      ${renderLoginForm()}
    `);
  }
});

// Utility to render the login form HTML (move your HTML here except the PHP/JS logic)
function renderLoginForm() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <title>Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        /* ... styles unchanged ... */
    </style>
</head>
<body>
    <svg class="mountains-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
            <linearGradient id="mountain-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7b2ff2"/>
                <stop offset="100%" stop-color="#f357a8"/>
            </linearGradient>
        </defs>
        <path d="M0,80 Q20,60 40,80 Q60,100 80,80 Q90,70 100,80 L100,100 L0,100 Z"
              fill="url(#mountain-gradient)" opacity="0.8"/>
        <circle cx="80" cy="25" r="8" fill="#fff8" />
        <circle cx="15" cy="18" r="0.6" fill="#fff"/>
        <circle cx="25" cy="10" r="0.7" fill="#fff"/>
        <circle cx="40" cy="22" r="0.5" fill="#fff"/>
        <circle cx="60" cy="17" r="0.6" fill="#fff"/>
        <circle cx="70" cy="8" r="0.5" fill="#fff"/>
        <circle cx="90" cy="15" r="0.7" fill="#fff"/>
    </svg>
    <div class="form-container">
        <h1>Login</h1>
        <form method="post" action="">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required maxlength="30">
                <small id="username-error" style="color: #f357a8;"></small>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-container">
                    <input type="password" id="password" name="password" required maxlength="255">
                    <button type="button" id="toggle-password" class="password-toggle"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            <div class="form-group">
                <button type="submit" name="submit" id="submit" disabled>Login</button>
            </div>
        </form>
        <div class="text-center">
            <p>Don't have an account? <a href="../signup/">Sign Up</a></p>
        </div>
    </div>
    <script src="../src/js/sweetalert2.js"></script>
    <script>
        const usernameField = document.getElementById('username');
        const usernameError = document.getElementById('username-error');
        const submitButton = document.getElementById('submit');
        function validateForm() {
            const username = usernameField.value;
            const usernamePattern = /^[a-zA-Z0-9_]+$/;
            if (!usernamePattern.test(username)) {
                usernameError.textContent = "Username can only contain letters, numbers, and underscores!";
                submitButton.disabled = true;
            } else {
                usernameError.textContent = "";
                submitButton.disabled = false;
            }
        }
        usernameField.addEventListener('input', validateForm);
        document.getElementById('toggle-password').addEventListener('click', function () {
            const passwordField = document.getElementById('password');
            const toggleIcon = this.querySelector('i');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        });
    </script>
</body>
</html>
  `;
}

module.exports = router;

// To use in your app:
// const loginRouter = require('./login.js');
// app.use('/', loginRouter);
