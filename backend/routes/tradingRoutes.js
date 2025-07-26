const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// MongoDB models
const Trade = mongoose.model('Trade', new mongoose.Schema({
  userId: { type: String, required: true },
  symbol: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  timestamp: { type: Date, default: Date.now }
}));

const Portfolio = mongoose.model('Portfolio', new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 100000 },
  positions: { type: Map, of: Number, default: {} }
}));

// Place a trade
router.post('/trade', async (req, res) => {
  try {
    const { userId, symbol, qty, price, side } = req.body;
    
    // Validate inputs
    if (!userId || !symbol || !qty || !price || !side) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Get or create portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId, balance: 100000, positions: {} });
    }
    
    // Check if user has enough shares to sell
    if (side === 'sell') {
      const currentQty = portfolio.positions.get(symbol) || 0;
      if (currentQty < qty) {
        return res.status(400).json({ 
          success: false, 
          error: `Not enough shares to sell. You have ${currentQty} ${symbol} shares.` 
        });
      }
    }
    
    // Check if user has enough balance to buy
    const tradeValue = qty * price;
    if (side === 'buy' && portfolio.balance < tradeValue) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient funds. Required: ${tradeValue}, Available: ${portfolio.balance}` 
      });
    }
    
    // Execute trade
    if (side === 'buy') {
      // Deduct balance
      portfolio.balance -= tradeValue;
      
      // Add to position
      const currentQty = portfolio.positions.get(symbol) || 0;
      portfolio.positions.set(symbol, currentQty + qty);
    } else { // sell
      // Add to balance
      portfolio.balance += tradeValue;
      
      // Reduce position
      const currentQty = portfolio.positions.get(symbol);
      portfolio.positions.set(symbol, currentQty - qty);
    }
    
    // Save portfolio changes
    await portfolio.save();
    
    // Record the trade
    const trade = new Trade({
      userId,
      symbol,
      qty,
      price,
      side,
      timestamp: new Date()
    });
    
    await trade.save();
    
    return res.json({
      success: true,
      message: `Successfully ${side === 'buy' ? 'bought' : 'sold'} ${qty} shares of ${symbol}`,
      trade
    });
    
  } catch (error) {
    console.error('Trade error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred while processing the trade' 
    });
  }
});

// Get trade history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Trade.find({ userId })
      .sort({ timestamp: -1 })
      .lean();
    
    res.json({ history });
    
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trade history' 
    });
  }
});

// Get portfolio
router.get('/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let portfolio = await Portfolio.findOne({ userId }).lean();
    if (!portfolio) {
      portfolio = { userId, balance: 100000, positions: {} };
      await Portfolio.create(portfolio);
    }
    
    // Convert Map to plain object for JSON response
    const positions = {};
    if (portfolio.positions instanceof Map) {
      for (const [key, value] of portfolio.positions.entries()) {
        positions[key] = value;
      }
    } else if (typeof portfolio.positions === 'object') {
      Object.assign(positions, portfolio.positions);
    }
    
    res.json({
      userId: portfolio.userId,
      balance: portfolio.balance,
      positions
    });
    
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio' 
    });
  }
});

// Add funds
router.post('/add-funds', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    // Validate input
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input' 
      });
    }
    
    // Get or create portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId, balance: 100000, positions: {} });
    }
    
    // Add funds
    portfolio.balance += amount;
    await portfolio.save();
    
    res.json({
      success: true,
      message: `Successfully added ${amount} to your account`,
      newBalance: portfolio.balance
    });
    
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add funds' 
    });
  }
});

module.exports = router;
