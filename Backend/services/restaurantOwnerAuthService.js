// services/restaurantOwnerAuthService.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { restaurantOwnerRepository } = require("../repository/restaurantOwnerRepository");

const restaurantOwnerAuthService = {
  generateToken(owner) {
    return jwt.sign(
      {
        id: owner._id,
        email: owner.email,
        role: owner.role,
        restaurantId: owner.restaurantId,
        type: "restaurant_owner"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  },

  async login(email, password) {
    console.log("🟡 Restaurant Owner Login attempt:", email);
    const owner = await restaurantOwnerRepository.findByEmail(email);
    console.log("🟡 Found owner:", !!owner);

    if (!owner) throw new Error("Owner not found");
    if (!owner.isActive) throw new Error("Account is deactivated");

    const isMatch = await owner.comparePassword(password);
    console.log("🟡 Password match:", isMatch);

    if (!isMatch) throw new Error("Invalid credentials");

    // Update last login
    await restaurantOwnerRepository.updateOwner(owner._id, { lastLogin: new Date() });

    const token = this.generateToken(owner);
    console.log("🟢 Owner Token generated successfully");
    
    // Remove password from response
    const ownerWithoutPassword = owner.toObject();
    delete ownerWithoutPassword.password;

    return { owner: ownerWithoutPassword, token };
  },

  async register(ownerData) {
    const existingOwner = await restaurantOwnerRepository.findByEmail(ownerData.email);
    if (existingOwner) throw new Error("Email already registered");

    const owner = await restaurantOwnerRepository.createOwner(ownerData);
    
    // Remove password from response
    const ownerWithoutPassword = owner.toObject();
    delete ownerWithoutPassword.password;

    const token = this.generateToken(owner);

    return { owner: ownerWithoutPassword, token };
  },

  async handleGoogleCallback(owner) {
    const token = this.generateToken(owner);
    
    // Remove password from response
    const ownerWithoutPassword = owner.toObject();
    delete ownerWithoutPassword.password;

    return {
      owner: ownerWithoutPassword,
      token
    };
  }
};

module.exports = { restaurantOwnerAuthService };