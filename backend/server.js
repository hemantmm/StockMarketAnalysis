require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const app= express();

const PORT = process.env.PORT || 4000;

// Enhance CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://stock-market-analysis-five-lake.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

// Optimize Mongoose connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // Increase connection timeout
    socketTimeoutMS: 30000, // Increase socket timeout
    serverSelectionTimeoutMS: 30000 // Increase server selection timeout
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
}
);

// Improve authentication middleware with better error handling
const authenticateToken = (req, res, next) => {
    console.log('Authentication check:', req.headers);
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('No authorization header found');
        return res.status(401).json({ 
            success: false,
            message: 'Authentication required'
        });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('No token found in authorization header');
        return res.status(401).json({
            success: false,
            message: 'Authentication token required'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        console.log('Authentication successful for user:', user);
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => {
    res.send('Welcome to the backend API server');
});

// User schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// Watchlist schema
const watchlistSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    stock_symbol: {
        type: String,
        required: true
    },
    stock_name: {
        type: String,
        required: true
    },
    date_added: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for user_id and stock_symbol to ensure uniqueness
watchlistSchema.index({ user_id: 1, stock_symbol: 1 }, { unique: true });

// Trade history schema
const tradeSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    side: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Portfolio schema
const portfolioSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 100000
    },
    positions: {
        type: Map,
        of: Number,
        default: {}
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
const Watchlist = mongoose.model('Watchlist', watchlistSchema);
const Trade = mongoose.model('Trade', tradeSchema);
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// User routes
app.post('/SignUp', async (req, res) => {
    const { username, email, password } = req.body;

    if(!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    try {
        const existingUser = await User.findOne({$or: [{ username }, { email }] });
        if(existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        await user.save();

        // Initialize portfolio for new user
        const portfolio = new Portfolio({
            user_id: username,
            balance: 100000,
            positions: {}
        });
        await portfolio.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/Login', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Login attempt with:', { username, email, hasPassword: !!password });
    
    try {
        // Build query dynamically based on what's provided
        let query = {};
        if (username) {
            query.username = username;
        } else if (email) {
            query.email = email;
        } else {
            console.log('No username or email provided');
            return res.status(400).json({ message: 'Username or email is required' });
        }

        console.log('Searching for user with query:', query);
        const user = await User.findOne(query);
        
        if (!user) {
            console.log('User not found with query:', query);
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }
        
        console.log('User found:', { id: user._id, username: user.username, email: user.email });
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if(!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }
        
        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful for user:', user.username);
        res.json({token, username: user.username});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Watchlist routes
app.post('/watchlist/add', authenticateToken, async (req, res) => {
    console.log('Received watchlist add request:', req.body);
    const { user_id, stock_symbol, stock_name } = req.body;
    
    if (!user_id || !stock_symbol || !stock_name) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }
    
    try {
        // Check if the item is already in the watchlist
        const existingItem = await Watchlist.findOne({ user_id, stock_symbol });
        if (existingItem) {
            console.log('Stock already in watchlist:', { user_id, stock_symbol });
            return res.json({ success: true, message: 'Stock already in watchlist' });
        }
        
        // Add new item to watchlist
        const watchlistItem = new Watchlist({
            user_id,
            stock_symbol,
            stock_name
        });
        await watchlistItem.save();
        
        console.log('Stock added to watchlist:', { user_id, stock_symbol, stock_name });
        res.json({ success: true, message: 'Stock added to watchlist' });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ success: false, message: `Failed to add stock to watchlist: ${error.message}` });
    }
});

app.post('/watchlist/remove', authenticateToken, async (req, res) => {
    const { user_id, stock_symbol } = req.body;
    
    try {
        await Watchlist.findOneAndDelete({ user_id, stock_symbol });
        res.json({ success: true, message: 'Stock removed from watchlist' });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({ success: false, message: 'Failed to remove stock from watchlist' });
    }
});

app.get('/watchlist/list/:user_id', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    
    try {
        const watchlist = await Watchlist.find({ user_id }).select('-_id user_id stock_symbol stock_name');
        res.json({ success: true, data: watchlist });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch watchlist', data: [] });
    }
});

app.get('/watchlist/check/:user_id/:stock_symbol', authenticateToken, async (req, res) => {
    const { user_id, stock_symbol } = req.params;
    
    try {
        const item = await Watchlist.findOne({ user_id, stock_symbol });
        res.json({ success: true, data: !!item });
    } catch (error) {
        console.error('Error checking watchlist:', error);
        res.status(500).json({ success: false, message: 'Failed to check watchlist', data: false });
    }
});

// Paper trading endpoints

app.post('/papertrade/trade', authenticateToken, async (req, res) => {
    const { user_id, symbol, qty, price, side } = req.body;
    if (!user_id || !symbol || !qty || !price || !side) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    if (qty <= 0 || price <= 0) {
        return res.status(400).json({ success: false, error: 'Quantity and price must be positive numbers' });
    }
    if (side !== 'buy' && side !== 'sell') {
        return res.status(400).json({ success: false, error: 'Side must be buy or sell' });
    }
    try {
        const trade = new Trade({ user_id, symbol, qty, price, side });
        await trade.save();
        let portfolio = await Portfolio.findOne({ user_id });
        if (!portfolio) {
            portfolio = new Portfolio({ user_id, balance: 100000 });
        }
        const tradeValue = qty * price;
        if (side === 'buy') {
            if (portfolio.balance < tradeValue) {
                return res.status(400).json({ success: false, error: 'Insufficient funds' });
            }
            portfolio.balance -= tradeValue;
            const currentPosition = portfolio.positions.get(symbol) || 0;
            portfolio.positions.set(symbol, currentPosition + qty);
        } else {
            const currentPosition = portfolio.positions.get(symbol) || 0;
            if (currentPosition < qty) {
                return res.status(400).json({ success: false, error: 'Insufficient shares' });
            }
            portfolio.balance += tradeValue;
            portfolio.positions.set(symbol, currentPosition - qty);
            if (portfolio.positions.get(symbol) === 0) {
                portfolio.positions.delete(symbol);
            }
        }
        portfolio.last_updated = new Date();
        await portfolio.save();
        res.json({ success: true, trade });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to process trade' });
    }
});

app.get('/papertrade/history/:user_id', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        const trades = await Trade.find({ user_id }).sort({ timestamp: -1 });
        res.json({ success: true, history: trades });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch trade history' });
    }
});

app.get('/papertrade/performance/:user_id', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        let portfolio = await Portfolio.findOne({ user_id });
        if (!portfolio) {
            portfolio = new Portfolio({ user_id, balance: 100000 });
            await portfolio.save();
        }
        const positions = {};
        for (const [key, value] of portfolio.positions.entries()) {
            positions[key] = value;
        }
        res.json({ success: true, balance: portfolio.balance, positions, last_updated: portfolio.last_updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch portfolio performance' });
    }
});

// Add keep-alive to the Express server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Set timeout on the server to be higher
server.setTimeout(60000); // 60 seconds timeout