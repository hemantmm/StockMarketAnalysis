from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from model import train_model
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

@app.post("/predict")
async def predict_price(request: Request):
    data = await request.json()
    prices = data.get("prices", [])
    
    if not prices or len(prices) < 2:
        return {"error": "No prices provided"}
    
    prediction_price = train_model(prices)
    return {"prediction_price": prediction_price}


# @app.post("/set-alert")
# def set_alert(alert: Alert):
#     with open("alerts.json", "r+") as f:
#         alerts=json.load(f)
#         alerts.append(alert.dict())
#         f.seek(0)
#         json.dump(alerts, f, indent=2)
#     return {"message": "Alert set successfully"}

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
        # If file doesn't exist, create and write initial list
        with open("alert_store.json", "w") as f:
            json.dump([alert.dict()], f, indent=2)
    return {"message": "Alert saved!"}

# source venv/bin/activate
# uvicorn main:app --reload
