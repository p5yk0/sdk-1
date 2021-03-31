#NFT UPLOAD
img=exemple.jpg
name=$("Yippee Ki Yay")
description=$("Yippee Ki Yay from France")

#Upload file
  media=$(curl --request POST \
  -F "file=@$img" \
   --url http://127.0.0.1:3000/api/uploadIM| jq -r '.file');


#CRYPT and Upload secret
  secret=$(curl --request POST \
  -F "file=@$img" \
   --url http://127.0.0.1:3000/api/cryptFile| jq -r '.file');

#Generate and upload NFT
nft=$(curl --request POST \
  --url http://127.0.0.1:3000/api/uploadEX \
  --header 'Content-Type: application/json' \
  --data '{
	"internalid":"C18",
	"name":"'+$name+'",
	"description":"'+$description+'",
	"media":"'+$media+'",
	"cryptedMedia":"'+$secret+'"
}'| jq -r '.file');

#Mint NFT
id=$(curl --request POST \
  --url http://127.0.0.1:3000/api/createNFT \
  --header 'Content-Type: application/json' \
  --data '{
	"nftUrl":"'+$nft+'"
}');

#Deploy
curl --request POST \
  --url http://127.0.0.1:3000/api/sellNFT \
  --header 'Content-Type: application/json' \
  --data '{
	"nftId":'+$id+'
}
	'