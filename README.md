# Pos_System01

## Running the Project

This repository has two parts:

- `API/` — Node.js/Express backend
- `frontend/` — React + Vite frontend

### Backend

1. Open a terminal and go to the API folder:
   ```bash
   cd API
   ```
2. Install dependencies (only needed once):
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```

The backend listens on port `5000` by default.

### Frontend

1. Open a second terminal and go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (only needed once):
   ```bash
   npm install
   ```
3. Start the frontend dev server:
   ```bash
   npm run dev
   ```

The frontend uses a Vite proxy for `/api` requests in development, so it forwards calls to the backend on port `5000`.

### Notes for remote container / Codespaces

- If you are running this in a remote container or Codespaces, use the forwarded preview URL for the frontend.
- The frontend dev server will proxy API calls to `http://127.0.0.1:5000`.
- If you need to override the API host, set `VITE_API_BASE` before starting the frontend:
  ```bash
  export VITE_API_BASE=http://your-backend-host:5000/api
  npm run dev
  ```
