import randomString from '../utils/randomString.js';
import { blake2AsHex } from '@polkadot/util-crypto';


export async function generateKey() {
    let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return blake2AsHex(randomString(charset, 20));
}