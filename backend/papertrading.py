# Paper trading module for virtual trading, history, and backtesting
import json
import os
from datetime import datetime
from typing import List, Dict

DATA_FILE = 'papertrading_store.json'

# Helper to load/save data
def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Place a virtual trade
def place_trade(user_id: str, symbol: str, qty: int, price: float, side: str):
    data = load_data()
    user = data.setdefault(user_id, {'balance': 100000, 'trades': [], 'positions': {}})
    if 'balance' not in user or user['balance'] > 1000000 or user['balance'] == 1000000:
        user['balance'] = 100000
    cost = qty * price
    if side == 'buy':
        if user['balance'] < cost:
            return {'success': False, 'error': 'Insufficient balance'}
        user['balance'] -= cost
        user['positions'][symbol] = user['positions'].get(symbol, 0) + qty
    elif side == 'sell':
        if user['positions'].get(symbol, 0) < qty:
            return {'success': False, 'error': 'Not enough shares'}
        user['balance'] += cost
        user['positions'][symbol] -= qty
    else:
        return {'success': False, 'error': 'Invalid side'}
    user['trades'].append({
        'symbol': symbol,
        'qty': qty,
        'price': price,
        'side': side,
        'timestamp': datetime.utcnow().isoformat()
    })
    save_data(data)
    return {'success': True, 'balance': user['balance'], 'positions': user['positions']}

# Get trading history
def get_trading_history(user_id: str):
    data = load_data()
    user = data.get(user_id, {'trades': []})
    return user['trades']

# Get portfolio performance
def get_performance(user_id: str):
    data = load_data()
    user = data.get(user_id, {'balance': 100000, 'positions': {}})
    if 'balance' not in user or user['balance'] > 1000000 or user['balance'] == 1000000:
        user['balance'] = 100000
    return {'balance': user['balance'], 'positions': user['positions']}

# Backtest a simple strategy (buy and hold)
def backtest_strategy(prices: List[float], initial_balance: float = 1000000):
    if not prices:
        return {'error': 'No price data'}
    shares = initial_balance // prices[0]
    final_balance = (initial_balance - shares * prices[0]) + shares * prices[-1]
    return {
        'initial_balance': initial_balance,
        'final_balance': final_balance,
        'profit': final_balance - initial_balance
    }
