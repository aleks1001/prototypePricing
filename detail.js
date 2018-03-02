const axios = require('axios');
const async = require('async');
const moment = require('moment');
const r = require('rethinkdb')

const generateDaysOfTasks = ({days, hotelId}) => {
  var tasks = []
  for (let i = 1; i <= days; i++) {
    tasks.push((cb)=> {
      const checkIn = moment().add(i, 'days').format('YYYYMMDD');
      const checkOut = moment().add(i + 1, 'days').format('YYYYMMDD')
      const url = `https://www.priceline.com/pws/v0/stay/integratedlisting/detail/${hotelId}?adult-occ=2&cguid=834794b14f2141b3a1366b1fd1cfff86&check-in=${checkIn}&check-out=${checkOut}&currency=USD&rate-display-option=S&response-options=POP_COUNT,RATE_SUMMARY&rooms=1`
      axios.get(url)
        .then(function(response) {
          const hotel = response.data.hotel;
          //const maxPriceAllHotels = maxBy(hotels);
          //const minPriceAllHotel = minBy(hotels);
          //const maxPriceReqHotel = maxBy(reqHotels(hotels, 15));
          //const mixPriceReqHotel = minBy(reqHotels(hotels, 15));

          cb(null, {
            hotelName: hotel.name,
            x: new moment(checkIn, 'YYYYMMDD'),
            y: [parseInt(hotel.ratesSummary.minPrice), 0]
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
            url: 'http://0.0.0.0:3232/hotel',
            data: {hotel: hotel}
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

const getByHotelIdForDays = (req, res, next)=> {
  r.table('hotel').filter({hotelId:req.params.hotelId}).orderBy('checkIn').limit(parseInt(req.params.days)).run(req._rdbConn).then((data)=> {
    res.send(data)
  }).catch((err)=> {
    console.log(err);
    next(err)
  }).finally(next)
}

module.exports = {call, getByHotelIdForDays}