// Node.js version of the provided PHP Database class using mysql2/promise

const mysql = require('mysql2/promise');

// Database configuration
const DB_SERVER = "sql8.freesqldatabase.com";
const DB_USERNAME = "sql8794565";
const DB_PASSWORD = "xpw1fvexwS";
const DB_NAME = "sql8794565";

// Helper function for escaping/validating input (mimics PHP's htmlspecialchars/trim/stripslashes)
function validate(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\\/g, '') // remove backslashes (stripslashes)
    .trim();
}

// Password hashing (mimics PHP hash_hmac('sha256', $password, 'iqbolshoh'))
const crypto = require('crypto');
function hashPassword(password) {
  return crypto.createHmac('sha256', password, 'iqbolshoh').digest('hex');
}

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: DB_SERVER,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  // Execute prepared statement with parameters
  async executeQuery(sql, params = []) {
    try {
      const [rows, fields] = await this.pool.execute(sql, params);
      return rows;
    } catch (err) {
      return `SQL/Execution error: ${err.message}`;
    }
  }

  // Validation utility
  validate(value) {
    return validate(value);
  }

  // SELECT
  async select(table, columns = "*", condition = "", params = []) {
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    const sql = `SELECT ${cols} FROM \`${table}\`` + (condition ? ` WHERE ${condition}` : "");
    return await this.executeQuery(sql, params);
  }

  // INSERT
  async insert(table, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO \`${table}\` (${keys.join(", ")}) VALUES (${placeholders})`;
    const params = Object.values(data);
    const result = await this.pool.execute(sql, params).catch(err => ({ insertId: null, error: err }));
    if (result.error) return `SQL/Execution error: ${result.error.message}`;
    const [insertResult] = result;
    return insertResult.insertId;
  }

  // UPDATE
  async update(table, data, condition = "", params = []) {
    const set = Object.keys(data).map(k => `\`${k}\` = ?`).join(", ");
    const sql = `UPDATE \`${table}\` SET ${set}` + (condition ? ` WHERE ${condition}` : "");
    const allParams = [...Object.values(data), ...params];
    const [result] = await this.pool.execute(sql, allParams).catch(err => [{ affectedRows: 0, error: err }]);
    if (result.error) return `SQL/Execution error: ${result.error.message}`;
    return result.affectedRows;
  }

  // DELETE
  async delete(table, condition = "", params = []) {
    const sql = `DELETE FROM \`${table}\`` + (condition ? ` WHERE ${condition}` : "");
    const [result] = await this.pool.execute(sql, params).catch(err => [{ affectedRows: 0, error: err }]);
    if (result.error) return `SQL/Execution error: ${result.error.message}`;
    return result.affectedRows;
  }

  // Password hash
  hashPassword(password) {
    return hashPassword(password);
  }
}

// Export for use elsewhere
module.exports = Database;
