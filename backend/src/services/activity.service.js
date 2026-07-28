const { Activity } = require('../models/Activity');

async function logActivity(payload) {
  return Activity.create(payload);
}

module.exports = { logActivity };