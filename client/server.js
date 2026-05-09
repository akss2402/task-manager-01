import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

console.log(`Starting server on port ${PORT}`);
console.log(`Serving files from: ${DIST_DIR}`);

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ ERROR: dist directory not found at ${DIST_DIR}`);
  console.error('Make sure npm run build completed successfully');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`❌ ERROR: index.html not found at ${indexPath}`);
  process.exit(1);
}

console.log(`✓ dist directory exists`);
console.log(`✓ index.html found`);

const server = http.createServer((req, res) => {
  try {
    // Prevent directory traversal attacks
    let urlPath = req.url.split('?')[0]; // Remove query strings
    if (urlPath === '/') {
      urlPath = '/index.html';
    }
    
    let filePath = path.join(DIST_DIR, urlPath);
    
    // Security: ensure file is within DIST_DIR
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Read the file
    fs.readFile(filePath, (err, data) => {
      try {
        if (err) {
          // If file not found, serve index.html (for SPA routing)
          fs.readFile(indexPath, (indexErr, indexData) => {
            try {
              if (indexErr) {
                console.error('Error reading index.html:', indexErr.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(indexData);
            } catch (e) {
              console.error('Error in index.html callback:', e);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
              }
              res.end('Internal Server Error');
            }
          });
          return;
        }

        // Determine content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
          '.eot': 'application/vnd.ms-fontobject'
        };
        
        contentType = mimeTypes[ext] || contentType;

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch (e) {
        console.error('Error in file read callback:', e);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
        }
        res.end('Internal Server Error');
      }
    });
  } catch (err) {
    console.error('Request handler error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Internal Server Error');
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
