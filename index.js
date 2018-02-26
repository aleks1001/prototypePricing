var bodyParser = require('body-parser')
var express = require("express");
var app = express();
var path = require("path");

const listing = require('./listing')
const detail = require('./detail')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'ejs')
app.get('/listing/:cityId/:days', (req, res) => {
  listing(function(result) {
    res.render('index', {items: JSON.stringify(result)})
  }, {
    days: req.params.days,
    cityId: req.params.cityId
  })
})

app.get('/detail/:hotelId/:days', (req, res) => {
  detail(function(result) {
    res.render('index', {items: JSON.stringify(result)})
  }, {
    days: req.params.days,
    hotelId: req.params.hotelId
  });
})

app.get('/', (req, res) => {
  res.redirect('/listing/30')
})

app.listen(9090)

console.log('listening on port 9090')