require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
var bodyParser = require('body-parser')
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const { URL } = require('url');
const { Schema } = mongoose

let mw = bodyParser.urlencoded({extended: false})

process.env.MONGO_URI=' '
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: {type: Number, required: true}
}) 
const Url = mongoose.model('Url', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', mw, function(req, res) {
  let url
  try {
    url = new URL(req.body.url)
  } catch(e) {
    return res.json({ error: 'invalid url' })
  }
  if (url.protocol != 'http:' && url.protocol != 'https:') return res.json({ error: 'invalid url' })

  Url.findOne({original_url: req.body.url}, (err, data) => {
    if(err) console.log(err)
    if(data) {
      return res.json({ original_url: data.original_url, short_url: data.short_url })
    }
    let surl = 0
    Url.findOne({}, {}, { sort: '-short_url' }, (err, data) => {
      if(err) console.log(err)
      else {
        surl = data.short_url + 1
        Url.create({ original_url: req.body.url, short_url: surl }, (err, data) => {
          if(err) console.log(err)
          else return res.json({ original_url: data.original_url, short_url: data.short_url })
        })
      }
    })
  })
});

app.get('/api/shorturl/:surl', async function(req, res) {
  await Url.findOne({ short_url: req.params.surl }, (err, data) => {
    if(!data || err) res.json({ error: 'No short URL found for the given input'})
    else res.redirect(data.original_url)
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
