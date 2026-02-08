import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  chatId: string;
  userId: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema(
  {
    chatId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'ai', 'system'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index for efficient fetching of messages in a chat
chatMessageSchema.index({ chatId: 1, createdAt: 1 });

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;
