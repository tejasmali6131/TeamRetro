import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { wsManager } from './websocket/websocketManager';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Import routes
import templateRoutes from './routes/templateRoutes';
import retroRoutes from './routes/retroRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
app.use('/api/templates', templateRoutes);
app.use('/api/retros', retroRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/cards', cardRoutes);
// app.use('/api/actions', actionRoutes);
// app.use('/api/users', userRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const server = createServer(app);
wsManager.initialize(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}/ws`);
});

export default app;
