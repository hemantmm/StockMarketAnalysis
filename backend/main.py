from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from model import train_model, get_hold_advice, get_price_at_holding_period, get_target_price
from pydantic import BaseModel
import json
from watchlist import add_to_watchlist, remove_from_watchlist, get_user_watchlist, is_in_watchlist
from indianstock_api import get_watchlist_data
from papertrading import place_trade, get_trading_history, get_performance, backtest_strategy

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Alert(BaseModel):
    stock: str
    target_price: float
    email: str

class HoldAdviceRequest(BaseModel):
    stock: str
    buy_price: float
    current_price: float
    holding_period: int  # in days
    prices: list[float] = []

class LoginRequest(BaseModel):
    email: str
    password: str

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

# User storage (in production, use a proper database)
users_db = {}

@app.post("/predict")
async def predict_price(request: Request):
    data = await request.json()
    prices = data.get("prices", [])
    
    if not prices or len(prices) < 2:
        return {"error": "No prices provided"}
    
    prediction_price = train_model(prices)
    return {"prediction_price": prediction_price}

@app.post("/set-alert")
def set_alert(alert: Alert):
    try:
        with open("alert_store.json", "r+") as f:
            alerts = json.load(f)
            alerts.append(alert.dict())
            f.seek(0)
            json.dump(alerts, f, indent=2)
            f.truncate()
    except FileNotFoundError:
        with open("alert_store.json", "w") as f:
            json.dump([alert.dict()], f, indent=2)
    return {"message": "Alert saved!"}

@app.post("/hold-advice")
async def hold_advice(request: HoldAdviceRequest):
    try:
        stock = request.stock
        buy_price = request.buy_price
        current_price = request.current_price
        holding_period = request.holding_period
        prices = request.prices
        # Use price trend from real data
        price_trend = 1 if len(prices) > 1 and prices[-1] > prices[0] else 0
        recommendation = get_hold_advice(holding_period, price_trend)
        # Generate target prices using AI model with current price
        target_prices = get_target_price(current_price, holding_period, price_trend, recommendation)
        advice = f"Recommendation: {recommendation}"
        return {"advice": advice, "target_prices": target_prices, "recommendation": recommendation}
    except Exception as e:
        return {"error": str(e), "advice": "Error processing request"}

# Watchlist API endpoints
class WatchlistItem(BaseModel):
    user_id: str
    stock_symbol: str
    stock_name: str

@app.post("/watchlist/add")
async def add_to_watchlist_endpoint(item: WatchlistItem):
    result = add_to_watchlist(item.user_id, item.stock_symbol, item.stock_name)
    return result

@app.post("/watchlist/remove")
async def remove_from_watchlist_endpoint(item: WatchlistItem):
    result = remove_from_watchlist(item.user_id, item.stock_symbol, item.stock_name)
    return result

@app.get("/watchlist/list/{user_id}")
async def get_watchlist_endpoint(user_id: str):
    watchlist = get_user_watchlist(user_id)
    return {"success": True, "data": watchlist}

@app.get("/watchlist/check/{user_id}/{stock_symbol}")
async def check_in_watchlist_endpoint(user_id: str, stock_symbol: str):
    result = is_in_watchlist(user_id, stock_symbol)
    return {"success": True, "data": result}

@app.get("/watchlist/data/{user_id}")
async def get_watchlist_data_endpoint(user_id: str):
    # Get user's watchlist
    watchlist = get_user_watchlist(user_id)
    
    # Extract stock symbols
    stock_symbols = [item["stock_symbol"] for item in watchlist]
    
    # Fetch data for each stock in the watchlist
    stock_data = get_watchlist_data(stock_symbols)
    
    return {"success": True, "data": stock_data}

# Paper trading endpoints
class TradeRequest(BaseModel):
    user_id: str
    symbol: str
    qty: int
    price: float
    side: str  # 'buy' or 'sell'

@app.post("/papertrade/trade")
async def paper_trade(request: TradeRequest):
    result = place_trade(request.user_id, request.symbol, request.qty, request.price, request.side)
    return result

@app.get("/papertrade/history/{user_id}")
async def paper_trade_history(user_id: str):
    return {"history": get_trading_history(user_id)}

@app.get("/papertrade/performance/{user_id}")
async def paper_trade_performance(user_id: str):
    return get_performance(user_id)

class BacktestRequest(BaseModel):
    prices: list[float]
    initial_balance: float = 1000000

@app.post("/papertrade/backtest")
async def paper_trade_backtest(request: BacktestRequest):
    return backtest_strategy(request.prices, request.initial_balance)

@app.post("/Login")
async def login(request: LoginRequest):
    try:
        email = request.email.lower().strip()
        password = request.password
        
        # Check if user exists and password matches
        if email in users_db and users_db[email]["password"] == password:
            return {
                "success": True,
                "message": "Login successful",
                "user": {
                    "name": users_db[email]["name"],
                    "email": email
                }
            }
        else:
            return {
                "success": False,
                "message": "Invalid email or password"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Login failed: {str(e)}"
        }

@app.post("/SignUp")
async def signup(request: SignUpRequest):
    try:
        name = request.name.strip()
        email = request.email.lower().strip()
        password = request.password
        
        # Check if user already exists
        if email in users_db:
            return {
                "success": False,
                "message": "User with this email already exists"
            }
        
        # Create new user
        users_db[email] = {
            "name": name,
            "password": password
        }
        
        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "name": name,
                "email": email
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"SignUp failed: {str(e)}"
        }

# source venv/bin/activate
# uvicorn main:app --reload
