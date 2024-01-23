const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    chatRoomName: String,
    senderId: String,
    // receiverId: [String], // 1:다 채팅을 위해 배열로 변경
    message: String,
    profile_image: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatRoom = mongoose.model('chatRoom', chatRoomSchema);
module.exports = chatRoom;