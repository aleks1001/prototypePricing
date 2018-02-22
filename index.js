var express = require("express");
var app     = express();
var path    = require("path");

//var cassandra = require('cassandra-driver');
//var client = new cassandra.Client({contactPoints: ['127.0.0.1'], keyspace: 'demo'});
//client.connect(function(err,result){
//  console.log('cassandra connected')
//});

const listing = require('./listing')

app.set('view engine', 'ejs')
app.get('/listing', (req, res) => {
  listing(function(result){
    res.render('index', { items: JSON.stringify(result) })
  })
})

app.get('/data', (req, res) => {
  listing(function(result){
    res.send(result);
  }, true)
})

app.get('/detail', (req, res) => {

  //client.execute("SELECT lastname, age, city, email, firstname FROM users WHERE lastname='Jones'", function (err, result) {
  //  if (!err){
  //    if ( result.rows.length > 0 ) {
  //      var user = result.rows[0];
  //      console.log("name = %s, age = %d", user.firstname, user.age);
  //    } else {
  //      console.log("No results");
  //    }
  //  }
  //});

  res.render('detail', {})
})

app.listen(8080)

console.log('listening on port 8080')