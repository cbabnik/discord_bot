// scan.js
// As commands get more numerous complicated scan.js should be changed to match text to commands more efficiently.

const Scanner = () => {
    const regexList = [];

    const addCommand = (regex, id) => {
        regexList.push({regex, id});
    };

    const scan = text => {
        for (let i=0; i<regexList.length; i+=1) {
            if (text.match(regexList[i].regex) !== null) {
                return regexList[i]
            }
        }
        return null
    };

    return {
        addCommand,
        scan
    };
};

module.exports = { Scanner };