const fs = require('fs');
const got = require('got');
const FileType = require('file-type');
const { SkynetClient } = require('@nebulous/skynet');

const client = new SkynetClient();

exports.uploadIM = async (req, res) => {
  const file = req.files.file;
  file.mv('./uploads/' + file.name, async function(err, result) {
    if(err) { throw err }
    try {
      const skylink = await client.uploadFile('./uploads/' + file.name);
      res.json({ file: `https://siasky.net/${skylink.substring(6)}` });
    } catch (err) {
      res.status(404).send(err);
    }
  });
};

exports.uploadEX = async (req, res) => {

  const { internalId, name, descripion, media, cryptedMedia } = req.body;

  try {

    const stream = await got.stream(media);

    const extention = await FileType.fromStream(stream); 

    let modifiedData = {
      internalId,
      name,
      descripion,
      media: {
        type: extention.mime,
        url: media,
        height: 250,
        width: 250
      },
      cryptedMedia: {
        url: cryptedMedia,
      }
    }

    fs.writeFileSync('./uploads/test.json', JSON.stringify(modifiedData));

    const skylink = await client.uploadFile('./uploads/test.json');

    res.json({ file: `https://siasky.net/${skylink.substring(6)}` });
  } catch (err) {
    console.log(err)
    res.status(404).send(err.message);
  }
};