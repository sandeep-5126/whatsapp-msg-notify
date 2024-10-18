import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { Message } from './models/Message.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Webhook verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the token and respond with the challenge
  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403); // Forbidden if token is incorrect
  }
});

// Webhook to handle incoming messages
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    const changes = body.entry[0].changes;

    changes.forEach(async (change) => {
      const messageData = change.value.messages;
      
      if (messageData && messageData.length > 0) {
        const message = messageData[0];
        const from = message.from;  // Sender's WhatsApp ID
        const to = message.to;      // Receiver's WhatsApp ID
        const text = message.text?.body || '';  // The message text

        // Save the message in MongoDB
        try {
          const newMessage = new Message({
            from,
            to,
            message: text,
            messageId: message.id
          });

          await newMessage.save();
          console.log('Message saved to database:', newMessage);
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
    });

    res.sendStatus(200); // Acknowledge receipt of the webhook event
  } else {
    res.sendStatus(404); // Not a valid WhatsApp webhook event
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
