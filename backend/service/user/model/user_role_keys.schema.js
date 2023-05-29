const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
/**
 * User Licences Role key Schema
 */
const UserLicencesRoleKeysSchema = new mongoose.Schema({
    access_keys:{
        people: {
            type: Array,
            required: true
        },
        project: {
            type: Array,
            required: true
        },
        role:{
            type: Array,
            required: true
        } 
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
});


UserLicencesRoleKeysSchema.plugin(timestamp);
const UserLicencesRoleKeysModelSchema = mongoose.model(CC.U001C_USERS_ROLES_KEYS,UserLicencesRoleKeysSchema);
module.exports = UserLicencesRoleKeysModelSchema;
