import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { BotFirebaseService } from '../../utils/firebase';

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

    // Check if user is admin
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    const isAdmin = adminUserIds.includes(session.user.id);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let daysAgo = 7;
    
    switch (period) {
      case '30d':
        daysAgo = 30;
        break;
      case '90d':
        daysAgo = 90;
        break;
      default:
        daysAgo = 7;
    }
    
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    console.log(`Server Activity API - Getting activity for last ${daysAgo} days`);
    console.log(`Server Activity API - Start date: ${startDate.toISOString()}`);

    // Get server activity data
    const activityData = await BotFirebaseService.getServerActivity(startDate);
    
    console.log(`Server Activity API - Found ${activityData.recentlyAdded.length} joined, ${activityData.recentlyLeft.length} left`);

    res.status(200).json(activityData);
  } catch (error) {
    console.error('Error fetching server activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
