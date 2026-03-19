const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

async function runTest() {
    console.log("Cloudinary Deletion Test");

    // NOTE: Replace this with a real URL from your Cloudinary to manually test if needed.
    // This is just a placeholder to show how it's called.
    const testUrl = "https://res.cloudinary.com/dummy/image/upload/v12345/kaamko-kura/avatars/test_id.jpg";

    console.log(`Attempting to delete: ${testUrl}`);
    const result = await deleteFromCloudinary(testUrl);

    console.log("Test execution finished.");
}

runTest();
