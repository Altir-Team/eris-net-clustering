const arrayFromNum = (num) => new Array(num).fill(0).map((_, i) => i);

const batchArray = (array, size = 2) => {
    const newArr = [];
    for (let i = 0; i < array.length; i += size) {
        newArr.push(array.slice(i, i + size));
    }
    return newArr;
}

module.exports = {
	arrayFromNum,
	batchArray
};