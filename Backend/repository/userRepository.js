const User = require("../models/userModel");

const userRepository = {
  findByEmail: async (email) => User.findOne({ email }),
  findByGoogleId: async (id) => User.findOne({ googleId: id }),
  createUser: async (data) => User.create(data),
  async linkGoogleAccount(userId, googleId, photo) {
    return await User.findByIdAndUpdate(
      userId,
      { 
        googleId, 
        photo,
        emailVerified: true 
      },
      { new: true }
    ).select("-password");
  }
};

module.exports={userRepository};