from checker import send_email

send_email("hemant29mehta@gmail.com", "🔔 Stock Alert Test", "✅ Email notification system is working!")

from checker import fetch_price, check_alerts
import json

print("\n📊 Testing price fetching:")
test_stock = "RELIANCE"
price = fetch_price(test_stock)
print(f"Current price of {test_stock}: ₹{price}")

print("\n📝 Testing alert system:")
sample_alert = {
    "stock": "RELIANCE",
    "target_price": 2000.0, 
    "email": "hemant29mehta@gmail.com"
}

with open("alert_store.json", "w") as f:
    json.dump([sample_alert], f, indent=2)

print("Sample alert saved. Running checker...")
check_alerts()

print("\n✅ Test completed!")
