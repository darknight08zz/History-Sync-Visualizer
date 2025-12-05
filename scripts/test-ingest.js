const fs = require('fs');
const path = require('path');
const http = require('http');

const boundary = '--------------------------' + Date.now().toString(16);

function uploadFile(filePath) {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const postDataStart = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        'Content-Type: text/plain',
        '',
        ''
    ].join('\r\n');

    const postDataEnd = `\r\n--${boundary}--\r\n`;

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ingest',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(postDataStart) + fileContent.length + Buffer.byteLength(postDataEnd)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log(`Response for ${fileName}:`, res.statusCode);
            try {
                const json = JSON.parse(data);

                if (res.statusCode === 202 && json.id) {
                    console.log(`Job queued with ID: ${json.id}. Polling...`);
                    pollJob(json.id);
                } else {
                    console.log('Events count:', json.events ? json.events.length : 0);
                    console.log('Detected info:', json.info);
                }
            } catch (e) {
                console.log('Response body:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request for ${fileName}: ${e.message}`);
    });

    req.write(postDataStart);
    req.write(fileContent);
    req.write(postDataEnd);
    req.end();
}

function pollJob(id) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/jobs/${id}`,
        method: 'GET'
    };

    setTimeout(() => {
        http.get(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const job = JSON.parse(data);
                    console.log(`Job ${id} status: ${job.status}`);
                    if (job.status === 'completed') {
                        console.log('Job result events:', job.result.events.length);
                    } else if (job.status === 'failed') {
                        console.log('Job failed:', job.error);
                    } else {
                        pollJob(id);
                    }
                } catch (e) {
                    console.log('Poll error:', e);
                }
            });
        });
    }, 1000);
}

uploadFile(path.join(__dirname, '../gitlog.txt'));
uploadFile(path.join(__dirname, '../wa_sample.txt'));
