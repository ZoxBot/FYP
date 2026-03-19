const { cloudinary } = require('../cloudinary');

/**
 * Extracts the public ID from a Cloudinary URL and deletes the file.
 * @param {string} fileUrl - The full Cloudinary URL.
 */
async function deleteFromCloudinary(fileUrl) {
    if (!fileUrl) return;

    try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v12345678/kaamko-kura/avatars/abc123.jpg
        // Public ID would be: kaamko-kura/avatars/abc123

        const parts = fileUrl.split('/');
        const fileNameWithExtension = parts.pop();
        const publicIdWithFolders = parts.slice(parts.indexOf('kaamko-kura')).join('/') + '/' + fileNameWithExtension.split('.')[0];

        console.log(`Deleting from Cloudinary: ${publicIdWithFolders}`);
        const result = await cloudinary.uploader.destroy(publicIdWithFolders);
        console.log('Cloudinary deletion result:', result);
        return result;
    } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
    }
}

module.exports = { deleteFromCloudinary };
