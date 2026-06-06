# DevConnect Deployment Guide

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add your Render IP access rule or use `0.0.0.0/0` for a demo project.
4. Copy the connection string into `MONGO_URI`.

## 2. Cloudinary

1. Create a Cloudinary account.
2. Copy cloud name, API key, and API secret.
3. Add them to the Render backend environment variables.

## 3. Google OAuth

1. Create OAuth credentials in Google Cloud Console.
2. Add your Vercel frontend URL to authorized JavaScript origins.
3. Add the client ID to both backend and frontend environment variables.

## 4. Backend on Render

Create a Web Service with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 5. Frontend on Vercel

Import the repository and configure:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables:

```env
VITE_API_URL=https://your-render-api.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 6. Final Checks

- Register a user.
- Publish a post with a cover image.
- Edit the profile and upload an avatar.
- Like and comment on a post.
- Confirm dashboard counts update.
- Use the Sample Data button once if the production database starts empty.
- Promote an admin manually in MongoDB by setting `role` to `admin`.
- Confirm admin dashboard loads.
