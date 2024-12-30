import mongoose, { Schema, Document } from 'mongoose';

interface IFile extends Document {
  filename: string;
  contentType: string;
  length: number;
  id: string;
}

const FileSchema: Schema = new Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  length: { type: Number, required: true },
  id: { type: String, required: true },
});

const File = mongoose.model<IFile>('File', FileSchema);

export { File, IFile }; 