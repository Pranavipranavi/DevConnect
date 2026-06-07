# DevConnect

DevConnect is a premium MERN Stack developer blogging platform inspired by Dev.to, Medium, and modern SaaS dashboards.

**Tagline:** Share Knowledge. Build Reputation. Grow Together.

Test commit from Sunny
## Features

- JWT authentication with register, login, logout, persistent login, and protected routes
- Google OAuth login endpoint and frontend integration
- Role-based access for guest, user, and admin
- Rich text blog editor with draft saving and publishing
- Auto-generated slugs, reading time, view counter, tags, categories, and cover uploads
- Likes, comments, and comment moderation
- Bookmarks for saving posts to the dashboard
- One-click sample data generation for demos and empty databases
- User profiles with avatar upload, bio, social links, author stats, and published posts
- Global search by title, category, tag, and author with latest, popular, viewed, and liked filters
- User dashboard for blogs, drafts, published posts, and analytics
- Admin dashboard for users, totals, and moderation
- Dark mode, responsive navigation, loading states, empty states, toasts, and page transitions
- Secure Express API with Helmet, CORS, rate limiting, input validation, sanitization, bcrypt, and JWT
- Cloudinary image storage and MongoDB Atlas-ready models

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios, React Quill, Lucide React, Framer Motion, React Hot Toast, Context API  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Google Auth Library, Cloudinary, Multer  
**Deployment:** Vercel frontend, Render backend, MongoDB Atlas database, Cloudinary storage

## Screenshots

Add screenshots after running the app locally or deploying:

- Homepage
- Blog Details
- Editor
- Dashboard
- Admin Dashboard
- Profile

## Folder Structure

```text
devconnect/
  client/
    src/
      components/
      context/
      hooks/
      layouts/
      pages/
      services/
      styles/
      utils/
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
```

## Installation

1. Install the root tooling:

```bash
npm install
```

2. Install client and server dependencies:

```bash
npm run install:all
```

3. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Fill in MongoDB Atlas, JWT, Google OAuth, and Cloudinary credentials.

5. Start both apps:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`. Backend runs on `http://localhost:5000`.

## Environment Variables

### Server

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devconnect
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Client

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Users

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/dashboard`
- `GET /api/users/:id`

### Blog

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

### Comments

- `POST /api/comments`
- `GET /api/comments/:postId`
- `DELETE /api/comments/:id`

### Likes

- `POST /api/likes/:postId`

### Bookmarks

- `GET /api/bookmarks`
- `POST /api/bookmarks/:postId`

### Seed

- `POST /api/seed/demo`
- `POST /api/seed/demo?reset=true`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/analytics`
- `DELETE /api/admin/user/:id`
- `DELETE /api/admin/post/:id`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel, Render, MongoDB Atlas, and Cloudinary setup.
