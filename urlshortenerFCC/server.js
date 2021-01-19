require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParse = require('body-parser');
mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})

let url = mongoose.model('Url', urlSchema)

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
let result = {}
app.post('/api/shorturl/new', bodyParse.urlencoded({ extended: false }), (req, res) => {
  let input = req.body['url']
  let count = 1

  var expression = /^[http://www.]/g;
  var regex = new RegExp(expression);

  if (!input.match(regex)) {
    return res.json({ 
        error: 'invalid url' 
      })
  }

  result['original_url'] = input
  url.findOne({})
      .sort({short: 'desc'})
      .exec((err, re) => {
        if(!err && re != undefined){
          count = re.short + 1
        }
        if(!err){
          url.findOneAndUpdate(
            {original: input},
            {original: input, short: count},
            {new: true, upsert: true},
            (err, saved) => {
              if(!err){
                result['short_url'] = saved.short
                res.json(result)
              }
            }
          )
        }
      })
})
app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input
  url.findOne({short: input}, (err, re) => {
    if(!err && re != undefined){
      res.redirect(re.original)
    } else {
      res.json('URL not Found')
    }
  })
  
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

