var express = require('express');
var router = express.Router();
var axios = require('axios');
var querystring = require('querystring');
var crypto = require('crypto');

var db  = require('../lib/db.js');
const { token } = require('morgan');
require('dotenv').config();

// oauth 사용자 password 필드에 임의의 값 설정을 위한 무작위 문자열 생성
function generateSafeString(length) {
  return crypto.randomBytes(length).toString('hex');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/login/kakao', (req, res) => {
  console.log('GET /login/kakao - 카카오 로그인 페이지로 리디렉션');
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;
  res.redirect(kakaoAuthUrl);
} )

router.get('/auth/kakao/callback', async (req, res) => {
  console.log('GET /auth/kakao/callback - 카카오로부터 콜백 요청됨');
  
  const code = req.query.code;  // 카카오에게 받은 인증코드
  console.log('인증 코드:', code);

  try {
    // 여기서 access_token요청
    console.log('카카오로부터 액세스 토큰 요청');

    const tokenResponse  = await axios.post('https://kauth.kakao.com/oauth/token', querystring.stringify({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code: code,  // Authorization Code로 accessToken을 받아옴
    }), {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
    });
    const accessToken = tokenResponse.data.access_token;

    // 사용자 정보 요청
    console.log('카카오로부터 사용자 정보 요청');
    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 유저 정보에서 nickname, profile_image 가져와서
    const userInfo = userInfoResponse.data;
    const nickname = userInfo.properties.nickname;
    const profileImage = userInfo.properties.profile_image;
    const randomPassword = generateSafeString(16);  // 16바이트 길이의 안전한 무작위 문자열

    // 받아온 카카오 id로 가입한적이 있는지 확인후, 가입시키기
    db.query('SELECT * FROM users WHERE id = ?', [userInfo.id], (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        db.query('INSERT INTO users (id, username, point, password, logintype, image) VALUES (?, ?, ?, ?, ?, ?)',
          [userInfo.id, nickname, 0, randomPassword, "kakao", profileImage], (err, result) => {
            if (err) throw err;
            console.log(userInfo.id + " 카카오 사용자 가입");
          });
      } else {
        console.log("기존 사용자");
      }
    })
    
    console.log(userInfoResponse.data);
    res.status(200).json({
      message: "카카오 사용자 로그인 완료",
      data: userInfoResponse.data,
    })
  }  catch (error) {
    res.status(500).send(error);
  }
});


router.get('/login/naver', (req, res) => {
  var naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URI}&state=STATE_STRING`;
  res.redirect(naverAuthUrl);
})

router.get('/auth/naver/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;

    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', querystring.stringify({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      redirect_uri: process.env.NAVER_REDIRECT_URI,
      code: code,
      state: state
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  });

    const accessToken = tokenResponse.data.access_token;
    const userInfoResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userInfo = userInfoResponse.data;
    const nickname = userInfo.response.name;
    const profileImage = userInfo.response.profile_image;
    const userEmail = userInfo.response.email;
    const randomPassword = generateSafeString(16);

    db.query('SELECT * FROM users WHERE email = ?', [userEmail], (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        db.query('INSERT INTO users (username, email, point, password, logintype, image) VALUES (?, ?, ?, ?, ?, ?)',
          [nickname, userEmail, 0, randomPassword, "naver", profileImage], (err, result) => {
            if (err) throw err;
            console.log(userInfo.id + " 네이버 사용자 가입");
        });
        console.log(userInfoResponse.data);
        res.status(200).json({
          message: "네이버 사용자 로그인 완료",
          data: userInfo.response
        });
      } else {
        return res.status(200).json({
          message: "해당 메일로 이미 가입한 사용자입니다.",
          data: userInfo.response,
    });
  }
    })
  } catch (error) {
    res.status(500).send(error);
  }

})

module.exports = router;
