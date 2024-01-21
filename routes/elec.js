const axios = require('axios');

const url = "https://api.odcloud.kr/api/EvInfoServiceV2/v1/getEvSearchList"
require('dotenv').config();
const SERVICE_KEY = process.env.ELECTRIC_CAR_KEY
const addrSetting = '[addr::LIKE]'
const addrValue = '대전광역시 유성구'
const encodedValue = encodeURIComponent(addrSetting)+'='+encodeURIComponent(addrValue)

axios.get(`${url}?page=1&perPage=10&cond${encodedValue}&serviceKey=${SERVICE_KEY}`)
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('에러 발생:', error.message);
    if (error.response) {
        console.error('에러 응답 데이터:', error.response.data);
      }
  });

