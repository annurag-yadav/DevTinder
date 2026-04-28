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

