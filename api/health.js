// Vercel Serverless Function for Health Check
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      hasGoogleKey: !!process.env.GOOGLE_API_KEY
    }
  });
}

