import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { adminRouter } from './routes/admin.routes';
import { authRouter } from './routes/auth.routes';
import { bookingRouter } from './routes/booking.routes';
import { locationRouter } from './routes/location.routes';
import { propertyRouter } from './routes/property.routes';
import { userRouter } from './routes/user.routes';
import { globalLimiter } from './middleware/rate-limit.middleware';

const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '8mb' }));
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/locations', locationRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(env.PORT, () => {
  console.log(`Backend running at http://localhost:${env.PORT}`);
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
