var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
var db  = require('../lib/db.js');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

router.get('/', function(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const email = decodedToken.email;
    db.query('select username, point, image from users where email=?', [email], (err, result) => {
        const userInfo = {
            username: result[0].username,
            point: result[0].point,
            image: result[0].image
        };
        res.send(userInfo);
    })
});

router.get('/follows', function(req, res, next) {
    console.log('connected');
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const email = decodedToken.email;
    db.query('select id from users where email=?', [email], (err, result) => {
        const id = result[0].id;
        let followInfo = {
            follower_id: null,
            following_id: null
        }
        const getFollowers = new Promise((resolve) => {
            db.query('select follower_id from follows where following_id=?', [id], (err, rows) => {
                const followerIds = rows.map(row => row.follower_id);
                followInfo.follower_id = followerIds;
                console.log(followerIds);
                resolve();
            });
        });
    
        const getFollowing = new Promise((resolve) => {
            db.query('select following_id from follows where follower_id=?', [id], (err, erows) => {
                const followingIds = erows.map(erow => erow.following_id);
                followInfo.following_id = followingIds;
                console.log(followingIds);
                resolve();
            });
        });
        Promise.all([getFollowers, getFollowing]).then(() => {
            console.log(followInfo);
            res.send(followInfo);
        });
    })
});

module.exports = router;