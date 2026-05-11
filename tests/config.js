/**
 * Test Configuration
 * Update BASE_URL to point to your running backend server.
 * If using ngrok, set it to your ngrok URL.
 */
const CONFIG = {
  BASE_URL: process.env.API_URL || "http://localhost:5000/api",
  ADMIN_EMAIL: "admin@examduty.com",
  ADMIN_PASSWORD: "admin123",
};

module.exports = CONFIG;
