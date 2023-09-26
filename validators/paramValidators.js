module.exports = {
  validateParams: (req, res, next) => {
    const {number, text, path} = req.body;
    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }
    if (!text && !path) {
      return res.status(400).json({
        success: false,
        message: "Either text or path is required.",
      });
    }
    next();
  }
}
