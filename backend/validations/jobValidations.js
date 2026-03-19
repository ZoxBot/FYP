const { z } = require("zod");
 
const bidSchema = z.object({
    body: z.object({
        amount: z.preprocess((val) => Number(val), z.number().positive("Amount must be a positive number")),
        proposal: z.string().min(10, "Proposal must be at least 10 characters").max(2000, "Proposal too long"),
    }),
});
 
const disputeSchema = z.object({
    body: z.object({
        reason: z.string().min(10, "Reason must be at least 10 characters").max(1000, "Reason too long"),
    }),
});
 
module.exports = {
    bidSchema,
    disputeSchema
};
