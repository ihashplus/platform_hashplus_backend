# HashPlus Platform Backend

Welcome to the backend repository for the **HashPlus Platform**. This is a comprehensive Node.js and Express.js REST API designed to power an e-learning and subscription-based platform. It features robust authentication, course and bootcamp management, a payment system with Moyasar, file uploads to Cloudflare R2, and caching using Redis.

## 🚀 Technologies Used

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Caching & Rate Limiting:** Redis (ioredis) & Upstash Redis
- **Authentication:** JWT (Access & Refresh tokens) & Google OAuth
- **File Storage:** Cloudflare R2 (S3 Compatible API via AWS SDK)
- **Payments Processing:** Moyasar (with Webhooks integration)
- **Security:** Helmet, CORS, XSS filtering, Express Rate Limit
- **Validation:** Zod
- **Mailing:** Nodemailer
- **Background Jobs:** Node-Cron

## 📁 Project Structure

The project follows a standard MVC-inspired architecture for Express applications.

```
src/
├── app.js               # Express app setup and middleware configuration
├── config/              # Environment variables and database connection configs
├── controllers/         # Route handlers containing business logic
├── cron/                # Scheduled cron jobs (e.g., subscription resets)
├── middleware/          # Custom middlewares (auth, error handling, rate limiting)
├── models/              # Mongoose database schemas
├── routes/              # Express API routes
├── services/            # Reusable business logic and external services
├── utils/               # Helper functions and utilities (API errors, response handlers)
└── validators/          # Zod validation schemas for requests
```

## ✨ Core Features

- **Authentication & Authorization:** Secure login/registration via JWT and Google OAuth. Role-based access control.
- **E-Learning Management:** Extensive models and routes for Categories, Bootcamps, Courses, Content, Submissions, and Reviews.
- **E-Commerce & Subscriptions:** Full cart system, coupon management with usage tracking, payment gateway integration via Moyasar, and recurring subscription plans.
- **Media Uploads:** Secure file and video streaming management utilizing Cloudflare R2 with presigned URLs for private and public buckets.
- **Analytics & Dashboard:** Specialized endpoints for administrative and user dashboards.
- **Automated Tasks:** Daily background tasks (like resetting subscriptions) managed via `node-cron`.

## ⚙️ Environment Variables

To run this project locally, create a `.env` file in the root directory and add the following variables:

```env
# Server
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_URL=your_redis_connection_url
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token

# JWT
JWT_ACCESS_SECRET_KEY=your_access_secret
JWT_REFRESH_SECRET_KEY=your_refresh_secret
JWT_ACCESS_EXPIRE_TIME=1d
JWT_REFRESH_EXPIRE_TIME=30d

# Emails (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudflare R2 (Private & Public Buckets)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET=your_private_bucket_name
R2_PUBLIC_ACCESS_KEY_ID=your_r2_public_access_key
R2_PUBLIC_SECRET_ACCESS_KEY=your_r2_public_secret_key
R2_BUCKET_PUBLIC=your_public_bucket_name
R2_PUBLIC_DOMAIN=your_public_r2_dev_domain
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token

# Moyasar (Payments)
MOYASAR_SECRET_KEY=sk_test_your_key
MOYASAR_WEBHOOK_SECRET=your_webhook_secret
```

## 🛠️ Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository_url>
   cd platform_hashplus_backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *This uses `nodemon` to automatically restart the server on code changes.*

4. **Start the production server:**
   ```bash
   npm start
   ```
   *This uses Node's native `--watch` flag as defined in `package.json`.*

## 🔗 API Documentation

*API endpoints are generally grouped under `/api/v1/`.*

### Main Endpoints Overview
- `/api/auth` - Authentication & user registration
- `/api/users` - User management
- `/api/profile` - User profile updates
- `/api/categories` - Categories for courses/bootcamps
- `/api/courses` - Course operations
- `/api/bootcamps` - Bootcamp operations
- `/api/content` - Course/Bootcamp content modules
- `/api/enrollments` - Enrollments management
- `/api/cart` - User cart system
- `/api/coupons` - Coupon validation and management
- `/api/subscriptions` - Subscription plans
- `/api/payments` - Payment processing
- `/api/reviews` - Reviews and ratings
- `/api/submissions` - Assignment/Quiz submissions
- `/api/upload` - Secure file upload handlers
- `/api/dashboard` - Dashboard analytics
- `/webhook/moyasar` - Public webhook listener for Moyasar payment status

## 🛡️ Security Measures
- **Helmet:** Sets various HTTP headers to help protect the app.
- **Express Rate Limit:** Protects APIs against brute-force attacks.
- **XSS-Clean:** Sanitizes user input to prevent Cross-Site Scripting.
- **CORS:** Configured to strictly accept requests from the designated `CLIENT_URL`.

## 📜 License
ISC License
