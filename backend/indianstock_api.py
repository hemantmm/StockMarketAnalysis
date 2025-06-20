import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("INDIAN_API_KEY")

def get_stock_info(stock_symbol):
    """Get information about a stock from the Indian Stock API"""
    url = "https://stock.indianapi.in/stock"
    
    headers = {
        "X-Api-Key": API_KEY
    }
    
    params = {
        "name": stock_symbol
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data
    except Exception as e:
        print(f"Error fetching stock info: {e}")
        return None

def get_watchlist_data(stock_symbols):
    """Get data for multiple stocks"""
    result = {}
    
    for symbol in stock_symbols:
        stock_data = get_stock_info(symbol)
        if stock_data:
            result[symbol] = stock_data
    
    return result
