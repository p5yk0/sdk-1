//General libraries
const fs = require('fs');
const { exit } = require('process');
const openpgp = require("openpgp");
var AdmZip = require('adm-zip');
const axios = require('axios')

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
    const hash = crypto.createHash('sha256');
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
      userIds: [{ name: 'yourname', email: 'johndoe@ternoa.com' }],
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
    zip.writeZip(filePath + '-' + hashFile + '.ternoa.zip');
    try {

      /* Upload image to SIA */
      const skylink = await client.uploadFile(filePath + '-' + hashFile + '.ternoa.zip');
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

    res.json({ file: `https://siasky.net/${skylink.substring(6)}` });

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

exports.listNft = async (req, res) => {

  const { nftId, price } = req.body;

  async function main() {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const user = keyring.addFromMnemonic((process.env.mnemonic));

    const wsProvider = new WsProvider(ENDPOINT);
    const api = await ApiPromise.create({ provider: wsProvider, types: spec });
    const unsub = await api.tx.marketplace
      .list(
          nftId,
          price
      )
      .signAndSend(user, async ({ events = [], status }) => {

        if (status.isFinalized) {
          unsub();
          res.send(nftId, price);
        }

      })
  }
  main();

};

exports.sellNFT = async (req, res) => {

  const { nftId } = req.body;

  async function main() {

    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const user = keyring.addFromMnemonic((process.env.mnemonic));

    const wsProvider = new WsProvider(ENDPOINT);
    const api = await ApiPromise.create({ provider: wsProvider, types: spec });
    await api.tx.marketplace.list(Number(nftId), 10).signAndSend(user, async ({ events = [], status }) => {
      events.forEach(async ({ event: { data, method, section } }) => {
        res.send(JSON.stringify(data));

      });
    })

  }

  main();

};


exports.signPasswordRequest = async (req, res) => {

  async function main() {
    const { nftId, hash } = req.body;


    await cryptoWaitReady();

    /* Connect to Wallet */
    const keyring = new Keyring({ type: 'sr25519' });
    const user = await keyring.addFromUri(process.env.mnemonic);

    /*Encrypt NFT secret using NGX public KEY*/
    const fileForOpenpgpjs = new Uint8Array("./nftkeys/" + hash + "_privatekey.key");
    const publicKeyArmored = fs.readFileSync('./keys/public.txt');
    const encryptionResponse = await openpgp.encrypt({
      message: openpgp.Message.fromBinary(fileForOpenpgpjs),
      publicKeys: (await openpgp.readKey({ armoredKey: publicKeyArmored })),
    });

    const reader = openpgp.stream.getReader(encryptionResponse);
    const { value } = await reader.read();
    fs.writeFileSync("./tosgx/" + hash + '_privatekey.key.ternoa', value);

    /*Encrypt privatekey password using NGX public KEY*/
    const fileForOpenpgpjs_key = new Uint8Array("./txtkeys/" + hash + ".text");
    const publicKeyArmored_key = fs.readFileSync('./keys/public.txt');
    const encryptionResponse_key = await openpgp.encrypt({
      message: openpgp.Message.fromBinary(fileForOpenpgpjs_key),
      publicKeys: (await openpgp.readKey({ armoredKey: publicKeyArmored_key })),
    });

    const reader_key = openpgp.stream.getReader(encryptionResponse_key);
    const { value_key } = await reader_key.read();
    fs.writeFileSync("./tosgx/" + hash + '.text.ternoa', value_key);

    /* zip Both of files */
    var zip = new AdmZip();
    zip.addLocalFile("./tosgx/" + hash + '.text.ternoa', value_key);
    zip.addLocalFile("./tosgx/" + hash + '_privatekey.key.ternoa', value_key);
    var willSendthis = zip.toBuffer();
    zip.writeZip("./tosgx/" + hash + '.zip');

    /* generate Hash of file*/
    var hashZip = await getChecksum("./tosgx/" + hash + ".zip");

    /* upload zip file to sia*/
    const skylink = await client.uploadFile("./tosgx/" + hash + ".zip");

    console.log(`https://siasky.net/${skylink.substring(6)}`);

    /* Generate signature  */
    const message = stringToU8a(nftId + '_' + hashZip + '_' + process.env.address);
    console.log(nftId + '_' + hashZip + '_' + process.env.address);
    const signature = user.sign(message);
    console.log(u8aToHex(signature));


    /* Send request for SGX */

    axios
      .post('https://sgx.ternoa.com/deposit', {
        signature: u8aToHex(signature),
        data: nftId + '_' + hashZip + '_' + process.env.address,
        zip: `https://siasky.net/${skylink.substring(6)}`

      })

      .then(res => {
        console.log(`statusCode: ${res.statusCode}`)
        res.send(JSON.stringify("ok"));
      })
      .catch(error => {
        //to change when NGX deployed
        res.send(JSON.stringify("ok"));
      })


  }
  main();
}

