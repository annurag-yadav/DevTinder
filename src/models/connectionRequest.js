const mongoose = require('mongoose');

const ConnectionRequestSchema = new mongoose.Schema({
    fromUserId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",  // Reference to the User model
        required : true,
    },
    toUserId : {
        type : mongoose.Schema.Types.ObjectId,
         ref : "User",  // Reference to the User model
        required : true,
    },
    status : {
        type : String,
        enum : ["ignored", "interested" , "accepted", "rejected"],
        message: "{VALUE} is not a valid status"
    }
},{
    timestamps : true
});

// compound indexing to make the query faster
ConnectionRequestSchema.index({fromUserId : 1, toUserId : 1});

// Prevent user from seending a connection request to themselves it runs before 
// saving the document to the database because me are using pre save hook

ConnectionRequestSchema.pre("save", function (next){
    const connectionRequest = this;
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error ("Cannot send connection request to yourself");
    }
    next();
})


const ConnectionRequest = new mongoose.model("ConnectionRequest", ConnectionRequestSchema);

module.exports = ConnectionRequest;

        