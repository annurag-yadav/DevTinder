const express = require('express');
const userRouter = express.Router();

const userAuth = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');

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


module.exports = userRouter;