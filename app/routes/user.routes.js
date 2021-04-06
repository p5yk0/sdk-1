const controller = require("../controllers/general.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",

    );
    next();
  });

  /*
  Generate mnemonic and public address
  */
  app.get("/api/mnemonicGenerate", controller.mnemonicGenerate);


  /*
  Generate key for protect Secret
  */
  app.get("/api/generateKey", controller.generateKey);


  /*
  Protect file using key
  */
  app.post("/api/cryptFile", controller.cryptFile);

  /*
  Upload images to SIA server
  */
  app.post("/api/uploadIM", controller.uploadIM);

  /*
  Upload JSON file to SIA server
  */
  app.post("/api/uploadEX", controller.uploadEX);

  /*
  Upload NFT to TERNOA chain
  */
  app.post("/api/createNFT", controller.createNft);
  app.post("/api/createNFTBatch", controller.createNftBatch);

  /*
  Sell NFT to TERNOA Market Place
  */
  app.post("/api/sellNFT", controller.sellNFT);

  /*
  Generate Signature and crypt for SGX enclave
  */
  app.post("/api/signPasswordRequest", controller.signPasswordRequest);

  /*
 Exemple SGX endoing
  */
  app.post("/api/sgxEnpoint", controller.sgxEnpoint);
};
