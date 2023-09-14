// Define a schema for the user
const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
  });
  
  // Create a User model
  const User = mongoose.model('User', userSchema);

  module.exports = User;