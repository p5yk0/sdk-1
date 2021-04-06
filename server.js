import dotenv from 'dotenv';
dotenv.config();

/* clean Folder in case of dev purpose */
import cleanupDev from "./app/utils/cleanup.dev.js"
const args = process.argv.slice(2)
if( args[0] === "dev" ) {
    cleanupDev([ './zip',  './nftkeys', './tosgx', './uploads', './txtkeys' ])
}


import express from "express";
const app = express();
app.get('/', (req, res) => {
    res.send('server is running');
});


// Utilisation d'un router pour l'api
// On pourrait le faire directement au niveau application si rien d'autre n'est servi hormis l'api
let apiRouter = express.Router();
// API CORS config
import cors from "cors";
apiRouter.use(
    cors({ allowedHeaders:"x-access-token, Origin, Content-Type, Accept" })
)

// --------------------------------------------------------------------------------------
// Routes definitions
import { bindMiddlewares, defineRoute } from"./app/routes/router.js"
import routesWallet from "./app/routes/wallet.routes.js";
import routesNFT from "./app/routes/nft.routes.js";
const routersConfig = [ routesWallet, routesNFT ];

console.log('=> Initialisation des routes api/');
for( let config of routersConfig ) {
    let router = express.Router();

    // On charge les middlewares pre-route (appliqués à toutes les routes du router)
    bindMiddlewares(config.preMiddlewares, router);

    // On définie les routes
    defineRoute(config.path, config.routes, router)

    // On charge les middlewares pre-route (appliqués à toutes les routes du router)
    bindMiddlewares(config.postMiddleWare, router);

    apiRouter.use(config.path, router);
}
app.use('/api', apiRouter);


// Gestion des urls non définies
app.use(function (req, res, next) {
    res.status(404);
    if( req.accepts('json') ) {
        res.json({ error: 'Not found' });
        return;
    }
    res.type('txt').send('Not found');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});