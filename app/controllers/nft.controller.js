
import * as nftService  from '../services/nft.service.js';


export async function cryptFile(req, res, next) {
    console.log(req.files);
    const file = req.files.file;
    res.locals.api_response = await nftService.cryptFile(file);
    next();
}