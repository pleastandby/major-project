const mongoose = require('mongoose');

let gfsBucket;

const initGridFS = (conn) => {
    gfsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
        bucketName: 'uploads'
    });
    console.log('GridFS Initialized');
};

const getGridFSBucket = () => {
    return gfsBucket;
};

// Custom Storage Engine for Multer targeting GridFS
function CustomGridFSStorage() {}

CustomGridFSStorage.prototype._handleFile = function _handleFile(req, file, cb) {
    if (!gfsBucket) {
        return cb(new Error('GridFSBucket not initialized yet.'));
    }

    let prefix = 'file';
    if (req.user && req.user.id) {
        prefix += '-' + req.user.id;
    }
    
    const filename = prefix + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname.replace(/\s/g, '_');

    const uploadStream = gfsBucket.openUploadStream(filename, {
        contentType: file.mimetype
    });

    file.stream.pipe(uploadStream);

    uploadStream.on('error', cb);
    uploadStream.on('finish', () => {
        cb(null, {
            filename: filename,
            id: uploadStream.id,
            bucketName: 'uploads'
        });
    });
};

CustomGridFSStorage.prototype._removeFile = function _removeFile(req, file, cb) {
    if (gfsBucket && file.id) {
        gfsBucket.delete(file.id).then(() => cb(null)).catch(cb);
    } else {
        cb(null);
    }
};

const storage = new CustomGridFSStorage();

module.exports = { storage, initGridFS, getGridFSBucket };
