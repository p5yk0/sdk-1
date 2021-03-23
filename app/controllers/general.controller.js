//General libraries
const fs = require('fs');
const { exit } = require('process');
const openpgp = require("openpgp");
var AdmZip = require('adm-zip');
//Polkadot libraries
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { stringToU8a, u8aToHex } = require('@polkadot/util');
const { signatureVerify, cryptoWaitReady, decodeAddress, mnemonicGenerate, blake2AsHex, naclEncrypt } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');
//Sia libraries
const { SkynetClient } = require('@nebulous/skynet');
const client = new SkynetClient();
//Ternoa libraries
const { spec } = require('../types')
const ENDPOINT = 'wss://chaos.ternoa.com';
//Crypto libraries
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const keyLength = 32
const password = '1234'
const salt = crypto.randomBytes(32)
const iv = crypto.randomBytes(16)
const key = crypto.scryptSync(password, salt, keyLength);

function getChecksum(path) {
  return new Promise(function (resolve, reject) {
    // crypto.createHash('sha1');
    // crypto.createHash('sha256');
    const hash = crypto.createHash('md5');
    const input = fs.createReadStream(path);

    input.on('error', reject);

    input.on('data', function (chunk) {
      hash.update(chunk);
    });

    input.on('close', function () {
      resolve(hash.digest('hex'));
    });
  });
}

exports.mnemonicGenerate = async (req, res) => {

  const keyring = new Keyring({ type: 'sr25519' });
  const mnemonic = mnemonicGenerate();
  const newAccount = await keyring.addFromUri(mnemonic);

  let account = {
    mnemonic: mnemonic,
    address: newAccount.address,

  };

  res.setHeader('Content-Type', 'application/json');

  /* Return random account details */
  res.send(JSON.stringify(account));

};

exports.generateKey = async (req, res) => {

  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const hash = blake2AsHex(result);
  res.setHeader('Content-Type', 'application/json');

  /* Return random password */
  res.send(JSON.stringify(hash));

};

exports.uploadIM = async (req, res) => {

  const file = req.files.file;
  file.mv('./uploads/' + file.name, async function (err, result) {
    if (err) { throw err; }
    try {
      /* Upload image to SIA */
      const skylink = await client.uploadFile('./uploads/' + file.name);
      res.json({ file: `https://siasky.net/${skylink.substring(6)}` });
    } catch (err) {
      res.status(404).send(err);
    }
  });
};

exports.cryptFile = async (req, res) => {

  const file = req.files.file;

  file.mv('./uploads/' + file.name, async function (err, result) {
    if (err) { throw err; }

    let filePath = './uploads/' + file.name; // source file path

    /* Generate Strong Key for NFT */
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 20; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    const hash = blake2AsHex(result);


    const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519',
      userIds: [{ name: 'Mickaël Canu', email: 'contact@netick.fr' }],
      passphrase: hash
    });

    /*Safe encrypted NFT keys*/ 
    var hashFile = await getChecksum(filePath);
    fs.writeFileSync('./nftkeys/' + hashFile + '_privatekey.key', privateKeyArmored);
    fs.writeFileSync('./nftkeys/' + hashFile + '_publickey.key', publicKeyArmored);
    fs.writeFileSync('./nftkeys/' + hashFile + '_revokekey.key', revocationCertificate);
    fs.writeFileSync('./txtkeys/' + hashFile + '.text', hash);


    /*Encrypt file*/ 
    const fileForOpenpgpjs = new Uint8Array(req.files.file.data);
    const encryptionResponse = await openpgp.encrypt({
      message: openpgp.Message.fromBinary(fileForOpenpgpjs),
      publicKeys: (await openpgp.readKey({ armoredKey: publicKeyArmored })),
    });

    const reader = openpgp.stream.getReader(encryptionResponse);

    const { value } = await reader.read();

    fs.writeFileSync(filePath + '.ternoa', value);

    /* zip secret */
    var zip = new AdmZip();
    zip.addLocalFile(filePath + '.ternoa');
    var willSendthis = zip.toBuffer();
    zip.writeZip(filePath + '-'+hashFile+'.ternoa.zip');
    try {

      /* Upload image to SIA */
      const skylink = await client.uploadFile(filePath + '-'+hashFile+'.ternoa.zip');
    res.json({ file: `https://siasky.net/${skylink.substring(6)}` });
    } catch (err) {
      res.status(404).send(err);
    }
  });
};

exports.uploadEX = async (req, res) => {

  const { internalId, name, descripion, media, cryptedMedia } = req.body;

  let modifiedData = {
    internalId,
    name,
    descripion,
    media: {
      url: media,
    },
    cryptedMedia: {
      url: cryptedMedia,
    }
  }

  try {
    fs.writeFileSync('./uploads/test.json', JSON.stringify(modifiedData));

    /* generate and upload Json file */
    const skylink = await client.uploadFile('./uploads/test.json');

    res.send(`Upload successful, skylink: ${skylink}`);

  } catch (err) {
    console.error(err)
    res.status(404).send(err);
  }
};




exports.createNft = async (req, res) => {

  /*Method for create NFT using Mnemonic*/
  const { nftUrl } = req.body;

  async function main() {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const user = keyring.addFromMnemonic((process.env.mnemonic));

    const wsProvider = new WsProvider(ENDPOINT);
    const api = await ApiPromise.create({ provider: wsProvider, types: spec });
    const unsub = await api.tx.nfts
      .create({
        offchain_uri: nftUrl,
      })
      .signAndSend(user, async ({ events = [], status }) => {


        if (status.isFinalized) {
          unsub();
          events.forEach(async ({ event: { data, method, section } }) => {
            const nftId = data[0].toString();
            res.send(nftId);

          })
        }

      })
  }
  main();

};


exports.signPasswordRequest = async (req, res) => {

  async function main() {
    const { nftId } = req.body;

    await cryptoWaitReady();

    /* Generate signature  */
    const keyring = new Keyring({ type: 'sr25519' });
    const user = await keyring.addFromUri(process.env.mnemonic);
    const message = stringToU8a(nftId);
    const signature = user.sign(message);

    /* Prepare request for SGX */
    let result = {
      nftId: nftId,
      signature: u8aToHex(signature),
      address: user.address,
      key: process.env.key
    };

    /* Crypt and send to SGX */
    console.log(JSON.stringify(result));
    require.extensions['.txt'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };

    var words = require("../../keys/public.txt");

    const publicKey = await openpgp.readKey({ armoredKey: words });
    const encrypted = await openpgp.encrypt({
      message: openpgp.Message.fromText(result), // input as Message object
      publicKeys: publicKey
    });

    let protectedRequest = encrypted;

    /*Return Crypted sign and password request for NFT*/
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(protectedRequest));

  }
  main();
}

