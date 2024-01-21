const axios = require('axios');

const url = "http://apis.data.go.kr/6300000/openapi2022/tasuInfo/gettasuInfo"
const SERVICE_KEY = process.env.TASU_KEY
console.log(SERVICE_KEY)

axios.get(`${url}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10`)
  .then(response => {
    console.log(response.data.response.body);
  })
  .catch(error => {
    console.error('에러 발생:', error.message);
  });