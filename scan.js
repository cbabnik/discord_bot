// scan.js
// As commands get more numerous complicated scan.js should be changed to match text to commands more efficiently.

const Scanner = () => {
    const regexList = [];

    const addCommand = (regex, id) => {
        regexList.push({regex, id});
    };

    const scan = text => regexList.filter(
        elem => text.match(elem.regex) !== null
    ).map(
        elem => elem.id
    );

    return {
        addCommand,
        scan
    };
};

module.exports = { Scanner };