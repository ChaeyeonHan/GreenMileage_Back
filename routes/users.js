var express = require('express');
var router = express.Router();

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const randomUUID = require('crypto').randomUUID;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
var db  = require('../lib/db.js');
const { profile } = require('console');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 이미지 업데이트
aws.config.update({
  region: 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
});

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read-write',
    bucket: "greenmileage-bucket",
    ContentType: 'image/jpeg',
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
      console.log("이미지 URL: " + req.file.location);
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
    console.log(error)
    res.status(500).json({
      message: "서버 오류 발생"
    });
  }
});

// 팔로우
router.post('/follow/:following_id', (req, res) => {

  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
        return res.status(400).json({
          message: "유효하지 않은 토큰입니다."
        });
    }
    const userEmail = decoded.email;
    
    // 해당 email로 유저 id
    const getUserIdQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(getUserIdQuery, [userEmail], (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "데이터베이스에서 사용자 ID를 가져오는 중 오류 발생"
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          message: "사용자를 찾을 수 없습니다."
        });
      }
      
      const follower_id = results[0].id;
      const following_id = req.params.following_id;

      // 이미 팔로우 되어있는지 확인
      const checkFollowQuery = 'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?';
      db.query(checkFollowQuery, [follower_id, following_id], (checkFollowErr, checkFollowResults) => {
        if (checkFollowErr) {
          return res.status(500).json({
            message: "데이터베이스에서 팔로우 상태 확인 중 오류 발생"
          });
        }
        if (checkFollowResults.length > 0) {
          return res.status(200).json({
            message: "이미 팔로우 되어 있습니다."
          });
        }

        // 팔로우 추가
        const insertFollowQuery = 'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)';
        db.query(insertFollowQuery, [follower_id, following_id], (err, results) => {
          if (err) {
            return res.status(500).json({
              message: "데이터베이스에서 팔로우 추가 중 오류 발생"
            });
          }
          return res.status(200).json({
            message: "팔로우가 추가되었습니다."
          });
        });
      });
    });
  });
});

// 특정 사용자의 팔로우 목록 가져오기
router.get('/followers', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
        return res.status(400).json({
          message: "유효하지 않은 토큰입니다."
        });
    }
    const userEmail = decoded.email;
    const getUserIdQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(getUserIdQuery, [userEmail], (err, getUserIdresults) => {
      if (err) {
        return res.status(500).json({
          message: "데이터베이스에서 사용자 ID를 가져오는 중 오류 발생"
        });
      }
      if (getUserIdresults.length === 0) {
        return res.status(404).json({
          message: "사용자를 찾을 수 없습니다."
        });
      }
      console.log("사용자 : " + getUserIdresults[0].id);
      const user_id = getUserIdresults[0].id;
      const sql = 'SELECT users.id, users.username, users.email, users.image FROM users JOIN follows on users.id = follows.follower_id WHERE follows.follower_id = ?';
      db.query(sql, [user_id], (err, results) => {
        if (err) {
          return res.status(500).json({
            message: "데이터베이스에서 팔로워 목록을 가져오는 중 오류 발생"
          });
        }
        return res.status(200).json({
          message: "팔로워 목록 조회 성공",
          results: results
        });
      });
    });
  });
});

// 팔로우 취소
router.delete('/unfollow/:following_id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
        return res.status(400).json({
          message: "유효하지 않은 토큰입니다."
        });
    }
    const userEmail = decoded.email;
    const getUserIdQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(getUserIdQuery, [userEmail], (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "데이터베이스에서 사용자 ID를 가져오는 중 오류 발생"
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          message: "사용자를 찾을 수 없습니다."
        });
      }
      const follower_id = results[0].id;
      const following_id = req.params.following_id;

      const sql = 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?';
      db.query(sql, [follower_id, following_id], (err, results) => {
        if (err) throw err;
        return res.status(200).json({
          message: "팔로우가 취소되었습니다."
        });
      });
    });
  });
});

module.exports = router;
