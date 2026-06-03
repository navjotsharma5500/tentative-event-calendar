# 📅 Tentative Event Calendar

A standalone production-ready event calendar for **Thapar Institute of Engineering & Technology**.

Built with React + Vite + TailwindCSS (frontend) and Node.js + Express + MongoDB Atlas (backend).

---

## 🗂️ Project Structure

```
tentative-event-calendar/
├── backend/           ← Node.js + Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
└── frontend/          ← React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## ⚡ Local Development Setup

### Step 1: Clone / Download the project

```bash
# If from git:
git clone <your-repo-url>
cd tentative-event-calendar
```

### Step 2: Set up the Backend

```bash
cd backend
npm install
```

Create `.env` file (copy from example):

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tentative-events?retryWrites=true&w=majority
ADMIN_PASSWORD=thapar2026
FRONTEND_URL=http://localhost:5173
```

> 💡 Replace `MONGODB_URI` with your actual MongoDB Atlas connection string.

Start the backend:

```bash
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### Step 3: Set up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🌐 Pages

| Route    | Description              |
|----------|--------------------------|
| `/`      | Public calendar view     |
| `/admin` | Admin dashboard (password-protected) |

**Default admin password:** `thapar2026` (set in `.env`)

---

## 📦 Excel Import

1. Go to `/admin` and log in
2. Click **Download Template** to get the Excel template
3. Fill in the template with event data:
   - Required: Society, Event, Start Date, Start Time, End Date, End Time, Venue
   - Optional: Description
4. Click **Import Excel** and upload the filled file

**Date format:** `YYYY-MM-DD`  
**Time format:** `HH:MM` (24-hour)

---

## 🔄 Conflict Detection

Conflicts are automatically detected when:
- Two events share the **same venue**
- Their **date/time ranges overlap**

Conflicting events are marked with:
- 🔴 Red dot on the calendar
- ⚠️ Conflict badge on event cards
- Red border on event cards

---

## 🚀 Deploying to Vercel + MongoDB Atlas

### Step 1: Set up MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Whitelist all IPs: `0.0.0.0/0` (for Vercel)
5. Get your connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/tentative-events
   ```

---

### Step 2: Deploy Backend to Vercel

```bash
cd backend

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

When prompted:
- **Project name:** `tentative-events-backend`
- **Framework:** Other
- **Root directory:** `./` (current backend folder)

After deployment, go to Vercel dashboard → Your backend project → **Settings → Environment Variables** and add:

| Variable         | Value                                      |
|------------------|--------------------------------------------|
| `MONGODB_URI`    | `mongodb+srv://...`                        |
| `ADMIN_PASSWORD` | `thapar2026`                               |
| `FRONTEND_URL`   | `https://your-frontend.vercel.app`         |

Then redeploy:
```bash
vercel --prod
```

Note your backend URL: `https://tentative-events-backend.vercel.app`

---

### Step 3: Deploy Frontend to Vercel

```bash
cd frontend

# Build first to verify no errors
npm run build

# Deploy
vercel
```

When prompted:
- **Project name:** `tentative-events-frontend`
- **Framework:** Vite

After initial deploy, go to Vercel dashboard → Frontend project → **Settings → Environment Variables** and add:

| Variable        | Value                                             |
|-----------------|---------------------------------------------------|
| `VITE_API_URL`  | `https://tentative-events-backend.vercel.app`     |

Then redeploy for production:
```bash
vercel --prod
```

---

### Step 4: Update Backend CORS

Once you have your frontend URL, update the backend env var:
```
FRONTEND_URL=https://your-frontend-name.vercel.app
```

And redeploy the backend.

---

## 🛠️ API Endpoints

### Public

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/events`                  | Get all events (with filters)  |
| GET    | `/api/events/by-date/:date`    | Get events for a specific date |
| GET    | `/api/events/calendar/:y/:m`   | Get calendar dot data          |
| GET    | `/api/events/venues`           | Get all distinct venues        |
| GET    | `/api/events/societies`        | Get all distinct societies     |

### Admin (requires `x-admin-password` header)

| Method | Endpoint                | Description             |
|--------|-------------------------|-------------------------|
| POST   | `/api/admin/verify-password` | Verify admin password  |
| GET    | `/api/admin/template`   | Download Excel template |
| POST   | `/api/admin/upload`     | Upload Excel file       |
| POST   | `/api/events`           | Create single event     |
| PUT    | `/api/events/:id`       | Update event            |
| DELETE | `/api/events/:id`       | Delete event            |

---

## 📊 MongoDB Schema

```js
{
  society:     String,   // required
  event:       String,   // required
  startDate:   String,   // YYYY-MM-DD, required
  startTime:   String,   // HH:MM, required
  endDate:     String,   // YYYY-MM-DD, required
  endTime:     String,   // HH:MM, required
  venue:       String,   // required
  description: String,   // optional
  conflict:    Boolean,  // auto-computed
  conflictWith: [ObjectId], // auto-computed
  createdAt:   Date,     // auto
  updatedAt:   Date,     // auto
}
```

---

## 🎨 Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18, Vite, TailwindCSS, Framer Motion, Lucide React |
| Backend   | Node.js, Express.js                       |
| Database  | MongoDB Atlas (Mongoose)                  |
| Auth      | Single admin password via `.env`          |
| Excel     | XLSX + Multer                             |
| Hosting   | Vercel                                    |

---

## 📋 Quick Command Reference

```bash
# Backend dev
cd backend && npm run dev

# Frontend dev
cd frontend && npm run dev

# Frontend production build
cd frontend && npm run build

# Deploy backend to Vercel
cd backend && vercel --prod

# Deploy frontend to Vercel
cd frontend && vercel --prod
```

---

## ✅ Health Check

After deployment, verify the backend is running:

```
GET https://your-backend.vercel.app/api/health
```

Expected response:
```json
{ "status": "OK", "message": "Tentative Event Calendar API is running" }
```

---

## 🐛 Troubleshooting

**CORS errors:** Make sure `FRONTEND_URL` in backend env matches your exact frontend URL.

**MongoDB not connecting:** Check that Atlas IP whitelist includes `0.0.0.0/0` and the connection string is correct.

**Excel import fails:** Ensure the file uses the template format exactly. Dates must be `YYYY-MM-DD`, times `HH:MM`.

**Admin login fails:** Check `ADMIN_PASSWORD` in backend `.env` matches what you're typing.

---

Made with ❤️ for Thapar Institute of Engineering & Technology — DoSA Office
