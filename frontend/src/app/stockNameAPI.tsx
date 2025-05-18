import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_INDIAN_API_KEY as string;

const fetchStockDetails = async (stockName: string) => {
  const options = {
    method: 'GET',
    url: 'https://stock.indianapi.in/stock',
    params: { name: stockName },
    headers: {
      'X-Api-Key': API_KEY
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
  }
};

export default fetchStockDetails;
