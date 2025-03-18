const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors())

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change to your MySQL user
    password: '12345678', // Change to your MySQL password
    database: 'baobabrun'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
    res.send('Welcome to Baobab Run API');
})

// Create a Sponsor
app.post('/sponsors', (req, res) => {
    const { name, email } = req.body;
    db.query('INSERT INTO sponsors (name, email) VALUES (?, ?)', [name, email], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Sponsor created', id: result.insertId });
    });
});

app.get('/sponsors', (req, res) => {
    db.query('SELECT * FROM sponsors', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Create a Child
app.post('/children', (req, res) => {
    const { name, age } = req.body;
    db.query('INSERT INTO children (name, age) VALUES (?, ?)', [name, age], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Child added', id: result.insertId });
    });
});

// Get All Children
app.get('/children', (req, res) => {
    db.query('SELECT * FROM children', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});


// Pledge an Amount for a Child (New API)
app.post('/pledge', (req, res) => {
    const { sponsor_id, child_id, pledged_amount } = req.body;
    db.query(
        'INSERT INTO sponsorships (sponsor_id, child_id, pledged_amount, status) VALUES (?, ?, ?, "pending")',
        [sponsor_id, child_id, pledged_amount],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Pledge created', id: result.insertId });
        }
    );
});

// Get All Sponsorships (View Pledges)
app.get('/sponsorships', (req, res) => {
    db.query(
        `SELECT s.id AS sponsorship_id, sp.name AS sponsor_name, c.name AS child_name, 
        s.pledged_amount, s.paid_amount, s.status 
        FROM sponsorships s
        JOIN sponsors sp ON s.sponsor_id = sp.id
        JOIN children c ON s.child_id = c.id`,
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results);
        }
    );
});

// Make a Payment (New API)
app.post('/pay', (req, res) => {
    const { sponsorship_id, amount_paid } = req.body;

    // Update the paid amount and status
    db.query(
        'UPDATE sponsorships SET paid_amount = paid_amount + ?, status = IF(paid_amount + ? >= pledged_amount, "fulfilled", "pending") WHERE id = ?',
        [amount_paid, amount_paid, sponsorship_id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Payment recorded successfully' });
        }
    );
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
