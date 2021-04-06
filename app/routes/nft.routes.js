
import { Route, Methods } from "../models/route.js"
import * as walletCtrl from "../controllers/wallet.controller.js"
import * as nftCtrl from "../controllers/nft.controller.js"


export default {
    path: '/nft',
    preMiddlewares : null,
    postMiddleWare : function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(res.locals.api_response));
    },
    routes: [

        // Protect file using key
        // curl --request POST  --url http://127.0.0.1:3000/api/nft/cryptFile --header 'Content-Type: multipart/form-data; boundary=---011000010111000001101001' --form file=@/home/pierrick/www/ternoa-sdk/tests/exemple.jpg
        Route(Methods.POST, "/cryptFile", nftCtrl.cryptFile),


    ]
};