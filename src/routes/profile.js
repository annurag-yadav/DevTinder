const express = require('express');
const profileRouter = express.Router();
const {validateSignupData , validateEditFields} = require('../utils/validation');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const userAuth = require('../middlewares/auth');

profileRouter.get("/profile/view",userAuth, async (req , res ) =>{
    try{
          const user = req.user;
            res.send(user);
      }
        catch (err){
          res.status(401).send({message : "Unauthorized", error : err.message})
        }

});

profileRouter.patch("/profile/edit", userAuth, async (req , res) => {
  try{
    if (!validateEditFields(req)){
      throw new Error ("Invalid fields for update");
    }

    const loggdInUser = req.user;

    //console.log(loggdInUser);

    Object.keys(req.body).forEach((key) =>{
      loggdInUser[key] = req.body[key]; 
    });
    await loggdInUser.save();

   // console.log(loggdInUser);

    res.json({message: "profile updated successfully" , data : loggdInUser});

  } catch (err){
    res.status(400).send("ERROR : " + err.message);
  }

});
module.exports = profileRouter;