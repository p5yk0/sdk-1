const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/uploadIM", controller.uploadIM);

  app.post("/api/uploadEX", controller.uploadEX);

  app.get("/api/mnemonicGenerate", controller.mnemonicGenerate);

  app.get("/api/generateKey", controller.generateKey);

  app.post("/api/cryptFile", controller.cryptFile);

  app.post("/api/createNFT", controller.createNft);


};