//General libraries
const fs = require('fs');
const { exit } = require('process');
//const encrypt = require('node-file-encrypt');
const openpgp = require("openpgp");
//Polkadot libraries
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { stringToU8a, u8aToHex} = require('@polkadot/util');
const { signatureVerify,  cryptoWaitReady, decodeAddress, mnemonicGenerate, blake2AsHex } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');
//Sia libraries
const { SkynetClient } = require('@nebulous/skynet');
const client = new SkynetClient();
//Ternoa libraries
const { spec } = require('../types')
const ENDPOINT = 'wss://chaos.ternoa.com';

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
      res.send(`Upload successful, skylink: ${skylink}`);
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
    let encryptPath = '';

    {
      /* Crypt file using previously generated Password */ 
      let f = new encrypt.FileEncrypt(filePath);
      f.openSourceFile();
      f.encrypt(process.env.key);
      encryptPath = f.encryptFilePath;
    }

    try {
      /* Upload image to SIA */ 
      const skylink = await client.uploadFile(encryptPath);
      res.send(`Upload successful, skylink: ${skylink}`);
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

