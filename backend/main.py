from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from model import train_model, get_hold_advice, get_price_at_holding_period, get_target_price
from pydantic import BaseModel
import json

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
    stock = request.stock
    buy_price = request.buy_price
    current_price = request.current_price
    holding_period = request.holding_period
    prices = request.prices
    # Use price trend from real data
    price_trend = 1 if len(prices) > 1 and prices[-1] > prices[0] else 0
    recommendation = get_hold_advice(holding_period, price_trend)
    # Generate target price using AI model with current price
    target_price = get_target_price(current_price, holding_period, price_trend, recommendation)
    advice = f"Recommendation: {recommendation}"
    return {"advice": advice, "target_price": target_price}

# source venv/bin/activate
# uvicorn main:app --reload
