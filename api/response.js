// method to call when returning success
exports.success = (res, data, statusCode) => {
  res.statusCode = statusCode;
  res.json(data);
}

// method to call when returning error
exports.error = (res, message, statusCode) => {
  res.statusCode = statusCode;
  res.json({ message });
}