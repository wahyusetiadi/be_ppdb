const db = require('../db');

/**
 * Get registration data by ID
 * @param {number|string} id - Registration ID
 * @returns {Promise<Object|null>} - Registration data or null if not found
 */
const getDataById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM registration WHERE idRegistration = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error in getDataById:', error);
    throw error;
  }
};

module.exports = getDataById;