const express = require('express');
const userRouter = express.Router();

const userAuth = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');

//get all the pending connection request for the logged in user
userRouter.get("/user/requests/received", userAuth, async (req , res )=>{
    try{

        const loggedInUser = req.user;

        //populate is used to get the details of the user who sent the connection request 
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


// get all the accepted connection requests for the logged in user
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


          // Extract the connected users from the connections array and return them in the response
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

        // finding all connection requests where the logged in user is in fromUserId 
        // or toUserId and then adding the fromUserId and toUserId to a set 
        // so that we can filter out those users from the feed 

        const connectionRequests = await ConnectionRequest.find({
            $or: [{fromUserId : loggedInUser._id}, {toUserId : loggedInUser._id}],
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });
        
        // hiding the loggedin user and hideUsersFromFeed 
        const user = await User.find({
            $and : [
                {_id : {$ne : loggedInUser._id}},
                {_id : {$nin : Array.from(hideUsersFromFeed)}}      
            ],
        }).select("firstName lastName photoUrl  skills about gender age").skip(skip).limit(limit);

        res.json({ data: user });

    }
    catch(err){
        res.status(400).json({
            message : err.message,
        });
    }
});


module.exports = userRouter;