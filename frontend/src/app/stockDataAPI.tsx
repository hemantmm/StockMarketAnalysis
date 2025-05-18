import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_INDIAN_API_KEY as string;

const fetchStockData = async (stockName: string, periodWise: string) => {
  const options = {
    method: 'GET',
    url: 'https://stock.indianapi.in/historical_data',
    params: {
      stock_name: stockName,
      period: periodWise,
      filter: 'price', // Keep this as per your original intention
    },
    headers: {
      'X-Api-Key': API_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching historical stock data:', error);
    throw error;
  }
};

export default fetchStockData;
