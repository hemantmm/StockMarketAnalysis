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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Rate limit hit
      return { error: 'Rate limit exceeded. Please try again later.' };
    }
    console.error('Error fetching stock details:', error);
    throw error;
  }
};

export default fetchStockDetails;
