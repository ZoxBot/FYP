const { doubleCsrf } = require("csrf-csrf");

const doubleCsrfOptions = {
  getSecret: (req) => req.user?.id || "fallback-secret-for-guests", // A secret from request
  cookieName: "_csrf", // The name of the cookie to store the secret
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    signed: false, // Ensure we are NOT using signed cookies to avoid req.secret requirement
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"], // Methods to ignore CSRF protection
  getTokenFromRequest: (req) => req.headers["x-csrf-token"], // How to get the token from the request
};

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection: originalProtection,
} = doubleCsrf(doubleCsrfOptions);

const doubleCsrfProtection = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return originalProtection(req, res, next);
};

module.exports = {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
};
