const axios = require('axios');
const async = require('async');
const moment = require('moment');

const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(function(item, index) {
  return function(callback) {
    const checkIn = moment().add(index, 'days').format('YYYYMMDD');
    const checkOut = moment().add(item, 'days').format('YYYYMMDD')
    const url = `https://www.priceline.com/pws/v0/stay/integratedlisting/detail/41249?adult-occ=2&cguid=834794b14f2141b3a1366b1fd1cfff86&check-in=${checkIn}&check-out=${checkOut}&currency=USD&rate-display-option=S&response-options=POP_COUNT,RATE_SUMMARY&rooms=1`
    axios.get(url)
      .then(function(response) {
        callback(null, `CHECK-IN: ${checkIn} - ${response.data.hotel.ratesSummary.minPrice}`)
      })
      .catch(function(error) {
        console.log(error);
        callback(error, null)
      });
  }
})

async.parallel(tasks, function(err, result) {
  console.log(result.sort())
})