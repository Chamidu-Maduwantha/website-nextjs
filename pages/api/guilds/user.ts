import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { BotFirebaseService } from '../../../utils/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('User API - Fetching guilds for user:', session.user.id);
    const guilds = await BotFirebaseService.getUserGuilds(session.user.id);
    console.log('User API - Found guilds:', guilds.length);
    
    res.status(200).json({ 
      success: true, 
      guilds: guilds,
      total: guilds.length 
    });
  } catch (error) {
    console.error('Error fetching user guilds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
