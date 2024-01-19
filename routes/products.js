const axios = require('axios');
const cheerio = require('cheerio');

async function fetchProducts() {
    try {
        const response = await axios.get('https://www.morestore.co.kr/');
        const html = response.data;

        const $ = cheerio.load(html);
        const products = [];
        // 사진, 제목, 가격

        $('.item.xans-record-').each((index, element) => {
            let productName = $(element).find('.name').find('a span').text().trim();
            let productImage = $(element).find('a').children('img').attr('src');
            let productPrice = $(element).find('.name').next('.name').find('a').text().trim();

            // 상대경로로 되어있으면 절대경로로 변환
            if (productImage.startsWith('//')) {
                productImage = 'https:' + productImage;
            }

            products.push({name: productName, imageUrl: productImage, price: productPrice});
        });

        console.log(products);
    } catch (error) {
        console.log(error);
    }
};

fetchProducts();