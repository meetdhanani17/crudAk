'use strict';
const roleSchema = require("./user_role.schema");
const roleKeysSchema = require("./user_role_keys.schema");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const CC = require("./../../../config/constant_collection");

class ulroleModel {

	constructor() {
		this.DB = require("../../../config/dbm");
		this.projectedKeys = {
			"crtd_dt": true
		};
	}

	/*
	* Name of the Method : Create Custome Role
	* Description : add new role
	*/
	createRole(insertData) {
		let role = new roleSchema(insertData);
		return new Promise(async (resolve, reject) => {
			try {
				const result = await role.save();
				resolve(result);
			} catch (error) {
				console.log(error);
				reject(error)
			}
		});
	}

	/*user Licences update role */
	updateRole(setObj,whereObj){
		return new Promise(async (resolve, reject) => {
			try {
			  let result = await roleSchema.updateOne(whereObj, { $set: setObj });
			  resolve(result);
			} catch (error) {
			  console.log(error);
			  reject(error);
			}
		});
	}

	/* Get Access Keys */
	getRoleKeys(whereObj) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await roleKeysSchema.findOne(whereObj).lean();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	checkExistRole(whereObj){
		return new Promise(async (resolve, reject) => {
			try {
				const result = await roleSchema.find(whereObj).lean();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	getRoleById(whereObj){
		return new Promise(async (resolve, reject) => {
			try {
				const result = await roleSchema.findOne(whereObj).lean();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	getRoleByKeys(whereObj) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await roleSchema.aggregate([
					{
						$match: whereObj
					}
				]);
				resolve(result);

			} catch (error) {
				console.log(error);
				reject(error)
			}
		});
	}

	getUsersByRoleId(whereObj){
		return new Promise(async (resolve, reject) => {
			try {
				const result = await userLicencesUsersSchema.find(whereObj).lean();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	getRoleByRoleKey(whereObj){
		return new Promise(async (resolve, reject) => {
			try {
				const result = await roleSchema.findOne(whereObj).lean();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}
}

module.exports = new ulroleModel();