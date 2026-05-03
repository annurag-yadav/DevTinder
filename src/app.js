const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./config/database');
const User = require('./models/user');
const {validateSignupData} = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser'); //to read cookies from the request
const jwt = require('jsonwebtoken');
const {userAuth} = require('./middlewares/auth');

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
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch){
        throw new Error ("Invalid password");
      } else {
      
        // create a jwt token
         const token = await jwt.sign({_id : user._id}, "DEV@Tinder$790")
         console.log(token);
        // add the token to cookies and send the response to the user 
         
        res.cookie("token", token);

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


app.get("/user" , async(req,res) =>{
     const userEmail = req.body.emailId;
     try{
      const user = await User.find ({emailId : userEmail});
      if(user.length === 0 ){
        res.status(404).send("user not found");
      } else{
        res.send(user)
      }
           } catch (err) {
      res.status(400).send("something went wrong")
     }

})

//Feed api - get/feed - get all the users from the database
app.get("/feed", async(req,res)=>{
  try{
   const users = await User.find({})
   res.send(users);
  } catch (err){
    res.status(400).send ("something went wrong")
  }

})

app.delete("/user", async (req,res) =>{
  const userId = req.body.userId;
  //console.log(userId);
  try{
    //const user = await User.findByIdAndDelete({_id : userId});
     const user = await User.findByIdAndDelete(userId);

    res.send("user Deleted Successfully");
  }
    catch (err){
      res.status(400).send("Something went wrong");
    }
})

//update data of the user
app.patch("/user/:userId", async (req , res ) =>{
  const userId = req.params.userId;
  const updateData = req.body;
  try{
   const AllowedUpdates = ["photoUrl","about", "skills", "age"];
   const requestedUpdates = Object.keys(updateData);
   const isValidOperation = requestedUpdates.every((update) => AllowedUpdates.includes(update));
    if (!isValidOperation){
      return res.status(400).send("Invalid updates");
    }
    if (updateData?.skills.length > 10){
      throw new Error ("You can add up to 10 skills only");
    }

    const user = await User.findByIdAndUpdate({ _id: userId}, updateData, { returnDocument: "after", runValidators: true});
    res.send("user updated successfully");
  
  } catch (err){
    res.status(400).send("something went wrong");
  }
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

