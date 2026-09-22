# Cloudflare Tunnel Setup Report

## Current Architecture
- **Frontend**: React/Vite running on `http://localhost:8173`
- **Backend**: Node.js + Express running on `http://localhost:8000`
- **Database**: MongoDB Atlas
- **API Communication**: The frontend Vite dev server is configured to proxy requests starting with `/api` and `/uploads` directly to the backend (`http://localhost:8000`). This ensures that the frontend can communicate with the backend seamlessly, without encountering CORS issues or requiring the backend port to be exposed to the public internet.

## Changes Made
1. **Frontend Port Configuration**: Updated `vite.config.js` to explicitly run the frontend on port `8173`.
2. **Frontend Proxy Configuration**: Added a proxy configuration in `vite.config.js` to forward requests to `/api` and `/uploads` to `http://localhost:8000`.
3. **Backend Port Configuration**: Updated the backend `.env` file to run the server on port `8000` (`PORT=8000`).
4. **Backend CORS Configuration**: Updated the backend `.env` file `CLIENT_URL` to `http://localhost:8173`. (Although the Vite proxy makes CORS largely unnecessary, this ensures proper configuration if needed).
5. **API Client URL Update**: Updated the frontend API client (`src/utils/api.js`) to use relative paths (e.g., `baseURL: '/api'`) instead of a hard-coded `http://localhost:5000/api`.
6. **Task Attachments Fix**: Updated `TaskDetailsModal.jsx` to use relative paths for file attachments (`href={file.path}`) instead of hard-coding the `localhost` domain, ensuring files load correctly over the tunnel.
7. **Health Endpoint**: Added a basic `GET /health` endpoint to `server.js` returning a success response.

## Local Testing Verification
- **Frontend URL**: `http://localhost:8173` (Tested and working)
- **Backend URL**: `http://localhost:8000` (Tested and working)
- **Health Check**: `http://localhost:8000/health` (Tested and working)
- **API Proxy Check**: `http://localhost:8173/api/health` successfully routes to the backend.

## Cloudflare Tunnel Configuration
I verified whether the `cloudflared` CLI was installed. It is currently **not installed** on your system.
As requested, I did not download or install it without your confirmation. 

### How to Install Cloudflared
To install `cloudflared` on Windows, run the following command in PowerShell using Windows Package Manager (winget):
```powershell
winget install --id Cloudflare.cloudflared
```
Alternatively, you can download the executable from the [official Cloudflare releases page](https://github.com/cloudflare/cloudflared/releases) and add it to your system PATH.

### How to Start the Temporary Tunnel
Once installed, start the temporary tunnel pointing to the frontend port:
```powershell
cloudflared tunnel --url http://localhost:8173
```
This will generate a temporary public URL (e.g., `https://xxxxx.trycloudflare.com`).

### Temporary Public URL
*(Pending `cloudflared` installation)* - Run the command above to get your URL.

### How to Stop the Tunnel
Press `Ctrl + C` in the terminal where the tunnel is running.

## Environment Variables Required
**Backend `.env`**:
- `PORT=8000`
- `MONGO_URI` (Use your existing Atlas URI)
- `JWT_SECRET` (Use your existing secret)
- `JWT_EXPIRES_IN=30d`
- `CLIENT_URL=http://localhost:8173`

**Frontend `.env`**:
- No environment variables are currently required as the Vite proxy handles API routing.

## How to Start the Application
1. **Start Backend**:
   ```powershell
   cd task_server
   npm install
   npm run dev
   ```
2. **Start Frontend**:
   ```powershell
   cd task_client
   npm install
   npm run dev
   ```
3. **Start Tunnel**:
   ```powershell
   cloudflared tunnel --url http://localhost:8173
   ```

## Security Considerations
- **No Direct Backend Exposure**: The backend runs exclusively on `localhost:8000` and does not need to be exposed to the public internet or router port forwarding. All public requests go through the Cloudflare Tunnel to the Vite dev server, which securely proxies only `/api` and `/uploads` requests.
- **No MongoDB Exposure**: The MongoDB Atlas connection remains secure. It is initiated outbound from the backend; you do not need to expose any ports for it.
- **Environment Variables**: Sensitive values remain secure in your `.env` files, which are excluded from version control via `.gitignore`.
- **CORS Limitations**: Since we use the Vite proxy, the frontend makes same-origin requests to the API. You do not need to allow `*` (all origins) in your CORS policy.

## Steps Required Later to Attach a Custom Domain
When you are ready to use a custom domain:
1. Log in to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Navigate to **Networks > Tunnels** and create a new tunnel.
3. Install the tunnel service on this PC using the command provided in the dashboard.
4. Route your custom domain to `http://localhost:8173` in the **Public Hostname** section of the tunnel configuration.

## Remaining Issues or Limitations
- **Vite Proxy in Production**: The current setup relies on the Vite development server (`npm run dev`) to proxy requests to the backend. While this works perfectly for development and temporary tunnels, in a production deployment, you should build the frontend (`npm run build`) and serve the static files from the Express backend, or set up a proper reverse proxy (like Nginx or a Cloudflare load balancer) to route `/api` traffic.
- **Tunnel URL testing**: As `cloudflared` is not yet installed, the final step of verifying the remote tunnel URL is pending. Please install `cloudflared` and test the generated URL.


C:\cloudflared\cloudflared.exe tunnel --url http://localhost:8173