const ObjectId = require("mongoose").Types.ObjectId;
const bcrypt = require('bcrypt');

const ItemsModel = require(__path_schemas + 'users');
const GroupsModel = require(__path_models + 'groups')
const saltRounds = 10;

module.exports = {
    listItems: async (params, options = null) => {
        let sort = {}
        sort[params.sortField] = params.sortType;

        return await ItemsModel
            .find(params.objWhere)
            .sort(sort)
            .limit(params.pagination.totalItemsPerPage)
            .skip(params.pagination.totalItemsPerPage * (params.pagination.currentPage - 1));
    },
    getItem: async (id, options = null) => {
        if (ObjectId.isValid(id)) {
            return await ItemsModel.findById(id);
        }
        else {
            return null;
        }
    },
    getItemByUsername: async (username, options = null) => {
        return await ItemsModel.findOne({ username });
    },
    changeStatus: async (id, currentStatus, options = null) => {
        let status = (currentStatus == "active") ? "inactive" : "active";
        let data = {
            modified: Date.now()
        }

        if (options.task == "update-one") {
            data.status = status;
            return await ItemsModel.updateOne({ _id: id }, data);
        }

        if (options.task == "update-multi") {
            data.status = currentStatus;
            return await ItemsModel.updateMany({ _id: { $in: id } }, data);
        }
    },
    changeGroup: async (group_id, group_name, options = null) => {
        return await ItemsModel.updateMany(
            { 'group.id': { $in: group_id } },
            { 'group.name': group_name },
        );
    },
    changeProfile: async (id, data, options = null) => {
        return await ItemsModel.updateOne({ _id: id }, data);
    },
    deleteItem: async (id, options = null) => {
        if (options.task == "delete-one") {
            return await ItemsModel.deleteOne({ _id: id });
        }

        if (options.task == "delete-multi") {
            return await ItemsModel.deleteMany({ _id: { $in: id } });
        }
    },
    countItem: async (params, options = null) => {
        return await ItemsModel.find(params.objWhere).count();
    },
    saveItem: async (id, item, options = null) => {
        if (options.task == "add") {
            item.password = bcrypt.hashSync(item.password, saltRounds);
            item.created = Date.now();
            item.modified = Date.now();
            return await ItemsModel.create(item);
        }

        if (options.task == "edit") {
            item.modified = Date.now();
            return await ItemsModel.updateOne({ _id: id }, item);
        }
    },
    logIn: async (username, password) => {
        let user = await ItemsModel.findOne({ username, status: 'active' });
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                let group = await GroupsModel.getItem(user.group.id);
                user = {
                    id: user.id,
                    name: user.username,
                    isAdmin: group.group_acp == 'yes',
                }
                return user;
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    checkPassword: async (id, password) => {
        let user = await ItemsModel.findOne({ _id: id, status: 'active' });

        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    changePassword: async (id, password) => {
        let data = {
            password: bcrypt.hashSync(password, saltRounds),
        };
        return await ItemsModel.updateOne({ _id: id }, data);
    },
}