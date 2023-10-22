let createFilterStatus = async (currentStatus, collection) => {
    const currentModel = require(__path_schemas + collection);

    let statusFilter = [
        { name: 'All', value: 'all', count: 0, link: '#', class: 'default' },
        { name: 'Active', value: 'active', count: 0, link: '#', class: 'default' },
        { name: 'Inactive', value: 'inactive', count: 0, link: '#', class: 'default' },
    ]
    statusFilter = await Promise.all(statusFilter.map(async (item) => {
        if (item.value === currentStatus) item.class = 'success';
        let condition = {};
        if (item.value !== "all") condition = { status: item.value };
        let itemCount = await currentModel.count(condition);
        item.count = itemCount;
        return item;
    }))

    return statusFilter;
}

module.exports = {
    createFilterStatus,
}
