const http = require("http");
const bcrypt = require('bcryptjs');
const EventEmitter = require('events');
const fs = require('fs');
const port = 4000;

const emitter = new EventEmitter();

emitter.on('dataEncrypted', (normal, hash) => {
    console.log('bcrypt:', hash);
    console.log('normal:', normal);
});

emitter.on('errorLogged', (error) => {
    const errorMessage = `${new Date().toISOString()} - ${error}\n`;
    fs.appendFile('ErrorLogs.txt', errorMessage, (err) => {
        if (err) {
            console.error('failed to write to log file:', err);
        }
    });
});

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/encrypt') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const jsonData = JSON.parse(body);
                const originalData = jsonData.data;

                bcrypt.hash(originalData, 10, (err, hash) => {
                    if (err) {
                        emitter.emit('errorLogged', 'encryption failed');
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Encryption failed'}));
                    } else {
                        emitter.emit('dataEncrypted', originalData, hash);
                        res.writeHead(200, {'Content-Type': 'application/json '});
                        res.end(JSON.stringify({encryptedData: hash}));
                    }
                });
            } catch (e) {
                emitter.emit('errorLogged', 'Invalid JSON');
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid JSON'}));
            };
        });
    };
});

server.listen(port, () => {
    console.log(`Server listening to port ${port}`);
});