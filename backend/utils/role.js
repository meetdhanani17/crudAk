const { ObjectId } = require('mongodb');
const projectModel = require('../service/project/model/project.model');

var RoleHelper = function () {};
RoleHelper.prototype.getProjectRoles = async function (project_id) {
    let roleWhereAll = {};
    roleWhereAll.project_id = ObjectId(project_id);
    roleWhereAll.is_leaved = false;
    roleWhereAll.is_deleted = false;
    let getAllUserRole = await projectModel.getUserDataAndRole(roleWhereAll);
    if(getAllUserRole && getAllUserRole.length > 0){
        return getAllUserRole.map((user) => {
            let pUser = user?.project_users?.[0] ? user.project_users[0] : {};
            return {
                ...pUser,
                role:user.project_access
            }
        });
    }else{
        return [];
    }
}

module.exports =new RoleHelper();