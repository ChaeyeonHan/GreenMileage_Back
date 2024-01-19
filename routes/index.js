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

    // logintype username image
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

//구글 로그인 구현
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_SECRET_KEY;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';


router.get('/login', (req, res) => {
  let url = 'https://accounts.google.com/o/oauth2/v2/auth';
  url += `?client_id=${GOOGLE_CLIENT_ID}`
  url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
  url += '&response_type=code'
  url += '&scope=openid email profile'    
  res.redirect(url);
});

router.get('/login/redirect', async (req, res) => {
  try {
    const { code } = req.query;
    console.log(`code: ${code}`);
    // access_token, refresh_token 등의 구글 토큰 정보 가져오기
    const resp = await axios.post(GOOGLE_TOKEN_URL, {
      // x-www-form-urlencoded(body)
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });
    const resp2 = await axios.get(GOOGLE_USERINFO_URL, {
      // Request Header에 Authorization 추가
      headers: {
          Authorization: `Bearer ${resp.data.access_token}`,
      },
    });
    const userData = resp2.data;

    db.query('SELECT * FROM users WHERE id = ?', [userData.id], (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        db.query('INSERT INTO users (username, email, point, logintype) VALUES (?, ?, ?, ?)',
          [userData.name, , userData.email, 0, "google"], (err, result) => {
            if (err) throw err;
            console.log(userData.id + " 구글 사용자 가입");
          });
      } else {
        console.log("기존 사용자");
      }
    })
    
    console.log(userData);
    res.status(200).json({
      message: "구글 사용자 로그인 완료",
      data: userData,
    })
    
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

module.exports = router;
