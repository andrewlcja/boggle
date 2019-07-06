// node modules
const Joi = require('@hapi/joi');

// use joi library to define request schemas
exports.createGameSchema = {
  duration: Joi.number().integer().min(1).required(),
  random: Joi.boolean().required(),
  board: Joi.string().trim()
}

exports.updateGameSchema = {
  token: Joi.string().trim().required(),
  word: Joi.string().trim().required()
}

exports.validateRequest = (body, schema) => {
  // validate incoming request against schema & strip away extra fields if any
  return Joi.validate(body, Joi.object().keys(schema), { stripUnknown: true });
}