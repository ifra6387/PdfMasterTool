import cron from "node-cron";
import fs from "fs";
import { storage } from "../storage";

export function initializeFileCleanup() {
  // Run cleanup every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running file cleanup...');
    
    try {
      // Clean up expired original files
      const expiredFiles = await storage.getExpiredFiles();
      for (const file of expiredFiles) {
        try {
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }
          await storage.deleteFile(file.id);
          console.log(`Deleted expired file: ${file.fileName}`);
        } catch (error) {
          console.error(`Error deleting file ${file.id}:`, error);
        }
      }

      // Clean up expired processed files
      const expiredProcessedFiles = await storage.getExpiredProcessedFiles();
      for (const file of expiredProcessedFiles) {
        try {
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }
          await storage.deleteProcessedFile(file.id);
          console.log(`Deleted expired processed file: ${file.fileName}`);
        } catch (error) {
          console.error(`Error deleting processed file ${file.id}:`, error);
        }
      }

      console.log(`Cleanup completed. Removed ${expiredFiles.length + expiredProcessedFiles.length} files.`);
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  });

  console.log('File cleanup scheduler initialized');
}
