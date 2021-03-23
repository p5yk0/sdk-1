# SDK1  - NFT
## Create and upload NFT to Ternoa's Marketplace
Bellow all steps for create your NFT and upload to Ternoa's Market place.

### Start the server locally
```
node server.js
```
> ⚠️ Nodemon is not compatible
### Generate Mnemonic
First, generate your mnemonic phrase and retreive you public address. 
```
GET http://127.0.0.1:3000/api/mnemonicGenerate
```
**Result**
```
{"mnemonic":"observe injury wasp verify found dream addict leaf produce section royal trim","address":"5FmvpY1zJQC4wDXi1L5yqjZL5VkVtiJb7XhHcPBRpSSytFcv"}
```
### Upload NFT public media to SIA Skynet
Upload the NFT public media. All users will be able to access to it.
```
curl --request POST \
  --url http://127.0.0.1:3000/api/uploadIM \
  --header 'Content-Type: multipart/form-data; boundary=---011000010111000001101001' \
  --form file=@/Users/ternoa/Downloads/example.png
```
**Result**
```
{
  "file": "https://siasky.net/NADj2RoH6l_YVKKN7YrsSHYlimHP-qDQdf3uQrAAZvKeQA"
}
```
### Encrypt and upload NFT secret media
Encrypt your secret media using [GPG algorithm](https://en.wikipedia.org/wiki/GNU_Privacy_Guard) then upload to SIA Skynet.

* *That command will generate GPG asymmetric keys and a secure password. We'll us hash of file as the filename*

```
curl --request POST \
  --url http://127.0.0.1:3000/api/cryptFile \
  --header 'Content-Type: multipart/form-data; boundary=---011000010111000001101001' \
  --form file=@/Users/ternoa/Downloads/example.png
```

**Result**
```
{
  "file": "https://siasky.net/NACIeWPwD9LSzB7ievDeaVQMN-NdGYX5xfXWdiAemBhNdA"
}
```
### Create your NFT
Get NFT design normal and secret


Grand CAPS (test Coin)


Getting your menomonic wallet
GET http://127.0.0.1:3000/api/mnemonicGenerate

generate key crypto
GET http://127.0.0.1:3000/api/generateKey

upload file
POST http://127.0.0.1:3000/api/uploadIM

crypt and upload secret 
POST http://127.0.0.1:3000/api/cryptFile

Generate NFT
POST http://127.0.0.1:3000/api/uploadEx

Create NFT
POST http://127.0.0.1:3000/api/createNFT

Sign NFT owneshit


Send Key to NoChain


## MARKETPLACE