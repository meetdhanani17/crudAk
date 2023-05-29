const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
/**
 * User Licences Role Schema
 */
const UserLicencesRoleSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    is_default: {
        type: mongoose.Schema.Types.Boolean,
        default:false
    },
    is_visible: {
        type: mongoose.Schema.Types.Boolean,
        default:true
    },
    access:{
        type:mongoose.Schema.Types.Mixed
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
});


UserLicencesRoleSchema.plugin(timestamp);
const UserLicencesRoleModelSchema = mongoose.model(CC.U001B_USERS_ROLES,UserLicencesRoleSchema);
module.exports = UserLicencesRoleModelSchema;
