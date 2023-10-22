const ObjectId = require("mongoose").Types.ObjectId;
const randomstring = require("randomstring");

const ItemsModel = require(__path_schemas + 'articles');
const CategoryModel = require(__path_schemas + 'category');
const FileHelpers = require(__path_helpers + 'file');

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
    changeSpecial: async (id, currentSpecial, user, options = null) => {
        let special = (currentSpecial == "active") ? "inactive" : "active";
        let data = {
            modified: {
                user_id: user.id,
                user_name: user.name,
                time: Date.now()
            }
        }

        if (options.task == "update-one") {
            data.special = special;
            return await ItemsModel.updateOne({ _id: id }, data);
        }

        if (options.task == "update-multi") {
            data.special = currentSpecial;
            return await ItemsModel.updateMany({ _id: { $in: id } }, data);
        }
    },
    changeCategory: async (category_id, category_name, options = null) => {
        return await ItemsModel.updateMany(
            { 'category.id': { $in: category_id } },
            { 'category.name': category_name },
        );
    },
    deleteItem: async (id, options = null) => {
        if (options.task == "delete-one") {
            let item = await ItemsModel.findById(id).select('thumb');

            await ItemsModel.deleteOne({ _id: id });

            FileHelpers.remove('public/uploads/articles/', item.thumb);

            return
        }

        if (options.task == "delete-multi") {
            if (Array.isArray(id)) {
                for (let i = 0; i < id.length; i++) {
                    let item = await ItemsModel.findById(id[i]).select('thumb');
                    FileHelpers.remove('public/uploads/articles/', item.thumb);
                }
            } else {
                let item = await ItemsModel.findById(id).select('thumb');
                FileHelpers.remove('public/uploads/articles/', item.thumb);
            }

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
        if (options.task == 'items-special') {
            return await ItemsModel
                .find({ status: 'active', special: 'active' })
                .select('id slug name category.name thumb created.user_name created.time')
                .limit(3)
                .sort({ ordering: 'asc' })
        }

        if (options.task == 'items-news') {
            return await ItemsModel
                .find({ status: 'active' })
                .select('id slug name category.name thumb content created.user_name created.time')
                .limit(3)
                .sort({ 'created.time': 'desc' })
        }

        if (options.task == 'items-in-category') {
            let category = await CategoryModel.findOne({ slug: params.slug }).select('_id');
            let categoryId = ''
            if (category && category.id) categoryId = category.id;

            return await ItemsModel
                .find({ 'category.id': categoryId, status: 'active', })
                .select('id slug name category.name thumb content created.user_name created.time')
                .sort({ 'created.time': 'desc' })
        }

        if (options.task == 'items-random') {
            return await ItemsModel.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $project: { _id: 1, slug: 1, name: 1, thumb: 1, 'created.time': 1 },
                },
                {
                    $sample: { size: 3 }
                }
            ]);
        }

        if (options.task == 'items-others') {
            let _id = new ObjectId(params.articleId);
            return await ItemsModel.aggregate([
                {
                    $match: { _id: { $ne: _id }, status: 'active', 'category.id': params.categoryId }
                },
                {
                    $project: { _id: 1, slug: 1, name: 1, 'category.name': 1, thumb: 1, content: 1, 'created.user_name': 1, 'created.time': 1 },
                },
                {
                    $sample: { size: 2 }
                }
            ]);
        }
    },
    getItemFrontend: async (id, options = null) => {
        if (ObjectId.isValid(id)) {
            return await ItemsModel
                .findOne({ _id: id })
                .select('thumb category.name created.user_name created.time name content category.id');
        }
        else {
            return null;
        }
    },
    getItemFrontendBySlug: async (slug, options = null) => {
        try {
            let article = await ItemsModel.findOne({ slug }).select('thumb category.name created.user_name created.time name content category.id');
            return article;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}