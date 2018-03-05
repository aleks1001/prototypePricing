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
      const url = `https://www.priceline.com/pws/v0/stay/integratedlisting/${cityId}?check-in=${checkIn}&check-out=${checkOut}&page-size=100&product-types=RTL&response-options=DETAILED_HOTEL&rooms=1&SORT=HDR&unlock-deals=true`

      axios.get(url)
        .then(function(response) {
          const hotels = response.data.hotels;
          cb(null, {
            hotels: hotels,
            checkIn: new moment(checkIn, 'YYYYMMDD').toDate(),
            checkOut: new moment(checkOut, 'YYYYMMDD').toDate()
          })

          //console.log('GET: ', hotels[0].name, "DATE: ", checkIn, hotels.length)
        })
        .catch(function(error) {
          cb(error, null)
        });
    })
  }
  return tasks;
}

const getByCityIdForNumOfDaysGrouped = function(req, res, next) {
  console.log(req.query, req.params);
  const stars = req.query['stars'] && req.query['stars'].split(',');
  console.log(stars);
  const filter = ()=> {
    if (stars) {
      const firstStar = parseInt(stars[0]);
      const lastStar = parseInt(stars[stars.length-1]);
      return function(hotel) {
        return hotel('cityId').eq(req.params.cityId).and(hotel('starRating').ge(firstStar).and(hotel('starRating').lt(firstStar + 1)))
      }
    } else {
      return function(hotel) {
        return hotel('cityId').eq(req.params.cityId)
      }
    }
  }

  r.map(
    r.table('hotel').filter(filter()).group('checkIn').max('price')('price').ungroup(),
    r.table('hotel').filter(filter()).group('checkIn').min('price')('price').ungroup(),
    r.table('hotel').filter(filter()).group('checkIn').limit(5).max('price')('price').ungroup(),
    r.table('hotel').filter(filter()).group('checkIn').limit(5).min('price')('price').ungroup(),
    function(max, min, maxRec, minRec) {
      return {
        'checkIn': max('group'),
        'maxHotelPrice': max('reduction').round(),
        'minHotelPrice': min('reduction').round(),
        'maxReqHotelPrice': maxRec('reduction').round(),
        'minReqHotelPrice': minRec('reduction').round()
      }
    }).run(req._rdbConn).then((data)=> {
      res.send(data)

    }).catch((err)=> {
      next(err)
    }).finally(next)
}

const loadData = (req, res, next)=> {
  return async.parallel(generateDaysOfTasks(req.params), function(err, results) {
    if (err) {
      res.send(err);
    }
    results.forEach((result) => {
      try {
        const hotels = [];
        result.hotels.forEach(hotel => {
          if (parseFloat(hotel.ratesSummary.minPrice) && parseFloat(hotel.ratesSummary.minPrice) <= 1000) {
            hotels.push({
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
              price: parseFloat(hotel.ratesSummary.minPrice),
              htlDealScore: hotel.htlDealScore || null
            })
          }

        });
        //console.log('SET: ',hotels[0].hotelName, "DATE: ", hotels[0].checkIn, hotels.length)
        r.table('hotel').insert(hotels).run(req._rdbConn).then((data)=> {
        }).catch((err)=> {
          next(err)
        }).finally(next)
      } catch (err) {
        res.send(err)
      }
    })
    res.sendStatus(200)
  })
}

module.exports = {getByCityIdForNumOfDaysGrouped, loadData}