# Laya Foresight Frontend Dashboard

This repository contains the frontend dashboard for the Laya Foresight project. It is built using React and Vite, designed to connect to the backend AI Agent server to visualize reasoning and simulate customer support scenarios in real-time.

## Prerequisites

- **Node.js**: Ensure Node.js (version 16 or above recommended) is installed.
- **npm** (comes with Node.js)

## Setup and Installation

### 1. Clone the Repository
Clone the frontend repository to your local machine:
```bash
git clone https://github.com/Laya-hackathon/laya-foresight-frontend
cd laya-foresight-frontend/laya-foresight-frontend
```

### 2. Install Dependencies
Run the following command to install all the necessary packages:
```bash
npm install
```

### 3. Environment Configuration
The frontend communicates with a separate backend API. To configure this connection dynamically, create a `.env` file in the root directory (where `package.json` is located).

*Example `.env`:*
```env
VITE_API_BASE_URL=http://localhost:8000
```
*Note: If `VITE_API_BASE_URL` is omitted, the app will default to `http://localhost:8000`.*

### 4. Running the Development Server
Start the Vite development server with hot module replacement (HMR):
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173/` by default.

