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
  console.log(data);
  return data;
} catch (error) {
  console.error(error);
}
}
export default activeTrendingStocks;