const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Trade schema (if not already defined in server.js)
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

// Portfolio schema (if not already defined in server.js)
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

// Create models if they don't exist in the main server file
let Trade;
let Portfolio;

try {
  Trade = mongoose.model('Trade');
} catch (e) {
  Trade = mongoose.model('Trade', tradeSchema);
}

try {
  Portfolio = mongoose.model('Portfolio');
} catch (e) {
  Portfolio = mongoose.model('Portfolio', portfolioSchema);
}

// Authentication middleware (if not imported from server.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ message: 'Authentication required' });
  
  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Place trade
router.post('/trade', authenticateToken, async (req, res) => {
  console.log('Received trade request:', req.body);
  const { user_id, symbol, qty, price, side } = req.body;
  
  // Input validation
  if (!user_id || !symbol || !qty || !price || !side) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  if (qty <= 0 || price <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Quantity and price must be positive numbers' 
    });
  }
  
  if (side !== 'buy' && side !== 'sell') {
    return res.status(400).json({ 
      success: false, 
      error: 'Side must be buy or sell' 
    });
  }
  
  try {
    // Create the trade
    const trade = new Trade({
      user_id,
      symbol,
      qty,
      price,
      side
    });
    
    // Save the trade
    const savedTrade = await trade.save();
    console.log('Trade saved:', savedTrade._id);
    
    // Update portfolio
    let portfolio = await Portfolio.findOne({ user_id });
    
    // Create portfolio if it doesn't exist
    if (!portfolio) {
      console.log('Creating new portfolio for user:', user_id);
      portfolio = new Portfolio({ user_id, balance: 100000 });
    }
    
    const tradeValue = qty * price;
    
    if (side === 'buy') {
      // Check if user has enough balance
      if (portfolio.balance < tradeValue) {
        return res.status(400).json({ success: false, error: 'Insufficient funds' });
      }
      
      // Update balance
      portfolio.balance -= tradeValue;
      
      // Update positions
      const currentPosition = portfolio.positions.get(symbol) || 0;
      portfolio.positions.set(symbol, currentPosition + qty);
    } else {
      // Check if user has enough shares
      const currentPosition = portfolio.positions.get(symbol) || 0;
      if (currentPosition < qty) {
        return res.status(400).json({ success: false, error: 'Insufficient shares' });
      }
      
      // Update balance
      portfolio.balance += tradeValue;
      
      // Update positions
      portfolio.positions.set(symbol, currentPosition - qty);
      
      // Remove position if quantity is 0
      if (portfolio.positions.get(symbol) === 0) {
        portfolio.positions.delete(symbol);
      }
    }
    
    portfolio.last_updated = new Date();
    await portfolio.save();
    
    res.json({ success: true, trade: savedTrade });
  } catch (error) {
    console.error('Error processing trade:', error);
    res.status(500).json({ success: false, error: 'Failed to process trade' });
  }
});

// Get trade history
router.get('/history/:user_id', authenticateToken, async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const trades = await Trade.find({ user_id }).sort({ timestamp: -1 });
    res.json({ success: true, history: trades });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trade history' });
  }
});

// Get portfolio performance
router.get('/performance/:user_id', authenticateToken, async (req, res) => {
  const { user_id } = req.params;
  
  try {
    let portfolio = await Portfolio.findOne({ user_id });
    
    // Create portfolio if it doesn't exist
    if (!portfolio) {
      portfolio = new Portfolio({ user_id, balance: 100000 });
      await portfolio.save();
    }
    
    // Convert positions Map to regular object
    const positions = {};
    for (const [key, value] of portfolio.positions.entries()) {
      positions[key] = value;
    }
    
    res.json({ 
      success: true, 
      balance: portfolio.balance, 
      positions,
      last_updated: portfolio.last_updated
    });
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch portfolio performance' });
  }
});

module.exports = router;
