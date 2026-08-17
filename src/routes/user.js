const express = require('express');
const userRouter = express.Router();

const userAuth = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');
const { calculateMatchScore } = require("../utils/matching");

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


userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
       // 1. PAGINATION PARAMETERS
        const page = parseInt(req.query.page) || 1;

        let limit = parseInt(req.query.limit) || 10;

        // Maximum 50 users per request
        limit = limit > 50 ? 50 : limit;

        const skip = (page - 1) * limit;

        // 2. FETCH ALL CONNECTION REQUESTS FOR THE LOGGED-IN USER
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select("fromUserId toUserId");
        // 3. CREATE A SET OF USER IDS TO HIDE FROM FEED
        const hideUsersFromFeed = new Set();

        connectionRequests.forEach((request) => {

            hideUsersFromFeed.add(
                request.fromUserId.toString()
            );

            hideUsersFromFeed.add(
                request.toUserId.toString()
            );

        });
        // 4. FETCH CANDIDATE USERS FROM DATABASE
        const candidates = await User.find({

            $and: [

                // Don't show logged-in user
                {
                    _id: {
                        $ne: loggedInUser._id
                    }
                },
                // Don't show users already interacted with
                {
                    _id: {
                        $nin: Array.from(hideUsersFromFeed)
                    }
                },
                // Only completed profiles
                {
                    profileCompleted: true
                }

            ]

        }).select(
            "firstName lastName photoUrl skills domains experienceMonths currentStatus role organization about gender age"
        );
        // 5. CALCULATE MATCH SCORE FOR EACH CANDIDATE
        const usersWithScore = candidates.map((candidate) => {

            const matchResult = calculateMatchScore(
                loggedInUser,
                candidate
            );

            return {
                ...candidate.toObject(),
                matchScore: matchResult.matchScore,
                matchBreakdown: matchResult.breakdown
            };
        });
        // 6. SORT CANDIDATES BY MATCH SCORE (HIGHEST FIRST)
        usersWithScore.sort(
            (a, b) => b.matchScore - a.matchScore
        );
        // 7. PAGINATE THE SORTED CANDIDATES
        const paginatedUsers = usersWithScore.slice(
            skip,
            skip + limit
        );
        // 8. RETURN THE PAGINATED USERS WITH MATCH SCORES
        res.status(200).json({
            data: paginatedUsers,

            pagination: {
                page: page,
                limit: limit,
                totalCandidates: usersWithScore.length,
                totalPages: Math.ceil(
                    usersWithScore.length / limit
                )
            }
        });

    }
    catch (err) {
        console.error("Feed error:", err);
        res.status(400).json({
            message: "Error fetching feed",
            error: err.message
        });
    }
});

// Search users
userRouter.get("/search", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const searchQuery = req.query.q?.trim();

        // Check if search query exists
        if (!searchQuery) {
            return res.status(400).json({
                message: "Search query is required"
            });
        }
        // Search users
        const users = await User.find({
            $and: [
                // Don't show logged-in user
                {
                    _id: {
                        $ne: loggedInUser._id
                    }
                },
                // Only show completed profiles
                {
                    profileCompleted: true
                },
                // Search in different profile fields
                {
                    $or: [
                        {
                            firstName: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        },
                        {
                            lastName: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        },
                        {
                            skills: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        },
                        {
                            domains: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        },
                        {
                            role: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        },
                        {
                            organization: {
                                $regex: searchQuery,
                                $options: "i"
                            }
                        }
                    ]
                }

            ]
        }).select(
            "firstName lastName photoUrl skills domains experienceMonths currentStatus role organization about"
        ).limit(10);

        res.status(200).json({
            data: users
        });

    } catch (err) {

        console.error("Search error:", err);

        res.status(400).json({
            message: "Error searching users",
            error: err.message
        });
    }
});

module.exports = userRouter;