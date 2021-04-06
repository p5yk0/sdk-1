
import { Route, Methods } from "../models/route.js"
import * as walletCtrl from "../controllers/wallet.controller.js"


export default {
    path: '/wallet',
    preMiddlewares : null,
    postMiddleWare : function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(res.locals.api_response));
    },
    routes: [

        // Generate mnemonic and public address
        Route(Methods.GET, "/mnemonicGenerate", walletCtrl.mnemonicGenerate),

        // Generate key for protect Secret
        Route(Methods.GET, "/generateKey", walletCtrl.generateKey),

    ]
};