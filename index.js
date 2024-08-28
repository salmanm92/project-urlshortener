require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const shortid = require('shortid');
const Url = require("./models/UrlSchema");
const dns = require('dns');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser'); 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

const mongoURL = process.env.MONGODB_URL;
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;


db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

app.post('/api/shorturl', async (req, res) => {
  const  original_url  = req.body.url;
  console.log(original_url);
  
  if (!validUrl.isWebUri(original_url)) {
    return res.json({ error: 'invalid url' });
  }
  const hostname = url.parse(original_url).hostname;
  dns.lookup(hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: 'invalid url' });
    } else {
  try {
    let foundUrl = await Url.findOne({ original_url: original_url });

    if (foundUrl) {
      res.json({ original_url: foundUrl.original_url, short_url: foundUrl.short_url });
    } else {
      const shortUrl = shortid.generate();
      const newUrl = new Url({ original_url: original_url, short_url: shortUrl });
      await newUrl.save();
      res.json({ original_url: original_url, short_url: shortUrl });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json('Server error');
  }
}
});
});

// GET /api/shorturl/:shorturl: Redirect to the original URL
app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shortUrl = req.params.shorturl;

  try {
    const result_url = await Url.findOne({ short_url: shortUrl });

    if (result_url) {
      res.redirect(result_url.original_url);
    } else {
      res.status(404).json('No URL found');
    }
  } catch (err) {
    res.status(500).json('Server error');
  }
});

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
