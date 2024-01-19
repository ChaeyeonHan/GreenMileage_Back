const axios = require("axios");
const cheerio = require("cheerio");

const url = 'https://www.greenpeace.org/korea/from-the-earth/';


axios.get(url)
  .then(response => {
    const $ = cheerio.load(response.data);

    // 원하는 정보를 선택자를 사용해 추출

    const campaigns = [];
    $('.swiper-slide.card-update').each((index, element) => {
      const campaign = {
        title: $(element).find('h3').text(),
        image: $(element).find('.thumbnail').css('background-image').replace(/url\(['"]?(.*?)['"]?\)/, '$1'),
        link: $(element).attr('href'),
        issue: $(element).find('.issue').text(),
        duration: $(element).find('.meta-box div:last-child span:last-child').text(),
        date: $(element).find('.meta-box div:last-child span:not(:last-child)').text(),
      };
      campaigns.push(campaign);
    });

    // 추출한 정보 출력 또는 다른 처리 수행
    console.log('캠페인 정보:', campaigns);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
