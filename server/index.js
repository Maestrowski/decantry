const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Decantry API is running' });
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.SERVER_URL ? `${process.env.SERVER_URL}/auth/google/callback` : "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
},
    async function (req, accessToken, refreshToken, profile, cb) {
        console.log("Google Auth Profile:", profile.id); // Debug log
        return cb(null, profile);
    }
));

console.log("Google Client ID loaded:", process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "..." : "Not Loaded");

// Google Auth Routes

// Login Route
app.get('/auth/google', (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ action: 'login' })).toString('base64');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

// Signup Route - Expects ?username=...
app.get('/auth/google/signup', (req, res, next) => {
    const { username } = req.query;
    if (!username) {
        return res.redirect('http://localhost:5173/signup?error=UsernameRequired');
    }
    const state = Buffer.from(JSON.stringify({ action: 'signup', username })).toString('base64');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

// Callback Route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=GoogleAuthFailed' }),
    async function (req, res) {
        try {
            const { state } = req.query;
            const { action, username } = JSON.parse(Buffer.from(state, 'base64').toString());
            const profile = req.user;
            const email = profile.emails[0].value;
            const googleId = profile.id;

            if (action === 'signup') {
                // Check if user exists
                const userCheck = await db.query('SELECT * FROM accounts WHERE email = $1 OR username = $2', [email, username]);
                if (userCheck.rows.length > 0) {
                    return res.redirect('http://localhost:5173/signup?error=UserAlreadyExists');
                }

                // Create user
                const newUserResult = await db.query(
                    'INSERT INTO accounts (username, email, google_id) VALUES ($1, $2, $3) RETURNING id, username, email',
                    [username, email, googleId]
                );
                const newUser = newUserResult.rows[0];
                await db.query('INSERT INTO leaderboards (account_id) VALUES ($1)', [newUser.id]);

                const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

                // Redirect to frontend with token
                res.redirect(`http://localhost:5173/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(newUser))}`);

            } else {
                // Login
                const userResult = await db.query('SELECT * FROM accounts WHERE email = $1 OR google_id = $2', [email, googleId]);

                if (userResult.rows.length === 0) {
                    return res.redirect('http://localhost:5173/login?error=UserNotFound');
                }

                const user = userResult.rows[0];

                // Link Google ID if not linked
                if (!user.google_id) {
                    await db.query('UPDATE accounts SET google_id = $1 WHERE id = $2', [googleId, user.id]);
                }

                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

                // Redirect to frontend with token
                res.redirect(`http://localhost:5173/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user.id, username: user.username, email: user.email }))}`);
            }
        } catch (err) {
            console.error(err);
            res.redirect('http://localhost:5173/login?error=ServerError');
        }
    }
);

// Guest Login
app.post('/api/auth/guest', async (req, res) => {
    try {
        const guestId = Math.floor(100000 + Math.random() * 900000);
        const username = `Guest_${guestId}`;
        const email = `guest_${guestId}_${Date.now()}@decantry.guest`;
        const password = `guest_${Date.now()}`; // Dummy password

        // Create guest account
        const result = await db.query(
            'INSERT INTO accounts (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password]
        );
        const userId = result.rows[0].id;

        // Generate token
        const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: userId, username, isGuest: true } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating guest account' });
    }
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM accounts WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUserResult = await db.query(
            'INSERT INTO accounts (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        const newUser = newUserResult.rows[0];

        // Initialize leaderboard
        await db.query('INSERT INTO leaderboards (account_id) VALUES ($1)', [newUser.id]);

        // Generate token
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'User created successfully',
            user: { id: newUser.id, username: newUser.username, email: newUser.email },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Stats Route
app.get('/api/user/stats', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const result = await db.query('SELECT total_points FROM leaderboards WHERE account_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.json({ total_points: 0 });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: 'Invalid token' });
    }
});



app.post('/api/user/score', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { mode, points } = req.body;

    if (!mode || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        let column = '';
        if (mode === 'casual') column = 'casual_points';
        else if (mode === 'expert') column = 'expert_points';
        else if (mode === 'timed') column = 'timed_points';
        else if (mode === 'daily') column = 'daily_points';
        else return res.status(400).json({ error: 'Invalid game mode' });

        // Update specific mode points and total points
        await db.query(`
            UPDATE leaderboards 
            SET ${column} = ${column} + $1, 
                total_points = total_points + $1 
            WHERE account_id = $2
        `, [points, userId]);

        res.json({ message: 'Score updated' });
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: 'Invalid token or database error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    const { mode } = req.query; // 'Casual', 'Expert', 'Timed', 'All'

    let orderBy = 'total_points';
    if (mode === 'Casual') orderBy = 'casual_points';
    else if (mode === 'Expert') orderBy = 'expert_points';
    else if (mode === 'Timed') orderBy = 'timed_points';

    try {
        const query = `
            SELECT a.username, l.${orderBy} as score
            FROM leaderboards l
            JOIN accounts a ON l.account_id = a.id
            ORDER BY l.${orderBy} DESC
            LIMIT 10
        `;

        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check user
        const userResult = await db.query('SELECT * FROM accounts WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

const nodemailer = require('nodemailer');

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        const userResult = await db.query('SELECT * FROM accounts WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            // User exists, generate token
            const resetToken = require('crypto').randomBytes(20).toString('hex');
            const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

            // Save token to DB (expires in 1 hour)
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
            await db.query(
                'INSERT INTO password_reset_tokens (account_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, resetToken, expiresAt]
            );

            // Configure Nodemailer
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: '"Decantry Support" <' + process.env.EMAIL_USER + '>',
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}`,
                html: `<p>You requested a password reset.</p><p>Please click the following link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
            };

            // Send email
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Password reset email sent to ${email}`);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }

        // Always return success to prevent email enumeration
        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    try {
        // 1. Find the token in the DB
        const tokenResult = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const resetRecord = tokenResult.rows[0];
        const accountId = resetRecord.account_id;

        // 2. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Update the user's password
        await db.query(
            'UPDATE accounts SET password = $1 WHERE id = $2',
            [hashedPassword, accountId]
        );

        // 4. Delete the used token (and potentially all tokens for this user to be safe)
        await db.query('DELETE FROM password_reset_tokens WHERE account_id = $1', [accountId]);

        res.json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Game Routes (Placeholder)
// Game Routes
app.get('/api/game/casual', async (req, res) => {
    try {
        // 1. Get a random country
        const randomCountryResult = await db.query('SELECT country_name FROM country_facts ORDER BY RANDOM() LIMIT 1');

        if (randomCountryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No countries found in database' });
        }

        const countryName = randomCountryResult.rows[0].country_name;

        // 2. Get all facts for that country
        const factsResult = await db.query('SELECT fact_content FROM country_facts WHERE country_name = $1 ORDER BY fact_number ASC', [countryName]);

        const facts = factsResult.rows.map(row => row.fact_content);

        res.json({ country: countryName, facts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/game/expert', async (req, res) => {
    try {
        // 1. Get 10 random distinct countries
        const countriesResult = await db.query('SELECT country_name FROM country_facts GROUP BY country_name ORDER BY RANDOM() LIMIT 10');

        if (countriesResult.rows.length < 10) {
            // Handle case where there are fewer than 10 countries
            // For now, just return what we have
        }

        const gameData = [];

        for (const row of countriesResult.rows) {
            const countryName = row.country_name;

            // 2. Get one random fact from 6-10 for this country
            const factResult = await db.query(`
                SELECT fact_content 
                FROM country_facts 
                WHERE country_name = $1 AND fact_number >= 6 AND fact_number <= 10 
                ORDER BY RANDOM() 
                LIMIT 1
            `, [countryName]);

            if (factResult.rows.length > 0) {
                gameData.push({
                    name: countryName,
                    fact: factResult.rows[0].fact_content
                });
            }
        }

        res.json(gameData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/game/timed', async (req, res) => {
    try {
        // 1. Get 1 random country
        const randomCountryResult = await db.query('SELECT country_name FROM country_facts GROUP BY country_name ORDER BY RANDOM() LIMIT 1');

        if (randomCountryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No countries found in database' });
        }

        const countryName = randomCountryResult.rows[0].country_name;

        // 2. Get 1 random fact for this country (any difficulty 1-10)
        const factResult = await db.query('SELECT fact_content FROM country_facts WHERE country_name = $1 ORDER BY RANDOM() LIMIT 1', [countryName]);

        if (factResult.rows.length === 0) {
            return res.status(404).json({ error: 'No facts found for country' });
        }

        res.json({
            name: countryName,
            fact: factResult.rows[0].fact_content
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/game/daily', async (req, res) => {
    try {
        // 1. Get all distinct countries sorted alphabetically
        const countriesResult = await db.query('SELECT country_name FROM country_facts GROUP BY country_name ORDER BY country_name ASC');

        if (countriesResult.rows.length === 0) {
            return res.status(404).json({ error: 'No countries found in database' });
        }

        const countries = countriesResult.rows.map(row => row.country_name);

        // 2. Determine index based on current date
        // Use days since a fixed epoch (e.g., Jan 1, 1970)
        const today = new Date();
        // Reset time part to ensure consistency throughout the day
        today.setHours(0, 0, 0, 0);
        const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

        const countryIndex = daysSinceEpoch % countries.length;
        const countryName = countries[countryIndex];

        // 3. Get all facts for that country
        const factsResult = await db.query('SELECT fact_content FROM country_facts WHERE country_name = $1 ORDER BY fact_number ASC', [countryName]);

        const facts = factsResult.rows.map(row => row.fact_content);

        res.json({ country: countryName, facts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Lobby / Table Routes ---

// Create Table
app.post('/api/lobby/create', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hostId = decoded.id;
        const { name, password, isPrivate, mode, maxPlayers } = req.body;

        if (!name) return res.status(400).json({ error: 'Table name is required' });

        // Enforce Single Table Rule: Remove user from any other tables
        await db.query('DELETE FROM table_members WHERE account_id = $1', [hostId]);
        // Clean up empty tables
        await db.query('DELETE FROM game_tables WHERE id NOT IN (SELECT table_id FROM table_members)');

        // Create table
        const tableResult = await db.query(
            'INSERT INTO game_tables (name, password, is_private, host_id, mode, max_players, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, password || null, isPrivate || false, hostId, mode || 'Casual', maxPlayers || 4, 'waiting']
        );
        const tableId = tableResult.rows[0].id;

        // Add host as member
        await db.query(
            'INSERT INTO table_members (table_id, account_id, is_ready, session_points) VALUES ($1, $2, $3, $4)',
            [tableId, hostId, false, 0]
        );

        res.json({ message: 'Table created', tableId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Tables (Join Table)
// Get Tables (Join Table)
app.get('/api/lobby/tables', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Build base conditions
        let whereClause = 't.is_private = FALSE';
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND t.name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // 1. Get total count of matching visible tables (having count > 0)
        // We need a subquery or CTE because of the GROUP BY + HAVING
        const countQueryText = `
            SELECT COUNT(*) FROM (
                SELECT t.id
                FROM game_tables t
                LEFT JOIN table_members tm ON t.id = tm.table_id
                WHERE ${whereClause}
                GROUP BY t.id
                HAVING COUNT(tm.account_id) > 0
            ) as subquery
        `;
        const countResult = await db.query(countQueryText, params);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get paginated data
        // Add limit/offset params
        params.push(limit);
        params.push(offset);

        const dataQueryText = `
            SELECT 
                t.id, t.name, t.mode, COALESCE(t.max_players, 4) as max_players, t.is_private, t.status,
                (t.password IS NOT NULL AND t.password != '') as has_password,
                COUNT(tm.account_id) as current_players,
                a.username as host_name
            FROM game_tables t
            JOIN accounts a ON t.host_id = a.id
            LEFT JOIN table_members tm ON t.id = tm.table_id
            WHERE ${whereClause}
            GROUP BY t.id, a.username
            HAVING COUNT(tm.account_id) > 0
            ORDER BY t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await db.query(dataQueryText, params);

        res.json({
            tables: result.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Join Table
app.post('/api/lobby/join', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, password } = req.body;

        // Enforce Single Table Rule: Remove user from any other tables
        await db.query('DELETE FROM table_members WHERE account_id = $1', [userId]);
        // Clean up empty tables
        await db.query('DELETE FROM game_tables WHERE id NOT IN (SELECT table_id FROM table_members)');

        // Check table exists and status
        const tableResult = await db.query('SELECT * FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
        const table = tableResult.rows[0];

        // Check password
        if (table.password && table.password !== password) {
            return res.status(403).json({ error: 'Incorrect password' });
        }

        // Check if full
        const membersResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1', [tableId]);
        const currentPlayers = parseInt(membersResult.rows[0].count);
        if (currentPlayers >= table.max_players) {
            return res.status(400).json({ error: 'Table is full' });
        }

        // Check if already joined
        const checkMember = await db.query('SELECT * FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, userId]);
        if (checkMember.rows.length > 0) {
            return res.json({ message: 'Already joined', tableId });
        }

        // Join
        await db.query('INSERT INTO table_members (table_id, account_id, is_ready, session_points) VALUES ($1, $2, $3, $4)', [tableId, userId, false, 0]);

        res.json({ message: 'Joined successfully', tableId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Leave Table (and delete if empty)
app.post('/api/lobby/leave', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId } = req.body;

        await db.query('DELETE FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, userId]);

        // Check remaining players
        const membersResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1', [tableId]);
        const currentPlayers = parseInt(membersResult.rows[0].count);

        if (currentPlayers === 0) {
            await db.query('DELETE FROM game_tables WHERE id = $1', [tableId]);
        } else {
            // Check if there are any ACTIVE players left. If not, reset table status to 'waiting'
            const activeResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1 AND is_in_game = TRUE', [tableId]);
            const activeCount = parseInt(activeResult.rows[0].count);
            if (activeCount === 0) {
                await db.query("UPDATE game_tables SET status = 'waiting' WHERE id = $1", [tableId]);
            }
        }

        res.json({ message: 'Left table' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Table Details
app.get('/api/lobby/room/:id', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const tableId = req.params.id;

        // Get table info
        const tableResult = await db.query('SELECT * FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
        const table = tableResult.rows[0];

        // Get members
        const membersResult = await db.query(`
            SELECT a.id, a.username, tm.is_ready, tm.session_points, tm.is_in_game
            FROM table_members tm
            JOIN accounts a ON tm.account_id = a.id
            WHERE tm.table_id = $1
        `, [tableId]);

        // Check if user is a member
        const isMember = membersResult.rows.some(m => String(m.id) === String(userId));
        if (!isMember) return res.status(403).json({ error: 'Not a member of this table' });

        res.json({
            table: {
                id: table.id,
                name: table.name,
                host_id: table.host_id,
                mode: table.mode,
                max_players: table.max_players || 4,
                status: table.status
            },
            members: membersResult.rows,
            isHost: table.host_id === userId
        });
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Game Mode (Host Only)
app.post('/api/lobby/update-mode', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, mode } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        if (tableResult.rows[0].host_id !== userId) {
            return res.status(403).json({ error: 'Only host can update settings' });
        }

        await db.query('UPDATE game_tables SET mode = $1 WHERE id = $2', [mode, tableId]);

        res.json({ message: 'Mode updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Table Settings (Host Only)
app.post('/api/lobby/update-settings', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, maxPlayers, password, isPrivate } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        if (tableResult.rows[0].host_id !== userId) {
            return res.status(403).json({ error: 'Only host can update settings' });
        }

        await db.query('UPDATE game_tables SET max_players = $1, password = $2, is_private = $3 WHERE id = $4', [maxPlayers, password || null, isPrivate, tableId]);

        res.json({ message: 'Settings updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Ready Status
app.post('/api/lobby/toggle-ready', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId } = req.body;

        // Check if member
        const memberResult = await db.query('SELECT is_ready FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, userId]);
        if (memberResult.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

        const currentReady = memberResult.rows[0].is_ready;
        await db.query('UPDATE table_members SET is_ready = $1 WHERE table_id = $2 AND account_id = $3', [!currentReady, tableId, userId]);

        res.json({ message: 'Ready status updated', isReady: !currentReady });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Forfeit Game
app.post('/api/lobby/forfeit', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId } = req.body;

        // Verify member
        const memberCheck = await db.query('SELECT 1 FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, userId]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

        // Set is_in_game = false, is_ready = false
        // This ensures they cannot "re-join" the active session logic in client
        await db.query('UPDATE table_members SET is_in_game = FALSE, is_ready = FALSE WHERE table_id = $1 AND account_id = $2', [tableId, userId]);

        // Check if there are any ACTIVE players left. If not, reset table status to 'waiting'
        const activeResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1 AND is_in_game = TRUE', [tableId]);
        const activeCount = parseInt(activeResult.rows[0].count);
        if (activeCount === 0) {
            await db.query("UPDATE game_tables SET status = 'waiting' WHERE id = $1", [tableId]);
        }

        res.json({ message: 'Forfeited' });
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Kick User (Host Only)
app.post('/api/lobby/kick', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, memberId } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        if (tableResult.rows[0].host_id !== userId) {
            return res.status(403).json({ error: 'Only host can kick players' });
        }

        if (userId === memberId) {
            return res.status(400).json({ error: 'Cannot kick yourself' });
        }

        await db.query('DELETE FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, memberId]);
        await db.query('UPDATE game_tables SET current_players = current_players - 1 WHERE id = $1', [tableId]);

        res.json({ message: 'User kicked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Transfer Host (Host Only)
app.post('/api/lobby/transfer-host', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, newHostId } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        if (tableResult.rows[0].host_id !== userId) {
            return res.status(403).json({ error: 'Only host can transfer ownership' });
        }

        // Verify new host is a member
        const memberResult = await db.query('SELECT * FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, newHostId]);
        if (memberResult.rows.length === 0) {
            return res.status(400).json({ error: 'New host must be a member of the table' });
        }

        await db.query('UPDATE game_tables SET host_id = $1 WHERE id = $2', [newHostId, tableId]);

        res.json({ message: 'Host transferred' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start Game (Host Only)
app.post('/api/lobby/start-game', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id, mode FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
        const table = tableResult.rows[0];

        if (table.host_id !== userId) {
            return res.status(403).json({ error: 'Only host can start game' });
        }

        // Verify all ready
        const membersResult = await db.query('SELECT is_ready FROM table_members WHERE table_id = $1', [tableId]);
        const allReady = membersResult.rows.every(m => m.is_ready);
        if (!allReady) {
            return res.status(400).json({ error: 'Not all players are ready' });
        }

        const totalPlayers = membersResult.rows.length;

        if (table.mode === 'Expert') {
            // Expert Mode Logic: 10 countries, 1 fact each (or just name/flag? ExpertGame.jsx uses fact)
            // ExpertGame.jsx uses: { name: 'Country', fact: 'Fact' }

            // Get 10 random countries
            const randomCountriesResult = await db.query(`
                SELECT cf.country_name, cf.fact_content 
                FROM country_facts cf
                JOIN (
                    SELECT country_name, MIN(fact_number) as min_fact 
                    FROM country_facts 
                    GROUP BY country_name 
                    ORDER BY RANDOM() 
                    LIMIT 10
                ) sub ON cf.country_name = sub.country_name AND cf.fact_number = sub.min_fact
            `);

            if (randomCountriesResult.rows.length < 10) return res.status(500).json({ error: 'Not enough countries found' });

            const rounds = randomCountriesResult.rows.slice(0, 10).map(row => ({
                country: row.country_name,
                fact: row.fact_content
            }));

            await db.query(`
                INSERT INTO multiplayer_games (table_id, mode, rounds, current_round, round_start_time, status, total_players)
                VALUES ($1, 'Expert', $2, 0, NOW(), 'active', $3)
            `, [tableId, JSON.stringify(rounds), totalPlayers]);

        } else if (table.mode === 'Timed') {
            // Timed Mode Logic
            // Create game entry
            const gameResult = await db.query(`
                INSERT INTO multiplayer_games (table_id, mode, round_start_time, status, total_players)
                VALUES ($1, 'Timed', NOW(), 'active', $2)
                RETURNING id
            `, [tableId, totalPlayers]);
            const gameId = gameResult.rows[0].id;

            // Initialize results for all players with 10 lives
            // We need member IDs.
            const members = await db.query('SELECT account_id FROM table_members WHERE table_id = $1', [tableId]);
            for (const member of members.rows) {
                await db.query(`
                    INSERT INTO multiplayer_results (game_id, account_id, score, lives)
                    VALUES ($1, $2, 0, 10)
                `, [gameId, member.account_id]);
            }

        } else {
            // Casual Mode Logic (Existing)
            const randomCountryResult = await db.query('SELECT country_name FROM country_facts ORDER BY RANDOM() LIMIT 1');
            if (randomCountryResult.rows.length === 0) return res.status(500).json({ error: 'No countries found' });
            const countryName = randomCountryResult.rows[0].country_name;

            const factsResult = await db.query('SELECT fact_content FROM country_facts WHERE country_name = $1 ORDER BY fact_number ASC', [countryName]);
            const facts = factsResult.rows.map(row => row.fact_content);

            await db.query(`
                INSERT INTO multiplayer_games (table_id, target_country, target_facts, mode, status, total_players)
                VALUES ($1, $2, $3, 'Casual', 'active', $4)
            `, [tableId, countryName, JSON.stringify(facts), totalPlayers]);
        }

        // Update Table Status
        await db.query("UPDATE game_tables SET status = 'playing' WHERE id = $1", [tableId]);
        // Set participating members to is_in_game=TRUE
        await db.query("UPDATE table_members SET is_in_game = TRUE WHERE table_id = $1 AND is_ready = TRUE", [tableId]);
        // Ensure others are FALSE (sanity check)
        await db.query("UPDATE table_members SET is_in_game = FALSE WHERE table_id = $1 AND is_ready = FALSE", [tableId]);

        res.json({ message: 'Game started' });
    } catch (err) {
        console.error('Error in start-game:', err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        try { require('fs').appendFileSync('error_log.txt', new Date().toISOString() + ' Error in start-game: ' + err.stack + '\n'); } catch (e) { }
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Get Multiplayer Game Data
app.get('/api/game/multiplayer/:tableId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const tableId = req.params.tableId;

        // Verify member
        const memberCheck = await db.query('SELECT 1 FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, userId]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

        // Get active game
        const gameResult = await db.query(`
            SELECT * FROM multiplayer_games 
            WHERE table_id = $1 AND status = 'active' 
            ORDER BY created_at DESC LIMIT 1
        `, [tableId]);

        if (gameResult.rows.length === 0) return res.status(404).json({ error: 'No active game found' });

        const game = gameResult.rows[0];

        if (game.mode === 'Expert') {
            res.json({
                id: game.id,
                mode: 'Expert',
                rounds: game.rounds,
                currentRound: game.current_round,
                roundStartTime: game.round_start_time
            });
        } else if (game.mode === 'Timed') {
            res.json({
                id: game.id,
                mode: 'Timed',
                roundStartTime: game.round_start_time
            });
        } else {
            res.json({
                id: game.id,
                mode: 'Casual',
                country: game.target_country,
                facts: game.target_facts
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit Multiplayer Score / Answer
app.post('/api/game/multiplayer/submit', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { gameId, score, round, answer, isCorrect } = req.body;

        // Check game mode
        const gameResult = await db.query('SELECT mode, table_id FROM multiplayer_games WHERE id = $1', [gameId]);
        if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = gameResult.rows[0];

        if (game.mode === 'Expert') {
            // Expert Mode Submission
            await db.query(`
                INSERT INTO multiplayer_round_answers (game_id, round_number, account_id, answer, is_correct, points)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (game_id, round_number, account_id) DO NOTHING
            `, [gameId, round, userId, answer, isCorrect, score]);

            // We don't update session points yet, maybe at the end of the game? 
            // Or incrementally? The user said "For every correct country, the user will earn 100 points."
            // Let's update incrementally.
            if (score > 0) {
                await db.query(`
                    UPDATE table_members 
                    SET session_points = session_points + $1 
                    WHERE table_id = $2 AND account_id = $3
                `, [score, game.table_id, userId]);
            }

        } else if (game.mode === 'Timed') {
            // Timed Mode Submission
            // We expect score to be the points earned in this turn (e.g. 100 or 0)
            // But wait, the client usually sends the TOTAL score in Casual mode?
            // In Expert mode, it sends points for the round.
            // In Timed mode, let's assume 'score' is the points to ADD (100) or 0.
            // And we handle lives decrement here.

            if (isCorrect) {
                await db.query(`
                    UPDATE multiplayer_results 
                    SET score = score + $1 
                    WHERE game_id = $2 AND account_id = $3
                `, [score, gameId, userId]);

                // Update session points
                await db.query(`
                    UPDATE table_members 
                    SET session_points = session_points + $1 
                    WHERE table_id = $2 AND account_id = $3
                `, [score, game.table_id, userId]);
            } else {
                await db.query(`
                    UPDATE multiplayer_results 
                    SET lives = lives - 1 
                    WHERE game_id = $1 AND account_id = $2
                `, [gameId, userId]);
            }

        } else {
            // Casual Mode Submission (Existing)
            await db.query(`
                INSERT INTO multiplayer_results (game_id, account_id, score)
                VALUES ($1, $2, $3)
                ON CONFLICT (game_id, account_id) DO UPDATE SET score = $3
            `, [gameId, userId, score]);

            if (gameResult.rows.length > 0) {
                const tableId = gameResult.rows[0].table_id;
                await db.query(`
                    UPDATE table_members 
                    SET session_points = session_points + $1 
                    WHERE table_id = $2 AND account_id = $3
                `, [score, tableId, userId]);
            }
        }

        res.json({ message: 'Submitted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Multiplayer Game Status
app.get('/api/game/multiplayer/status/:gameId', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const gameId = req.params.gameId;

        // Get game info with DB-calculated elapsed time to ensure timezone consistency
        const gameResult = await db.query(`
            SELECT *, 
            EXTRACT(EPOCH FROM (NOW() - round_start_time)) as elapsed_seconds
            FROM multiplayer_games 
            WHERE id = $1
        `, [gameId]);
        if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = gameResult.rows[0];
        const tableId = game.table_id;

        // Get total players from game snapshot if available, else fallback to current active members
        let totalPlayers = game.total_players;

        // Count ONLY members who are currently in the game (is_in_game = TRUE)
        const membersResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1 AND is_in_game = TRUE', [tableId]);
        const currentActiveMembersCount = parseInt(membersResult.rows[0].count);

        if (!totalPlayers) {
            totalPlayers = currentActiveMembersCount;
        }

        // Effective players is simply the count of currently active players.
        // We do not want to wait for dropped out/forfeited players.
        const effectiveTotalPlayers = currentActiveMembersCount;

        // Check if table status is still 'playing'
        const tableStatusResult = await db.query('SELECT status FROM game_tables WHERE id = $1', [tableId]);
        const tableStatus = tableStatusResult.rows[0].status;

        console.log('Status endpoint reached. Mode:', game.mode);

        if (game.mode === 'Expert') {
            try {
                // Expert Status Logic
                const currentRound = game.current_round;

                // Get answers for current round
                let answersResult = { rows: [] };
                try {
                    answersResult = await db.query(`
                        SELECT a.username, mra.answer, mra.is_correct, mra.points, mra.account_id
                        FROM multiplayer_round_answers mra
                        JOIN accounts a ON mra.account_id = a.id
                        WHERE mra.game_id = $1 AND mra.round_number = $2
                    `, [gameId, currentRound]);
                } catch (qErr) {
                    console.error('Error querying answers:', qErr);
                }

                const finishedCount = answersResult.rows.length;
                // Round is complete if everyone currently in the table has answered
                const roundComplete = finishedCount >= effectiveTotalPlayers;

                // console.log(`Game ${gameId} Round ${currentRound} Status: ${finishedCount}/${effectiveTotalPlayers} (Total: ${totalPlayers}) finished. Complete: ${roundComplete}`);

                // Calculate total scores for the game so far
                let totalScoresResult = { rows: [] };
                try {
                    totalScoresResult = await db.query(`
                        SELECT a.username, a.id as account_id, SUM(mra.points) as total_score
                        FROM multiplayer_round_answers mra
                        JOIN accounts a ON mra.account_id = a.id
                        WHERE mra.game_id = $1
                        GROUP BY a.username, a.id
                    `, [gameId]);
                } catch (qErr) {
                    console.error('Error querying total scores:', qErr);
                }

                // Calculate Time Left using DB source of truth
                // Ensure we handle potential nulls if round hasn't started (though it should have)
                const elapsed = parseFloat(game.elapsed_seconds || 0);
                const timeLeft = Math.max(0, 60 - elapsed);

                // Get votes for current round
                const votesResult = await db.query('SELECT COUNT(*) FROM multiplayer_round_votes WHERE game_id = $1 AND round_number = $2', [gameId, currentRound]);
                const votesCount = parseInt(votesResult.rows[0].count);

                // Check if current user has voted
                const myVoteResult = await db.query('SELECT 1 FROM multiplayer_round_votes WHERE game_id = $1 AND round_number = $2 AND account_id = $3', [gameId, currentRound, userId]);
                const hasVoted = myVoteResult.rows.length > 0;

                res.json({
                    mode: 'Expert',
                    currentRound,
                    roundStartTime: game.round_start_time,
                    finishedCount,
                    totalPlayers: effectiveTotalPlayers,
                    roundComplete,
                    timeLeft, // Derived from server clock
                    roundResults: answersResult.rows,
                    totalScores: totalScoresResult.rows,
                    votesCount,
                    hasVoted,
                    tableStatus,
                    serverTime: Date.now()
                });
            } catch (innerErr) {
                console.error('Error in Expert status logic:', innerErr);
                throw innerErr;
            }

        } else if (game.mode === 'Timed') {
            // Timed Status Logic
            // Timed Status Logic
            const elapsed = parseFloat(game.elapsed_seconds || 0);
            const timeLeft = Math.max(0, 180 - elapsed); // 3 minutes

            const resultsResult = await db.query(`
                SELECT r.account_id, r.score, r.lives, a.username, tm.is_in_game
                FROM multiplayer_results r
                JOIN accounts a ON r.account_id = a.id
                LEFT JOIN table_members tm ON tm.account_id = r.account_id AND tm.table_id = $2
                WHERE r.game_id = $1
                ORDER BY r.score DESC
            `, [gameId, tableId]);

            const players = resultsResult.rows;
            // Only consider ACTIVE players for the "all lives zero" check
            const activePlayers = players.filter(p => p.is_in_game);
            // If there are no active players, game is over. If there are active players, check if they all have 0 lives.
            const allActiveLivesZero = activePlayers.length > 0 && activePlayers.every(p => p.lives <= 0);

            const isGameOver = timeLeft <= 0 || allActiveLivesZero || activePlayers.length === 0;

            if (isGameOver && tableStatus === 'playing') {
                // Mark game as finished if not already?
                // Actually, the client handles "Game Over" UI, but we should probably update DB status eventually.
                // But for now, let's just return the status.
            }

            res.json({
                mode: 'Timed',
                timeLeft,
                players,
                isGameOver,
                tableStatus
            });

        } else {
            // Casual Status Logic (Existing)
            const resultsResult = await db.query(`
                SELECT r.account_id, r.score, a.username
                FROM multiplayer_results r
                JOIN accounts a ON r.account_id = a.id
                WHERE r.game_id = $1
            `, [gameId]);

            const finishedCount = resultsResult.rows.length;
            // Use effectiveTotalPlayers (active members) to determine if game is over
            const isGameOver = finishedCount >= effectiveTotalPlayers;

            res.json({
                mode: 'Casual',
                finishedCount,
                totalPlayers: effectiveTotalPlayers,
                isGameOver,
                results: resultsResult.rows,
                tableStatus
            });
        }
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Next Round (Expert Mode)
// Next Round Vote (Expert Mode)
app.post('/api/game/multiplayer/next-round', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { gameId } = req.body;

        const gameResult = await db.query('SELECT table_id, rounds, current_round FROM multiplayer_games WHERE id = $1', [gameId]);
        if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = gameResult.rows[0];

        // Check if user is in game
        const memberCheck = await db.query('SELECT 1 FROM table_members WHERE table_id = $1 AND account_id = $2 AND is_in_game = TRUE', [game.table_id, userId]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not an active player' });

        // Record vote
        try {
            await db.query('INSERT INTO multiplayer_round_votes (game_id, round_number, account_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [gameId, game.current_round, userId]);
        } catch (e) {
            // Ignore unique violation if race condition
        }

        // Count votes
        const votesResult = await db.query('SELECT COUNT(*) FROM multiplayer_round_votes WHERE game_id = $1 AND round_number = $2', [gameId, game.current_round]);
        const votesCount = parseInt(votesResult.rows[0].count);

        // Count active players
        const membersResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1 AND is_in_game = TRUE', [game.table_id]);
        const activePlayers = parseInt(membersResult.rows[0].count);

        if (votesCount >= activePlayers) {
            // Advance Round
            const nextRound = game.current_round + 1;
            if (nextRound >= game.rounds.length) {
                // Game Over
                await db.query("UPDATE multiplayer_games SET status = 'finished' WHERE id = $1", [gameId]);
                return res.json({ message: 'Game finished', gameOver: true });
            }

            await db.query(`
                UPDATE multiplayer_games 
                SET current_round = $1, round_start_time = NOW() 
                WHERE id = $2
            `, [nextRound, gameId]);

            res.json({ message: 'Next round started', round: nextRound, roundAdvanced: true });
        } else {
            res.json({ message: 'Vote recorded', accumulatedVotes: votesCount, requiredVotes: activePlayers, roundAdvanced: false });
        }
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Lobby (Host Only - Return to Lobby)
app.post('/api/lobby/reset', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { tableId, gameId } = req.body;

        // Verify host
        const tableResult = await db.query('SELECT host_id FROM game_tables WHERE id = $1', [tableId]);
        if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });

        if (tableResult.rows[0].host_id !== userId) {
            return res.status(403).json({ error: 'Only host can reset lobby' });
        }

        // Update table status to 'waiting'
        await db.query("UPDATE game_tables SET status = 'waiting' WHERE id = $1", [tableId]);

        // Mark game as finished? (Optional, currently status='active' is used to find current game)
        // Let's mark it as 'finished' so players don't rejoin it
        if (gameId) {
            await db.query("UPDATE multiplayer_games SET status = 'finished' WHERE id = $1", [gameId]);
        }

        // Reset ready status for all members?
        await db.query("UPDATE table_members SET is_ready = FALSE, is_in_game = FALSE WHERE table_id = $1", [tableId]);

        res.json({ message: 'Lobby reset' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



// Invite User
app.post('/api/lobby/invite', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const senderId = decoded.id;
        const { tableId, username } = req.body;

        console.log(`Invite request: sender=${senderId}, table=${tableId}, target=${username}`);

        // Find receiver
        const userResult = await db.query('SELECT id FROM accounts WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        const receiverId = userResult.rows[0].id;

        if (senderId === receiverId) return res.status(400).json({ error: 'Cannot invite yourself' });

        // Check if already invited
        const existingInvite = await db.query('SELECT id FROM table_invites WHERE table_id = $1 AND receiver_id = $2 AND status = \'pending\'', [tableId, receiverId]);
        if (existingInvite.rows.length > 0) return res.status(400).json({ error: 'User already invited' });

        // Check if already in table
        const existingMember = await db.query('SELECT account_id FROM table_members WHERE table_id = $1 AND account_id = $2', [tableId, receiverId]);
        if (existingMember.rows.length > 0) return res.status(400).json({ error: 'User already in table' });

        await db.query('INSERT INTO table_invites (table_id, sender_id, receiver_id) VALUES ($1, $2, $3)', [tableId, senderId, receiverId]);

        res.json({ message: 'Invite sent' });
    } catch (err) {
        console.error('Error in /api/lobby/invite:', err);
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Get User Invites
app.get('/api/user/invites', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const invitesResult = await db.query(`
            SELECT i.id, i.table_id, t.name as table_name, a.username as sender_name, i.created_at,
            (t.password IS NOT NULL AND t.password != '') as has_password
            FROM table_invites i
            JOIN game_tables t ON i.table_id = t.id
            JOIN accounts a ON i.sender_id = a.id
            WHERE i.receiver_id = $1 AND i.status = 'pending'
            ORDER BY i.created_at DESC
        `, [userId]);

        res.json(invitesResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Respond to Invite
app.post('/api/user/invites/respond', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { inviteId, action, password } = req.body; // action: 'accept' or 'decline'

        const inviteResult = await db.query('SELECT * FROM table_invites WHERE id = $1 AND receiver_id = $2', [inviteId, userId]);
        if (inviteResult.rows.length === 0) return res.status(404).json({ error: 'Invite not found' });
        const invite = inviteResult.rows[0];

        if (invite.status !== 'pending') return res.status(400).json({ error: 'Invite already responded to' });

        if (action === 'accept') {
            const tableId = invite.table_id;

            // Get max_players (if it exists, otherwise default) and current count
            const tableResult = await db.query('SELECT * FROM game_tables WHERE id = $1', [tableId]);
            if (tableResult.rows.length === 0) return res.status(404).json({ error: 'Table not found' });
            const table = tableResult.rows[0];

            // Check password
            if (table.password && table.password !== '') {
                if (password !== table.password) {
                    return res.status(401).json({ error: 'Incorrect password' });
                }
            }

            const maxPlayers = table.max_players || 4; // Default to 4 if column missing

            const membersCountResult = await db.query('SELECT COUNT(*) FROM table_members WHERE table_id = $1', [tableId]);
            const currentCount = parseInt(membersCountResult.rows[0].count);

            if (currentCount >= maxPlayers) {
                return res.status(400).json({ error: 'Table is full' });
            }

            // Add member
            await db.query('INSERT INTO table_members (table_id, account_id) VALUES ($1, $2)', [tableId, userId]);

            // Try to update current_players if it exists, otherwise ignore
            try {
                await db.query('UPDATE game_tables SET current_players = current_players + 1 WHERE id = $1', [tableId]);
            } catch (ignore) { } await db.query('UPDATE table_invites SET status = \'accepted\' WHERE id = $1', [inviteId]);

            res.json({ message: 'Joined table', tableId });
        } else {
            await db.query('UPDATE table_invites SET status = \'declined\' WHERE id = $1', [inviteId]);
            res.json({ message: 'Invite declined' });
        }
    } catch (err) {
        console.error('Error in /api/user/invites/respond:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

