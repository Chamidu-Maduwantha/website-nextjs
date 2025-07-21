import { BotFirebaseService } from '../../../utils/firebase.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const devMode = await BotFirebaseService.getDevMode();
    
    res.status(200).json({ 
      devMode: devMode,
      success: true
    });
  } catch (error) {
    console.error('Error getting dev mode status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
