const CONSTANTS = require('../../../config/constant');
const roleModel = require('../model/user_role.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');



class UlRoleHandler {

  /* Create role to the User Licence */
  async createRole(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();

    try {
      if (!reqData.name || reqData.name == "" || reqData.name.trim() == "") {
        response.status(200).send(util.error({}, message.role_name_is_empty));
      } else {
        let insObj = {
          name: reqData.name,
          role: reqData.name.trim().toLowerCase().split(" ").join("_"),
          is_default:true
        }

        let insRs = await roleModel.createRole(insObj);
        return response.status(200).send(util.success(insRs, message.role_update_success));
      }
    } catch (err) {
      console.log(err)
      response.send(util.error({}, message.something_went_wrong));
    }
  }

  async listAll(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();

    try {
      
        let roleRs = await roleModel.getRoleByKeys({
          is_deleted:false
        });
        return response.status(200).send(util.success(roleRs, message.role_update_success));
      
    } catch (err) {
      console.log(err)
      response.send(util.error({}, message.something_went_wrong));
    }
  }
  
  async manageRole(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();

    try {
      if (!reqData.user_licences_id || reqData.user_licences_id == "") {
        response.status(200).send(util.error({}, message.user_licence_id_empty));
      } else if (!reqData.user_id || reqData.user_id == "") {
        response.status(200).send(util.error({}, message.user_id_empty));
      } else if (!reqData.role_name || reqData.role_name == "" || reqData.role_name.trim() == "") {
        response.status(200).send(util.error({}, message.role_name_is_empty));
      } else if (!reqData.access || typeof reqData.access != "object") {
        response.status(200).send(util.error({}, message.role_access_values_are_empty));
      } else {
        let role_id = reqData.role_id ? reqData.role_id : "";
        let roleName = reqData.role_name.trim();
        let insObj = {}
        insObj.is_default = 0;
        insObj.user_licences_id = ObjectId(reqData.user_licences_id);
        insObj.is_visible = true;
        insObj.name = roleName;
        insObj.role = roleName.toLowerCase().split(" ").join("_");

        /* CONSTANTS.DEFAULT_ROLE_KEYS This is import from CONSTONT FILE */
        if(CONSTANTS.LDEFAULT_ROLE_KEYS.includes(insObj.role)){
          return response.status(200).send(util.error({}, message.role_already_exist));
        }

        /* Check Exists Role */
        let whereCheckObj = {}
        whereCheckObj.role = insObj.role;
        whereCheckObj.user_licences_id = ObjectId(reqData.user_licences_id);
        whereCheckObj.is_deleted = false;
        if (role_id != "") {
          whereCheckObj._id = { "$ne": ObjectId(role_id) }
        }
        let checkExistRole = await roleModel.checkExistRole(whereCheckObj);

        if (checkExistRole.length > 0) {
          return response.status(200).send(util.error({}, message.role_already_exist));
        }
        /* Check Exists Role Where End */

        /* Check Role Keys */
        let roleKeysWhere = {};
        roleKeysWhere.is_deleted = false;
        let keyRs = await roleModel.getRoleKeys(roleKeysWhere);

        if (keyRs && keyRs.access_keys) {
          let accessModuleKeys = Object.keys(keyRs.access_keys);

          for (let ai in accessModuleKeys) {
            let accessKey = accessModuleKeys[ai];
            if (typeof reqData.access[accessKey] == "undefined") {
              return response.status(200).send(util.error({}, accessKey + " access object is miss"));
            } else {
              let reqAccessKeys = reqData.access[accessKey];
              if (typeof reqAccessKeys == "object" && Object.keys(reqAccessKeys).length > 0) {
                if (typeof keyRs.access_keys[accessKey] == "object") {
                  let reqAccessKeysArr = Object.keys(reqAccessKeys);
                  let difference = keyRs.access_keys[accessKey].filter(x => !reqAccessKeysArr.includes(x));
                  if (difference.length > 0) {
                    return response.status(200).send(util.error({}, "Under " + accessKey + " object, " + difference.join(", ") + " keys are missing"));
                  }
                }
              } else {
                return response.status(200).send(util.error({}, accessKey + " access object is empty"));
              }
            }
          }

          insObj.access = reqData.access;
          if (role_id != "") {

            let updObj = {};
            updObj.name = insObj.name;
            updObj.role = insObj.role;
            updObj.access = insObj.access;

            let updWhere = {}
            updWhere._id = ObjectId(role_id);
            let updRs = await roleModel.updateRole(updObj, updWhere);
            if (updRs && updRs.n > 0) {
              return response.status(200).send(util.success({}, message.role_update_success));
            } else {
              return response.send(util.error({}, message.role_update_failed));
            }

          } else {

            let createRoleRs = await roleModel.createRole(insObj);
            if (createRoleRs && createRoleRs._id) {
              return response.status(200).send(util.success(createRoleRs, message.role_created_successfuly));
            } else {
              return response.status(200).send(util.error({}, message.role_failed_to_create));
            }

          }

        } else {
          return response.status(200).send(util.error({}, message.role_keys_not_created));
        }
        /* Check Role Keys End */
      }
    } catch (err) {
      console.log(err)
      response.send(util.error({}, message.something_went_wrong));
    }
  }

  async getRoleKeys(request, response) {
    let projectId = request.params.user_licences_id;
    try {
      let roleKeysWhere = {};
      roleKeysWhere.is_deleted = false;
      let keyRs = await roleModel.getRoleKeys(roleKeysWhere);

      if (keyRs && Object.keys(keyRs).length > 0) {
        if (request.query.role_id) {
          let rlWhere = {}
          rlWhere._id = ObjectId(request.query.role_id);
          rlWhere.is_deleted = 0;
          let roleData = await roleModel.getRoleById(rlWhere);
          keyRs["role_data"] = roleData;
        } else {
          keyRs["role_data"] = {};
        }
        response.send(util.success(keyRs, message.common_messages_record_available));
      } else {
        response.send(util.error({}, message.common_messages_record_not_available));
      }

    } catch (err) {
      console.log(err)
      return response.send(util.error({}, message.something_went_wrong));
    }
  }

  async getRoleById(request, response) {
    let role_id = request.params.role_id;
    try {
      let rlWhere = {}
      rlWhere._id = ObjectId(role_id);
      rlWhere.is_deleted = 0;
      let roleData = await roleModel.getRoleById(rlWhere);
      if (roleData && roleData._id) {

        response.send(util.success(roleData, message.common_messages_record_available));
      } else {
        response.send(util.error({}, message.common_messages_record_not_available));
      }

    } catch (err) {
      console.log(err)
      return response.send(util.error({}, message.something_went_wrong));
    }
  }
  
  async getRoleByLicenceId(request, response){
    let licenceId = request.params.user_licences_id;
    try {
      let rlWhere = {};
      rlWhere["$or"] = [{ "user_licences_id": ObjectId(licenceId) }, { "is_default": 1 }];
      rlWhere.is_deleted = false;
      let roleData = await roleModel.getRoleByLicenceId(rlWhere);

      if(roleData){
        response.send(util.success(roleData, message.common_messages_record_available));
      }else{
        response.send(util.error({}, message.common_messages_record_not_available));
      }
      
    }catch (err) {
      console.log(err)
      return response.send(util.error({}, message.something_went_wrong));
    }
  }


  async deleteRoleById(request, response) {
    let role_id = request.body.role_id;
    let user_licences_id = request.body.user_licences_id;
    try {
      let rlWhere = {}
      rlWhere._id = ObjectId(role_id);
      rlWhere.user_licences_id = ObjectId(user_licences_id);
      rlWhere.is_deleted = false;
      let roleData = await roleModel.getRoleById(rlWhere);
      if (roleData && roleData._id) {
        let userWhere = {}
        userWhere.user_licences_id = ObjectId(user_licences_id);
        userWhere.role = ObjectId(role_id);
        let getRoleUser = await roleModel.getUsersByRoleId(userWhere);
        if (getRoleUser && getRoleUser.length > 0) {
          response.send(util.error({}, message.not_delete_role_user_exists));
        } else {
          let updRole = {};
          updRole.is_deleted = true;
          let updRs = await roleModel.updateRole(updRole, rlWhere);
          if (updRs && updRs.n > 0) {
            response.send(util.success([], message.role_romove_success));
          } else {
            response.send(util.success([], message.failed_to_delete_role));
          }
        }
      } else {
        response.send(util.error({}, message.invalid_role_id));
      }

    } catch (err) {
      console.log(err)
      return response.send(util.error({}, message.something_went_wrong));
    }
  }
}

module.exports = new UlRoleHandler();