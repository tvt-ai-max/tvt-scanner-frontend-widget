const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;

const audits = new Map();
let nextId = 1;

function generateScores() {
  const performance = Math.floor(Math.random() * 40) + 55;
  const security = Math.floor(Math.random() * 35) + 60;
  const aeo = Math.floor(Math.random() * 45) + 40;
  const mobile = Math.floor(Math.random() * 30) + 65;
  const overall = Math.round(
    performance * 0.4 + security * 0.25 + aeo * 0.2 + mobile * 0.15
  );
  return { overall_score: overall, scores: { performance, security, aeo, mobile } };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath, contentType) {
  const abs = path.resolve(__dirname, filePath);
  if (!fs.existsSync(abs)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(abs).pipe(res);
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && pathname === '/api/v1/audit') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const id = String(nextId++);
        audits.set(id, {
          id,
          url: data.url,
          status: 'PROCESSING',
          progress: 0,
          created: Date.now(),
          lead: null,
          result: null
        });

        let progress = 0;
        const interval = setInterval(() => {
          const audit = audits.get(id);
          if (!audit) { clearInterval(interval); return; }
          progress += Math.floor(Math.random() * 12) + 5;
          if (progress >= 100) {
            progress = 100;
            audit.status = 'COMPLETED';
            audit.progress = 100;
            audit.result = generateScores();
            clearInterval(interval);
          } else {
            audit.progress = progress;
          }
        }, 2000);

        json(res, 201, { id, status: 'PROCESSING' });
      } catch {
        json(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  const statusMatch = pathname.match(/^\/api\/v1\/audit\/(\w+)\/status$/);
  if (req.method === 'GET' && statusMatch) {
    const audit = audits.get(statusMatch[1]);
    if (!audit) return json(res, 404, { error: 'Audit not found' });
    json(res, 200, {
      id: audit.id,
      status: audit.status,
      progress: audit.progress,
      result: audit.result
    });
    return;
  }

  const patchMatch = pathname.match(/^\/api\/v1\/audit\/(\w+)$/);
  if (req.method === 'PATCH' && patchMatch) {
    const audit = audits.get(patchMatch[1]);
    if (!audit) return json(res, 404, { error: 'Audit not found' });
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.lead) audit.lead = data.lead;
        json(res, 200, { id: audit.id, status: 'updated' });
      } catch {
        json(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  const pdfMatch = pathname.match(/^\/api\/v1\/audit\/(\w+)\/pdf$/);
  if (req.method === 'GET' && pdfMatch) {
    const audit = audits.get(pdfMatch[1]);
    if (!audit) return json(res, 404, { error: 'Audit not found' });
    cors(res);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="tvt-scanner-report.pdf"'
    });
    res.end('%PDF-1.4 mock pdf content');
    return;
  }

  if (req.method === 'GET') {
    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(res, 'index.html', 'text/html');
    }
    const ext = path.extname(pathname);
    const relPath = pathname.startsWith('/src/') ? path.join('..', pathname) : pathname.slice(1);
    if (MIME[ext]) {
      return serveStatic(res, relPath, MIME[ext]);
    }
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`TVT Scanner Mock Server running at http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  POST   /api/v1/audit           - Start audit');
  console.log('  GET    /api/v1/audit/:id/status - Poll status');
  console.log('  PATCH  /api/v1/audit/:id        - Submit lead');
  console.log('  GET    /api/v1/audit/:id/pdf    - Download PDF');
});
