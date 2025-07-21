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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Remove premium user
    const result = await BotFirebaseService.removePremiumUser(userId);

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Premium access removed successfully' 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error removing premium user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
