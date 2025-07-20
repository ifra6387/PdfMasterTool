import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, files, processedFiles } from "@shared/schema";

// Use local PostgreSQL database
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
const sql = postgres(connectionString);
const db = drizzle(sql);

async function initializeDatabase() {
  try {
    console.log("Creating database tables...");
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `;
    
    // Create files table
    await sql`
      CREATE TABLE IF NOT EXISTS "files" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer REFERENCES "users"("id"),
        "original_name" text NOT NULL,
        "file_name" text NOT NULL,
        "file_path" text NOT NULL,
        "file_size" integer NOT NULL,
        "mime_type" text NOT NULL,
        "tool" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "expires_at" timestamp NOT NULL
      );
    `;
    
    // Create processed_files table
    await sql`
      CREATE TABLE IF NOT EXISTS "processed_files" (
        "id" serial PRIMARY KEY NOT NULL,
        "original_file_id" integer REFERENCES "files"("id"),
        "file_name" text NOT NULL,
        "file_path" text NOT NULL,
        "file_size" integer NOT NULL,
        "download_token" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "expires_at" timestamp NOT NULL
      );
    `;
    
    console.log("Database tables created successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().then(() => {
    console.log("Database initialization complete");
    process.exit(0);
  }).catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
}

export { initializeDatabase };