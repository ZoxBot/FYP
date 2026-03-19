const { z } = require("zod");
 
const messageSchema = z.object({
    body: z.object({
        message: z.string().max(2000, "Message too long").optional(),
        attachment_url: z.string().url().optional(),
        attachment_type: z.string().optional(),
    }).refine(data => data.message || data.attachment_url, {
        message: "Either message or attachment must be provided",
        path: ["message"]
    }),
    params: z.object({
        taskId: z.preprocess((val) => Number(val), z.number().int().positive("Invalid Task ID")),
    }),
});
 
module.exports = {
    messageSchema
};
