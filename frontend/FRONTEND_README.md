# CustomGCS Frontend

Ground Control Station (GCS) React/TypeScript frontend application.

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v4 + PostCSS
- **Icons**: Lucide React
- **Deployment**: NGINX (Docker)

## Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── assets/                # Images, icons, sounds
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   ├── useTelemetry.ts
│   │   └── useMission.ts
│   ├── pages/                 # Page components
│   ├── services/              # API & WebSocket services
│   │   ├── api/               # REST API services
│   │   └── websocket/         # WebSocket client
│   ├── store/                 # Zustand state management
│   │   ├── connectionStore.ts
│   │   ├── telemetryStore.ts
│   │   ├── missionStore.ts
│   │   ├── parameterStore.ts
│   │   ├── alertStore.ts
│   │   ├── preflightStore.ts
│   │   ├── calibrationStore.ts
│   │   └── authStore.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── mavlink.ts
│   │   ├── mission.ts
│   │   ├── vehicle.ts
│   │   ├── telemetry.ts
│   │   └── alert.ts
│   ├── utils/                 # Utility functions
│   │   ├── coordinateUtils.ts
│   │   ├── unitConverters.ts
│   │   └── mavlinkConstants.ts
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Application entry point
├── Dockerfile                 # Production build dockerfile
├── nginx.conf                 # NGINX configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_BASE_URL=ws://localhost:5000/ws
VITE_APP_NAME=CustomGCS
VITE_APP_VERSION=0.0.1
VITE_ENABLE_MOCK_DATA=false
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Build output will be in `dist/` directory.

### Docker Build

```bash
docker build -t customgcs-frontend .
docker run -p 80:80 customgcs-frontend
```

## Architecture

### State Management

The application uses **Zustand** for state management with the following stores:

- **connectionStore**: Manages connection status and type
- **telemetryStore**: Handles real-time telemetry data from the vehicle
- **missionStore**: Manages mission planning and execution
- **parameterStore**: Handles vehicle parameters and configuration
- **alertStore**: Manages user notifications and alerts
- **preflightStore**: Handles pre-flight checklists
- **calibrationStore**: Manages sensor calibration processes
- **authStore**: Authentication and user management

### Services

#### API Services (`src/services/api/`)

- **authService**: User authentication
- **missionService**: Mission management
- **parameterService**: Vehicle parameters
- **vehicleService**: Vehicle commands and control

#### WebSocket Service (`src/services/websocket/`)

- **wsClient**: Real-time telemetry and updates via WebSocket

### NGINX Configuration

The NGINX configuration (`nginx.conf`) handles:

1. **Static file serving**: React build files
2. **API proxying**: `/api/*` → backend:5000
3. **WebSocket proxying**: `/ws/*` → backend:5000
4. **Security headers**: XSS protection, content type, frame options
5. **Gzip compression**: For improved performance

## Development Workflow

1. **Create a feature branch**: `git checkout -b feat/your-feature`
2. **Review designs**: Check Figma or design specs
3. **Define types**: Create/update TypeScript types
4. **Implement stores**: Set up Zustand stores and hooks
5. **Build components**: Create UI components with Tailwind CSS
6. **Connect services**: Integrate with backend APIs
7. **Test locally**: Verify functionality with dev server
8. **Build and deploy**: Create production build and deploy

## Module Development

The project follows a phased development approach:

- **Phase 1**: Core infrastructure (connection, telemetry, HUD)
- **Phase 2**: Mission planning and execution
- **Phase 3**: Parameters and calibration
- **Phase 4**: Advanced features (PID tuning, logs, ERS)

Each module should include:

- Type definitions
- Store/state management
- API/WebSocket services
- Custom hooks
- UI components
- Tests

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Contributing

1. Follow TypeScript best practices
2. Use functional components and hooks
3. Keep components small and focused
4. Write descriptive commit messages
5. Test thoroughly before committing

## License

Proprietary - All rights reserved
