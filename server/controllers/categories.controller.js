export class CategoriesController {
  constructor(categoryRepo) {
    this.repo = categoryRepo;
  }

  getAll = (req, res, next) => {
    try {
      const categories = this.repo.findAll();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  };
}
