
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

require('dotenv').config();

const app = express();

const myKeyring = async () => {

  //await cryptoWaitReady();

  /*const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
  const alice = keyring.addFromMnemonic("quit cluster magic awesome burst uphold float snow include meadow fruit zone");
  const message = stringToU8a('this is our message');
  const signature = alice.sign(message);
  const isValid = alice.verify(message, signature);
  console.log(`${u8aToHex(signature)} is ${isValid ? 'valid' : 'invalid'}`);*/

/*
const isValidSignature = (signedMessage, signature, address) => {
  const publicKey = decodeAddress(address);
  const hexPublicKey = u8aToHex(publicKey);

  return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
};

const isValid = isValidSignature(
  'This is a text message',
  '0x2aeaa98e26062cf65161c68c5cb7aa31ca050cb5bdd07abc80a475d2a2eebc7b7a9c9546fbdff971b29419ddd9982bf4148c81a49df550154e1674a6b58bac84',
  '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
);
*/


  }

  myKeyring();
//await cryptoWaitReady();
//const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
//const alice = keyring.addFromMnemonic("quit cluster magic awesome burst uphold float snow include meadow fruit zone");
// create the message, actual signature and verify
//const message = stringToU8a('this is our message');
//const signature = alice.sign(message);
//const isValid = alice.verify(message, signature);

// output the result
//console.log(`${u8aToHex(signature)} is ${isValid ? 'valid' : 'invalid'}`);


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('server is running');
});

require("./app/routes/user.routes")(app);

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});