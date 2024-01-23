// var express = require('express');
// var app = express();
// var router = express.Router();
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// var db  = require('../lib/db.js');
// const chatRoom = require('../models/ChatRoom');

// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

// require('dotenv').config();
// const SECRET_KEY = process.env.JWT_SECRET;


// // 채팅방 식별자
// function createChatRoomId(userId1, userId2) {
//     return [userId1, userId2].sort().join('_');
// }

// io.on('connection', function (socket){
//     console.log('새로운 사용자가 연결되었습니다.');

//     // 메시지 전송
//     // client가 sendMessage 이벤트를 발송하면 활성화
//     socket.on('sendMessage', (data) => {
//         jwt.verify(data.token, SECRET_KEY, async (err, decoded) => {
//             if (err) {
//                 socket.emit('unauthorized', '토큰이 유효하지 않습니다.');
//             } else {
//                 try {
//                     const chatMessage = new chatRoom({
//                         chatRoomId: data.chatRoomId,
//                         senderId: decoded.userEmail,
//                         message: data.message,
//                         profile_image: data.profile_image
//                     });

//                     // chatMessage.save().then(() => {
//                     //     io.to(createChatRoomId(data.senderId, data.receiverId)).emit('newMessage', chatMessage);
//                     // })
//                     await chatMessage.save();
//                     // 같은 채팅방의 모든 사용자에게 전송
//                     io.to(data.chatRoomId).emit('newMessage', chatMessage);
//                 } catch (error) {
//                     console.error('메시지 저장 에러: ', error);
//                 }
//             }
//         });
//     })

//     // 채팅방 입장
//     socket.on('joinRoom', (data) => {
//         jwt.verify(data.token, SECRET_KEY, (err, decoded) => {
//             if (err) {
//                 socket.emit('unauthorized', '토큰이 유효하지 않습니다.');
//             } else {
//                 const chatRoomId = data.chatRoomId;
//                 socket.join(chatRoomId);
//                 console.log(decoded.userEmail + '가 ' + chatRoomId + ' 방에 입장했습니다.');
//             }
//         });
//     });

// });

// const authenticateToken = (req, res, next) => {
//     const token = req.headers.authorization.split(' ')[1];
//     jwt.verify(token, SECRET_KEY, (err, user) => {
//         if (err) {
//             return res.status(403).json({ message: 'Invalid token' });
//         }
//         req.user = user;
//         next();
//     });
// };


// // 채팅방 리스트 조회
// router.get('/chatrooms', authenticateToken, async (req, res) => {

// })


// module.exports = router;
