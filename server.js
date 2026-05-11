const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up the SQLite database
const db = new sqlite3.Database('./urls.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE,
      original_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// POST /api/shorten
// Accepts a long URL and generates a short code mapping.
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL provided. Ensure it includes http:// or https://' });
  }

  // Check if we already shortened this URL (optional efficiency)
  db.get('SELECT short_code FROM urls WHERE original_url = ?', [url], (lookupErr, row) => {
    if (row) {
      const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;
      return res.json({ original_url: url, short_code: row.short_code, short_url: shortUrl });
    }

    const shortCode = nanoid(6); // Generate a unique 6-character code

    const stmt = db.prepare('INSERT INTO urls (short_code, original_url) VALUES (?, ?)');
    stmt.run([shortCode, url], function(err) {
      if (err) {
        console.error('Database insertion error', err);
        return res.status(500).json({ error: 'Database error while saving the link' });
      }
      
      const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
      res.json({ original_url: url, short_code: shortCode, short_url: shortUrl });
    });
  });
});

// GET /:shortCode
// Redirects the short code to the corresponding original URL.
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  db.get('SELECT original_url FROM urls WHERE short_code = ?', [shortCode], (err, row) => {
    if (err) {
      console.error('Database lookup error', err);
      return res.status(500).send('Internal Server Error');
    }
    
    if (row) {
      res.redirect(301, row.original_url);
    } else {
      res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>404 Not Found</h2>
          <p>The shortened link you are looking for does not exist.</p>
          <a href="/" style="color: #6366f1; text-decoration: none;">Go back to home</a>
        </div>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running beautifully on http://localhost:${PORT}`);
});
