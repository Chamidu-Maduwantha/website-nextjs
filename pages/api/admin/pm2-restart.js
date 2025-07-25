import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action } = req.body;

    // Get PM2 process name - now using the correct "cm46-bot" name
    const pm2ProcessName = 'cm46-bot';

    let command;
    let successMessage;

    // Check if we're on Windows and try different PM2 approaches
    const isWindows = process.platform === 'win32';
    const pm2Command = isWindows ? 'npx pm2' : 'pm2'; // Use npx on Windows if global pm2 not available

    switch (action) {
      case 'restart':
        command = `${pm2Command} restart ${pm2ProcessName}`;
        successMessage = 'Bot restarted successfully';
        break;
      case 'stop':
        command = `${pm2Command} stop ${pm2ProcessName}`;
        successMessage = 'Bot stopped successfully';
        break;
      case 'start':
        command = `${pm2Command} start ${pm2ProcessName}`;
        successMessage = 'Bot started successfully';
        break;
      case 'status':
        command = `${pm2Command} list ${pm2ProcessName} --no-color`;
        successMessage = 'Bot status retrieved';
        break;
      case 'logs':
        command = `${pm2Command} logs ${pm2ProcessName} --lines 20 --no-color`;
        successMessage = 'Bot logs retrieved';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    console.log(`Admin ${session.user.name || session.user.id} executing PM2 command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      
      console.log(`PM2 command executed successfully:`, stdout);
      if (stderr) {
        console.warn(`PM2 command stderr:`, stderr);
      }

      res.status(200).json({ 
        success: true, 
        message: successMessage,
        output: stdout,
        stderr: stderr || null
      });
    } catch (execError) {
      console.error(`PM2 command failed:`, execError);
      
      // Check if it's a PM2 not found error
      if (execError.message.includes("'pm2' is not recognized") || 
          execError.message.includes("pm2: command not found")) {
        
        return res.status(500).json({ 
          error: 'PM2 not installed', 
          details: 'PM2 is not installed globally on this system. Please install PM2 globally with "npm install -g pm2" or use alternative bot management.',
          suggestions: [
            'Install PM2 globally: npm install -g pm2',
            'Use npx pm2: npx pm2 restart your-bot',
            'Use Node.js directly: node index.js',
            'Use nodemon for development: nodemon index.js'
          ]
        });
      }
      
      // Check if it's a timeout or actual error
      if (execError.killed && execError.signal === 'SIGTERM') {
        return res.status(500).json({ 
          error: 'Command timed out', 
          details: 'PM2 command took too long to execute' 
        });
      }

      res.status(500).json({ 
        error: 'PM2 command failed', 
        details: execError.message,
        output: execError.stdout || null,
        stderr: execError.stderr || null
      });
    }

  } catch (error) {
    console.error('PM2 restart API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
