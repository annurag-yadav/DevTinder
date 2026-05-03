const User = require('../models/user');
const jwt = require('jsonwebtoken');


const userAuth = async (req, res, next) => {
     try{
     const {token} = reqcookies;
        if (!token){
          throw new Error ("Unauthorized");
        }

     const dcodeObj = await jwt.verify(token, "DEV@Tinder$790");
        const {_id} = dcodeObj;
        const user = await User.findById(_id);
        if (!user){
            throw new Error ("User not found");
        }
        req.user = user;
        next();


     } catch (err){
        res.status(400).send({message : "Error logging in", error : err.message});
     }  


};

module.exports = userAuth;