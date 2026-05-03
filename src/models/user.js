const mongoose = require('mongoose');
const validator = require('validator'); 


const userSchema = new mongoose.Schema({
    firstName:{
        type : String,
        required : true
    },
    lastName:{
        type : String
    },
    emailId:{
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error ("Invalid email address")
            }
        }
    },
    password:{
        type : String,
         validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error ("Weak password")
            }
        }
    },
    age : {
        type : Number,
        min : 18
    },
    gender : {
        type : String,
        validate (value){
            if(!["Male", "Female", "Other"].includes(value)){
                throw new Error ("Gender is not valid")
        }
    }
    },
    photoUrl : {
        type : String,
        default : "https://media.istockphoto.com/id/1553217327/vector/user-profile-icon-avatar-person-sign-profile-picture-portrait-symbol-easily-editable-line.jpg?s=612x612&w=0&k=20&c=frb9OtEMcqiJM42xDV81uM5n653yJkN3zYm7bvSDylo=",
        validate(value){
            if(!validator.isURL(value)){
                throw new Error ("Invalid photo URL")
            }
        }
    },
    about : {
        type : String,
        default : "Hey there! I am using DevTinder."
    },
    skills : {
        type : [String]
    }
    
}, {timestamps: true});

const User = mongoose.model('user', userSchema);
module.exports = User;