from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import train_model, get_hold_advice, get_price_at_holding_period, get_target_price, get_stock_recommendation
from pydantic import BaseModel
import json
from watchlist import add_to_watchlist, remove_from_watchlist, get_user_watchlist, is_in_watchlist
from indianstock_api import get_watchlist_data
from fastapi.responses import JSONResponse

app = FastAPI()

# Fix CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://stock-market-analysis-five-lake.vercel.app",
        "https://stock-market-analysis-five-lake-git-main-hemantmehta.vercel.app"
    ],
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

# source venv/bin/activate
# uvicorn main:app --reload
