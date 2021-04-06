import { mnemonicGenerate as generateMnemonic } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';


/**
 * Generate random mnemonic with her public address
 * Exemple de retour :
 * {
 *    "mnemonic": "sting sunny oppose dilemma lumber logic lucky chaos chair rib deputy flat",
 *    "address": "5DndzCxdemsxP8KprYbZmFE87crz5QEQmK6L4nbHZAhXLjGv"
 * }
 */
export async function mnemonicGenerate() {

    const keyring    = new Keyring({ type: 'sr25519' });
    const mnemonic   = generateMnemonic();
    const newAccount = await keyring.addFromUri(mnemonic);

    return {
        mnemonic : mnemonic,
        address  : newAccount.address,
    };
}