const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb+srv://backend:backend@backend.1wf7nqn.mongodb.net/DevTinder');
};

module.exports = connectDB;