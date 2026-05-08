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

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');


app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);


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

