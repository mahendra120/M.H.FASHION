import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const getCleanedUri = (rawUri: string | undefined): string | null => {
  if (!rawUri) return null;
  let uri = rawUri.trim();
  
  // Remove surrounding double or single quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  
  // Remove accidental "MONGODB_URI=" prefix if pasted directly from an env file
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.slice('MONGODB_URI='.length).trim();
  }
  
  // Remove surrounding quotes again in case they were inside the prefix
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  
  return uri;
};

const CLEANED_MONGODB_URI = getCleanedUri(MONGODB_URI);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function isMongoConfigured(): boolean {
  if (!CLEANED_MONGODB_URI) {
    console.warn('[mongodb] MONGODB_URI environment variable is not set');
    return false;
  }
  const isValid = CLEANED_MONGODB_URI.startsWith('mongodb://') || CLEANED_MONGODB_URI.startsWith('mongodb+srv://');
  if (!isValid) {
    console.warn('[mongodb] MONGODB_URI has invalid format:', CLEANED_MONGODB_URI.slice(0, 20) + '...');
  }
  return isValid;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = CLEANED_MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Add it to your .env.local file.');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      `Invalid MONGODB_URI connection string scheme. Expected it to start with "mongodb://" or "mongodb+srv://". (Parsed value starts with: "${uri.slice(0, 15)}...")`
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('bad auth') || message.includes('authentication failed')) {
        throw new Error(
          'MongoDB authentication failed. Verify MONGODB_URI credentials and redeploy.',
        );
      }
    }

    throw error;
  }

  return cached.conn;
}
