import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  messageId: String,
  status: { type: String, default: 'received' }
});

export const Message = mongoose.model('Message', messageSchema);
