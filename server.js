
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

require('dotenv').config();

const app = express();



(async () => {



})();





app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('server is running');
});

require("./app/routes/user.routes")(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});