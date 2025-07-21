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
    
    console.log('Admin API - Session:', session);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    const isAdmin = adminUserIds.includes(session.user.id);
    
    console.log('Admin API - User ID:', session.user.id);
    console.log('Admin API - Admin user IDs:', adminUserIds);
    console.log('Admin API - Is admin:', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all guilds for admin users
    const guilds = await BotFirebaseService.getAllGuilds();
    console.log('Admin API - Found guilds:', guilds.length);
    
    res.status(200).json({ 
      success: true, 
      guilds: guilds,
      total: guilds.length 
    });
  } catch (error) {
    console.error('Error fetching admin guilds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
