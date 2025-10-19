import { useState } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  X,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedBy?: string;
    uploadedAt?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('pdf')) return FileText;
    return File;
  };

  const Icon = getFileIcon();
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPDF = file.type.includes('pdf');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{file.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
                {file.uploadedBy && ` • Uploaded by ${file.uploadedBy}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/20 relative">
          {isImage && (
            <>
              <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="px-2 flex items-center text-sm">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px bg-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center h-full p-8">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                />
              </div>
            </>
          )}

          {isVideo && (
            <div className="flex items-center justify-center h-full p-8">
              <video
                src={file.url}
                controls
                className="max-w-full max-h-full rounded-lg shadow-lg"
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {isPDF && (
            <iframe
              src={file.url}
              className="w-full h-full"
              title={file.name}
            />
          )}

          {!isImage && !isVideo && !isPDF && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Icon className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-lg mb-2">Preview not available</p>
              <p className="text-sm mb-4">Download to view this file</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* Footer - File Info */}
        {file.uploadedAt && (
          <div className="px-6 py-3 border-t border-border text-sm text-muted-foreground">
            Uploaded on {file.uploadedAt}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
