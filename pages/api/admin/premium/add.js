import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { BotFirebaseService } from "../../../../utils/firebase";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminUserIds.includes(session.user.id)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, subscriptionType = 'permanent' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!['monthly', 'permanent'].includes(subscriptionType)) {
      return res.status(400).json({ error: 'Invalid subscription type' });
    }

    // We'll let the bot fetch the username when sending the welcome message
    // For now, we'll store the user ID and the bot will handle the username
    const result = await BotFirebaseService.addPremiumUser(
      userId,
      'User', // Placeholder username - bot will fetch real username
      session.user.id,
      session.user.name || session.user.username,
      subscriptionType
    );

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: `Premium access granted successfully`,
        data: result.data 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error adding premium user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
