import { Redis } from '@upstash/redis';

// Upstash יודע למשוך את ה-URL וה-TOKEN אוטומטית מקובץ ה-.env
export const redis = Redis.fromEnv();