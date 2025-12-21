// This file contains type definitions for file uploads
declare global {
  namespace Express {
    interface Multer {
      File: File;
    }
  }
}

export type FileUpload = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
};
