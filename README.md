# CampusBuddy

An AI campus assistant for Nasarawa State University, Keffi (NSUK), recreated from your demo video.

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Map | OpenStreetMap tiles via Leaflet / react-leaflet, satellite view from Esri, walking routes from OSRM |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| AI chat | OpenAI API (with an offline fallback that answers from the database) |

## Features

- **Landing page** with a live campus map preview and Sign in.
- **Auth**: register and log in (JWT, bcrypt).
- **Dashboard**: greeting, today's classes, pending tasks, unread notices, upcoming events, announcements (click to mark read).
- **AI Assistant**: chat with quick prompts. Answers are grounded in your MongoDB data (buildings, timetable, events, announcements). Replies that mention a building get a "Show on map" button. History is saved per user.
- **Map**: search, category chips (Faculty, Library, Admin, Medical, Hostel...), default and satellite views, zoom, locate me, building details (contact, hours, facilities), bookmark, share, and **Get Directions** (locates you, then draws a walking route with distance and time).
- **Schedule** (weekly timetable plus tasks), **Courses**, **Settings**, **Help & Support**.
- Responsive: sidebar becomes a drawer and building details become a bottom sheet on phones.

## Setup

You need Node 20+ and MongoDB (local, or a free MongoDB Atlas connection string).

```bash
# 1. install everything
npm run install:all

# 2. configure (all secrets live in .env files, never in the code)
cp server/.env.example server/.env   # MONGODB_URI, JWT_SECRET, ADMIN_*, DEMO_USER_*, OPENAI_API_KEY ...
cp client/.env.example client/.env   # API_PROXY_TARGET, optional VITE_DEMO_*, maps keys

# 3. run both at once
npm run dev
#    API  -> http://localhost:5000   (check http://localhost:5000/api/health)
#    App  -> http://localhost:5173
```

`npm run server` and `npm run client` still work if you prefer two terminals.

### How the frontend and backend are linked

The React app never hardcodes the API address. `client/src/lib/api.js` calls relative URLs like `/api/auth/login`.
In development the Vite dev server (port 5173) forwards every `/api/...` request to `API_PROXY_TARGET`
(the Express server, default `http://localhost:5000`), set in `client/.env`. The server allows that origin through
`CLIENT_ORIGIN` in `server/.env`. In production either serve both from one domain, or set `VITE_API_URL` to the API's full URL.

`server/.env` holds every secret (database, JWT, OpenAI, SMTP, admin and demo passwords). The server refuses to start
if `MONGODB_URI` or `JWT_SECRET` is missing. Anything in `client/.env` that starts with `VITE_` ends up in the browser,
so only public values go there.

## Deploying to Vercel

Frontend and API deploy together as one Vercel project (see `vercel.json`):
the React build is served as static files and every `/api/*` request goes to `api/index.js`,
which runs the same Express app as a serverless function. Because both share one domain, the
frontend keeps calling `/api` and no `VITE_API_URL` is needed.

1. Import the GitHub repo in Vercel (leave Root Directory as the repo root; settings come from `vercel.json`).
2. In Project Settings > Environment Variables add the values from `server/.env`
   (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`,
   `OPENAI_API_KEY`...), plus `CLIENT_ORIGIN` and `CLIENT_URL` set to your Vercel URL, `DNS_SERVERS` empty,
   and optionally `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD`.
3. In MongoDB Atlas > Network Access allow `0.0.0.0/0` (Vercel has no fixed IP).
4. Check `https://<your-app>.vercel.app/api/health` shows `"db": true`.

### OpenAI

Put your key in `server/.env` as `OPENAI_API_KEY` (model defaults to `gpt-4o-mini`, change with `OPENAI_MODEL`).
The key stays on the server and is never sent to the browser. Without a key, or if OpenAI is unreachable, the assistant
falls back to simple answers built from the database, so the app still works. `GET /api/health` shows which mode is active.

## Things to adjust

- **Real campus data.** The building coordinates, phone numbers, emails, lecturers and courses in
  `server/src/seed/data.js` are **sample values** (coordinates are approximate, around 8.847 N, 7.878 E). Correct them
  with the real ones, or edit the documents in MongoDB, then run `npm run seed`. Building images can be set with the `image` URL field.
- **Map tiles.** OpenStreetMap does not provide satellite imagery, so the Satellite option uses Esri World Imagery.
  The public OSM tile server and the public walking-route server (`routing.openstreetmap.de`) have fair-use limits:
  fine for a project demo, but for heavy production traffic use a tile provider (e.g. MapTiler) and your own OSRM
  (set `VITE_ROUTING_URL`).
- **Courses and timetable** are shared by all students. Per-student enrolment would be a natural next step.
- There is no admin screen yet; campus data is managed in MongoDB.

## Project layout

```
server/src
  index.js            Express app and startup (also auto-seeds)
  models/             User, Building, Course, Event, Announcement, Task, ChatMessage
  routes/             auth, buildings, dashboard, announcements, events, courses, tasks, chat
  services/ai.js      OpenAI call + campus-data prompt + offline fallback
  services/places.js  matches buildings mentioned in questions and answers
  seed/               sample data and seed script
client/src
  pages/              Landing, AuthPage, Dashboard, Assistant, MapPage, Schedule, Courses, Settings, Help
  components/         AppLayout (sidebar and top bar), map/CampusMap, map/BuildingSheet, RichText...
  lib/                api client, routing (OSRM + geolocation), formatting, category styles
```
# Campus-Buddy
