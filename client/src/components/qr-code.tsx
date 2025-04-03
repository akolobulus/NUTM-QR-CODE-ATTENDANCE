import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { generateQRCode, type QRResponse } from '@/lib/attendance';
import { RefreshCcw } from 'lucide-react';

// Import QR Code library
import QRCodeReact from 'react-qr-code';

export default function QRCode() {
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { toast } = useToast();

  const qrMutation = useMutation({
    mutationFn: generateQRCode,
    onSuccess: (data) => {
      setQrData(data);
      setTimeLeft(data.expiresIn);
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate QR code',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Generate QR code on initial load
  useEffect(() => {
    qrMutation.mutate();
  }, []);

  // Set up timer to count down and refresh QR code
  useEffect(() => {
    if (!qrData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto refresh when timer reaches 0
          qrMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData]);

  // Format the time left in MM:SS format
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      {qrMutation.isPending || !qrData ? (
        <Skeleton className="h-48 w-48 mb-4" />
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <QRCodeReact
            value={JSON.stringify(qrData.qrData)}
            size={200}
            level="H"
          />
        </div>
      )}
      
      <div className="text-sm text-gray-500 mb-4 text-center">
        <p>QR Code expires in: <span className="font-bold">{formatTimeLeft()}</span></p>
        <p className="text-xs">(Refreshes automatically every 10 minutes)</p>
      </div>
      
      <Button
        variant="default"
        className="bg-primary hover:bg-primary-dark"
        onClick={() => qrMutation.mutate()}
        disabled={qrMutation.isPending}
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        Refresh QR Code
      </Button>
    </div>
  );
}
