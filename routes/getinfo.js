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
    db.query('select email, username, point, image from users where email=?', [email], (err, result) => {
        const userInfo = {
            email: result[0].email,
            username: result[0].username,
            point: result[0].point,
            image: result[0].image
        };
        res.send(userInfo);
    })
});

router.get('/follows', function(req, res, next) {
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
            db.query('select follower_id from follows where following_id=?', [id], async (err, rows) => {
                const followerIds = rows.map(row => row.follower_id);
                const kuserDetailsPromises = followerIds.map(async (followerId) => {
                    return new Promise((resolve, reject) => {
                        db.query('select id, username, email, image from users where id = ?', [followerId], (err, kuserRows) => {
                            if (err) {
                                console.error('Error fetching user details:', err);
                                reject(err);
                                return;
                            }
                
                            // userRows에서 필요한 정보 추출
                            const kuserDetails = {
                                id: kuserRows[0].id,
                                username: kuserRows[0].username,
                                email: kuserRows[0].email,
                                image: kuserRows[0].image
                            };
                
                            resolve(kuserDetails);
                        });
                    });
                });
                
                // userDetailsPromises 배열에 있는 모든 프로미스를 병렬로 처리
                const kuserDetailsArray = await Promise.all(kuserDetailsPromises);
                
                followInfo.follower_id = kuserDetailsArray;
                resolve();
            });
        });
    
        const getFollowing = new Promise((resolve) => {
            db.query('select following_id from follows where follower_id=?', [id], async (err, erows) => {
                const followingIds = erows.map(erow => erow.following_id);
                const userDetailsPromises = followingIds.map(async (followingId) => {
                    return new Promise((resolve, reject) => {
                        db.query('select id, username, email, image from users where id = ?', [followingId], (err, userRows) => {
                            if (err) {
                                console.error('Error fetching user details:', err);
                                reject(err);
                                return;
                            }
                
                            // userRows에서 필요한 정보 추출
                            const userDetails = {
                                id: userRows[0].id,
                                username: userRows[0].username,
                                email: userRows[0].email,
                                image: userRows[0].image
                            };
                
                            resolve(userDetails);
                        });
                    });
                });
                
                // userDetailsPromises 배열에 있는 모든 프로미스를 병렬로 처리
                const userDetailsArray = await Promise.all(userDetailsPromises);
                
                followInfo.following_id = userDetailsArray;
                resolve();
            });
        });
        Promise.all([getFollowers, getFollowing]).then(() => {
            res.send(followInfo);
        });
    })
});

router.get('/campaigns', function(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const email = decodedToken.email;
    console.log(email);
    db.query('select campaign_title from campaign where user_email=?', [email], (err, result) => {
        if(err) throw err;
        const userInfo = result[0];
        console.log(userInfo);
        res.send(userInfo);
    })
});

router.get('/my-campaigns', function(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const email = decodedToken.email;
    db.query('select title from my_campaign where user_email=?', [email], async (err, result) => {
        const title = result.map(result => result.title);
        const campaignInfo = title.map(async (title) => {
            return new Promise((resolve, reject) => {
                db.query('select title, image, link, participants from campaign where title = ?', [title], (err, userRows) => {
                    if (err) {
                        console.error('Error fetching user details:', err);
                        reject(err);
                        return;
                    }
        
                    // userRows에서 필요한 정보 추출
                    const campaignDetails = {
                        title: userRows[0].title,
                        image: userRows[0].image,
                        link: userRows[0].link,
                        participants: userRows[0].participants
                    };

                    resolve(campaignDetails);
                });
            });
        });
        const campaignArray = await Promise.all(campaignInfo);
        res.send(campaignArray);
    })
});

module.exports = router;