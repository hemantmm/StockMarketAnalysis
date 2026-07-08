"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowRight,
  FaBell,
  FaChartLine,
  FaChartPie,
  FaClock,
  FaLightbulb,
  FaRocket,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import UserMenu from "./components/UserMenu";

const navigationItems = [
  {
    label: "Stock Search",
    icon: FaSearch,
    href: "/StockSearchs",
    description: "Search Indian equities, view price history, and get technical AI recommendations.",
    metric: "Live analysis",
  },
  {
    label: "Active Stocks",
    icon: FaRocket,
    href: "/ActiveStocks",
    description: "Scan market movers with refreshable lists and quick sorting controls.",
    metric: "Market pulse",
  },
  {
    label: "Watchlist",
    icon: FaStar,
    href: "/Watchlist",
    description: "Keep your preferred symbols close and compare them from one focused view.",
    metric: "Saved ideas",
  },
  {
    label: "Portfolio",
    icon: FaChartPie,
    href: "/Portfolio",
    description: "Track allocation, holdings, and investment exposure in a cleaner workspace.",
    metric: "Holdings",
  },
  {
    label: "Price Alerts",
    icon: FaBell,
    href: "/Notifier",
    description: "Create alerts for price movement so market changes do not get buried.",
    metric: "Smart alerts",
  },
  {
    label: "Trading",
    icon: FaChartLine,
    href: "/Trading",
    description: "Review strategy signals and trading activity before taking the next step.",
    metric: "Execution",
  },
  {
    label: "Hold Advisor",
    icon: FaLightbulb,
    href: "/HoldStock",
    description: "Evaluate whether a position deserves patience, action, or closer review.",
    metric: "Decision aid",
  },
  {
    label: "AI Platform",
    icon: FaTrophy,
    href: "/BestAIPlatform",
    description: "See the AI workflow and platform capabilities behind the analysis experience.",
    metric: "Insights",
  },
];

const stats = [
  { label: "Active Traders", value: "50K+" },
  { label: "AI Predictions", value: "1.2M+" },
  { label: "Backtest Accuracy", value: "94%" },
];

const HomePage = () => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState("OPEN");
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setMarketStatus(now.getHours() >= 9 && now.getHours() < 16 ? "OPEN" : "CLOSED");
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-left"
            aria-label="Go to MarketSense home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-amber-300 shadow-lg shadow-slate-300/50">
              <FaRocket />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight text-slate-950 sm:text-xl">
                MarketSense
              </span>
              <span className="hidden text-xs font-medium text-slate-500 sm:block">
                AI stock market workspace
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  marketStatus === "OPEN" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {marketStatus}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <FaClock className="text-slate-400" />
              {isClient
                ? currentTime.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </div>
            {user ? (
              <UserMenu user={user} />
            ) : (
              <button
                onClick={() => router.push("/Login")}
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef7f6_45%,#fff7e6_100%)] px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700">
                <FaShieldAlt />
                Built for daily market decisions
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-slate-950 sm:text-5xl lg:text-6xl">
                Analyze stocks, track ideas, and act with a clearer market view.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                MarketSense brings stock search, live movers, watchlists, alerts,
                portfolio tools, and trading workflows into one focused dashboard.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/StockSearchs")}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <FaSearch />
                  Search a stock
                  <FaArrowRight />
                </button>
                <button
                  onClick={() => router.push("/ActiveStocks")}
                  className="inline-flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400"
                >
                  <FaChartLine />
                  View active stocks
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-5">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Workspace snapshot
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Today&apos;s command center
                  </h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  AI assisted
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <button
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                    type="button"
                  >
                    <span className="block text-2xl font-black text-slate-950">
                      {item.value}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-300">
                      Quick route
                    </p>
                    <p className="mt-2 text-2xl font-black">RELIANCE</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Example: search symbol, compare history, review recommendation.
                    </p>
                  </div>
                  <FaArrowRight className="mt-1 text-amber-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">
                  App pages
                </p>
                <h2 className="mt-1 text-3xl font-black text-slate-950">
                  Choose your next workflow
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Each page is tuned around a market task, so the first click gets
                you to a useful screen instead of a brochure.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className="group flex min-h-[190px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200"
                >
                  <span>
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-800 transition group-hover:bg-emerald-100 group-hover:text-emerald-700">
                      <item.icon />
                    </span>
                    <span className="block text-lg font-black text-slate-950">
                      {item.label}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  <span className="mt-4 flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                    {item.metric}
                    <FaArrowRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
