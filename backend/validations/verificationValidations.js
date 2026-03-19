const { z } = require("zod");
 
const reviewVerificationSchema = z.object({
    body: z.object({
        action: z.enum(['approve', 'reject'], {
            errorMap: () => ({ message: "Action must be either 'approve' or 'reject'" })
        }),
    }),
});
 
module.exports = {
    reviewVerificationSchema
};
