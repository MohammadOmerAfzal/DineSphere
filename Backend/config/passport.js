const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");
const mongoose = require("mongoose");

passport.serializeUser((user, done) => {
  done(null, user._id ? user._id.toString() : user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return done(new Error("Invalid user ID"), null);
    }

    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    console.error("Deserialization Error:", err);
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      state: false // ✅ Disable state parameter to avoid session requirement
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔵 Google OAuth Profile:", profile.id);
        
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("🟢 Existing Google user found:", user.email);
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          console.log("🟢 Linking Google to existing user:", user.email);
          user.googleId = profile.id;
          user.photo = profile.photos[0]?.value;
          user.emailVerified = true;
          user.lastLogin = new Date();
          
          if (!user.profile.firstName && profile.name.givenName) {
            user.profile.firstName = profile.name.givenName;
          }
          if (!user.profile.lastName && profile.name.familyName) {
            user.profile.lastName = profile.name.familyName;
          }
          
          await user.save();
          return done(null, user);
        }

        console.log("🟡 Creating new user from Google OAuth");
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          photo: profile.photos[0]?.value,
          profile: {
            firstName: profile.name.givenName || '',
            lastName: profile.name.familyName || '',
          },
          role: "customer",
          emailVerified: true,
          lastLogin: new Date(),
        });

        console.log("🟢 New user created:", user.email);
        return done(null, user);
      } catch (err) {
        console.error("🔴 Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;