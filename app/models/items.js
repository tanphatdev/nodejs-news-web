const ItemsModel = require(__path_schemas + 'items');

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
        return await ItemsModel.findById(id);
    },
    changeStatus: async (id, currentStatus, options = null) => {
        let status = (currentStatus == "active") ? "inactive" : "active";
        let data = {
            modified: {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            }
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
    changeOrdering: async (cids, orderings, options = null) => {
        let data = {
            modified: {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            }
        }
        if (Array.isArray(cids)) {
            for (let i in cids) {
                data.ordering = parseInt(orderings[i]);
                await ItemsModel.updateOne({ _id: cids[i] }, data);
            }
            return
        } else {
            data.ordering = parseInt(orderings);
            await ItemsModel.updateOne({ _id: cids }, data);
            return
        }
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
            item.created = {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            };
            item.modified = {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            };
            return await ItemsModel.create(item);
        }

        if (options.task == "edit") {
            item.modified = {
                user_id: 0,
                user_name: "admin",
                time: Date.now()
            };
            return await ItemsModel.updateOne({ _id: id }, item);
        }
    },
}