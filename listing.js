const axios = require('axios');
const async = require('async');
const moment = require('moment');
const _ = require('lodash')
const r = require('rethinkdb')

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
          //const maxPriceAllHotels = maxBy(hotels);
          //const minPriceAllHotel = minBy(hotels);
          //const maxPriceReqHotel = maxBy(reqHotels(hotels, 15));
          //const mixPriceReqHotel = minBy(reqHotels(hotels, 15));

          cb(null, {
            hotels: hotels,
            checkIn: new moment(checkIn, 'YYYYMMDD').toDate(),
            checkOut: new moment(checkOut, 'YYYYMMDD').toDate()
          })

          //callback(null, {
          //  date: new moment(checkIn, 'YYYYMMDD'),
          //  maxHotelPrice: maxPriceAllHotels,
          //  minHotelPrice: minPriceAllHotel,
          //  maxReqHotelPrice: maxPriceReqHotel,
          //  minReqHotelPrice: mixPriceReqHotel
          //})

        })
        .catch(function(error) {
          cb(error, null)
        });
    })
  }
  return tasks;
}

const getByCityIdForNumOfDaysGrouped = function(req, res, next) {
  r.table('hotel').filter(r.row('cityId').eq(req.params.cityId)).group('checkIn','checkOut').run(req._rdbConn).then((data)=> {
      res.send(data)
    }).catch((err)=> {
      next(err)
    }).finally(next)
}

const loadData = (req, res, next)=> {
  return async.parallel(generateDaysOfTasks(req.params), function(err, results) {
    results.forEach((result) => {
      const hotels = result.hotels.map(hotel => {
        return {
          checkIn: result.checkIn,
          checkOut: result.checkOut,
          hotelId: hotel.hotelId,
          hotelName: hotel.name,
          brandId: hotel.brandId,
          starRating: hotel.starRating,
          neighborhoodId: hotel.location.neighborhoodId,
          neighborhoodName: hotel.location.neighborhoodName,
          cityId: hotel.location.cityId.toString(),
          overallGuestRating: hotel.overallGuestRating,
          minPrice: parseFloat(hotel.ratesSummary.minPrice),
          htlDealScore: hotel.htlDealScore || null
        }
      });
      r.table('hotel').insert(hotels).run(req._rdbConn).then((data)=> {

      }).catch((err)=> {
        next(err)
      }).finally(next)
    })
    res.send(results)
  })
}

module.exports = {getByCityIdForNumOfDaysGrouped, loadData}