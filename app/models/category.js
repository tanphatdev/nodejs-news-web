const ObjectId = require("mongoose").Types.ObjectId;
const randomstring = require("randomstring");

const ItemsModel = require(__path_schemas + 'category');

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
    getItemBySlug: async (slug, options = null) => {
        return await ItemsModel.findOne({ slug });
    },
    listItemsInSelectBox: async (options = null) => {
        return await ItemsModel.find({ status: 'active' }).select('_id name');
    },
    changeStatus: async (id, currentStatus, user, options = null) => {
        let status = (currentStatus == "active") ? "inactive" : "active";
        let data = {
            modified: {
                user_id: user.id,
                user_name: user.name,
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
    changeOrdering: async (cids, orderings, user, options = null) => {
        let data = {
            modified: {
                user_id: user.id,
                user_name: user.name,
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
    saveItem: async (id, item, user, options = null) => {
        if (options.task == "add") {
            item.created = {
                user_id: user.id,
                user_name: user.name,
                time: Date.now()
            };
            item.modified = {
                user_id: user.id,
                user_name: user.name,
                time: Date.now()
            };

            let slug = await ItemsModel.findOne({ slug: item.slug });
            if (slug) item.slug = item.slug + '-' + randomstring.generate(6);

            return await ItemsModel.create(item);
        }

        if (options.task == "edit") {
            item.modified = {
                user_id: user.id,
                user_name: user.name,
                time: Date.now()
            };

            let { slug } = await ItemsModel.findById(id);
            item.slug = slug;
            return await ItemsModel.updateOne({ _id: id }, item);
        }
    },
    listItemFrontend: async (params = null, options = null) => {
        if (options.task == 'items-in-menu') {
            return await ItemsModel
                .find({ status: 'active' })
                .select('_id name slug')
                .sort({ ordering: 'asc' })
        }
    },
}