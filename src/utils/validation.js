const validation = require('validator');

const validateSignupData = (req) => {
    const { firstName, lastName, emailId, password, age, gender } = req.body;

    if (!firstName || !emailId || !password) {
        throw new Error("Missing required fields");
    } 
    else  if (!validation.isEmail(emailId)) {
        throw new Error("Invalid email address");
    }
    else if (!validation.isStrongPassword(password)) {
        throw new Error("Weak password");
    }
    else if (age && (age < 18 || age > 100)) {
        throw new Error("Invalid age");
    }
    else if (gender && !["Male", "Female", "Other"].includes(gender)) {
        throw new Error("Invalid gender");
    }
};

const validateEditFields = (req)=>{
    const allowedEditFields = ["firstName", "lastName", "emailId", "age", "gender","about","skills"];

    const isEditAllowed = Object.keys(req.body).every((field) => allowedEditFields.includes(field));

    return isEditAllowed;
}
 

module.exports = {
    validateSignupData,
    validateEditFields
}