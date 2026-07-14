import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFile: (file: File) => void;
  onClose: () => void;
}

/**
 * A drag-and-drop file selector shown as an overlay above the message input.
 */
export default function FileUpload({ onFile, onClose }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFile(accepted[0]);
        onClose();
      }
    },
    [onFile, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`glass flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
        isDragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-indigo-500/30'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud size={32} className="text-indigo-400" />
      <p className="text-sm font-medium text-text-primary">
        {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to browse'}
      </p>
      <p className="text-xs text-text-secondary">Max file size 25MB</p>
    </div>
  );
}
