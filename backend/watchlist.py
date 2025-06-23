import json
import os
from typing import List, Dict, Any, Optional

# Path to the watchlist JSON file
WATCHLIST_PATH = "watchlist.json"

def _load_watchlist() -> List[Dict[str, Any]]:
    """Load the watchlist from the JSON file. Create if it doesn't exist."""
    try:
        if os.path.exists(WATCHLIST_PATH):
            with open(WATCHLIST_PATH, "r") as f:
                return json.load(f)
        else:
            # Create an empty watchlist file
            with open(WATCHLIST_PATH, "w") as f:
                json.dump([], f, indent=2)
            return []
    except Exception as e:
        print(f"Error loading watchlist: {e}")
        return []

def _save_watchlist(watchlist_data: List[Dict[str, Any]]) -> bool:
    """Save the watchlist data to the JSON file."""
    try:
        with open(WATCHLIST_PATH, "w") as f:
            json.dump(watchlist_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving watchlist: {e}")
        return False

def add_to_watchlist(user_id: str, stock_symbol: str, stock_name: str) -> Dict[str, Any]:
    """Add a stock to a user's watchlist."""
    watchlist_data = _load_watchlist()
    
    # Check if this stock is already in the user's watchlist
    for item in watchlist_data:
        if item.get("user_id") == user_id and item.get("stock_symbol") == stock_symbol:
            return {
                "success": False, 
                "message": "Stock is already in watchlist"
            }
    
    # Add the stock to the watchlist
    watchlist_data.append({
        "user_id": user_id,
        "stock_symbol": stock_symbol,
        "stock_name": stock_name
    })
    
    # Save the updated watchlist
    if _save_watchlist(watchlist_data):
        return {
            "success": True,
            "message": "Stock added to watchlist"
        }
    else:
        return {
            "success": False,
            "message": "Failed to save watchlist"
        }

def remove_from_watchlist(user_id: str, stock_symbol: str, stock_name: str) -> Dict[str, Any]:
    """Remove a stock from a user's watchlist."""
    watchlist_data = _load_watchlist()
    
    original_length = len(watchlist_data)
    
    # Filter out the stock to remove
    watchlist_data = [
        item for item in watchlist_data 
        if not (item.get("user_id") == user_id and item.get("stock_symbol") == stock_symbol)
    ]
    
    if len(watchlist_data) == original_length:
        return {
            "success": False,
            "message": "Stock not found in watchlist"
        }
    
    # Save the updated watchlist
    if _save_watchlist(watchlist_data):
        return {
            "success": True,
            "message": "Stock removed from watchlist"
        }
    else:
        return {
            "success": False,
            "message": "Failed to save watchlist"
        }

def get_user_watchlist(user_id: str) -> List[Dict[str, Any]]:
    """Get all stocks in a user's watchlist."""
    watchlist_data = _load_watchlist()
    
    # Filter for items belonging to the specified user
    user_watchlist = [
        item for item in watchlist_data
        if item.get("user_id") == user_id
    ]
    
    return user_watchlist

def is_in_watchlist(user_id: str, stock_symbol: str) -> bool:
    """Check if a stock is in a user's watchlist."""
    watchlist_data = _load_watchlist()
    
    # Check if the stock exists in the user's watchlist
    for item in watchlist_data:
        if item.get("user_id") == user_id and item.get("stock_symbol") == stock_symbol:
            return True
    
    return False
