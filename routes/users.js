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
const chatRoom = require('../models/ChatRoom');



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
    contentType: multerS3.AUTO_CONTENT_TYPE,
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

let clients = [];
// sse 연결 설정
router.get('/notifications', function(req, res) {

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
      const user_id = results[0].id;
      
      // 클라이언트 추가, message 전송
      const clientId = Date.now();
      const newClient = {
        id: clientId,
        userId: user_id,
        response: res
      };
      clients.push(newClient);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    });

    // 연결 종료시 제거
    req.on('close', () => {
      console.log(`{clientId} Connection closed`);
      clients = clients.filter(client => client.id !== clientId);
    });
  });
});



// 알림 목록 조회
router.get('/notifications/list', function(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      message: "유효하지 않은 토큰입니다."
    });
  }

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
      const user_id = results[0].id;
      const getNotificationQuery = 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER By timestamp DESC';
      db.query(getNotificationQuery, [user_id], (err, notifications) => {
        if (err) {
          return res.status(500).json({
            message: "데이터베이스에서 알림을 가져오는 중 오류 발생"
          });
        }
        
        // 알림 목록 반환
        res.json(notifications);
      });
    });
  });
});

// 알림 읽음 업데이트
router.patch('/notifications/:notification_id', (req, res) => {
  const updateNotificationQuery = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
  const notification_id = req.params.notification_id;

  db.query(updateNotificationQuery, [notification_id], (error, result) => {
    if (error) {
      return res.status(500).json({
        message: "읽음 처리 실패"
      });
    } else {
      console.log("Notification marked read");
    }
  });
});

// 팔로우 및 알림 생성 
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

          // 팔로우 후, 팔로우한 사용자에게 알림 전송
          notifyUser(following_id, `${userEmail}님이 팔로우를 했습니다.`);
          console.log("팔로우함");

          return res.status(200).json({
            message: "팔로우가 추가되었습니다."
          });
        });
      });
    });
  });
});

// 팔로우 추가후 알림 보내기
const notifyUser = (userId, message) => {
  // 해당 id를 가진 사용자를 찾고, SSE 메시지를 전송
  clients.forEach(client => {
    if (client.userId == userId) {
      client.response.write(`data: ${message}`);
    }
  });
  
  const insertNotificationQuery = 'INSERT INTO notifications (user_id, content, timestamp) VALUES (?, ?, NOW());'
  db.query(insertNotificationQuery, [userId, message], (err, result) => {
    if (err) {
      console.err("알림 저장 중 오류 발생", err);
    }
  });
};


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


// 내가 참여하고 있는 채팅방 정보 불러오기(스키마 별도 생성 필요)
// router.get('/chats', async (req, res) => {
//   const token = req.headers.authorization.split(' ')[1];
//   try {
//     const decoded = await jwt.verify(token, SECRET_KEY);
//     const userEmail = decoded.email;

//     const chatRooms = await chatRoom.find({senderId: userEmail}).select('chatRoomName -_id');

//     res.status(200).json({
//       message: "채팅방 조회 성공",
//       data: chatRooms
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: error.message
//     });
//   }
// });

module.exports = router;
