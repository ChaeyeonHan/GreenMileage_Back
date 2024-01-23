var mysql = require('mysql');
const mongoose = require("mongoose");
require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "GreenMileageDB"
});

// DB연결
mongoose
    .connect(
        process.env.DB_CONNECT,
        {
        // useNewUrlPaser: true,
        // useUnifiedTofology: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
        }
    )
    .then(() => console.log('MongoDB Connected!'))
    .catch((err) => {
        console.log(err);
    });



// 데이터베이스 연결
connection.connect(function(err) {
    if (err) throw err;
    console.log("MySQL Connected!");
});

module.exports = connection;
