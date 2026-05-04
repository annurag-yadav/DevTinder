const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./config/database');
const User = require('./models/user');
const {validateSignupData} = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser'); //to read cookies from the request
const jwt = require('jsonwebtoken');
const userAuth = require('./middlewares/auth');

app.use(express.json());
app.use(cookieParser());


app.post("/signup", async(req,res) =>{

    try{
    // validate the data
     validateSignupData(req);

     const {firstName, lastName, emailId, password, age, gender} = req.body;
   // encrypt the password
    const hashPassword = await bcrypt.hash(password , 10);
    

   // Creating a new instance of the user model and saving it to the database
   const user = new User({
    firstName,
    lastName,
    emailId,
    password: hashPassword,
    age,
    gender 
   })
    await user.save()

    res.status(200).json({message : "User created successfully"})
   } catch (error) {
    res.status(500).json({message : "Error creating user", error : error.message})
   }

})

//login api
app.post("/login", async (req , res) => {
  try{
     const {emailId , password} = req.body;

     const user = await User.findOne({emailId : emailId});
     if (!user){
      throw new Error ("User not found");
     }
      const isPasswordMatch = await user.validatePassword(password);
      if (!isPasswordMatch){
        throw new Error ("Invalid password");
      } else {
      
        // create a jwt token
        // done in userschema method getJWT
        const token = await user.getJWT();
         
        // console.log(token);
        // add the token to cookies and send the response to the user 
         
        res.cookie("token", token ,{expires : new Date(Date.now() + 8*60*60*1000)});

        res.status(200).send({message : "Login successful"})
      }

  } catch (err){
    res.status(400).send({message : "Error logging in", error : err.message})
  }

})

app.get("/profile",userAuth, async (req , res ) =>{
    try{
          const user = req.user;
            res.send(user);
      }
        catch (err){
          res.status(401).send({message : "Unauthorized", error : err.message})
        }

})

app.get("/logout", (req , res) => {
  res.clearCookie("token");
  res.status(200).send({message : "Logout successful"})
})



connectDB()
  .then(() =>{
    console.log('Database connected successfully');
    app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });

