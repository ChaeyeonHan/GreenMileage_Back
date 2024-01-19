var mysql = require('mysql');
require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "GreenMileageDB"
});

// 데이터베이스 연결
connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

module.exports = connection;
