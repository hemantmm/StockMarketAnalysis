from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HoldAdviceRequest(BaseModel):
    stock: str
    buy_price: float
    current_price: float
    holding_period: int  # in days
    prices: list[float] = []

def train_hold_classifier():
    X = np.array([
        [10, 1], [20, 1], [30, 0], [40, 0], [60, 1], [90, 1], [120, 0], [180, 1]
    ])
    y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression()
    clf.fit(X, y)
    return clf

def get_hold_advice(holding_period, price_trend):
    clf = train_hold_classifier()
    pred = clf.predict(np.array([[holding_period, price_trend]]))[0]
    return "Sell" if pred == 1 else "Hold"

def get_target_price(current_price, holding_period, price_trend, recommendation):
    if recommendation == "Sell":
        return None
    target_prices = {}
    short_term_multiplier = 1.03 + (0.02 if price_trend == 1 else 0.01)
    target_prices["short_term"] = round(current_price * short_term_multiplier, 2)
    medium_term_multiplier = 1.08 + (0.04 if price_trend == 1 else 0.02)
    target_prices["medium_term"] = round(current_price * medium_term_multiplier, 2)
    long_term_multiplier = 1.15 + (0.05 if price_trend == 1 else 0.03)
    target_prices["long_term"] = round(current_price * long_term_multiplier, 2)
    return target_prices

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Hold Stock API is running"}

@app.post("/hold-advice")
async def hold_advice(request: HoldAdviceRequest):
    try:
        stock = request.stock
        buy_price = request.buy_price
        current_price = request.current_price
        holding_period = request.holding_period
        prices = request.prices
        price_trend = 1 if len(prices) > 1 and prices[-1] > prices[0] else 0
        recommendation = get_hold_advice(holding_period, price_trend)
        target_prices = get_target_price(current_price, holding_period, price_trend, recommendation)
        advice = f"Recommendation: {recommendation}"
        return {"advice": advice, "target_prices": target_prices, "recommendation": recommendation}
    except Exception as e:
        return {"error": str(e), "advice": "Error processing request"}
