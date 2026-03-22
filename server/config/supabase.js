const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer the powerful Service Role Key for the backend to bypass RLS, fallback to the anon key
const supabaseKey = process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_KEY !== 'your_service_role_key_here' 
    ? process.env.SUPABASE_SERVICE_KEY 
    : process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const bucketName = process.env.SUPABASE_BUCKET || 'elevare';

/**
 * Uploads a file to Supabase Storage
 * @param {string} filePath - Local path to the file
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 */
const uploadToSupabase = async (filePath, originalName, mimeType) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        // Ensure unique filename to avoid overwrites
        const uniqueFileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uniqueFileName, fileContent, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            throw error;
        }

        return data.path;
    } catch (err) {
        throw new Error('Failed to upload to Supabase: ' + err.message);
    }
};

/**
 * Streams a file from Supabase
 * @param {string} fileId - Path of the file in Supabase
 * @param {express.Response} res - Express response object
 */
const streamFromSupabase = async (fileId, res) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .download(fileId);

        if (error) throw error;
        
        const buffer = await data.arrayBuffer();
        
        if (data.type) {
            res.set('Content-Type', data.type);
        }
        res.end(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        res.status(404).json({ message: 'File not found on Supabase' });
    }
};

/**
 * Downloads a file from Supabase to a local path (for OCR/processing)
 * @param {string} fileId - Path of the file in Supabase
 * @param {string} destPath - Local path to save the file
 */
const downloadFromSupabase = async (fileId, destPath) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .download(fileId);
            
        if (error) throw error;
        
        const buffer = Buffer.from(await data.arrayBuffer());
        fs.writeFileSync(destPath, buffer);
        return destPath;
    } catch (err) {
        throw new Error('Failed to download from Supabase: ' + err.message);
    }
};

/**
 * Deletes a file from Supabase
 * @param {string} fileId - Path of the file to delete
 */
const deleteFromSupabase = async (fileId) => {
    try {
        if (!fileId) return;
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileId]);
            
        if (error) throw error;
    } catch (err) {
        console.error(`Failed to delete file ${fileId} from Supabase:`, err.message);
    }
};

module.exports = {
    uploadToSupabase,
    streamFromSupabase,
    downloadFromSupabase,
    deleteFromSupabase
};
