/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_INDIAN_API_KEY as string;

const activeTrendingStocks = async () => {
  const options = {
    method: 'GET',
    url: 'https://stock.indianapi.in/NSE_most_active',
    headers: {
      'X-Api-Key': API_KEY
    }
  };

  try {
    const { data } = await axios.request(options);
    // Map API response to expected format
    // Assume data.records or data.data is an array of stocks
    const stocks = Array.isArray(data.records)
      ? data.records
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
    // Map to { company, price, currentPrice }
    return stocks.map((item: any) => ({
      company: item.symbol || item.company || item.name || "",
      price: item.lastPrice || item.price || item.currentPrice || item.close || 0,
      currentPrice: item.currentPrice || item.lastPrice || item.price || item.close || 0
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default activeTrendingStocks;