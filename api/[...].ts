import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import the worker to avoid ESM issues
    const { default: workerHandler } = await import('../dist/server/index.js');
    
    // Convert Vercel request to Fetch API Request
    const url = new URL(req.url || '/', `https://${req.headers.host}`);
    const request = new Request(url, {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(', ') : (value || ''),
        ])
      ),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    // Call the worker fetch handler
    const response = await workerHandler.fetch(request, {}, {});

    // Set status
    res.status(response.status);
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

