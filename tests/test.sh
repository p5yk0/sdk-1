INPUT=../private/round1.csv
OLDIFS=$IFS
IFS=','
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }
while read wallet address Artist nftName  fileSecretName fileName description  
do
#NFT UPLOAD
imgFile="../private/$fileName"
secretFile="../private/$fileSecretName"

name=$nftName
description2=$(echo $description| sed 's/['"'"'"]/\\&/g')


#Upload file
  media=$(curl --request POST \
  -F "file=@$imgFile" \
   --url http://127.0.0.1:3000/api/uploadIM| jq -r '.file');

#CRYPT and Upload secret
  secret=$(curl --request POST \
  -F "file=@$secretFile" \
   --url http://127.0.0.1:3000/api/cryptFile| jq -r '.file');

#Generate and upload NFT
nft=$(curl --request POST \
  --url http://127.0.0.1:3000/api/uploadEX \
  --header 'Content-Type: application/json' \
  --data '{
	"internalid":"C18",
	"name":"'$name'",
	"description":"'$name'",
	"media":"'$media'",
	"cryptedMedia":"'$secret'"
}'| jq -r '.file');

#Mint NFT
id=$(curl --request POST \
  --url http://127.0.0.1:3000/api/createNFT \
  --header 'Content-Type: application/json' \
  --data '{
	"nftUrl":"'$nft'"
}');


exit;


#Deploy
curl --request POST \
  --url http://127.0.0.1:3000/api/sellNFT \
  --header 'Content-Type: application/json' \
  --data '{
	"nftId":'+$id+'
}
	'

  done < $INPUT
IFS=$OLDIFS