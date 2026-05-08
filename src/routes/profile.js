const express = require('express');
const profileRouter = express.Router();
const {validateSignupData} = require('../utils/validation');
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

profileRouter.patch("/profile/update", userAuth, async (req , res) => {
  try{
    
    

  } catch (err){
    res.status(401).send({message : "Unauthorized", error : err.message})
  }



});
module.exports = profileRouter;