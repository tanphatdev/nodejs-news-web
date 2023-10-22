const ObjectId = require("mongoose").Types.ObjectId;

const ItemsModel = require(__path_schemas + 'groups');

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
    listItemsInSelectBox: async (options = null) => {
        return await ItemsModel.find().select('_id name');
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
    changeGroupACP: async (id, currentGroupACP, options = null) => {
        let groupACP = (currentGroupACP == "yes") ? "no" : "yes";
        let data = {
            group_acp: groupACP,
            modified: Date.now(),
        }

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
            item.created = Date.now();
            item.modified = Date.now();
            return await ItemsModel.create(item);
        }

        if (options.task == "edit") {
            item.modified = Date.now();
            return await ItemsModel.updateOne({ _id: id }, item);
        }
    },
}