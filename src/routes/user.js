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

        // -----------------------------
        // 1. Validate search query
        // -----------------------------
        if (!searchQuery) {
            return res.status(400).json({
                message: "Search query is required"
            });
        }

        // -----------------------------
        // 2. Pagination
        // -----------------------------
        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        let limit = parseInt(req.query.limit) || 10;

        // Maximum 50 users per page
        limit = Math.min(Math.max(limit, 1), 50);

        // -----------------------------
        // 3. Escape regex characters
        // -----------------------------
        const escapedQuery = searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        // -----------------------------
        // 4. Find matching users
        // -----------------------------
        const users = await User.find({
            $and: [

                // Don't show logged-in user
                {
                    _id: {
                        $ne: loggedInUser._id
                    }
                },

                // Only completed profiles
                {
                    profileCompleted: true
                },

                // Search fields
                {
                    $or: [
                        {
                            firstName: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        },
                        {
                            lastName: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        },
                        {
                            skills: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        },
                        {
                            domains: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        },
                        {
                            role: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        },
                        {
                            organization: {
                                $regex: escapedQuery,
                                $options: "i"
                            }
                        }
                    ]
                }

            ]
        })
        .select(
            "firstName lastName photoUrl about skills domains experienceMonths currentStatus role organization"
        )
        .limit(1000);

        // -----------------------------
        // 5. Calculate search relevance
        // -----------------------------
        const queryLower = searchQuery.toLowerCase();

        const rankedUsers = users.map((user) => {

            let searchScore = 0;

            const firstName =
                (user.firstName || "").toLowerCase();

            const lastName =
                (user.lastName || "").toLowerCase();

            const role =
                (user.role || "").toLowerCase();

            const organization =
                (user.organization || "").toLowerCase();

            const skills = (user.skills || []).map(
                (skill) => skill.toLowerCase()
            );

            const domains = (user.domains || []).map(
                (domain) => domain.toLowerCase()
            );

            // -----------------------------
            // First Name
            // -----------------------------

            // Exact first name
            if (firstName === queryLower) {
                searchScore += 100;
            }

            // First name starts with query
            else if (firstName.startsWith(queryLower)) {
                searchScore += 80;
            }

            // First name contains query
            else if (firstName.includes(queryLower)) {
                searchScore += 60;
            }

            // -----------------------------
            // Last Name
            // -----------------------------

            // Exact last name
            if (lastName === queryLower) {
                searchScore += 70;
            }

            // Last name starts with query
            else if (lastName.startsWith(queryLower)) {
                searchScore += 50;
            }

            // Last name contains query
            else if (lastName.includes(queryLower)) {
                searchScore += 30;
            }

            // -----------------------------
            // Skills
            // -----------------------------

            // Exact skill
            if (skills.includes(queryLower)) {
                searchScore += 60;
            }

            // Partial skill
            else if (
                skills.some((skill) =>
                    skill.includes(queryLower)
                )
            ) {
                searchScore += 40;
            }

            // -----------------------------
            // Domains
            // -----------------------------

            // Exact domain
            if (domains.includes(queryLower)) {
                searchScore += 50;
            }

            // Partial domain
            else if (
                domains.some((domain) =>
                    domain.includes(queryLower)
                )
            ) {
                searchScore += 35;
            }

            // -----------------------------
            // Role
            // -----------------------------

            if (role === queryLower) {
                searchScore += 40;
            }
            else if (role.includes(queryLower)) {
                searchScore += 25;
            }

            // -----------------------------
            // Organization
            // -----------------------------

            if (organization === queryLower) {
                searchScore += 30;
            }
            else if (organization.includes(queryLower)) {
                searchScore += 15;
            }

            return {
                ...user.toObject(),
                searchScore
            };
        });

        // -----------------------------
        // 6. Sort by search score
        // -----------------------------

        rankedUsers.sort(
            (a, b) => b.searchScore - a.searchScore
        );

        // -----------------------------
        // 7. Total results
        // -----------------------------

        const totalResults = rankedUsers.length;

        const totalPages = Math.ceil(
            totalResults / limit
        );

        // -----------------------------
        // 8. Pagination
        // -----------------------------

        const skip = (page - 1) * limit;

        const paginatedResults =
            rankedUsers.slice(
                skip,
                skip + limit
            );

        // -----------------------------
        // 9. Send response
        // -----------------------------

        res.status(200).json({

            data: paginatedResults,

            pagination: {
                page,
                limit,
                totalResults,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }

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