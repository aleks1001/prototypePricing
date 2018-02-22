const axios = require('axios');
const async = require('async');
const moment = require('moment');
const _ = require('lodash')

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

const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(function(item, index) {
  return function(callback) {
    const checkIn = moment().add(index, 'days').format('YYYYMMDD');
    const checkOut = moment().add(item, 'days').format('YYYYMMDD')
    const url = `https://www.priceline.com/pws/v0/stay/integratedlisting/3000015284?check-in=${checkIn}&check-out=${checkOut}&cityId=3000016152&product-types=RTL&response-options=DETAILED_HOTEL&rooms=1&SORTBY=HDR`
    axios.get(url)
      .then(function(response) {
        const hotels = response.data.hotels;

        const maxPriceAllHotels = maxBy(hotels);
        const minPriceAllHotel = minBy(hotels);
        const maxPriceReqHotel = maxBy(reqHotels(hotels, 15));
        const mixPriceReqHotel = minBy(reqHotels(hotels, 15));

        //callback(null, {
        //  x: new moment(checkIn, 'YYYYMMDD'),
        //  y: [parseInt(maxPriceHotel), parseInt(minPriceHotel)]
        //})

        callback(null, {
          date: new moment(checkIn, 'YYYYMMDD'),
          maxHotelPrice: maxPriceAllHotels,
          minHotelPrice: minPriceAllHotel,
          maxReqHotelPrice: maxPriceReqHotel,
          minReqHotelPrice: mixPriceReqHotel
        })

      })
      .catch(function(error) {
        console.log(error);
        callback(error, null)
      });
  }
})

const call = function(callback, custom) {
  return async.parallel(tasks, function(err, result) {
    callback(result)
  })
}

module.exports = call
//HOTEL_ID: ${hotels[0].hotelId} CHECK_IN: ${checkIn} - ${hotels[0].ratesSummary.minPrice}