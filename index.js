var bodyParser = require('body-parser')
var express = require("express");
var app = express();
var path = require("path");
var r = require('rethinkdb')

const listing = require('./listing')
const detail = require('./detail')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(createConnection);

app.set('view engine', 'ejs')
app.get('/create/:cityId/:days', listing.loadData)
app.get('/listing/:cityId/:days', listing.getByCityIdForNumOfDaysGrouped)
app.get('/detail/:hotelId/:days', detail.getByHotelIdForDays)

startExpress()

function createConnection(req, res, next) {
  r.connect({
    host: 'localhost',
    port: 28015,
    db: 'test'
  }).then(function(conn) {
    req._rdbConn = conn;
    next();
  }).error(handleError(res));
}

function handleError(res) {
  return function(error) {
    res.send(500, {error: error.message});
  }
}

function startExpress() {
  app.listen(9099);
  console.log('Listening on port 9099');
}
