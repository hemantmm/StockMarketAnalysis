from dotenv import load_dotenv

import requests
import json
import smtplib
import schedule
import time
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

API_KEY = os.getenv("INDIAN_API_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def fetch_price(stock):
    url = f"https://stock.indianapi.in/{stock}"
    headers = {
        "X-Api-Key": API_KEY
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return float(data["data"]["price"])
    except Exception as e:
        print(f"Error fetching price for {stock}: {e}")
        raise

def send_email(to, subject, body):
    try:
        print(f"Attempting to send email to {to}")
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        print("Login successful")

        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server.send_message(msg)
        server.quit()
        print(f"Email sent to {to}")
    except Exception as e:
        print(f"❌ Error sending email to {to}: {e}")

def check_alerts():
    try:
        with open("alert_store.json", "r+") as f:
            alerts = json.load(f)
            remaining = []
            for alert in alerts:
                try:
                    price = fetch_price(alert["stock"])
                    if price >= alert["target_price"]:
                        send_email(
                            alert["email"],
                            f"📈 Stock Alert: {alert['stock']}",
                            f"🎯 Target reached! {alert['stock']} is now ₹{price:.2f}"
                        )
                    else:
                        remaining.append(alert)
                except Exception as e:
                    print(f"Error processing alert for {alert['stock']}: {e}")
                    remaining.append(alert)

            f.seek(0)
            f.truncate()
            json.dump(remaining, f, indent=2)
    except Exception as e:
        print(f"Error loading alert_store.json: {e}")

def start_scheduler():
    schedule.every(5).minutes.do(check_alerts)
    print("📅 Scheduler started... Monitoring alerts every 5 minutes.")
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_scheduler()
