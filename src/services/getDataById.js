// services/getDataById.js
const db = require('../db');

const getDataById = (id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM registration WHERE idRegistration = ?';

        db.get(query, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

module.exports = getDataById;
