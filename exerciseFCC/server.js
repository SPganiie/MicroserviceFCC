const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(cors())
app.use(express.static('public'))

let exerciseSchema = new mongoose.Schema({
  description : {type: String, required: true}, 
  duration : {type: Number, required: true}, 
  date : String
})
let userSchema = new mongoose.Schema({
  username : {type: String, required: true},
  log : [exerciseSchema]
})

let exercise = mongoose.model('Exercises', exerciseSchema)
let user = mongoose.model('Users', userSchema)

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', urlencodedParser, (req, res) => {
  let createUser = new user({username: req.body.username}) 
  createUser.save((err, done) => {
    if(!err){
      res.json({
        username: done.username,
        _id: done.id
      })
    }
  })
})

app.get('/api/exercise/users', (req, res) => {
  user.find({}, (err, done) => {
    res.json(done)
  })
})

app.post('/api/exercise/add', urlencodedParser, (req, res) => {
  let input = {
    description : req.body.description, 
    duration : parseInt(req.body.duration), 
    date : req.body.date
  }
  if(input.date === ''){
    input.date =  new Date().toISOString().substring(0,10)
  }
  user.findByIdAndUpdate(
      req.body.userId, 
      {$push: {log: input}},
      {new: true},
      (err, result) => {
        if(!err){
          res.json({
            _id: result._id,
            username: result.username,
            description:input.description,
            duration: input.duration,
            date: new Date(input.date).toDateString()
          })
        }else{
          console.log('error gesssss')
        }
      }
    )
})

app.get('/api/exercise/log', (req, res) => {
  user.findById(req.query.userId, (err, result) => {
    if(!err){
      let sum = result.toJSON()
      let fromDate =  new Date(0)
      let toDate   = new Date()
      if(req.query.from || req.query.to){
        if(req.query.from){
           fromDate = new Date(req.query.from).getTime()
        }
        if(req.query.to){
           toDate = new Date(req.query.to).getTime()
        }
        sum.log = sum.log.filter((x) => {
          let xDate = new Date(x.date).getTime()
          return xDate >= fromDate && xDate <= toDate 
        })
      }
      if(req.query.limit){
        sum.log = sum.log.slice(0, req.query.limit) 
      }
      sum['count'] = result.log.length
      res.json(sum)
    }else{
      res.json("User Tidak Ditemukan")
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
