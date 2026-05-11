const express = require('express');
const userRouter = express.Router();

const userAuth = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');

//get all the pending connection request for the logged in user
userRouter.get("/user/requests/received", userAuth, async (req , res )=>{
    try{

        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            toUserId : loggedInUser._id,
            status : "interested"
        }).populate("fromUserId", ["firstName", "lastName","photoUrl", "skills", "about", "gender", "age"]);

        res.status(200).json({
            message : "Connection requests retrieved successfully",
            data : connectionRequests,
        });


    }

    catch(err){
        res.status(400).send("Error :" + err.message);
    }
});


userRouter.get("/user/connections", userAuth, async (req , res )=>{
    try{

        const loggedInUser = req.user;
        const connections = await ConnectionRequest.find({
            $or : [
                {fromUserId : loggedInUser._id, status : "accepted"},
                {toUserId : loggedInUser._id, status : "accepted"}
            ]
        }).populate("fromUserId", ["firstName", "lastName","photoUrl", "skills", "about", "gender", "age"])
          .populate("toUserId", ["firstName", "lastName","photoUrl", "skills", "about", "gender", "age"]);

        const data = connections.map((row) =>{
            if(row.fromUserId._id.toString() === loggedInUser._id.toString()){
                return row.toUserId;
            }
            return row.fromUserId;
        });


        res.status(200).json({
            message : "Connections retrieved successfully",
            data,
        });

    }
    catch(err){
        res.status(400).send("Error :" + err.message);
    }
});


userRouter.get("/feed", userAuth, async (req , res )=>{
    try{
        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit; // Set a maximum limit to prevent abuse  


        const skip = (page - 1) * limit;

        const connectionRequests = await ConnectionRequest.find({
            $or: [{fromUserId : loggedInUser._id}, {toUserId : loggedInUser._id}],
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });
        
        const user = await User.find({
            $and : [
                {_id : {$ne : loggedInUser._id}},
                {_id : {$nin : Array.from(hideUsersFromFeed)}}
            ],
        }).select("firstName lastName skills about gender age").skip(skip).limit(limit);

        res.status(200).send(user);

    }
    catch(err){
        res.status(400).json({
            message : err.message,
        });
    }
});


module.exports = userRouter;