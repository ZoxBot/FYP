const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary will automatically pick up the CLOUDINARY_URL from the .env file

const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const verificationStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/verification',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    },
});

const ticketStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/tickets',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const portfolioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/portfolio',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const submissionStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/submissions',
        // Allow common document and image formats, or use auto for loose restrictions
        resource_type: 'auto',
    },
});

const chatStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kaamko-kura/chat',
        // Support images, docs, and zip files
        resource_type: 'auto',
    },
});

module.exports = { cloudinary, avatarStorage, verificationStorage, ticketStorage, portfolioStorage, submissionStorage, chatStorage };
