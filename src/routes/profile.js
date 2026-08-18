const express = require('express');
const profileRouter = express.Router();
const {validateSignupData , validateEditFields} = require('../utils/validation');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const userAuth = require('../middlewares/auth');
const { calculateMatchScore, getCommonDomains, getCommonSkills } = require("../utils/matching")

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

// Complete profile API
profileRouter.patch("/profile/complete", userAuth, async (req, res) => {
    try {

        const {
            domains,
            skills,
            experienceMonths,
            currentStatus,
            role,
            organization
        } = req.body;

        const user = req.user;

        // 1. Check domains
        // At least one domain is required
        if (!Array.isArray(domains) || domains.length === 0) {
            throw new Error("At least one domain is required");
        }

        // 2. Check experience
        if (
            experienceMonths === undefined ||
            experienceMonths < 0
        ) {
            throw new Error("Invalid experience");
        }

        // 3. Check current status
        const allowedStatuses = [
            "Student",
            "Working Professional",
            "Teacher/Faculty",
            "Freelancer",
            "Job Seeker",
            "Other"
        ];

        if (!allowedStatuses.includes(currentStatus)) {
            throw new Error("Invalid current status");
        }

        // 4. Save profile data
        user.domains = domains;

        // Skills are optional
        user.skills = skills || [];

        user.experienceMonths = experienceMonths;
        user.currentStatus = currentStatus;

        // Role and organization are optional
        user.role = role || "";
        user.organization = organization || "";

        // 5. Mark profile as completed
        user.profileCompleted = true;

        // 6. Save user
        await user.save();

        // 7. Send response
        res.status(200).json({
            message: "Profile completed successfully",
            data: user
        });

    } catch (err) {

        console.error("Profile completion error:", err);

        res.status(400).json({
            message: "Error completing profile",
            error: err.message
        });
    }
});

// Get another user's public profile
profileRouter.get(
    "/profile/:userId",
    userAuth,
    async (req, res) => {

        try {

            const { userId } = req.params;

            // Logged-in user
            const loggedInUser = req.user;

            // Find target user
            const user = await User.findById(userId).select(
                "firstName lastName photoUrl about skills domains experienceMonths currentStatus role organization"
            );

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            // Calculate match percentage
            const matchResult = calculateMatchScore(
                loggedInUser,
                user
            );

            // Find common skills
            const commonSkills = getCommonSkills(
                loggedInUser,
                user
            );

            // Find common domains
            const commonDomains = getCommonDomains(
                loggedInUser,
                user
            );

            // Send only user-facing matching information
            res.status(200).json({
                data: {

                    ...user.toObject(),

                    // Overall match percentage
                    matchPercentage: matchResult.matchScore,

                    // Common skills
                    commonSkills,

                    // Common domains
                    commonDomains

                }
            });

        } catch (err) {

            console.error(
                "Public profile error:",
                err
            );

            res.status(400).json({
                message: "Error fetching profile",
                error: err.message
            });
        }
    }
);

module.exports = profileRouter;