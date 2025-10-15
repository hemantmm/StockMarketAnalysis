from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model import train_model, get_hold_advice, get_price_at_holding_period, get_target_price, get_stock_recommendation
from pydantic import BaseModel
import json
from watchlist import add_to_watchlist, remove_from_watchlist, get_user_watchlist, is_in_watchlist
from indianstock_api import get_watchlist_data
from fastapi.responses import JSONResponse, Response
import os
import papertrading
import csv
import io

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://stock-market-analysis-five-lake.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fix CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://stock-market-analysis-five-lake.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

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

@app.post("/predict")
async def predict_prices(request: Request):
    try:
        data = await request.json()
        prices = data.get("prices", [])
        
        if not prices or len(prices) < 2:
            return {"error": "Insufficient price data provided"}
            
        # Your prediction logic here
        # ...existing code...
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/api/stock-recommendation")
async def recommend_stock(request: Request):
    try:
        data = await request.json()
        symbol = data.get('symbol', '').upper()
        prices = data.get('prices', [])
        period = data.get('period', '1m')  # Get the selected period
        
        print(f"Received request for {symbol} with {len(prices)} price points, period: {period}")
        
        if not prices or len(prices) < 2:
            return JSONResponse(
                status_code=400,
                content={"error": "Insufficient price data"}
            )
        
        recommendation = get_stock_recommendation(prices)
        
        # Adjust confidence based on the period
        if period == "max":
            confidence_boost = "High"
        elif period in ["3yr", "5yr", "10yr"]:
            confidence_boost = "Medium-High"
        elif period in ["1yr"]:
            confidence_boost = "Medium"
        else:  # Short periods like 1m, 3m, 6m
            confidence_boost = "Medium-Low"
            
        # Only override if the confidence is lower than the boost
        confidence_levels = {"Low": 1, "Medium-Low": 2, "Medium": 3, "Medium-High": 4, "High": 5}
        if confidence_levels.get(recommendation['confidence'], 0) < confidence_levels.get(confidence_boost, 0):
            recommendation['confidence'] = confidence_boost
            
        response = {
            'symbol': symbol,
            'recommendation': recommendation['action'],
            'confidence': recommendation['confidence'],
            'reason': recommendation['reason'],
            'period': period
        }
        print(f"Recommendation for {symbol} ({period}): {response}")
        return response
    except Exception as e:
        import traceback
        print(f"Error generating recommendation: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"Analysis failed: {str(e)}"}
        )

class TradeRequest(BaseModel):
    userId: str
    symbol: str
    qty: int
    price: float
    side: str

class FundsRequest(BaseModel):
    userId: str
    amount: float

@app.get("/")
def read_root():
    return {"message": "Trading API is running"}

@app.post("/trading/trade")
def place_trade(trade: TradeRequest):
    result = papertrading.place_trade(
        trade.userId, 
        trade.symbol, 
        trade.qty, 
        trade.price, 
        trade.side
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "success": True,
        "message": f"Successfully {'bought' if trade.side == 'buy' else 'sold'} {trade.qty} shares of {trade.symbol}",
        "trade": {
            "userId": trade.userId,
            "symbol": trade.symbol,
            "qty": trade.qty,
            "price": trade.price,
            "side": trade.side
        }
    }

@app.get("/trading/history/{user_id}")
def get_history(user_id: str):
    history = papertrading.get_trading_history(user_id)
    return {"history": history}

@app.get("/trading/portfolio/{user_id}")
def get_portfolio(user_id: str):
    performance = papertrading.get_performance(user_id)
    return {
        "userId": user_id,
        "balance": performance["balance"],
        "positions": performance["positions"]
    }

@app.post("/trading/add-funds")
def add_funds(request: FundsRequest):
    data = papertrading.load_data()
    user = data.setdefault(request.userId, {'balance': 100000, 'trades': [], 'positions': {}})
    user['balance'] += request.amount
    papertrading.save_data(data)
    
    return {
        "success": True,
        "message": f"Successfully added {request.amount} to your account",
        "newBalance": user['balance']
    }

@app.get("/export/portfolio/{user_id}")
def export_portfolio_csv(user_id: str):
    performance = papertrading.get_performance(user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Symbol", "Quantity"])
    for symbol, qty in performance["positions"].items():
        writer.writerow([symbol, qty])
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=portfolio_{user_id}.csv"})

@app.get("/export/watchlist/{user_id}")
def export_watchlist_csv(user_id: str):
    watchlist = get_user_watchlist(user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Stock Symbol", "Stock Name"])
    for item in watchlist:
        writer.writerow([item["stock_symbol"], item["stock_name"]])
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=watchlist_{user_id}.csv"})

@app.get("/export/tradehistory/{user_id}")
def export_tradehistory_csv(user_id: str):
    history = papertrading.get_trading_history(user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Symbol", "Qty", "Price", "Side", "Timestamp"])
    for trade in history:
        writer.writerow([trade["symbol"], trade["qty"], trade["price"], trade["side"], trade["timestamp"]])
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=tradehistory_{user_id}.csv"})

@app.post("/import/portfolio/{user_id}")
async def import_portfolio_csv(user_id: str, file: UploadFile = File(...)):
    content = await file.read()
    reader = csv.reader(io.StringIO(content.decode()))
    next(reader, None)  # skip header
    data = papertrading.load_data()
    user = data.setdefault(user_id, {'balance': 100000, 'trades': [], 'positions': {}})
    for row in reader:
        if len(row) >= 2:
            symbol, qty = row[0], int(row[1])
            user['positions'][symbol] = qty
    papertrading.save_data(data)
    return {"success": True, "message": "Portfolio imported"}

@app.post("/import/watchlist/{user_id}")
async def import_watchlist_csv(user_id: str, file: UploadFile = File(...)):
    content = await file.read()
    reader = csv.reader(io.StringIO(content.decode()))
    next(reader, None)  # skip header
    from watchlist import _load_watchlist, _save_watchlist
    watchlist_data = _load_watchlist()
    for row in reader:
        if len(row) >= 2:
            stock_symbol, stock_name = row[0], row[1]
            watchlist_data.append({"user_id": user_id, "stock_symbol": stock_symbol, "stock_name": stock_name})
    _save_watchlist(watchlist_data)
    return {"success": True, "message": "Watchlist imported"}

@app.post("/import/tradehistory/{user_id}")
async def import_tradehistory_csv(user_id: str, file: UploadFile = File(...)):
    content = await file.read()
    reader = csv.reader(io.StringIO(content.decode()))
    next(reader, None)  # skip header
    data = papertrading.load_data()
    user = data.setdefault(user_id, {'balance': 100000, 'trades': [], 'positions': {}})
    for row in reader:
        if len(row) >= 5:
            symbol, qty, price, side, timestamp = row
            user['trades'].append({
                'symbol': symbol,
                'qty': int(qty),
                'price': float(price),
                'side': side,
                'timestamp': timestamp
            })
    papertrading.save_data(data)
    return {"success": True, "message": "Trade history imported"}

# source venv/bin/activate
# uvicorn main:app --reload
