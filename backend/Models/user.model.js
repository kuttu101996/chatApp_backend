const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {Chat} = require("./chat.model")
const { Message } = require("./message.model");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("remove", function (next) {
  const userId = this._id;

  // Find all chats where the user is a participant
  Chat.find({ users: userId }, (err, chats) => {
    if (err) return next(err);

    // Create an array of chat IDs
    const chatIds = chats.map((chat) => chat._id);

    // Remove all messages associated with the found chat IDs and the user
    Message.deleteMany({ chat: { $in: chatIds }, sender: userId }, (err) => {
      if (err) return next(err);

      // Remove all chats where the user is a participant
      Chat.deleteMany({ users: userId }, (err) => {
        if (err) return next(err);

        // Continue with the user deletion once related messages and chats are deleted
        next();
      });
    });
  });
});

userSchema.methods.matchPass = async function (enteredPass) {
  return await bcrypt.compare(enteredPass, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
