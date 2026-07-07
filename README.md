# 📈 Stock Portfolio Tracker

> A full-stack investment portfolio management platform built with Flask and real-time market data.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![yfinance](https://img.shields.io/badge/yfinance-0.2+-blueviolet?style=flat-square)](https://pypi.org/project/yfinance/)

---

## 📌 Overview

**Stock Portfolio Tracker** is a web application that simulates a personal investment portfolio manager. Users can buy and sell stocks at historical or current prices, track their portfolio value over time, analyze individual asset performance, and visualize portfolio distribution — all powered by live Yahoo Finance data.

The platform supports both **US equities** (AAPL, MSFT, NVDA, etc.) and **Colombian market tickers** (ECO.CL, PFBCOL.CL), making it relevant for local and international investors.

---

## 💡 Why I Built This

I built this project to bridge two areas I'm deeply interested in: **data science and financial analytics**. I wanted to go beyond static analysis and build a live system where real market data drives every interaction.

The challenge was designing a platform that felt complete — not just a script that fetches prices, but a full application with a buy/sell engine, commission logic, historical performance tracking, and interactive charts. Building it pushed me to think about REST API design, object-oriented modeling of financial concepts (assets, portfolios, brokers), and how to present data visually in a meaningful way.

Using Colombian tickers alongside US equities was a deliberate choice: it reflects my interest in applying data tools to local market realities, not just well-documented US datasets.

---

## ✨ Features

- **Buy & Sell Engine** — Execute trades at real historical prices using date-based lookup or current market price, with automatic commission deduction (0.3% per transaction).
- **Real-Time Price Updates** — Fetch live closing prices for all active positions via the Yahoo Finance API.
- **Equity Curve** — Interactive chart showing price evolution of any individual ticker over 1-month or 1-year periods.
- **Portfolio Trajectory** — Aggregated portfolio value over time from the earliest purchase date to today.
- **Profitability Analysis** — Percentage return breakdown by day, month, or year for individual assets or the full portfolio.
- **Portfolio Distribution** — Donut chart categorizing holdings into US Equities, Colombian Equities, and Cash.
- **Transaction History** — Full log of all buy/sell operations with date, quantity, price, and commission.
- **OOP Business Logic** — Clean separation of concerns via `Portafolio`, `Accion`, `Activo`, `Broker`, `Transaccion`, and `Historial` model classes.

---

## 📊 Key Capabilities

| Capability | Detail |
|---|---|
| REST API endpoints | 11 endpoints covering the full investment lifecycle |
| Market data source | Yahoo Finance (via yfinance) — real-time and historical |
| Supported tickers | 10 (8 US equities + 2 Colombian: ECO.CL, PFBCOL.CL) |
| Commission model | 0.3% per transaction, applied on both buy and sell |
| Portfolio analytics | Equity curve, profitability by period, asset distribution |
| OOP model classes | 6 classes: Portafolio, Accion, Activo, Broker, Transaccion, Historial |
| Historical price lookup | Buy at any past date's closing price via date parameter |
| Return calculation | Absolute and percentage return per asset and for the full portfolio |

---

## 🏗️ Architecture

```
Browser (HTML / CSS / JavaScript)
        │
        │  HTTP (REST)
        ▼
Flask Application (main.py)
   ├── GET  /                       → Dashboard UI
   ├── GET  /resumen                → Portfolio summary (capital, P&L, return %)
   ├── GET  /activos                → Active positions
   ├── POST /comprar                → Buy asset (date-based or current price)
   ├── POST /vender                 → Sell asset
   ├── GET  /historial              → Transaction log
   ├── GET  /equity-data            → Price series for chart (1M / 1Y)
   ├── GET  /precios                → Refresh current prices for all holdings
   ├── GET  /historico              → Full price trajectory for one ticker
   ├── GET  /rentabilidad           → Return % over time (days / months / years)
   ├── GET  /trayectoria-portafolio → Aggregate portfolio value over time
   └── GET  /distribucion          → Holdings breakdown by asset category
        │
        ▼
Business Logic (models/)
   ├── Portafolio  → Capital, active positions, transaction ledger
   ├── Accion      → Individual equity (ticker, quantity, cost basis, market price)
   ├── Activo      → Base class for all asset types
   ├── Broker      → Commission model (0.3% per transaction)
   ├── Transaccion → Immutable record of each buy/sell operation
   └── Historial   → Portfolio value snapshots over time
        │
        ▼
Yahoo Finance API (yfinance)
   └── Historical & real-time price data
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Flask |
| Market Data | yfinance (Yahoo Finance API) |
| Data Processing | pandas |
| Frontend | JavaScript (ES6+), HTML5, CSS3 |
| Architecture | REST API + OOP / MVC pattern |

---

## 📁 Project Structure

```
Shares_Proyect/
├── main.py                   # Flask app entry point — all routes and API logic
├── models/
│   ├── activo.py             # Activo: base class for all asset types
│   ├── accion.py             # Accion: equity model (inherits Activo)
│   ├── portafolio.py         # Portafolio: capital management, buy/sell operations
│   ├── broker.py             # Broker: commission engine
│   ├── transaccion.py        # Transaccion: immutable trade record
│   └── historial.py          # Historial: portfolio value log
├── static/
│   ├── *.js                  # Frontend charts and dashboard logic
│   └── *.css                 # Styles
├── templates/
│   └── index.html            # Main dashboard template
├── documentacion/            # Project documentation files
├── requirements.txt          # Python dependencies
└── .gitignore
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.10 or higher
- pip

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ignacioperez1504/Shares_Proyect.git
cd Shares_Proyect

# 2. Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Linux / macOS
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
python main.py
```

The app will be available at **http://localhost:5000**

---

## 🚀 Usage

Once running, open your browser at `http://localhost:5000`.

**Starting capital:** $100,000 (simulated)

### Buying a stock
- Select a ticker from the available list
- Enter quantity
- Optionally enter a historical date to buy at that day's closing price
- Click **Buy** — the commission (0.3%) is automatically deducted

### Selling a stock
- Select an active position from your portfolio
- Enter the quantity to sell
- Confirm the current market price
- Click **Sell**

### Available Tickers

| US Market | Colombian Market |
|---|---|
| AAPL, MSFT, GOOGL, AMZN | ECO.CL |
| TSLA, NVDA, META, JPM | PFBCOL.CL |

---

## 📸 Screenshots

> Screenshots will be added in a future update. To see the dashboard in action, clone the repository and run it locally following the installation instructions above.

---

## 🔮 Potential Improvements

- [ ] Persistent storage (SQLite / PostgreSQL)
- [ ] User authentication and multi-portfolio support
- [ ] Export portfolio report to PDF / CSV
- [ ] Real-time price streaming with WebSockets
- [ ] Price alerts and notifications
- [ ] Expanded ticker universe (ETFs, crypto, bonds)
- [ ] Deployment (Docker + cloud hosting)

---

## 👤 Author

**Ignacio Joaquín Pérez Chaves**
Data Science Engineering student at ITM — Instituto Tecnológico Metropolitano, Medellín, Colombia.

- GitHub: [@ignacioperez1504](https://github.com/ignacioperez1504)
- Email: [ignacioperezchaves@gmail.com](mailto:ignacioperezchaves@gmail.com)
