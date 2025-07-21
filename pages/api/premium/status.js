import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { BotFirebaseService } from "../../../utils/firebase";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check premium status for the current user
    const isPremium = await BotFirebaseService.isPremiumUser(session.user.id);

    res.status(200).json({ 
      success: true, 
      isPremium: isPremium 
    });
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
