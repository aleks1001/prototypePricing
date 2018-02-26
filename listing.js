const axios = require('axios');
const async = require('async');
const moment = require('moment');
const _ = require('lodash')

axios.defaults.headers.post['Content-Type'] = 'application/json';

const reqHotels = function(arr, num) {
  var a = [];
  for (var i = 0; i <= num; i++) {
    a.push(arr[i])
  }
  return a;
}

const maxBy = function(hotels) {
  return _.maxBy(hotels, (hotel) => {
    return parseFloat(hotel.ratesSummary.minPrice)
  }).ratesSummary.minPrice;
}

const minBy = function(hotels) {
  return _.minBy(hotels, (hotel) => {
    return parseFloat(hotel.ratesSummary.minPrice)
  }).ratesSummary.minPrice;
}

const generateDaysOfTasks = ({days, cityId}) => {
  var tasks = []
  for (let i = 1; i <= days; i++) {
    tasks.push((cb)=> {
      const checkIn = moment().add(i, 'days').format('YYYYMMDD');
      const checkOut = moment().add(i + 1, 'days').format('YYYYMMDD')
      const url = `https://www.priceline.com/pws/v0/stay/integratedlisting/${cityId}?check-in=${checkIn}&check-out=${checkOut}&offset=0&page-size=40&product-types=RTL&response-options=DETAILED_HOTEL&rooms=1&SORTBY=HDR`
      axios.get(url)
        .then(function(response) {
          const hotels = response.data.hotels;
          const maxPriceAllHotels = maxBy(hotels);
          const minPriceAllHotel = minBy(hotels);
          //const maxPriceReqHotel = maxBy(reqHotels(hotels, 15));
          //const mixPriceReqHotel = minBy(reqHotels(hotels, 15));

          cb(null, {
            x: new moment(checkIn, 'YYYYMMDD'),
            y: [parseInt(maxPriceAllHotels), parseInt(minPriceAllHotel)]
          })

          //callback(null, {
          //  date: new moment(checkIn, 'YYYYMMDD'),
          //  maxHotelPrice: maxPriceAllHotels,
          //  minHotelPrice: minPriceAllHotel,
          //  maxReqHotelPrice: maxPriceReqHotel,
          //  minReqHotelPrice: mixPriceReqHotel
          //})

          axios({
            method: 'post',
            url: 'http://0.0.0.0:3232/hotels',
            data: {hotels: hotels, checkIn: new moment(checkIn, 'YYYYMMDD').toDate(), checkOut: new moment(checkOut, 'YYYYMMDD').toDate()}
          });

        })
        .catch(function(error) {
          cb(error, null)
        });
    })
  }
  return tasks;
}

const call = function(callback, props) {
  return async.parallel(generateDaysOfTasks(props), function(err, result) {
    callback(result)
  })
}

module.exports = call
