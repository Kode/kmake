"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs = require("fs");
const http = require("http");
const log = require("kmake/log");
const path = require("path");
async function run(options, loglog) {
    log.set(loglog);
    log.info('Running server on ' + options.port + '...');
    const server = http.createServer((request, response) => {
        let baseDir = 'build/Release';
        if (options.debug) {
            baseDir = 'build/Debug';
        }
        let filePath = baseDir + request.url;
        if (request.url === '/') {
            filePath = baseDir + '/index.html';
        }
        const extname = path.extname(filePath);
        let contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
            case '.wasm':
                contentType = 'application/wasm';
                break;
        }
        console.log('Reading file ' + filePath + '.');
        fs.readFile(filePath, (error, content) => {
            response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            if (error) {
                if (error.code == 'ENOENT') {
                    console.log('File ' + filePath + ' not found.');
                    fs.readFile('./404.html', (error, content) => {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Error: ' + error.code + ' ..\n');
                    response.end();
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    });
    server.on('error', (e) => {
        if (e.name === 'EADDRINUSE') {
            log.error('Error: Port ' + options.port + ' is already in use.');
            log.error('Please close the competing program (maybe another instance of kmake?)');
            log.error('or switch to a different port using the --port argument.');
        }
    });
    server.listen(options.port);
}
exports.run = run;
//# sourceMappingURL=server.js.map