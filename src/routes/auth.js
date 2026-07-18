const express = require('express');
const authRouter = express.Router();
const {validateSignupData} = require('../utils/validation');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');


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

module.exports = authRouter;