const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { userRepository } = require("../repository/userRepository");

const authService = {
  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  },

async login(email, password) {
  console.log("🟡 Login attempt:", email);
  const user = await userRepository.findByEmail(email);
  console.log("🟡 Found user:", !!user);

  if (!user) throw new Error("User not found");

  console.log("🟡 User password hash:", user.password);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("🟡 Password match:", isMatch);

  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user._id, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("🟢 Token generated successfully");
  return { user, token };
},


  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) throw new Error("Email already registered");

    const user = await userRepository.createUser({
      ...userData,
    });

    return user;
  },

    async handleGoogleCallback(user) {
    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
        role: user.role,
        photo: user.photo,
      },
      token,
    };
  }

};

module.exports = { authService };
