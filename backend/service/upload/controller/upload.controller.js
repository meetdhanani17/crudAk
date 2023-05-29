const CONSTANTS = require('../../../config/constant');
const util = require('../../../utils/response');
const message = require('../../../utils/messages.json');
const logger = require('./../../../config/winston');
const sanitizer = require("./../../../node_modules/sanitizer");
const upload = require('../../../utils/upload');
const helper = require('../../../utils/helper');
const fs = require('fs');
class uploadHandler {

  async uploadImage(request, response) {
    let fOrignalName = null;
    if (request.files && request.files.file) {
      fOrignalName = request.files.file.name;
      var file = fs.readFileSync(request.files.file.tempFilePath);
      file = "data:/" + request.files.file.mimetype + ";base64," + (file.toString('base64'));

    } else if (request.body.file && request.body.file != "") {
      var file = request.body.file;
      fOrignalName = request.body.name ? request.body.name : "";
    } else {
      return response.send(util.error("", message.required_parameters_null_or_missing));
    }
    let module_type = request.body.module_type;
    let module_key = request.body.module_key;
    let project_id = request.body.project_id;
    if (file != '' && module_type != '') {
      try {
        // if(!module_key || (typeof module_key != "undefined" && module_key == "")){
        //   return response.status(200).send(util.error({}, message.module_key_is_empty_error));
        // }
        switch (module_type) {
          case "plan":
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.PLAN + module_key + '/' : CONSTANTS.PLAN;
            if (typeof module_key != "undefined" && module_key != "") {
              file_path = CONSTANTS.PROJECT_PATH + project_id + "/" + file_path
            }
            else {
              file_path = CONSTANTS.PROJECT_PATH + file_path
            }
            break;
          case "user_profile":
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.USER_PROFILE + module_key + '/' : CONSTANTS.USER_PROFILE;
            break;
          case "filler_media":
            var file_path = CONSTANTS.FILLER_MEDIA_PATH;
            if (typeof module_key != "undefined" && module_key != "") {
              file_path = CONSTANTS.PROJECT_PATH + project_id + "/" + file_path
            }
            else {
              file_path = CONSTANTS.PROJECT_PATH + file_path
            }
            break;
          case "project":
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.PROJECT_PATH + module_key + '/' : CONSTANTS.PROJECT_PATH;
            break;
          case "project_photo":
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.PROJECT_PATH + module_key + '/photos/' : CONSTANTS.PROJECT_PATH;
            break;
          case "project_logo":
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.PROJECT_PATH + module_key + '/logo/' : CONSTANTS.PROJECT_PATH;
            break;
          default:
            var file_path = typeof module_key != "undefined" && module_key != "" ? CONSTANTS.PROJECT_PATH + module_key + '/' : CONSTANTS.PROJECT_PATH;
            if (typeof module_key != "undefined" && module_key != "") {
              file_path = CONSTANTS.PROJECT_PATH + project_id + "/" + file_path
            }
            else {
              file_path = CONSTANTS.PROJECT_PATH + file_path
            }
        }
        const upload_data = await upload.uploadFile(file, file_path, fOrignalName);
        let resSend = util.success(upload_data, message.common_file_uploaded_success);
        if(resSend && upload_data){
          let icon =  helper.getIconByType(upload_data.split(".").pop());
          resSend.icon = icon;
        }
        response.send(resSend);
      } catch (error) {
        console.log(error, "error")
        response.status(200).send(util.error(error, message.common_messages_error));
      }
    } else {
      response.send(util.error({}, message.required_parameters_null_or_missing));
    }
  }
}


module.exports = new uploadHandler();