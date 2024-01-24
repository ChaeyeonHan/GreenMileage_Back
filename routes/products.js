const axios = require('axios');
const cheerio = require('cheerio');
const url = 'https://www.morestore.co.kr/';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    axios.get(url)
    .then(response => {
    const $ = cheerio.load(response.data);

        const products = [];
        // 사진, 제목, 가격

        $('.item.xans-record-').each((index, element) => {
            let productName = $(element).find('.name').find('a span').text().trim();
            let productImage = $(element).find('a').children('img').attr('src');
            let productPrice = $(element).find('.name').next('.name').find('a').text().trim();
            let productLink = 'https://www.morestore.co.kr' + $(element).find('.name').find('a').attr('href');

            // 상대경로로 되어있으면 절대경로로 변환
            if (productImage.startsWith('//')) {
                productImage = 'https:' + productImage;
            }

            products.push({name: productName, imageUrl: productImage, price: productPrice, link: productLink});
        });

        const limitedProducts = products.slice(0, 10);

        res.send(limitedProducts);

    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
});

module.exports = router;