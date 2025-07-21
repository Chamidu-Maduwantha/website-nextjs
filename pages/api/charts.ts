import type { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseService } from '../../lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { days = 7 } = req.query;
    
    // Get chart data from Firebase
    const chartData = await FirebaseService.getChartData(Number(days));
    
    res.status(200).json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

