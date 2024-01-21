var express = require('express');
var router = express.Router();

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const randomUUID = require('crypto').randomUUID;
const jwt = require('jsonwebtoken');
require('dotenv').config();
var db  = require('../lib/db.js');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 이미지 업데이트
aws.config.update({
  region: 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read-write',
    bucket: "greenmileage-bucket",
    key: (req, file, cb) => {
      cb(null, Date.now().toString() + randomUUID() + file.originalname);
    }
  })
});


router.post('/image/upload', upload.single('profileImage'), async (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const token = req.headers.authorization.split(' ')[1]
    
    if (!token) {
      return res.status(403).json({
        message: "토큰이 없습니다."
      });
    }
    // 토큰 검증
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(400).json({
          message: "유효하지 않은 토큰입니다."
        });
      }

      const fileUrl = req.file.location;
      const userEmail = decoded.email;
      const sql = 'UPDATE users SET image = ? WHERE email = ? ';

      db.query(sql, [fileUrl, userEmail], (error, results) => {
        if (error) {
          return res.status(500).json({
            message: "데이터베이스 업데이트 중 오류 발생"
          });
        }

        res.status(200).json({
          message: "프로필 이미지가 업데이트 되었습니다.",
          imageUrl: fileUrl
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "서버 오류 발생"
    });
  }
});

module.exports = router;
