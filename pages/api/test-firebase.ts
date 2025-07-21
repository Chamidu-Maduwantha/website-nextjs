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
    console.log('Testing Firebase connection...');
    
    // Test bot stats
    const stats = await FirebaseService.getBotStats();
    console.log('Bot stats:', stats);
    
    // Test guilds
    const guilds = await FirebaseService.getAllGuilds();
    console.log('All guilds:', guilds);
    
    res.status(200).json({
      stats: stats,
      guilds: guilds,
      guildsCount: guilds.length
    });
  } catch (error) {
    console.error('Error testing Firebase:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
