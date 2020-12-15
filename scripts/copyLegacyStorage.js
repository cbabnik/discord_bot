var args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Must give the path from and path to")
    process.exit(1)
}
if (args.length === 1) {
    const arg = args[0]
    args = [
        `legacy/storage/beta/${arg}.json`,
        `storage/beta/${arg}`,
    ]
}
if (args.length > 2) {
    console.log("One argument only please")
    process.exit(1)
}
console.log(`Executing with args: ${args}`)

const persist = require('node-persist')
let json = require( `../${args[0]}` );

storage = persist.create( {dir: args[1] } );


(async () => {
    await storage.init();
    
    Object.keys(json).forEach(async (k) => {
        await storage.setItem(k, json[k])
        console.log(`set ${k}`)
    });
})();
