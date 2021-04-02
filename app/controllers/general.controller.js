//General libraries
const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const openpgp = require("openpgp");
var AdmZip = require('adm-zip');
const axios = require('axios')
const zlib = require('zlib');
var unzipper = require('unzipper');
const request = require('superagent');
const admZip = require('adm-zip');
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

  /*generate pgp */
  const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIds: [{ name: 'yourname', email: 'johndoe@ternoa.com' }],
    passphrase: hash
  });

  /*Safe encrypted NFT keys*/
  fs.writeFileSync('./keys/private.txt', privateKeyArmored);
  fs.writeFileSync('./keys/public.txt', publicKeyArmored);
  fs.writeFileSync('./keys/_revokekey.txt', revocationCertificate);

  /* Return random password */
  res.setHeader('Content-Type', 'application/json');
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
  console.log(req);
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


        if (status.isInBlock) {
          unsub();
          events.forEach(async ({ event: { data, method, section } }) => {

            if (`${section}.${method}` === 'nfts.Created') {
              const nftId = data[0].toString();
              res.send(nftId);
            }
          })
        }

      })

  }
  main();

};

exports.createNftBatch = async (req, res) => {

  /*Method for create NFT using Mnemonic*/
  //const { nftUrls } = req.body;
  const nftUrls  = [
      'https://siasky.net/_BFquQxd1zQNbu2lW3vvAcUxnyUHx8q_C0p_hL8M4mqEKQ',
      'https://siasky.net/_Alpe7wzt9gLGmPn4ugTdhFf_Tf4zEMkVYgXa8hVc2qGyw',
      'https://siasky.net/_AXanmnJQScy4mo0LSwk7bc-a6ABs-Go6JUdEWP-b0YlsA',
  ];

  const nftIds = [];

  async function main() {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const user = keyring.addFromMnemonic((process.env.mnemonic));

    const wsProvider = new WsProvider(ENDPOINT);
    const api = await ApiPromise.create({ provider: wsProvider, types: spec });

    // construct transaction to be batched
    const transactionsToBeBatchedSent = nftUrls.map(nftUrl => {
      return api.tx.nfts
          .create({
            offchain_uri: nftUrl,
          })
    });

    // batch transactions
    try {
      // Time to trigger the tx
      await api.tx.utility
          .batch(transactionsToBeBatchedSent)
          .signAndSend(user, ({ events = [], status }) => {
            console.log('Transaction status:', status.type);

            if (status.isRetracted) {
              // If the transaction is retracted we set a timeout so that if
              // the tx is not finalized in 5 minutes (300 s)  we cancel the job.
              setTimeout(() => { process.exit(1) }, 300 * 1000);
            } else if (status.isInBlock) {
              blockHash = status.asInBlock.toHex();

              console.log('Included at block hash', status.asInBlock.toHex());
              console.log('Events:');

              events.forEach(({ event: { data, method, section }, phase }) => {
                console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());

                if (`${section}.${method}` === 'utility.BatchCompleted') {
                  console.log('All transactions succeeded!');
                  // ok,  we can now list all nfts.
                  listNfts();
                } else if (`${section}.${method}` === 'utility.BatchInterrupted') {
                  console.log('Transactions failed after call' +  `${data[0]}`);
                  firstFailure = data[0];
                }else if (`${section}.${method}` === 'nfts.Created') {
                  const nftId = data[0].toString();
                  nftIds.push(nftId);
                }
              });
            } else if (status.isFinalized) {
              console.log('Finalized block hash', status.asFinalized.toHex());
              res.send("ok");
            }
          });
    } catch (e) {
      firstFailure = 0;
    } finally {
      // We wait for completion
      console.info('BatchCompleted')
    }
  }

  async function listNfts() {
    await cryptoWaitReady();

    const keyring = new Keyring({type: 'sr25519', ss58Format: 2});
    const user = keyring.addFromMnemonic((process.env.mnemonic));

    const wsProvider = new WsProvider(ENDPOINT);
    const api = await ApiPromise.create({provider: wsProvider, types: spec});

    // construct transaction to be batched
    const transactionsToBeBatchedSent = nftIds.map(nftId => {
      return api.tx.marketplace.list(Number(nftId), "1000000000000000000");
    });

    // batch transactions
    try {
      // Time to trigger the tx
      await api.tx.utility
          .batch(transactionsToBeBatchedSent)
          .signAndSend(user, ({ events = [], status }) => {
            console.log('Transaction status:', status.type);

            if (status.isRetracted) {
              // If the transaction is retracted we set a timeout so that if
              // the tx is not finalized in 5 minutes (300 s)  we cancel the job.
              setTimeout(() => { process.exit(1) }, 300 * 1000);
            } else if (status.isInBlock) {
              blockHash = status.asInBlock.toHex();

              console.log('Included at block hash', status.asInBlock.toHex());
              console.log('Events:');

              events.forEach(({ event: { data, method, section }, phase }) => {
                console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());

                if (`${section}.${method}` === 'utility.BatchCompleted') {
                  console.log('All Nfts listed!');
                } else if (`${section}.${method}` === 'utility.BatchInterrupted') {
                  console.log('Transactions failed after call' +  `${data[0]}`);
                  firstFailure = data[0];
                }
              });
            } else if (status.isFinalized) {
              console.log('Finalized block hash', status.asFinalized.toHex());
              res.send(JSON.stringify("ok"));
            }
          });
    } catch (e) {
      firstFailure = 0;
    } finally {
      // We wait for completion
      console.info('BatchCompleted')
    }
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
    await api.tx.marketplace.list(Number(nftId), "1000000000000000000").signAndSend(user, async ({ events = [], status }) => {
      res.send(JSON.stringify("ok"));
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

    /* generate Hash of files of keys*/
    var hashKey = await getChecksum("./tosgx/" + hash + ".text.ternoa");
    console.log(nftId + '_' + hashKey + '_' + process.env.address);


    /* upload zip file to sia*/
    const skylink = await client.uploadFile("./tosgx/" + hash + ".zip");
    console.log(`https://siasky.net/${skylink.substring(6)}`);

    /* Generate signature  */
    const message = stringToU8a(nftId + '_' + hashKey + '_' + process.env.address);
    const signature = user.sign(message);
    console.log(u8aToHex(signature));
    res.send(JSON.stringify("ok"));


    /* Send request for SGX */
    /*axios
      .post(process.env.endpoint, {
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
        res.send(JSON.stringify("ko"));
        console.log(error.errno);
      })*/
  }

  main();
}

//Used for add/change signature
exports.sgxEnpoint = async (req, res) => {

  async function main() {
    const { signature, data, zip, hash } = req.body;
    const dataContent = data.split('_');

    await cryptoWaitReady();

    const isValidSignature = (
      signedMessage, signature, address) => {
      const publicKey = decodeAddress(address);
      const hexPublicKey = u8aToHex(publicKey);

      return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
    };

    /* first check if signed content is real  */
    const isValid = isValidSignature(data, signature, dataContent[2]);

    if (isValid == true) {
      /* check is owner is declared owner */
      const wsProvider = new WsProvider(ENDPOINT);
      const api = await ApiPromise.create({ provider: wsProvider, types: spec });
      const nftData = await api.query.nfts.data(dataContent[0]);
      const offchain_uri = Buffer.from(nftData.details.offchain_uri, 'hex');

      if (nftData.owner.toString() == dataContent[2]) {

        /* Download zip and check the Hash*/
        const zipFile = "./zip/" + dataContent[0] + ".zip";
        const source = zip;

        request
          .get(source)
          .on('error', function (error) {
            console.log(error);
          })
          .pipe(fs.createWriteStream(zipFile))
          .on('finish', async function () {
            var zip = new admZip(zipFile);
            zip.extractAllTo("./zip", true);
            var hashZip = await getChecksum("./zip/" + hash + ".text.ternoa");
            if (hashZip == dataContent[1]) {
              /* Unzip with NGX Private Keys */
            }
          });

        res.send(JSON.stringify("ok"));
      }
    }
  }
  main();
}
