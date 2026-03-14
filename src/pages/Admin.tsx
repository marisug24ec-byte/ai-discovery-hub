import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Check, X, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: allTools, isLoading } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const pendingTools = allTools?.filter((t) => t.status === 'pending') || [];
  const activeTools = allTools?.filter((t) => t.status === 'active') || [];
  const rejectedTools = allTools?.filter((t) => t.status === 'rejected') || [];

  const handleAction = async (toolId: string, status: string) => {
    const { error } = await supabase.from('ai_tools').update({ status }).eq('id', toolId);
    if (error) {
      toast.error('Failed to update: ' + error.message);
    } else {
      toast.success(`Tool ${status === 'active' ? 'approved' : 'rejected'}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-tools'] });
    }
  };

  const ToolRow = ({ tool }: { tool: any }) => (
    <div className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {tool.logo_url ? (
          <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg object-cover bg-secondary" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-primary">
            {tool.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{tool.name}</p>
          <p className="text-sm text-muted-foreground truncate">{tool.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{tool.category}</Badge>
            <span className="text-xs text-muted-foreground">Trust: {tool.trust_score}</span>
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
      {tool.status === 'pending' && (
        <div className="flex gap-2 shrink-0">
          <Button variant="neon" size="sm" onClick={() => handleAction(tool.id, 'active')} className="gap-1">
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleAction(tool.id, 'rejected')} className="gap-1">
            <X className="h-4 w-4" /> Reject
          </Button>
        </div>
      )}
      {tool.status === 'active' && (
        <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
      )}
      {tool.status === 'rejected' && (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10 neon-border">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage AI tool submissions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass p-4 text-center">
            <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{pendingTools.length}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
          <div className="glass p-4 text-center">
            <Check className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{activeTools.length}</p>
            <p className="text-sm text-muted-foreground">Active Tools</p>
          </div>
          <div className="glass p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-destructive">{rejectedTools.length}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="glass mb-6">
            <TabsTrigger value="pending">Pending ({pendingTools.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeTools.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedTools.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pendingTools.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No pending submissions</p>
            ) : (
              pendingTools.map((tool) => <ToolRow key={tool.id} tool={tool} />)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3">
            {activeTools.map((tool) => <ToolRow key={tool.id} tool={tool} />)}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-3">
            {rejectedTools.map((tool) => <ToolRow key={tool.id} tool={tool} />)}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
