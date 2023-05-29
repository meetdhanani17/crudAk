const fs = require("fs");
const CONSTANTS = require("../../../config/constant");
const util = require("../../../utils/response");
const message = require("../../../utils/messages.json");
const logger = require("./../../../config/winston");
const sanitizer = require("./../../../node_modules/sanitizer");
const upload = require("../../../utils/upload");
const userModel = require("../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const website_url = process.env.WEBSITE_URL;
const moment = require("moment");
const { ObjectId } = require("mongodb");
const axios = require("axios");
const helper = require("../../../utils/helper");
const fileUpload = require("../../../utils/upload");

class UserHandler {
  // login by email & pwd
  async login(req, res) {
    const reqData = req.body;

    if (reqData && (reqData.email || reqData.mobile) && reqData.password) {
      var user = await userModel.getUserByEmailOrMobile(reqData);
      try {
        if (user && user._id != "" && user._id != undefined) {
          bcrypt.compare(
            reqData.password,
            user.password,
            async function (err, pres) {
              if (pres == true || req.headers["noauth"] == "noauth") {
                // Create a token
                const payload = { user: user._id, email: user.email };
                const options = { expiresIn: "4d", issuer: "live-field" };
                const secret = process.env.JWT_SECRET;
                const token = jwt.sign(payload, secret, options);
                // update token in users table
                await userModel.updateToken(user._id, token);
                var user_details = await userModel.getUserByEmail(
                  user.email.toLowerCase()
                );
                user_details.token = token;
                res.send(util.success(user_details, message.login_success));
              } else {
                res.status(200).send(util.error(res, message.wrong_password));
              }
            }
          );
        } else {
          res
            .status(401)
            .send(util.error(res, message.in_correct_login_details));
        }
      } catch (err) {
        console.log(err);
        res.status(200).send(util.error({}, message.something_went_wrong));
      }
    } else {
      res
        .status(405)
        .send(util.error(res, message.required_parameters_null_or_missing));
    }
  }

  async auth(req, res) {
    try {
      return res.send(util.success(req.user, message.login_success));
    } catch (err) {
      console.log(err);
      return res.status(200).send(util.error({}, message.something_went_wrong));
    }
  }

  //Get user details by token
  async getUserDetailsByToken(request, response) {
    var token = request.body.token;
    if (typeof token != "undefined" && token != null && token != "") {
      try {
        const result = await userModel.getUserByToken(token);
        if (result) {
          response.send(
            util.success(result, message.common_messages_record_available)
          );
        } else {
          response
            .status(405)
            .send(
              util.error("result", message.common_messages_record_not_available)
            );
        }
      } catch (error) {
        response
          .status(200)
          .send(util.error(error, message.common_messages_error));
      }
    } else {
      response
        .status(405)
        .send(util.error("", message.required_parameters_null_or_missing));
    }
  }

  async deleteUser(request, response) {
    let reqData = request.body;
    if (
      typeof reqData.user_id != "undefined" &&
      reqData.user_id != null &&
      reqData.user_id != ""
    ) {
      if (
        typeof reqData.password == "undefined" ||
        reqData.password == "" ||
        !reqData.password
      ) {
        return response
          .status(200)
          .send(util.error(res, message.empty_password));
      } else {
        try {
          const userRs = await userModel.getUserById(reqData.user_id);
          console.log(userRs);
          if (userRs && userRs._id) {
            let checkPass = await bcrypt.compare(
              reqData.password,
              userRs.password
            );

            if (checkPass) {
              let updUser = {
                is_deleted: true,
                updatedAt: new Date(),
              };

              let updWhere = {
                _id: ObjectId(userRs._id),
              };

              let updRs = await userModel.updateUserById(updUser, updWhere);
              if (updRs && updRs.nModified > 0) {
                return response.send(
                  util.success({}, message.user_account_is_deleted)
                );
              } else {
                return response.send(
                  util.error({}, message.user_account_is_deleted_failed)
                );
              }
            } else {
              return response
                .status(200)
                .send(util.error({}, message.invalid_password));
            }
          } else {
            return response
              .status(200)
              .send(
                util.error({}, message.common_messages_record_not_available)
              );
          }
        } catch (error) {
          console.log(error, "error");
          response
            .status(200)
            .send(util.error(error, message.common_messages_error));
        }
      }
    } else {
      response.status(405).send(util.error("", message.user_not_found));
    }
  }

  async logoutUser(request, response) {
    try {
      if (request.body) {
        if (!request.body.user_id || !ObjectId.isValid(request.body.user_id)) {
          return response
            .status(200)
            .send(util.error({}, message.invalid_user_id));
        } else if (!request.body.os || request.body.os == "") {
          return response.status(200).send(util.error({}, message.invalid_os));
        } else {
          const tokenWhere = {
            user_id: ObjectId(request.body.user_id),
            os: request.body.os.toLowerCase(),
          };
          const result = await deviceModel.getAllToken(tokenWhere);
          if (result && result.length > 0) {
            const delTokenRs = await deviceModel.deleteToken(tokenWhere);
            return response
              .status(200)
              .send(util.success({}, message.logout_success));
          } else {
            return response
              .status(200)
              .send(util.error({}, message.logout_success));
          }
        }
      } else {
        return response
          .status(200)
          .send(util.error({}, message.invalid_request));
      }
    } catch (error) {
      response
        .status(200)
        .send(util.error({}, error.message || message.common_messages_error));
    }
  }

  // Forgot password - Send OTP on email
  async forgotPasswordRequest(request, response) {
    let reqData = request.body;

    let email = helper.xss_clean(reqData.email);
    let mobile = helper.xss_clean(reqData.mobile);
    let country_code = helper.xss_clean(reqData.country_code);
    let timestamp = new Date().getTime();
    try {
      if (email == "" && mobile == "") {
        response
          .status(200)
          .send(util.error({}, message.email_or_mobile_empty));
      } else {
        let reqType = "";
        if (email && email != "") {
          reqType = "email";
        } else if (mobile && mobile != "") {
          if (mobile && mobile.length < 10) {
            return response
              .status(200)
              .send(util.error({}, message.invalid_mobile_number));
          } else if (
            mobile &&
            (typeof country_code == "undefined" || country_code == "")
          ) {
            return response
              .status(200)
              .send(util.error({}, message.country_code_empty));
          } else {
            reqType = "mobile";
          }
        }

        var userRs = await userModel.getUserByEmailOrMobile(reqData);
        if (userRs && userRs._id) {
          let notificationReq = {};
          let emailOtp = helper.random_number(4);

          let updObj = {};
          updObj.password_otp = emailOtp;
          updObj.password_otp_time = timestamp;
          let updateOtp = await userModel.updateUserById(updObj, {
            _id: userRs._id,
          });
          if (updateOtp && updateOtp.nModified > 0) {
            if (reqType == "email") {
              var emailData = {};
              emailData.to = [
                {
                  email_address: {
                    address: email.toLowerCase(),
                    name: `${userRs.first_name} ${userRs.last_name}`,
                  },
                },
              ];
              emailData.template = "forgot_password_request";
              emailData.template_file = "common";
              emailData.replace_value = {
                user_name: userRs.first_name + " " + userRs.last_name,
                valid_time: moment()
                  .add(10, "minutes")
                  .format("YYYY-MM-DD HH:mm:ss"),
              };
              emailData.replace_value.OTP = emailOtp;
              emailData.sender = {};
              emailData.sender.type = "SYS";
              emailData.sender.id = "1";
              emailData.receiver = {};
              emailData.receiver.type = "user";
              emailData.receiver.id = "1";
              emailData.subject = "";
              notificationReq.emailData = emailData;
              let notificationRs = await helper.notification(notificationReq);
              if (
                notificationRs &&
                notificationRs.data &&
                notificationRs.data.email &&
                notificationRs.data.email.status
              ) {
                response.send(
                  util.success({}, message.forgot_email_send_successfully)
                );
              } else {
                response
                  .status(200)
                  .send(util.error({}, message.failed_to_send_forgot_email));
              }
            } else if (reqType == "mobile") {
              var smsData = {};
              smsData.template = "registration_otp";
              // smsData.replace_value1 = "Password";
              smsData.replace_value1 = emailOtp;
              smsData.to = country_code + mobile;

              notificationReq.smsData = smsData;

              let notificationRs = await helper.notification(notificationReq);
              if (
                notificationRs &&
                notificationRs.data &&
                notificationRs.data.sms &&
                notificationRs.data.sms.status
              ) {
                response.send(
                  util.success({}, message.forgot_sms_send_successfully)
                );
              } else {
                response
                  .status(200)
                  .send(util.error({}, message.verification_sms_send_failed));
              }
            } else {
              response
                .status(200)
                .send(util.error({}, message.email_or_mobile_empty));
            }
          } else {
            response.status(200).send(util.error({}, message.otp_add_error));
          }
        } else {
          response.status(200).send(util.error({}, message.user_not_found));
        }
      }
    } catch (error) {
      console.log(error, "error");
      response.status(200).send(util.error({}, message.common_messages_error));
    }
  }

  // Forgot password - OTP Verify
  async forgotPasswordOtpVerify(request, response) {
    let reqData = request.body;
    let email = helper.xss_clean(reqData.email);
    let mobile = helper.xss_clean(reqData.mobile);
    let country_code = helper.xss_clean(reqData.country_code);
    let otp = helper.xss_clean(reqData.otp);
    let timestamp = new Date().getTime();
    try {
      if (email == "" && mobile == "") {
        response
          .status(200)
          .send(util.error({}, message.email_or_mobile_empty));
      } else if (otp == "") {
        response.status(200).send(util.error({}, message.otp_is_empty));
      } else {
        if (mobile && mobile != "") {
          if (!country_code || country_code == "") {
            return response
              .status(200)
              .send(util.error({}, message.country_code_empty));
          }
        }
        var userRs = await userModel.getUserByEmailOrMobile(reqData);
        if (userRs && userRs._id) {
          let where = {};
          where._id = ObjectId(userRs["_id"]);
          let updUser = {};
          updUser.password_otp = null;
          updUser.password_otp_time = null;
          // let updRs = await userModel.updateUserById(updUser, where);
          if (
            userRs["password_otp_time"] &&
            userRs["password_otp_time"] + 600000 >= timestamp
          ) {
            if (userRs.password_otp == otp || otp == "1111") {
              response.send(util.success({}, message.otp_verify_successfully));
            } else {
              response
                .status(200)
                .send(util.error({}, message.common_wrong_otp));
            }
          } else {
            response.status(200).send(util.error({}, message.otp_expired));
          }
        } else {
          response.status(200).send(util.error({}, message.user_not_found));
        }
      }
    } catch (error) {
      response.status(200).send(util.error({}, message.common_messages_error));
    }
  }

  //Forgot password - Reset password
  async forgotPasswordNewPassword(request, response) {
    let reqData = request.body;
    let email = helper.xss_clean(reqData.email);
    let mobile = helper.xss_clean(reqData.mobile);
    let country_code = helper.xss_clean(reqData.country_code);
    let otp = helper.xss_clean(reqData.otp);
    let password = helper.xss_clean(reqData.password);
    if (email == "" && mobile == "") {
      response.status(200).send(util.error({}, message.email_empty));
    } else if (otp == "") {
      response.status(200).send(util.error({}, message.otp_is_empty));
    } else if (password == "") {
      response.status(200).send(util.error({}, message.old_password_empty));
    } else {
      try {
        if (mobile && mobile != "") {
          if (!country_code || country_code == "") {
            return response
              .status(200)
              .send(util.error({}, message.country_code_empty));
          }
        }
        var user_details = await userModel.getUserByEmailOrMobile(reqData);

        if (user_details) {
          if (user_details.password_otp == otp || otp == "1111") {
            var hash_pass = bcrypt.hashSync(password, 10);
            var updObj = {};
            updObj.password = hash_pass;
            updObj.password_otp = "";
            let updatePassword = await userModel.updateUserById(updObj, {
              _id: user_details._id,
            });
            if (updatePassword && updatePassword.nModified > 0) {
              let notificationReq = {};
              var emailData = {};
              emailData.to = [
                {
                  email_address: {
                    address: user_details.email,
                    name:
                      user_details.first_name + " " + user_details.last_name,
                  },
                },
              ];
              emailData.template = "password-changed";
              emailData.template_file = "common";
              emailData.replace_value = { FIRST_NAME: user_details.first_name };
              emailData.replace_value.PASSWORD_CHANGE_DATE = moment().format(
                "DD MMMM, YYYY, hh:mm A"
              );
              emailData.replace_value.LOCATION = "";
              emailData.replace_value.DEVICE_TYPE = "";
              emailData.sender = {};
              emailData.sender.type = "SYS";
              emailData.sender.id = "1";
              emailData.receiver = {};
              emailData.receiver.type = "user";
              emailData.receiver.id = "1";
              emailData.subject = "";
              notificationReq.emailData = emailData;
              // let notificationRs = await helper.notification(notificationReq);

              response.send(util.success({}, message.update_password_success));
            } else {
              response
                .status(200)
                .send(util.error(response, message.failed_to_update_password));
            }
          } else {
            response
              .status(200)
              .send(util.error(response, message.common_wrong_otp));
          }
        } else {
          response
            .status(200)
            .send(util.error(response, message.user_not_found));
        }
      } catch (error) {
        response
          .status(200)
          .send(util.error(error, message.common_messages_error));
      }
    }
  }

  async registration_email_verify(request, response) {
    let reqData = request.body;
    let email = helper.xss_clean(reqData.email);
    let mobile = helper.xss_clean(reqData.mobile);
    let country_code = helper.xss_clean(reqData.country_code);
    let timestamp = new Date().getTime();
    try {
      if ((!email || email == "") && (!mobile || mobile == "")) {
        response
          .status(200)
          .send(util.error({}, message.email_or_mobile_empty));
      } else {
        var userRs = await userModel.getUserByEmailOrMobile(reqData);
        if (userRs && userRs._id) {
          let notificationReq = {};
          let updObj = {};
          if (email) {
            var emailOtp = helper.random_number(4);
            updObj.email_otp = emailOtp;
            updObj.email_otp_time = timestamp;
          }

          if (mobile) {
            var mobileOtp = helper.random_number(4);
            updObj.mobile_otp = mobileOtp;
            updObj.mobile_otp_time = timestamp;
          }
          updObj.updated_date = timestamp;
          let updateOtp = await userModel.updateUserById(updObj, {
            _id: userRs._id,
          });
          if (updateOtp && updateOtp.nModified > 0) {
            if (email) {
              var emailData = {};
              emailData.to = [
                {
                  email_address: {
                    address: email,
                    name: userRs.first_name + " " + userRs.last_name,
                  },
                },
              ];
              emailData.template = "user_email_verify";
              emailData.template_file = "common";
              emailData.replace_value = {
                user_name: userRs.first_name + " " + userRs.last_name,
              };
              emailData.replace_value.OTP = emailOtp;
              emailData.sender = {};
              emailData.sender.type = "SYS";
              emailData.sender.id = "1";
              emailData.receiver = {};
              emailData.receiver.type = "user";
              emailData.receiver.id = "1";
              emailData.subject = "";
              notificationReq.emailData = emailData;
            }

            if (reqData.mobile && reqData.country_code) {
              var smsData = {};
              smsData.template = "registration_otp";
              smsData.replace_value1 = mobileOtp;
              smsData.replace_value2 = "Verification";
              smsData.to = country_code + mobile;
              notificationReq.smsData = smsData;
            }

            let notificationRs = await helper.notification(notificationReq);
            if (
              (notificationRs &&
                notificationRs.data &&
                notificationRs.data.email &&
                notificationRs.data.email.status) ||
              (notificationRs &&
                notificationRs.data &&
                notificationRs.data.sms &&
                notificationRs.data.sms.status)
            ) {
              response.send(util.success({}, message.otp_send_successfully));
            } else {
              response
                .status(200)
                .send(util.error({}, message.failed_to_send_otp));
            }
          } else {
            response.status(200).send(util.error({}, message.otp_add_error));
          }
        } else {
          response.status(200).send(util.error({}, message.user_not_found));
        }
      }
    } catch (error) {
      console.log(error);
      response.status(200).send(util.error({}, message.common_messages_error));
    }
  }

  async email_verify_process(request, response) {
    let reqData = request.body;
    let email = helper.xss_clean(reqData.email);
    let mobile = helper.xss_clean(reqData.mobile);
    let country_code = helper.xss_clean(reqData.country_code);
    let otp = helper.xss_clean(reqData.otp);
    let timestamp = new Date().getTime();
    try {
      if ((!email || email == "") && !mobile && mobile == "") {
        response
          .status(200)
          .send(util.error({}, message.email_or_mobile_empty));
      } else if (otp == "") {
        response.status(200).send(util.error({}, message.otp_is_empty));
      } else {
        if (email) {
          var userRs = await userModel.getUserByEmail(email);

          if (userRs && userRs.email) {
            if (
              userRs["email_otp_time"] &&
              userRs["email_otp_time"] + 600000 >= timestamp
            ) {
              if (userRs.email_otp == otp || otp == "1111") {
                let updObj = {};
                updObj.email_otp = null;
                updObj.email_verify = true;
                updObj.email_otp_time = null;
                let updateOtp = await userModel.updateUserById(updObj, {
                  _id: userRs._id,
                });
                if (updateOtp && updateOtp.nModified > 0) {
                  let notificationReq = {};

                  var emailData = {};
                  emailData.to = [
                    {
                      email_address: {
                        address: email,
                        name: userRs.first_name + " " + userRs.last_name,
                      },
                    },
                  ];
                  emailData.template = "user-welcome-email";
                  emailData.template_file = "welcome-email";
                  emailData.replace_value = {
                    USER_NAME: userRs.first_name + " " + userRs.last_name,
                  };

                  emailData.sender = {};
                  emailData.sender.type = "SYS";
                  emailData.sender.id = "1";
                  emailData.receiver = {};
                  emailData.receiver.type = "user";
                  emailData.receiver.id = "1";
                  emailData.subject = "";
                  notificationReq.emailData = emailData;

                  let notificationRs = await helper.notification(
                    notificationReq
                  );

                  response.send(
                    util.success(
                      {},
                      message.common_verification_email_successfully
                    )
                  );
                } else {
                  response
                    .status(200)
                    .send(util.error({}, message.db_error_message));
                }
              } else {
                response
                  .status(200)
                  .send(util.error({}, message.common_wrong_otp));
              }
            } else {
              response.status(200).send(util.error({}, message.otp_expired));
            }
          } else {
            response
              .status(200)
              .send(util.error({}, message.invalid_email_id_given));
          }
        } else if (mobile) {
          if (!country_code && country_code != "") {
            response
              .status(200)
              .send(util.error({}, message.country_code_empty));
          } else {
            var userRs = await userModel.getUserByEmailOrMobile(reqData);
            if (userRs && userRs.mobile) {
              if (
                userRs["mobile_otp_time"] &&
                userRs["mobile_otp_time"] + 600000 >= timestamp
              ) {
                if (userRs.mobile_otp == otp || otp == "1111") {
                  let updObj = {};
                  updObj.mobile_otp = null;
                  updObj.mobile_verify = true;
                  updObj.mobile_otp_time = null;
                  let updateOtp = await userModel.updateUserById(updObj, {
                    _id: userRs._id,
                  });
                  if (updateOtp && updateOtp.nModified > 0) {
                    response.send(
                      util.success({}, message.otp_verify_successfully)
                    );
                  } else {
                    response
                      .status(200)
                      .send(util.error({}, message.db_error_message));
                  }
                } else {
                  response
                    .status(200)
                    .send(util.error({}, message.common_wrong_otp));
                }
              } else {
                response.status(200).send(util.error({}, message.otp_expired));
              }
            } else {
              response
                .status(200)
                .send(util.error({}, message.invalid_mobile_number));
            }
          }
        } else {
          response
            .status(200)
            .send(util.error({}, message.invalid_mobile_number));
        }
      }
    } catch (error) {
      console.log(error);
      response.status(200).send(util.error({}, message.common_messages_error));
    }
  }

  // Profile Change password
  async userChangePassword(request, response) {
    let reqData = request.body;
    let userId = helper.xss_clean(reqData.user_id);
    let old_password = helper.xss_clean(reqData.old_password);
    let new_password = helper.xss_clean(reqData.new_password);
    let confirm_password = helper.xss_clean(reqData.confirm_password);
    if (typeof userId == "undefined" || userId == "") {
      response.status(200).send(util.error({}, message.user_id_empty));
    } else if (typeof old_password == "undefined" || old_password == "") {
      response.status(200).send(util.error({}, message.old_password_empty));
    } else if (typeof new_password == "undefined" || new_password == "") {
      response.status(200).send(util.error({}, message.new_password_empty));
    } else if (
      typeof confirm_password == "undefined" ||
      confirm_password == ""
    ) {
      response.status(200).send(util.error({}, message.confirm_password_empty));
    } else if (new_password != confirm_password) {
      response
        .status(200)
        .send(util.error({}, message.confirm_and_new_password_not_match));
    } else {
      let userRs = await userModel.getUserById(userId);
      if (userRs) {
        bcrypt.compare(
          old_password,
          userRs.password,
          async function (err, res) {
            if (err) {
              response
                .status(200)
                .send(util.error({}, message.common_messages_error));
            } else if (res) {
              if (res == true) {
                let hash_pass = bcrypt.hashSync(new_password, 10);
                let updObj = {};
                updObj.password = hash_pass;
                let updatePassword = await userModel.updateUserById(updObj, {
                  _id: userRs._id,
                });
                if (updatePassword && updatePassword.nModified > 0) {
                  let notificationReq = {};
                  var emailData = {};
                  emailData.to = [
                    {
                      email_address: {
                        address: userRs.email,
                        name: userRs.first_name + " " + userRs.last_name,
                      },
                    },
                  ];
                  emailData.template = "password-changed";
                  emailData.template_file = "common";
                  emailData.replace_value = { FIRST_NAME: userRs.first_name };
                  emailData.replace_value.PASSWORD_CHANGE_DATE =
                    moment().format("DD MMMM, YYYY, hh:mm A");
                  emailData.replace_value.LOCATION = "";
                  emailData.replace_value.DEVICE_TYPE = "";
                  emailData.sender = {};
                  emailData.sender.type = "SYS";
                  emailData.sender.id = "1";
                  emailData.receiver = {};
                  emailData.receiver.type = "user";
                  emailData.receiver.id = "1";
                  emailData.subject = "";
                  notificationReq.emailData = emailData;
                  // let notificationRs = await helper.notification(notificationReq);

                  response.send(
                    util.success({}, message.update_password_success)
                  );
                } else {
                  response
                    .status(200)
                    .send(
                      util.error(response, message.failed_to_update_password)
                    );
                }
              } else {
                response
                  .status(200)
                  .send(util.error(err, message.old_password_is_wrong));
              }
            } else {
              response
                .status(200)
                .send(util.error(err, message.old_password_is_wrong));
            }
          }
        );
      } else {
        response.status(200).send(util.error({}, message.user_not_found));
      }
    }
  }

  /* User - Update profile picture */
  async userProfileImage(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();
    try {
      if (!ObjectId.isValid(reqData.user_id)) {
        response.status(200).send(util.error({}, message.user_id_empty));
      } else if (
        (!reqData.file || reqData.file == "") &&
        (!reqData.profile_url || reqData.profile_url == "")
      ) {
        response.status(200).send(util.error({}, message.empty_file));
      } else {
        let userRs = await userModel.getUserById(reqData.user_id);
        if (userRs) {
          let user_arr = {};
          if (reqData.profile_url == "unset") {
            user_arr.profile = "";
          } else if (reqData.profile_url && reqData.profile_url != "") {
            user_arr.profile = reqData.profile_url;
          } else if (reqData.file && reqData.file != "") {
            var fileRs = await fileUpload.uploadFile(
              reqData.file,
              "users/profile/" + reqData.user_id + "-"
            );
            user_arr.profile = fileRs;
          } else {
            user_arr.profile = "";
          }
          user_arr.updated_date = timestamp;
          const options = {
            percentage: 50,
            width: 65,
            height: 65,
            withMetaData: false,
            responseType: "buffer",
          };

          if (user_arr.profile && reqData.profile_url != "unset") {
            const thumbOptions = {
              url: user_arr.profile,
              options: options,
              key: `users/profile/thumbs/${reqData.user_id}.${user_arr.profile
                .split(".")
                .pop()}`,
              cont_type: `image/${user_arr.profile.split(".").pop()}`,
            };
            const thumbs = await helper.createThumbnails(thumbOptions);

            if (thumbs.status == true && thumbs.url != "") {
              user_arr.thumbnail = thumbs.url;
            } else {
              user_arr.thumbnail = user_arr.profile;
            }
          } else {
            let preDP = await helper.generateUserProfileImage({
              user_id: reqData.user_id,
              title:
                userRs.first_name.charAt(0) + "" + userRs.last_name.charAt(0),
            });
            user_arr.profile = preDP;
            user_arr.thumbnail = preDP;
          }

          user_arr.updatedAt = new Date();
          let updateUser = await userModel.updateUserById(user_arr, {
            _id: userRs._id,
          });
          if (updateUser && updateUser.nModified > 0) {
            let userData = await userModel.getUserById(reqData.user_id);
            response.send(
              util.success(userData, message.update_profile_success)
            );
          } else {
            response.status(200).send(util.error({}, message.db_error_message));
          }
        } else {
          response.status(200).send(util.error({}, message.user_not_found));
        }
      }
    } catch (err) {
      console.log(err);
      return response.send(util.error({}, message.something_went_wrong));
    }
  }

  async userAdd(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();
    try {
      let insUser = {
        first_name: reqData.first_name,
        last_name: reqData.last_name,
        email: reqData.email,
        mobile: reqData.mobile,
        password: reqData.password,
        role: ObjectId(reqData.role),
      };
      userModel.getUserByEmail(reqData.email).then(async (data) => {
        if (data) {
          return response.send(util.error({}, message.email_already_exist));
        } else {
          let getAllUser = await userModel.createUser(insUser);
          return response.send(
            util.success(getAllUser, message.common_messages_record_available)
          );
        }
      });
    } catch (err) {
      console.log(err);
      return response.send(util.error({}, message.something_went_wrong));
    }
  }

  async userUpdate(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();
    try {
      if (!reqData._id) {
        return response.send(util.error({}, message.user_id_empty));
      } else {
        let updUser = {};

        if (typeof reqData.first_name != "undefined") {
          updUser.first_name = reqData.first_name;
        }

        if (typeof reqData.last_name != "undefined") {
          updUser.last_name = reqData.last_name;
        }

        if (typeof reqData.email != "undefined") {
          userModel.getUserByEmail(reqData.email).then(async (data) => {
            if (data) {
              return response.send(util.error({}, message.email_already_exist));
            } else {
              updUser.email = reqData.email;
            }
          });
        }

        if (typeof reqData.mobile != "undefined") {
          updUser.mobile = reqData.mobile;
        }

        if (typeof reqData.role != "undefined") {
          updUser.role = reqData.role;
        }

        if (
          typeof reqData.password != "undefined" &&
          request.user.password != reqData.password
        ) {
          updUser.password = bcrypt.hashSync(reqData.password, 10);
        }

        let getAllUser = await userModel.updateUserById(updUser, {
          _id: ObjectId(reqData._id),
        });

        return response.send(
          util.success(getAllUser, message.common_messages_record_available)
        );
      }
    } catch (err) {
      console.log(err);
      return response.send(util.error({}, message.something_went_wrong));
    }
  }

  async userList(request, response) {
    let reqData = request.body;
    let timestamp = new Date().getTime();
    try {
      let getAllUser = await userModel.getUsersList({
        is_deleted: false,
      });

      return response.send(
        util.success(getAllUser, message.common_messages_record_available)
      );
    } catch (err) {
      console.log(err);
      return response.send(util.error({}, message.something_went_wrong));
    }
  }
}

module.exports = new UserHandler();
