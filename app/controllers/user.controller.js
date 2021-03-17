const fs = require('fs');
const { SkynetClient } = require('@nebulous/skynet');

const client = new SkynetClient();

exports.uploadIM = async (req, res) => {
  const file = req.files.file;
  file.mv('./uploads/' + file.name, async function(err, result) {
    if(err) { throw err; }
    try {
      const skylink = await client.uploadFile('./uploads/' + file.name);
      res.send(`Upload successful, skylink: ${skylink}`);
    } catch (err) {
      res.status(404).send(err);
    }
  });
};

exports.uploadEX = async (req, res) => {
  const { internalId, name, descripion, media, cryptedMedia } = req.body;

  let modifiedData = {
    internalId,
    name,
    descripion,
    media: {
      type: "image/png",
      url: media,
      height: 250,
      width: 250
    },
    cryptedMedia: {
      url: cryptedMedia,
    }
  }

  try {
    fs.writeFileSync('./uploads/test.json', JSON.stringify(modifiedData));

    const skylink = await client.uploadFile('./uploads/test.json');

    console.log(213)
    console.log(skylink)
    // res.send(`Upload successful, skylink: ${skylink}`);

  } catch (err) {
    console.error(err)
    // res.status(404).send(err);
  }
};