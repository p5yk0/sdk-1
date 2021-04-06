import crypto from 'crypto';

export default function getFileChecksum(filepath) {
    return new Promise(function(resolve, reject) {
        const hash  = crypto.createHash('sha256');
        const input = fs.createReadStream(filepath);

        input.on('error', reject);

        input.on('data', function(chunk) {
            hash.update(chunk);
        });

        input.on('close', function () {
            resolve(hash.digest('hex'));
        });
    });
}
