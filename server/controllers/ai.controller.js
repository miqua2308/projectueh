export class AiController {
  constructor(aiAdvisorService) {
    this.aiService = aiAdvisorService;
  }

  getSuggestions = async (req, res, next) => {
    try {
      const month = req.query.month || new Date().toISOString().substring(0, 7);
      const suggestions = await this.aiService.getSuggestions(month);
      res.json({ success: true, data: suggestions });
    } catch (err) {
      next(err);
    }
  };
}
