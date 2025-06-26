import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol required' });
  }
  try {
    // Example using a public API for demonstration. Replace with your backend if needed.
    const apiKey = process.env.NEXT_PUBLIC_STOCK_API_KEY;
    const url = `https://stock.indianapi.in/stock?name=${encodeURIComponent(symbol)}`;
    const response = await axios.get(url, {
      headers: { 'X-Api-Key': apiKey }
    });
    const price = response.data?.price || response.data?.data?.price || null;
    res.status(200).json({ price });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
}
