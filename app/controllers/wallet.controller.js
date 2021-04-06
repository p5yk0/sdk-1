
import * as walletService from '../services/wallet.service.js';
import * as cryptoService from '../services/crypto.service.js';


export async function mnemonicGenerate(req, res, next) {
    res.locals.api_response = await walletService.mnemonicGenerate();
    next();
}

export async function generateKey(req, res, next) {
    res.locals.api_response = await cryptoService.generateKey();
    next();
}