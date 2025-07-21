import { BotFirebaseService } from '../../../utils/firebase.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value' });
    }

    // Toggle dev mode in Firebase
    const success = await BotFirebaseService.setDevModeFromWeb(
      enabled, 
      session.user.id, 
      session.user.name
    );

    if (success) {
      res.status(200).json({ 
        success: true, 
        enabled: enabled,
        message: `Dev mode ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } else {
      res.status(500).json({ error: 'Failed to toggle dev mode' });
    }
  } catch (error) {
    console.error('Error in dev mode API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
