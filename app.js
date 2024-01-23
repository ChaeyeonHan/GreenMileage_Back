var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const chatRoom = require('./models/ChatRoom');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var campaignRouter = require('./routes/campaign');
var bicycleRouter = require('./routes/bicy');
var electriccarRouter = require('./routes/elec');
var infoRouter = require('./routes/getinfo');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const SECRET_KEY = process.env.JWT_SECRET;

// app.js
const port = 3000; // 원하는 포트 번호로 변경 가능
const corsOptions = {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(express.static(path.join(__dirname, '../GreenMileage_Front/dist')));
app.use(express.json());
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campaign/info', campaignRouter);
app.use('/bicycle/info', bicycleRouter);
app.use('/electric_car/info', electriccarRouter);
app.use('/get_user_info', infoRouter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// 채팅방 식별자
function createChatRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

io.on('connection', function (socket){
    console.log('새로운 사용자가 연결되었습니다.');

    // 채팅방 입장
    socket.on('joinRoom', (data) => {
      const chatRoomName = data.chatRoomName;
      socket.join(chatRoomName);
      console.log(data.userEmail + '가 ' + chatRoomName + ' 방에 입장했습니다.');

      // 입장 메시지 생성 및 전송
      const joinMessage = {
        chatRoomName: chatRoomName,
        senderId: 'system', // 시스템 메시지를 나타내는 senderId
        message: `${data.userEmail}님이 입장하셨습니다.`,
        profile_image: data.image // 시스템 프로필 이미지 경로
      };
      io.to(chatRoomName).emit('newMessage', joinMessage);
    });

    // 메시지 전송. client가 sendMessage 이벤트를 발송하면 활성화
    socket.on('sendMessage', async (data) => {
      const chatMessage = new chatRoom({
        chatRoomName: data.chatRoomName,
        senderId: data.userEmail,
        message: data.message,
        profile_image: data.profile_image
      });
      await chatMessage.save();
      console.log(chatMessage);
      console.log("메시지 전송 완료");
      
      io.to(data.chatRoomName).emit('newMessage', chatMessage);  // 같은 채팅방의 모든 사용자에게 전송
    });

    // 채팅방 나가기
    socket.on('leaveRoom', (data) => {
      const chatRoomName = data.chatRoomName;
      socket.leave(chatRoomName);
      console.log(data.userEmail +'님이 ' + chatRoomName + ' 방을 나갔습니다.');

      const leaveMessage = {
        chatRoomName: chatRoomName,
        senderId: 'system',
        message: `${data.userEmail}님이 나가셨습니다.`,
        profile_image: data.profile_image
      };

      io.to(chatRoomName).emit('newMessage', leaveMessage);
    })
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.get('/*', function (req, res) {
//   res.sendFile(path.join((__dirname, '../GreenMileage_Front/dist', 'index.html')));
// });

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;