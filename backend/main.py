from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from model import train_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_price(request: Request):
    data = await request.json()
    prices = data.get("prices", [])
    
    if not prices or len(prices) < 2:
        return {"error": "No prices provided"}
    
    prediction_price = train_model(prices)
    return {"prediction_price": prediction_price}

# source venv/bin/activate
# uvicorn main:app --reload