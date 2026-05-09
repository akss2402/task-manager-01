import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT) || 3000;
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

// Global error handlers to prevent crash
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] ❌ UNCAUGHT EXCEPTION:`, err.message);
  console.error(err.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] ❌ UNHANDLED REJECTION:`, reason);
  // Don't exit - keep server running
});

const server = http.createServer((req, res) => {
  // Prevent response errors from crashing the server
  res.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Response error: ${err.message}`);
  });

  const startTime = Date.now();
  
  try {
    console.log(`[${new Date().toISOString()}] 📨 REQUEST: ${req.method} ${req.url}`);
    
    // Health check endpoint for debugging
    if (req.url === '/health' || req.url === '/health/') {
      console.log(`[${new Date().toISOString()}] ✓ Health check OK`);
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      }
      return;
    }

    // Prevent directory traversal attacks
    let urlPath = req.url.split('?')[0]; // Remove query strings
    if (urlPath === '/') {
      urlPath = '/index.html';
    }
    
    let filePath = path.join(DIST_DIR, urlPath);
    
    console.log(`[${new Date().toISOString()}] 📂 RESOLVING: ${urlPath} => ${filePath}`);
    
    // Security: ensure file is within DIST_DIR
    if (!filePath.startsWith(DIST_DIR)) {
      console.log(`[${new Date().toISOString()}] ❌ FORBIDDEN: Path traversal attempt`);
      if (!res.headersSent) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
      }
      return;
    }

    // Read the file
    fs.readFile(filePath, (err, data) => {
      try {
        if (err) {
          console.log(`[${new Date().toISOString()}] ⚠️ FILE NOT FOUND: ${filePath} - ${err.code}`);
          // If file not found, serve index.html (for SPA routing)
          fs.readFile(indexPath, (indexErr, indexData) => {
            try {
              if (indexErr) {
                console.error(`[${new Date().toISOString()}] ❌ ERROR reading index.html: ${indexErr.message}`);
                if (!res.headersSent) {
                  res.writeHead(500, { 'Content-Type': 'text/plain' });
                  res.end('Internal Server Error - Could not read index.html');
                }
                return;
              }
              console.log(`[${new Date().toISOString()}] ✓ SERVE: index.html (${indexData.length} bytes) [${Date.now() - startTime}ms]`);
              if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(indexData);
              }
            } catch (e) {
              console.error(`[${new Date().toISOString()}] ❌ ERROR in index.html callback: ${e.message}`);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
              }
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

        console.log(`[${new Date().toISOString()}] ✓ SERVE: ${path.basename(filePath)} (${data.length} bytes, ${contentType}) [${Date.now() - startTime}ms]`);
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}] ❌ ERROR in file read callback: ${e.message}`);
        console.error(e.stack);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      }
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ CRITICAL ERROR in request handler: ${err.message}`);
    console.error(err.stack);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
});

server.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] ❌ SERVER ERROR: ${err.message}`);
  console.error(err.stack);
});

server.on('clientError', (err, socket) => {
  console.error(`[${new Date().toISOString()}] ❌ CLIENT ERROR: ${err.message}`);
  try {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  } catch (e) {
    console.error('Error sending error response:', e.message);
  }
});

// CRITICAL: Use explicit callback for listen to verify port binding
const listener = server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  ✅ Server running on port ${PORT}       ║`);
  console.log(`║  📂 Serving: ${DIST_DIR}`);
  console.log(`║  🌐 Listening on: 0.0.0.0:${PORT}              ║`);
  console.log(`║  📋 Health check: /health              ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`[${new Date().toISOString()}] ✨ Ready to accept requests!\n`);
  
  // Log every 30 seconds to prove server is alive
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] 💚 Server still alive and listening on port ${PORT}`);
  }, 30000);
});

// CRITICAL: Handle listen errors explicitly
listener.on('error', (err) => {
  console.error(`\n❌ FATAL: Failed to bind to port ${PORT}`);
  console.error(`Error: ${err.message}`);
  console.error(`Code: ${err.code}`);
  
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
  } else if (err.code === 'EACCES') {
    console.error(`Permission denied to bind to port ${PORT}`);
  }
  
  // Try alternative port if primary fails
  if (PORT !== 3000) {
    console.log(`\nAttempting to bind to port 3000 instead...`);
    server.listen(3000, '0.0.0.0', () => {
      console.log(`✅ Fallback: Server now running on port 3000`);
    });
  } else {
    process.exit(1);
  }
});

// Keep the process alive indefinitely
process.stdin.resume();
