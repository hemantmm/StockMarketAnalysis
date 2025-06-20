from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from typing import List, Dict, Optional

router = APIRouter()

WATCHLIST_FILE = "watchlist.json"

class WatchlistItem(BaseModel):
    user_id: str
    stock_symbol: str
    stock_name: str

class WatchlistResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List] = None

def load_watchlist() -> List[Dict]:
    """Load the watchlist from the JSON file"""
    if os.path.exists(WATCHLIST_FILE):
        try:
            with open(WATCHLIST_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_watchlist(watchlist: List[Dict]) -> None:
    """Save the watchlist to the JSON file"""
    with open(WATCHLIST_FILE, "w") as f:
        json.dump(watchlist, f, indent=2)

@router.post("/add")
async def add_to_watchlist(item: WatchlistItem) -> WatchlistResponse:
    """Add a stock to the watchlist"""
    watchlist = load_watchlist()
    
    for existing in watchlist:
        if existing["user_id"] == item.user_id and existing["stock_symbol"] == item.stock_symbol:
            return WatchlistResponse(success=True, message="Stock already in watchlist")
    
    watchlist.append(item.dict())
    save_watchlist(watchlist)
    
    return WatchlistResponse(success=True, message="Stock added to watchlist")

@router.post("/remove")
async def remove_from_watchlist(item: WatchlistItem) -> WatchlistResponse:
    """Remove a stock from the watchlist"""
    watchlist = load_watchlist()
    
    updated_watchlist = [
        stock for stock in watchlist 
        if not (stock["user_id"] == item.user_id and stock["stock_symbol"] == item.stock_symbol)
    ]
    
    if len(updated_watchlist) < len(watchlist):
        save_watchlist(updated_watchlist)
        return WatchlistResponse(success=True, message="Stock removed from watchlist")
    else:
        return WatchlistResponse(success=False, message="Stock not found in watchlist")

@router.get("/list/{user_id}")
async def get_user_watchlist(user_id: str) -> WatchlistResponse:
    """Get the watchlist for a specific user"""
    watchlist = load_watchlist()
    
    user_watchlist = [stock for stock in watchlist if stock["user_id"] == user_id]
    
    return WatchlistResponse(
        success=True,
        message="Watchlist retrieved successfully",
        data=user_watchlist
    )

@router.get("/check/{user_id}/{stock_symbol}")
async def check_in_watchlist(user_id: str, stock_symbol: str) -> WatchlistResponse:
    """Check if a stock is in a user's watchlist"""
    watchlist = load_watchlist()
    
    for item in watchlist:
        if item["user_id"] == user_id and item["stock_symbol"] == stock_symbol:
            return WatchlistResponse(success=True, message="Stock is in watchlist", data=True)
    
    return WatchlistResponse(success=True, message="Stock is not in watchlist", data=False)
