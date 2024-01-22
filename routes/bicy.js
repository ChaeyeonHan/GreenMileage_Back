const axios = require('axios');
var express = require('express');
var router = express.Router();

const url = "http://apis.data.go.kr/6300000/openapi2022/tasuInfo/gettasuInfo"
require('dotenv').config();
const SERVICE_KEY = process.env.TASU_KEY


router.get('/', function(req, res, next) {
  axios.get(`${url}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=220`)
  .then(response => {
    res.send(response.data.response.body.items);
  })
  .catch(error => {
    console.error('에러 발생:', error.message);
  });
});

module.exports = router;