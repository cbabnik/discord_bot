const { BUCKS } = require( 'constants' );
const archiver = require('archiver');
const fs = require('fs');
const debug = require( 'debug' )( 'basic' );

exports.backupOnRepeat = () => {
    backup();
    setInterval(() => {
        backup();
    }, 3600000); // one hour hard coded)
};

const backup = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
    const fileName = `backups/backup_${dateStr}.zip`;

    const output = fs.createWriteStream(fileName);
    const archive = archiver('zip');

    archive.directory('storage/').pipe(output);
    archive.finalize();
    debug('Data Backed up!')
};
exports.backup = backup;
