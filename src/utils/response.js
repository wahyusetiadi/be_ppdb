function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
  
  function sendError(res, message = 'Internal Server Error', statusCode = 500, error = null) {
    res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  }
  
  module.exports = {
    sendSuccess,
    sendError,
  };
  