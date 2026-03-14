import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Bookmark, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Stacks() {
  const { user } = useAuth();

  const { data: stacks, isLoading } = useQuery({
    queryKey: ['ai-stacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_stacks')
        .select('*, ai_stack_tools(tool_id, ai_tools(name, logo_url, category))')
        .order('save_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: savedStacks } = useQuery({
    queryKey: ['saved-stacks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_saved_stacks')
        .select('stack_id')
        .eq('user_id', user.id);
      return data?.map((s) => s.stack_id) || [];
    },
    enabled: !!user,
  });

  const handleSave = async (stackId: string) => {
    if (!user) return;
    const isSaved = savedStacks?.includes(stackId);
    if (isSaved) {
      await supabase.from('user_saved_stacks').delete().eq('user_id', user.id).eq('stack_id', stackId);
      toast.info('Stack unsaved');
    } else {
      await supabase.from('user_saved_stacks').insert({ user_id: user.id, stack_id: stackId });
      toast.success('Stack saved! 🚀');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 text-sm text-neon-purple">
          <Layers className="h-4 w-4" />
          Workflow Bundles
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3">
          <span className="gradient-text">AI Stacks</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Pre-built tool bundles for specific workflows. Save and customize your favorites.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading stacks...</div>
      ) : stacks && stacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {stacks.map((stack) => (
            <motion.div
              key={stack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="glass p-6 flex flex-col gap-4 hover:neon-border transition-all"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">{stack.name}</h3>
                <p className="text-sm text-muted-foreground">{stack.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(stack as any).ai_stack_tools?.map((st: any) => (
                  <Badge key={st.tool_id} variant="outline" className="gap-1 border-border">
                    {st.ai_tools?.name || 'Tool'}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {(stack as any).ai_stack_tools?.length || 0} tools
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {stack.save_count || 0} saves
                </span>
              </div>

              <Button
                variant={savedStacks?.includes(stack.id) ? 'neon' : 'neon-outline'}
                size="sm"
                onClick={() => handleSave(stack.id)}
                className="gap-2 mt-auto"
              >
                <Bookmark className={`h-4 w-4 ${savedStacks?.includes(stack.id) ? 'fill-current' : ''}`} />
                {savedStacks?.includes(stack.id) ? 'Saved' : 'Save Stack'}
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No stacks created yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Admin will create workflow bundles soon.</p>
        </div>
      )}
    </div>
  );
}
