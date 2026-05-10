import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distClientPath = path.join(__dirname, '../dist/client');

const STATIC_EXTENSIONS = new Set([
  '.js', '.mjs', '.css', '.html', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mp3', '.wav',
]);

function isStaticAsset(pathname) {
  const ext = path.extname(pathname);
  return STATIC_EXTENSIONS.has(ext.toLowerCase());
}

function getStaticFile(pathname) {
  // Always serve from dist/client/assets
  if (pathname.startsWith('/assets/')) {
    const filePath = path.join(distClientPath, pathname);
    // Security: prevent directory traversal
    if (!filePath.startsWith(distClientPath)) {
      return null;
    }
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
    } catch (err) {
      console.error(`Error reading static file ${filePath}:`, err);
    }
  }
  return null;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Vercel serverless function handler
 * Handles both static assets and dynamic SSR requests
 */
export default async function handler(req, res) {
  const pathname = new URL(req.url, `https://${req.headers.host}`).pathname;

  // Handle static assets
  if (isStaticAsset(pathname)) {
    const fileBuffer = getStaticFile(pathname);
    if (fileBuffer) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', getMimeType(pathname));
      res.setHeader('Content-Length', fileBuffer.length);
      return res.send(fileBuffer);
    }
  }

  // Handle dynamic SSR requests through the worker
  try {
    const serverModule = await import(/* @vite-ignore */ '../dist/server/index.js');
    const workerHandler = serverModule.default;

    if (!workerHandler || typeof workerHandler.fetch !== 'function') {
      console.error('Invalid worker handler:', workerHandler);
      return res.status(500).json({ error: 'Invalid server handler' });
    }

    // Create a Fetch API Request from Vercel request
    const url = new URL(req.url || '/', `https://${req.headers.host}`);
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(', ') : (value || ''),
      ])
    );

    let body;
    if (!['GET', 'HEAD'].includes(req.method)) {
      // Handle both JSON and form data
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start handler
    const response = await workerHandler.fetch(request, {}, {});

    // Set response status
    res.status(response.status);

    // Copy response headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    });

    // Send response body
    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    console.error('Server handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

