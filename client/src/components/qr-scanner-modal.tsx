import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { QRCodeData } from '@shared/schema';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: number;
}

export default function QRScannerModal({ isOpen, onClose, sessionId }: QRScannerModalProps) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const { toast } = useToast();
  
  const scanAttendanceMutation = useMutation({
    mutationFn: async (qrData: QRCodeData) => {
      const res = await apiRequest('POST', '/api/attendance/scan', qrData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });
      setScannedData(null);
      stopCamera();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
      setScannedData(null);
    },
  });

  const startCamera = async () => {
    setError(null);
    setIsCameraOn(true);
    try {
      const constraints = {
        video: {
          facingMode: 'environment'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please ensure you have granted permission.');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const processScan = (data: string) => {
    try {
      // Try to parse as JSON
      const qrData = JSON.parse(data) as QRCodeData;
      
      // If sessionId is specified, make sure it matches
      if (sessionId && qrData.sessionId !== sessionId) {
        toast({
          title: 'Wrong Session',
          description: 'This QR code is for a different session.',
          variant: 'destructive',
        });
        return;
      }
      
      scanAttendanceMutation.mutate(qrData);
    } catch (err) {
      toast({
        title: 'Invalid QR Code',
        description: 'The QR code does not contain valid attendance data.',
        variant: 'destructive',
      });
    }
  };

  // For testing purposes - in a real implementation you'd use a QR scanner library
  const processQrCodeManually = () => {
    const qrValue = prompt('Enter QR code data (for testing):');
    if (qrValue) {
      processScan(qrValue);
    }
  };

  // In a real implementation, you would integrate with a QR scanning library
  // For example, with react-qr-reader or a similar library
  useEffect(() => {
    // This would be replaced with actual QR code scanning logic
    // For now, we'll use the manual input method
    if (isOpen && isCameraOn) {
      // This is a mock implementation - in a real app you'd use:
      // const scanner = new QrScanner(videoRef.current, result => {
      //   processScan(result);
      // });
      // scanner.start();
      // 
      // return () => {
      //   scanner.stop();
      // };
    }
  }, [isOpen, isCameraOn]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan Attendance QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at the student's QR code to mark attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            {isCameraOn ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                ></video>
                <button 
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-1 bg-white/80 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Button onClick={startCamera} className="bg-primary">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            Align the QR code within the camera view to scan automatically
          </div>

          {scanAttendanceMutation.isPending && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={scanAttendanceMutation.isPending}
          >
            Cancel
          </Button>
          
          {/* Only for testing - would not be included in production */}
          <Button 
            onClick={processQrCodeManually}
            disabled={scanAttendanceMutation.isPending}
            className="bg-primary"
          >
            Manual Input (Test)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}