import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression

def train_model(prices:list):
    X = np.array(range(len(prices))).reshape(-1, 1)
    y = np.array(prices).reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    next_day = np.array([[len(prices)]])
    prediction_price = model.predict(next_day)
    return prediction_price[0][0]

def train_hold_classifier():
    # Dummy training data: [holding_period, price_trend], label (0=Hold, 1=Sell)
    X = np.array([
        [10, 1], [20, 1], [30, 0], [40, 0], [60, 1], [90, 1], [120, 0], [180, 1]
    ])
    y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    clf = LogisticRegression()
    clf.fit(X, y)
    return clf

def get_hold_advice(holding_period, price_trend):
    clf = train_hold_classifier()
    pred = clf.predict(np.array([[holding_period, price_trend]]))[0]
    return "Sell" if pred == 1 else "Hold"

def get_price_at_holding_period(prices, holding_period):
    if not prices or len(prices) < 2:
        return None
    X = np.array(range(len(prices))).reshape(-1, 1)
    y = np.array(prices).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    # Predict price at the holding period from now
    day = len(prices) + holding_period - 1
    pred = model.predict(np.array([[day]]))[0][0]
    return round(float(pred), 2)

def get_target_price(current_price, holding_period, price_trend, recommendation):
    """
    Generate target price(s) based on recommendation and market conditions
    Uses current market price as base for target price calculation
    Returns None for Sell recommendations, multiple prices for Hold
    """
    if recommendation == "Sell":
        # No target prices for sell recommendations
        return None
    
    # For Hold recommendations, provide multiple target prices
    target_prices = {}
    
    # Short-term target (1-3 months)
    short_term_multiplier = 1.03 + (0.02 if price_trend == 1 else 0.01)  # 3-5% gain
    target_prices["short_term"] = round(current_price * short_term_multiplier, 2)
    
    # Medium-term target (3-6 months)
    medium_term_multiplier = 1.08 + (0.04 if price_trend == 1 else 0.02)  # 8-12% gain
    target_prices["medium_term"] = round(current_price * medium_term_multiplier, 2)
    
    # Long-term target (6+ months)
    long_term_multiplier = 1.15 + (0.05 if price_trend == 1 else 0.03)  # 15-20% gain
    target_prices["long_term"] = round(current_price * long_term_multiplier, 2)
    
    return target_prices

def get_stock_recommendation(prices):
    """
    Analyze stock prices and recommend buy/sell/hold
    
    Args:
        prices (list): List of historical prices
        
    Returns:
        dict: Recommendation information with action and confidence
    """
    if len(prices) < 5:
        return {"action": "Hold", "confidence": "Low", "reason": "Not enough historical data"}
    
    # Prepare data for linear regression
    X = np.arange(len(prices)).reshape(-1, 1)
    y = np.array(prices)
    
    # Train model
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict future price (next period)
    next_period = len(prices)
    predicted_price = model.predict(np.array([[next_period]]))[0]
    
    # Calculate percent change from last price
    last_price = prices[-1]
    pct_change = ((predicted_price - last_price) / last_price) * 100
    
    # Determine trend strength
    slope = model.coef_[0]
    abs_slope = abs(slope)
    
    # Generate recommendation
    confidence = "Medium"
    if abs_slope > np.std(prices) / 10:
        confidence = "High" 
    elif abs_slope < np.std(prices) / 20:
        confidence = "Low"
        
    if pct_change > 3:
        action = "Buy"
        reason = f"Upward trend detected with {pct_change:.2f}% expected gain"
    elif pct_change < -3:
        action = "Sell"
        reason = f"Downward trend detected with {abs(pct_change):.2f}% expected loss"
    else:
        action = "Hold"
        reason = "No significant trend detected"
        
    return {
        "action": action,
        "confidence": confidence,
        "reason": reason
    }