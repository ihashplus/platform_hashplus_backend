import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5050;
const CLIENT_URL = process.env.CLIENT_URL || "*";

const MONGODB_URI = process.env.MONGODB_URI || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY || "";
const JWT_ACCESS_EXPIRE_TIME = process.env.JWT_ACCESS_EXPIRE_TIME || "";
const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || "";
const JWT_REFRESH_EXPIRE_TIME = process.env.JWT_REFRESH_EXPIRE_TIME || "";

const EMAIL_HOST = process.env.EMAIL_HOST || "";
const EMAIL_PORT = process.env.EMAIL_PORT || "";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_BUCKET = process.env.R2_BUCKET || "";
const R2_PUBLIC_ACCESS_KEY_ID = process.env.R2_PUBLIC_ACCESS_KEY_ID || "";
const R2_PUBLIC_SECRET_ACCESS_KEY =
  process.env.R2_PUBLIC_SECRET_ACCESS_KEY || "";

const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC || "";

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY || "";
const MOYASAR_WEBHOOK_SECRET = process.env.MOYASAR_WEBHOOK_SECRET || "";

if (NODE_ENV === "production") {
  if (!CLIENT_URL) {
    throw new Error("CLIENT_URL must be set in production");
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set in production");
  }

  if (!JWT_ACCESS_SECRET_KEY) {
    throw new Error("JWT_ACCESS_SECRET_KEY must be set in production");
  }

  if (!JWT_ACCESS_EXPIRE_TIME) {
    throw new Error("JWT_ACCESS_EXPIRE_TIME must be set in production");
  }

  if (!JWT_REFRESH_SECRET_KEY) {
    throw new Error("JWT_REFRESH_SECRET_KEY must be set in production");
  }

  if (!JWT_REFRESH_EXPIRE_TIME) {
    throw new Error("JWT_REFRESH_EXPIRE_TIME must be set in production");
  }

  if (!EMAIL_HOST) {
    throw new Error("EMAIL_HOST must be set in production");
  }

  if (!EMAIL_PORT) {
    throw new Error("EMAIL_PORT must be set in production");
  }

  if (!EMAIL_USER) {
    throw new Error("EMAIL_USER must be set in production");
  }

  if (!EMAIL_PASSWORD) {
    throw new Error("EMAIL_PASSWORD must be set in production");
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID must be set in production");
  }

  if (!R2_ACCESS_KEY_ID) {
    throw new Error("R2_ACCESS_KEY_ID must be set in production");
  }

  if (!R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_SECRET_ACCESS_KEY must be set in production");
  }

  if (!R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT must be set in production");
  }

  if (!R2_BUCKET) {
    throw new Error("R2_BUCKET must be set in production");
  }

  if (!R2_BUCKET_PUBLIC) {
    throw new Error("R2_BUCKET_PUBLIC must be set in production");
  }

  if (!MOYASAR_SECRET_KEY) {
    throw new Error("MOYASAR_SECRET_KEY must be set in production");
  }

  if (!MOYASAR_WEBHOOK_SECRET) {
    throw new Error("MOYASAR_WEBHOOK_SECRET must be set in production");
  }
}

export {
  PORT,
  CLIENT_URL,
  MONGODB_URI,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_URL,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  NODE_ENV,
  JWT_ACCESS_SECRET_KEY,
  JWT_ACCESS_EXPIRE_TIME,
  JWT_REFRESH_SECRET_KEY,
  JWT_REFRESH_EXPIRE_TIME,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  GOOGLE_CLIENT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_BUCKET_PUBLIC,
  R2_PUBLIC_ACCESS_KEY_ID,
  R2_PUBLIC_SECRET_ACCESS_KEY,
  MOYASAR_SECRET_KEY,
  MOYASAR_WEBHOOK_SECRET,
};
