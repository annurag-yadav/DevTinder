const express = require('express');
const authRouter = express.Router();
const {validateSignupData , validatePassword } = require('../utils/validation');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const PasswordReset = require('../models/passwordReset');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');


authRouter.post("/signup", async(req,res) =>{

    try{
    // validate the data
     validateSignupData(req);

     const {firstName, lastName, emailId, password, age, gender} = req.body;
   // encrypt the password
    const hashPassword = await bcrypt.hash(password , 10);
    

   // Creating a new instance of the user model and saving it to the database
   const user = new User({
    firstName,
    lastName,
    emailId,
    password: hashPassword
   })
    const savedUser = await user.save();
    const token = await savedUser.getJWT();
    res.cookie("token", token ,{expires : new Date(Date.now() + 8*60*60*1000)});

    res.status(200).json({message : "User created successfully", data: savedUser})
   } catch (error) {
    res.status(400).json({message : "Error creating user", error : error.message})
   }

})

//login api
authRouter.post("/login", async (req , res) => {
  try{
     const {emailId , password} = req.body;

    //  logger.info(`Login attempt for email: ${emailId}`);
    // console.log(`Login attempt for email: ${emailId}`);

     const user = await User.findOne({emailId : emailId});

    //  logger.info(`User found: ${user ? "Yes" : "No"}`);
     if (!user){
      throw new Error ("User not found");
     }
      const isPasswordMatch = await user.validatePassword(password);

      if (isPasswordMatch){
        
        // create a jwt token
        // done in userschema method getJWT
        const token = await user.getJWT();
         
        // console.log(token);
        // add the token to cookies and send the response to the user 
         
        res.cookie("token", token ,{expires : new Date(Date.now() + 8*60*60*1000)});

        res.status(200).send(user);
      }else {
      throw new Error("Invalid credentials");
    }

  } catch (err){
    res.status(400).send("ERROR : " + err.message);
  }

})

// logout api
authRouter.post("/logout", (req , res) =>{
  try{
    res.cookie("token", null ,{expires : new Date(Date.now())});
    res.status(200).send({message : "Logout successful"})
  } catch (err){
    res.status(400).send({message : "Error logging out", error : err.message})
  }
});

// forgot password api request the reset link and send it to the user
authRouter.post("/forgot-password", async (req, res) => {
    try {

      const { emailId } = req.body;

      const user = await User.findOne({ emailId: emailId})

      if (!user){
        throw new Error("User not found");
      }

      const token = crypto.randomBytes(32).toString("hex");
      console.log("Generated token:", token); // Log the generated token for debugging
      
      const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
      const expiresAt = new Date(Date.now() + 600000); // 10 minutes from now

      const passwordReset = new PasswordReset({
        userId: user._id,
        tokenHash: tokenHash,
        expiresAt: expiresAt
      });

      const savedPasswordReset = await passwordReset.save();

      const resetLink = `http://localhost:5173/reset-password?token=${token}`;

      await sendEmail(
          user.emailId,
          "Reset your TalentLink password",
           resetLink
     );


      res.status(200).json({ 
        message: "Password reset link generated successfully", resetLink: resetLink
       });

      
    } catch (err) {
      res.status(400)
      .json({ message: "Error generating password reset link", error: err.message });

    }
});

// reset password api
authRouter.post("/reset-password", async (req, res) => {
    try {

    const { token, newPassword}= req.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const passwordReset = await PasswordReset.findOne({ tokenHash: hashedToken });

    if (!passwordReset) {
      throw new Error("Invalid or expired password reset token");
    }
    if (passwordReset.expiresAt < new Date()) {
      throw new Error("Password reset token has expired");
    }

    const user = await User.findById(passwordReset.userId);

    if (!user) {
      throw new Error("User not found");
    }

    validatePassword(newPassword);

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    await PasswordReset.deleteOne({ _id: passwordReset._id });

    res.status(200).json({ message: "Password reset successful" });

  }
  catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Error resetting password", error: err.message });
  }
});

// Verify password reset token
authRouter.get("/reset-password/verify", async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            throw new Error("Reset token is missing");
        }

        // Hash the token received from the frontend
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find the reset request in database
        const passwordReset = await PasswordReset.findOne({
            tokenHash: hashedToken
        });

        if (!passwordReset) {
            throw new Error("Invalid or expired password reset token");
        }

        // Check whether token has expired
        if (passwordReset.expiresAt < new Date()) {
            throw new Error("Password reset token has expired");
        }

        res.status(200).json({
            message: "Password reset token is valid"
        });

    } catch (err) {
        console.error("Token verification error:", err);

        res.status(400).json({
            message: "Invalid password reset link",
            error: err.message
        });
    }
});

module.exports = authRouter;