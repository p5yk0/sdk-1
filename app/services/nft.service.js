import getFileChecksum from '../utils/checksum.js';
import * as cryptoService from '../services/crypto.service.js';
import * as fs from "fs";


export async function cryptFile(file) {
    let uploadPath = './uploads/' + file.name;
    await file.mv(uploadPath, async function(err, result) {
        if (err) { throw err; }

        /* Generate Strong Key for NFT */
        let hash = cryptoService.generateKey();

        const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
            type: 'ecc',
            curve: 'curve25519',
            userIds: [{ name: 'yourname', email: 'johndoe@ternoa.com' }],
            passphrase: hash
        });

        /*Safe encrypted NFT keys*/
        let hashFile = await getFileChecksum(uploadPath);
        fs.writeFileSync('./nftkeys/' + hashFile + '_privatekey.key', privateKeyArmored);
        fs.writeFileSync('./nftkeys/' + hashFile + '_publickey.key', publicKeyArmored);
        fs.writeFileSync('./nftkeys/' + hashFile + '_revokekey.key', revocationCertificate);
        fs.writeFileSync('./txtkeys/' + hashFile + '.text', hash);


        /*Encrypt file*/
        const fileForOpenpgpjs = new Uint8Array(file.data);
        const encryptionResponse = await openpgp.encrypt({
            message: openpgp.Message.fromBinary(fileForOpenpgpjs),
            publicKeys: (await openpgp.readKey({ armoredKey: publicKeyArmored })),
        });

        const reader = openpgp.stream.getReader(encryptionResponse);

        const { value } = await reader.read();

        fs.writeFileSync(uploadPath + '.ternoa', value);

        /* zip secret */
        let zip = new AdmZip();
        zip.addLocalFile(uploadPath + '.ternoa');
        let willSendthis = zip.toBuffer();
        zip.writeZip(uploadPath + '-' + hashFile + '.ternoa.zip');
        try {
            /* Upload image to SIA */
            const skylink = await client.uploadFile(uploadPath + '-' + hashFile + '.ternoa.zip');
            return { file: `https://siasky.net/${skylink.substring(6)}` };
        }
        catch (err) {
            return false;
        }
    });
}
