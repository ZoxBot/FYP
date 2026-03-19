const { z } = require("zod");
 
const reviewSchema = z.object({
    body: z.object({
        job_id: z.preprocess((val) => Number(val), z.number().int().positive("Invalid Job ID")),
        rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
        comment: z.string().max(1000, "Comment too long").optional(),
    }),
});
 
module.exports = {
    reviewSchema
};
