import { drizzle } from "drizzle-orm/postgres-js";
import { eq, lt } from "drizzle-orm";
import postgres from "postgres";
import { users, files, processedFiles, type User, type InsertUser, type File, type InsertFile, type ProcessedFile, type InsertProcessedFile } from "@shared/schema";

// Use local PostgreSQL database
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
const sql = postgres(connectionString);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File methods
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getUserFiles(userId: number): Promise<File[]>;
  updateFileStatus(id: number, status: string): Promise<void>;
  deleteFile(id: number): Promise<void>;
  getExpiredFiles(): Promise<File[]>;
  
  // Processed file methods
  createProcessedFile(processedFile: InsertProcessedFile): Promise<ProcessedFile>;
  getProcessedFileByToken(token: string): Promise<ProcessedFile | undefined>;
  deleteProcessedFile(id: number): Promise<void>;
  getExpiredProcessedFiles(): Promise<ProcessedFile[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const result = await db.insert(files).values(insertFile).returning();
    return result[0];
  }

  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id));
    return result[0];
  }

  async getUserFiles(userId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.userId, userId));
  }

  async updateFileStatus(id: number, status: string): Promise<void> {
    await db.update(files).set({ status }).where(eq(files.id, id));
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async getExpiredFiles(): Promise<File[]> {
    const now = new Date();
    return await db.select().from(files).where(lt(files.expiresAt, now));
  }

  async createProcessedFile(insertProcessedFile: InsertProcessedFile): Promise<ProcessedFile> {
    const result = await db.insert(processedFiles).values(insertProcessedFile).returning();
    return result[0];
  }

  async getProcessedFileByToken(token: string): Promise<ProcessedFile | undefined> {
    const result = await db.select().from(processedFiles).where(eq(processedFiles.downloadToken, token));
    return result[0];
  }

  async deleteProcessedFile(id: number): Promise<void> {
    await db.delete(processedFiles).where(eq(processedFiles.id, id));
  }

  async getExpiredProcessedFiles(): Promise<ProcessedFile[]> {
    const now = new Date();
    return await db.select().from(processedFiles).where(lt(processedFiles.expiresAt, now));
  }
}

// Create a fallback storage that uses in-memory when DB connection fails
class FallbackStorage implements IStorage {
  private dbStorage: DatabaseStorage;
  private memStorage: MemStorage;
  private usingMemory: boolean = false;

  constructor() {
    this.dbStorage = new DatabaseStorage();
    this.memStorage = new MemStorage();
  }

  private async withFallback<T>(dbOperation: () => Promise<T>): Promise<T> {
    if (this.usingMemory) {
      console.warn("Using in-memory storage due to database connection issues");
    }
    
    try {
      if (!this.usingMemory) {
        return await dbOperation();
      }
    } catch (error) {
      console.warn("Database operation failed, falling back to in-memory storage:", error);
      this.usingMemory = true;
    }
    
    // Fallback operation - we'll need to implement these methods in MemStorage
    throw new Error("Fallback not implemented for this operation");
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getUser(id);
      }
    } catch (error) {
      console.warn("Database getUser failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getUserByEmail(email);
      }
    } catch (error) {
      console.warn("Database getUserByEmail failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getUserByEmail(email);
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.createUser(user);
      }
    } catch (error) {
      console.warn("Database createUser failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.createUser(user);
  }

  async createFile(file: InsertFile): Promise<File> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.createFile(file);
      }
    } catch (error) {
      console.warn("Database createFile failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.createFile(file);
  }

  async getFile(id: number): Promise<File | undefined> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getFile(id);
      }
    } catch (error) {
      console.warn("Database getFile failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getFile(id);
  }

  async getUserFiles(userId: number): Promise<File[]> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getUserFiles(userId);
      }
    } catch (error) {
      console.warn("Database getUserFiles failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getUserFiles(userId);
  }

  async updateFileStatus(id: number, status: string): Promise<void> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.updateFileStatus(id, status);
      }
    } catch (error) {
      console.warn("Database updateFileStatus failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.updateFileStatus(id, status);
  }

  async deleteFile(id: number): Promise<void> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.deleteFile(id);
      }
    } catch (error) {
      console.warn("Database deleteFile failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.deleteFile(id);
  }

  async getExpiredFiles(): Promise<File[]> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getExpiredFiles();
      }
    } catch (error) {
      console.warn("Database getExpiredFiles failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getExpiredFiles();
  }

  async createProcessedFile(processedFile: InsertProcessedFile): Promise<ProcessedFile> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.createProcessedFile(processedFile);
      }
    } catch (error) {
      console.warn("Database createProcessedFile failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.createProcessedFile(processedFile);
  }

  async getProcessedFileByToken(token: string): Promise<ProcessedFile | undefined> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getProcessedFileByToken(token);
      }
    } catch (error) {
      console.warn("Database getProcessedFileByToken failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getProcessedFileByToken(token);
  }

  async deleteProcessedFile(id: number): Promise<void> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.deleteProcessedFile(id);
      }
    } catch (error) {
      console.warn("Database deleteProcessedFile failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.deleteProcessedFile(id);
  }

  async getExpiredProcessedFiles(): Promise<ProcessedFile[]> {
    try {
      if (!this.usingMemory) {
        return await this.dbStorage.getExpiredProcessedFiles();
      }
    } catch (error) {
      console.warn("Database getExpiredProcessedFiles failed, using memory storage");
      this.usingMemory = true;
    }
    return await this.memStorage.getExpiredProcessedFiles();
  }
}

// Add the in-memory storage implementation back
class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private processedFiles: Map<number, ProcessedFile>;
  private currentUserId: number;
  private currentFileId: number;
  private currentProcessedFileId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.processedFiles = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentProcessedFileId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      ...insertFile,
      id,
      createdAt: new Date(),
      status: insertFile.status || "pending",
      userId: insertFile.userId!,
    };
    this.files.set(id, file);
    return file;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getUserFiles(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId,
    );
  }

  async updateFileStatus(id: number, status: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      this.files.set(id, { ...file, status });
    }
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  async getExpiredFiles(): Promise<File[]> {
    const now = new Date();
    return Array.from(this.files.values()).filter(
      (file) => file.expiresAt < now,
    );
  }

  async createProcessedFile(insertProcessedFile: InsertProcessedFile): Promise<ProcessedFile> {
    const id = this.currentProcessedFileId++;
    const processedFile: ProcessedFile = {
      ...insertProcessedFile,
      id,
      createdAt: new Date(),
      originalFileId: insertProcessedFile.originalFileId!,
    };
    this.processedFiles.set(id, processedFile);
    return processedFile;
  }

  async getProcessedFileByToken(token: string): Promise<ProcessedFile | undefined> {
    return Array.from(this.processedFiles.values()).find(
      (file) => file.downloadToken === token,
    );
  }

  async deleteProcessedFile(id: number): Promise<void> {
    this.processedFiles.delete(id);
  }

  async getExpiredProcessedFiles(): Promise<ProcessedFile[]> {
    const now = new Date();
    return Array.from(this.processedFiles.values()).filter(
      (file) => file.expiresAt < now,
    );
  }
}

export const storage = new FallbackStorage();
