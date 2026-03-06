const http = require('http');
const fs = require('fs');
const path = require('path');
const { extractResumeData } = require('./resumeExtractor');
const { parseAllJDs } = require('./jdParser');
const { matchResumeToAllJDs } = require('./matcher');
const { parsePdf } = require('./pdfParser');

const PORT = process.env.PORT || 3000;

// Load JDs once
let parsedJDs = [];
try {
    const jdsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/jds/jds.json'), 'utf8'));
    parsedJDs = parseAllJDs(jdsRaw);
} catch (err) {
    console.error('Failed to load JDs:', err);
}

const server = http.createServer((req, res) => {
    // CORS HTTP headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API Routes
    if (req.url === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', up: true }));
        return;
    }

    if (req.url === '/api/jds' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsedJDs));
        return;
    }

    if (req.url === '/api/match' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                let resumeText = data.text;

                if (!resumeText) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing resume text' }));
                    return;
                }

                const resumeData = extractResumeData(resumeText);
                const matchingJobs = matchResumeToAllJDs(resumeData, parsedJDs);

                const responseData = {
                    name: resumeData.name,
                    salary: resumeData.salary,
                    yearOfExperience: resumeData.yearOfExperience,
                    resumeSkills: resumeData.resumeSkills,
                    matchingJobs: matchingJobs.map(job => ({
                        jobId: job.jobId,
                        role: job.role,
                        salary: job.salary,
                        aboutRole: job.aboutRole,
                        skillsAnalysis: job.skillsAnalysis,
                        matchingScore: job.matchingScore,
                        weightedScore: job.weightedScore,
                        summary: job.summary
                    }))
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(responseData));
            } catch (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Static File Serving
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    // Prevent directory traversal
    if (filePath.indexOf(path.join(__dirname, 'public')) !== 0) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// For Vercel Serverless environment export
module.exports = server;

// If run directly via node server.js
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
        console.log(`API endpoints: /api/match, /api/jds, /api/health`);
    });
}
