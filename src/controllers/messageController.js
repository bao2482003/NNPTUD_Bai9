const mongoose = require('mongoose');
const Message = require('../models/Message');
const { uploadFileAndGetUrl } = require('../utils/fileService');

exports.getConversationWithUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ success: false, error: 'userId không hợp lệ' });
    }

    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId,   to: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('from', 'name email')
      .populate('to',   'name email');

    return res.json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.sendMessage = async (req, res) => {
  try {
    const from = req.user.id;
    const { to, text } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, error: 'Thiếu trường to (người nhận)' });
    }

    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ success: false, error: 'to (userId) không hợp lệ' });
    }

    if (from === to) {
      return res.status(400).json({ success: false, error: 'Không thể tự nhắn tin cho chính mình' });
    }

    let contentMessage;

    if (req.file) {
      const fileUrl = await uploadFileAndGetUrl(req.file);
      contentMessage = { type: 'file', content: fileUrl };
    } else if (text && text.trim() !== '') {
      contentMessage = { type: 'text', content: text.trim() };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Cần cung cấp nội dung: file hoặc text'
      });
    }

    const message = await Message.create({ from, to, contentMessage });

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.getLastMessagePerUser = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);

    const results = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if:   { $eq: ['$from', currentUserId] },
              then: '$to',
              else: '$from'
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:         '$otherUser',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'otherUserInfo'
        }
      },
      {
        $unwind: {
          path:                       '$otherUserInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id:         0,
          otherUser:   '$otherUserInfo',
          lastMessage: {
            _id:            '$lastMessage._id',
            from:           '$lastMessage.from',
            to:             '$lastMessage.to',
            contentMessage: '$lastMessage.contentMessage',
            createdAt:      '$lastMessage.createdAt'
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.deleteMyMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const result = await Message.deleteMany({
      $or: [
        { from: currentUserId },
        { to: currentUserId }
      ]
    });
    return res.json({
      success: true,
      message: `Đã xoá ${result.deletedCount} tin nhắn`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};