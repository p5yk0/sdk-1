
// Generate a random string of {length} characters defined in {charset}
export default function(charset, length) {

    let result = '';

    for( let i = 0; i < length; i++ ) {
        result += charset.charAt(crypto.randomBytes(4).readUInt32BE() % charset.length);
    }

    /*
    // Ancienne méthode avec Math.random
    let result  = '';
    for( let i = 0; i < 20; i++ ) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    */

    return result;
}