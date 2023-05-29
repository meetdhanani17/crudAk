const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
const bcrypt = require('bcrypt');

/**
 * User  Schema
 */
const UserSchema = new mongoose.Schema({
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  email: {
    type: String
  },
  email_otp: {
    type: String
  },
  email_otp_time: {
    type: Number
  },
  mobile: {
    type: String
  },
  country_code: {
    type: String
  },
  mobile_otp: {
    type: String
  },
  mobile_otp_time: {
    type: Number
  },
  password_otp: {
    type: String
  },
  password_otp_time: {
    type: Number, 
    default: (new Date()).getTime()
  },
  profile: {
    type: String
  },
  password: {
    type: String
  },
  email_verify:{
    type:Boolean,
    default: false
  },
  mobile_verify:{
    type:Boolean,
    default: false
  },
  phcid:{
    type: mongoose.Schema.Types.ObjectId,
    default:null
  },
  role:{
    type: mongoose.Schema.Types.ObjectId,
    ref: CC.U001B_USERS_ROLES
  },
  token: {
    type: mongoose.Schema.Types.String,
  },
  
  is_deleted: {
      type: Boolean,
      default: false
  },
  
  status: {
    type: String,
    enum:['Active', 'Pending', 'In-Active'],
    default: 'Active'
  }
});

// encrypt password before save
UserSchema.pre('save', function(next) {
  const user = this;
  var SALTING_ROUNDS = 10;
  if(!user.isModified || !user.isNew) {
    next();
  } else {
    bcrypt.hash(user.password, SALTING_ROUNDS, function(err, hash) {
      if (err) {
        console.log('Error hashing password for user', user.first_name);
        next(err);
      } else {
        user.password = hash;
        next();
      }
    });
  }
});

UserSchema.plugin(timestamp);
const UserModel = mongoose.model(CC.U001_USERS,UserSchema);
module.exports = UserModel;