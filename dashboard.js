// Node.js/Express.js version of the provided PHP dashboard script.
// Assumes you have express-session, cookie-parser, a Database utility, and use Express for routing.

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./config'); // Should export a Database class

const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400 * 30 * 1000,
    httpOnly: true,
    secure: false // set to true with HTTPS
  }
}));

router.get('/dashboard', (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('./login/');
  }
  const username = req.session.username || '';
  return res.send(renderDashboard(username));
});

router.post('/dashboard', async (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('./login/');
  }

  // Handle logout
  if (req.body.logout) {
    req.session.destroy(() => {
      res.clearCookie('username');
      res.clearCookie('session_token');
      return res.redirect('./login/');
    });
    return;
  }

  // TODO: Add backend logic for updating profile and credentials
  // Example: if (req.body.update_credentials) { ... }

  const username = req.session.username || '';
  return res.send(renderDashboard(username));
});

/**
 * Utility to render the dashboard HTML (adapted from the provided PHP/HTML)
 * @param {string} username
 */
function renderDashboard(username) {
  // Escape HTML for username
  const safeUsername = (username || '').replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        /* ... styles as in your original file ... */
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
    <div class="dashboard-container">
        <h1>Welcome, ${safeUsername}!</h1>
        <div class="tabs">
            <button class="tab active" data-tab="home"><i class="fas fa-home"></i> Home</button>
            <button class="tab" data-tab="profile"><i class="fas fa-user"></i> Manage Profile</button>
            <button class="tab" data-tab="credentials"><i class="fas fa-key"></i> Update Credentials</button>
            <button class="tab" data-tab="logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
        <div class="tab-content active" id="home">
            <p style="color:#fff; text-align:center;">This is your dashboard. Use the tabs above to manage your account.</p>
            <button class="founders-btn" onclick="window.location.href='dashboard/details.php'">
                <i class="fas fa-users"></i> Founders
            </button>
        </div>
        <div class="tab-content" id="profile">
            <div class="profile-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="profile-info">
                <strong>Username:</strong> ${safeUsername}<br>
                <!-- Add more profile info here -->
            </div>
            <button type="button" onclick="alert('Profile editing not implemented yet');">Edit Profile</button>
        </div>
        <div class="tab-content" id="credentials">
            <form method="post" action="">
                <label for="new-username">New Username</label>
                <input type="text" id="new-username" name="new_username" maxlength="30" placeholder="Enter new username">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" name="new_password" maxlength="255" placeholder="Enter new password">
                <button type="submit" name="update_credentials">Update Credentials</button>
            </form>
            <!-- Add backend logic for credentials update -->
        </div>
        <div class="tab-content" id="logout">
            <form method="post" action="">
                <button type="submit" name="logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </form>
        </div>
    </div>
    <script>
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
            });
        });
    </script>
</body>
</html>
  `;
}

module.exports = router;

// To use in your app:
// const dashboardRouter = require('./dashboard.js');
// app.use('/', dashboardRouter);
