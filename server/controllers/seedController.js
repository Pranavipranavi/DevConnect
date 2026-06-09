import asyncHandler from '../utils/asyncHandler.js';
import { seedDemoContent } from '../services/seedService.js';

export const seedDemo = asyncHandler(async (req, res) => {
  const result = await seedDemoContent({ reset: req.query.reset === 'true' });
  res.status(result.created ? 201 : 200).json({
    message: result.created ? 'Sample data generated successfully' : 'Sample data already exists',
    ...result
  });
});
