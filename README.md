# MarketSense: AI-Powered Stock Market Analysis Platform

MarketSense is an advanced, open-source stock market analysis platform powered by AI and machine learning. It provides real-time insights, predictive analytics, intelligent recommendations, and a suite of trading simulation tools for both beginners and experienced traders.

## Features

- **AI Stock Analysis**: Get predictive insights and recommendations for stocks using advanced AI models.
- **Trading Simulator**: Practice trading with virtual money using the paper trading module.
- **Portfolio Management**: Track your holdings, performance, and trade history.
- **Watchlist**: Add stocks to your watchlist and monitor their performance.
- **Smart Price Alerts**: Set up email alerts for target stock prices.
- **Active Stocks & Market Data**: View trending and active stocks in real time.
- **Hold/Sell Advisory**: Get expert advice on whether to hold or sell your stocks.
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python)
- **Machine Learning**: Custom models for price prediction and recommendations
- **Database**: MongoDB
- **Authentication**: Local storage

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.8+
- npm or yarn

### Setup

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/marketsense.git
cd marketsense
```

#### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

#### 3. Install Backend Dependencies

```bash
cd ../backend
pip install -r requirements.txt
```

#### 4. Start the Backend Server

```bash
uvicorn main:app --reload
```

The backend will run on [http://localhost:8000](http://localhost:8000) by default.

#### 5. Start the Frontend

```bash
cd ../frontend
npm run dev
# or
yarn dev
```

The frontend will run on [http://localhost:3000](http://localhost:3000).

## Usage

- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Register or log in to access trading and portfolio features.
- Explore stock analysis, trading simulator, watchlist, and more.

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or improvements.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://react.dev/)
- [Vercel](https://vercel.com/)

---

*MarketSense: Empowering smarter trading decisions with AI.*
