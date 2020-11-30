// scan.js
// As commands get more numerous complicated scan.js should be changed to match text to commands more efficiently.

const Scanner = () => {
    const regexList = [];

    const addRegex = ( regex, id ) => {
        regexList.push( {regex, id} );
    };

    const scan = text => {
        for ( let i=0; i<regexList.length; i+=1 ) {
            if ( text.match( regexList[i].regex ) !== null ) {
                return regexList[i].id;
            }
        }
        return null;
    };

    const multiScan = text => {
        // this can be done in parallel
        const matches = [];
        for ( let i=0; i<regexList.length; i+=1 ) {
            if ( text.match( regexList[i].regex ) !== null ) {
                matches.push( regexList[i].id );
            }
        }
        return matches;
    };

    return {
        addRegex,
        scan,
        multiScan
    };
};

module.exports = { Scanner };
