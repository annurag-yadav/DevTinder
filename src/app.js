const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./config/database');
const User = require('./models/user');

app.use(express.json());

app.post("/signup", async(req,res) =>{
   const user = new User({
    firstName : req.body.firstName,
    lastName : req.body.lastName,
    emailId : req.body.emailId,
    password : req.body.password,
    age : req.body.age,
    gender : req.body.gender
   })
   try { await user.save()

    res.status(200).json({message : "User created successfully"})
   } catch (error) {
    res.status(500).json({message : "Error creating user", error : error.message})
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
app.patch("/user", async (req , res ) =>{
  const userId = req.body.userId;
  const updateData = req.body;
  try{
    const user = await User.findByIdAndUpdate({ _id: userId}, updateData, { returnDocument: "after"});
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

