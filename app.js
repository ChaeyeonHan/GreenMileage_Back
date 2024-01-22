var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var campaignRouter = require('./routes/campaign');
var bicycleRouter = require('./routes/bicy');
var electriccarRouter = require('./routes/elec');

var app = express();
// app.js
const port = 3000; // 원하는 포트 번호로 변경 가능

app.use(express.static(path.join(__dirname, '../GreenMileage_Front/dist')));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send(`
      <h1>Log in</h1>
      <a href="/login">Log in</a>
  `);
});

app.get('/react', (req, res) => {
  res.sendFile(path.join(__dirname, '../GreenMileage_Front/dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campaign', campaignRouter);
app.use('/bicycle', bicycleRouter);
app.use('/electric_car', electriccarRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;

app.get('*', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '/react-project/build/index.html'));
});
