const crypto = require('crypto');

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const header = { alg: "HS256", typ: "JWT" };
const payload = {
  iss: "supabase",
  role: "anon",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 // 1 year
};

const secret = "bifrost_secret_key_1234567890_super_secret";

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));

const signature = crypto
  .createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
console.log(jwt);
