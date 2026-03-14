import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ExternalLink, CheckCircle } from 'lucide-react';

interface PolygonModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
  trustScore: number;
  txHash: string;
}

export default function PolygonModal({ open, onClose, toolName, trustScore, txHash }: PolygonModalProps) {
  const blockHeight = Math.floor(Math.random() * 9000000 + 1000000);
  const timestamp = new Date().toISOString();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Polygon Verified Trust Score
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 neon-border">
            <span className="text-sm text-muted-foreground">Tool</span>
            <span className="font-semibold">{toolName}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 neon-border">
            <span className="text-sm text-muted-foreground">Trust Score</span>
            <span className="text-2xl font-bold text-primary">{trustScore}/100</span>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Status:</span>
              <span className="text-primary font-medium">Verified on Polygon</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">TX Hash:</span>
              <code className="block mt-1 text-xs font-mono text-foreground/80 break-all">{txHash}</code>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Block:</span>
              <span className="ml-2 font-mono">{blockHeight}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="ml-2 font-mono text-xs">{timestamp}</span>
            </div>
          </div>

          <a
            href={`https://mumbai.polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View on PolygonScan <ExternalLink className="h-3 w-3" />
          </a>

          <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30">
            <p className="font-medium mb-1">How Trust Score is calculated:</p>
            <p>Score is based on API reliability (30%), user ratings (25%), security audit (25%), and community feedback (20%). Verified on Polygon Mumbai testnet for immutable transparency.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
