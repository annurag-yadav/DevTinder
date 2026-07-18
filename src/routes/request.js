const express = require ('express');
const requestRouter = express.Router();
const userAuth = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');

// send connection request api 
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req , res )=>{
      try{
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;
    
        // validate the status value
        const allowedStatuses = ["ignored", "interested"];
        if (!allowedStatuses.includes(status)){
            return res.status(400).json({message : "Invalid status value"});
        }

        // check if the toUsrId exists in the database
        const toUser = await User.findById(toUserId);
        if (!toUser){
            return res.status(404).json({message : "user not found"});
        }

        // check if a connection request already exists between the two users
        const existingRequest = await ConnectionRequest.findOne({
            $or : [
                {fromUserId, toUserId},  // A - B 
                {fromUserId : toUserId, toUserId : fromUserId}  // B - A 
            ]
        });
        if (existingRequest) {
            return res.status(400).json({message : "Connection request already exists"});       
        }



        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });
        const data = await connectionRequest.save();
        res.status(200).json({
            success : true,
            message : "Connection request sent successfully",
            data,
        }); 

      }
        catch(err){
            res.status(400).send("Error :" + err.message);
        }
});

// get all the connection requests sent by the logged in user
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req , res )=>{
    try{

        // grt the logged in user from userAuth middleware
        const loggedInUser = req.user;
        const{status, requestId} = req.params;

        // validate the status value
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)){
            return res.status(400).json({message : "Invalid status value"});
        }

        // check if the connection request exists and belongs to the logged in user
        const connectionRequest = await ConnectionRequest.findOne({
            _id : requestId,
            toUserId : loggedInUser._id,
            status : "interested",
        });

        
        if (!connectionRequest){
            return res.status(404).json({message : "Connection request not found"});
        }

        // update the status of the connection request 
        connectionRequest.status = status;
        const data = await connectionRequest.save();
        res.status(200).json({
            message : `Connection request ${status} successfully`,
            data,
        });

    }


    catch(err){
        res.status(400).send("Error :" + err.message);
    }
});


module.exports = requestRouter;