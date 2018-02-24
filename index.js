var express = require("express");
var app = express();
var path = require("path");

const listing = require('./listing')

app.set('view engine', 'ejs')
app.get('/listing', (req, res) => {
  listing(function(result) {
    res.render('index', {items: JSON.stringify(result)})
  })
})

app.get('/data', (req, res) => {
  listing(function(result) {
    res.send(result);
  }, true)
})

app.get('/detail', (req, res) => {
  res.render('detail', {})
})

app.listen(9090)

console.log('listening on port 9090')