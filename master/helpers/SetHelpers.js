const find = (set, func) => {
    for (const item of set) {
        if (func(item)) return item;
    }
}

module.exports = {
	find
};