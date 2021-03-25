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
Using Previously uploaded files, generate your NFT
```
curl --request POST \
  --url http://127.0.0.1:3000/api/uploadEX \
  --header 'Content-Type: application/json' \
  --data '{
	"internalid":"18",
	"name":"Yippee Ki Yay",
	"description":"Yippee Ki Yay from France",
        "media":"https://siasky.net/NADj2RoH6l_YVKKN7YrsSHYlimHP-qDQdf3uQrAAZvKeQA",
        "cryptedMedia":"https://siasky.net/NACIeWPwD9LSzB7ievDeaVQMN-NdGYX5xfXWdiAemBhNdA"
        }'
```

**Result**

```
{
  "file": "https://siasky.net/AAAKYhYQ1R6PwULeslCcsf5c3TGJdxboe9LUAjX5IPIB3w"
}
```


### Claim Free tokens
In order to try our blockchain, you should claim free Tokens.
> ⚠️ Faucet is now only available for Ternoa's developers. Feel free to ask tokens on our Discord for get test tokens.


### Create NFT on Ternoa Chain
Now your NFT is ready to deploy on Ternoa chain's. 
```
curl --request POST \
  --url http://127.0.0.1:3000/api/createNFT \
  --header 'Content-Type: application/json' \
  --data '{
	"nftUrl":"https://siasky.net/AAAKYhYQ1R6PwULeslCcsf5c3TGJdxboe9LUAjX5IPIB3w"
        }'
	
```
On Ternoa Chaos Net, you can follow the NFT creating event.

![](https://i.imgur.com/z1qo7ZT.png)
![](https://i.imgur.com/46dMysM.png)

### Sign NFT ownership and Send it to NoChain (SGX)
Prepare and send to SGX crypted && signed data 
```
curl --request POST \
  --url http://127.0.0.1:3000/api/signPasswordRequest \
  --header 'Content-Type: application/json' \
  --data '{
  "nftId": "36",
  "hash": "5dae77e26da1c563fdff7e8706fd552d"
}'
```

## MARKETPLACE