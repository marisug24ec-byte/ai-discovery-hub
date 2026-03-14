import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AIToolCard from '@/components/AIToolCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Index() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: tools, isLoading } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('status', 'active')
        .order('trust_score', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_bookmarks')
        .select('tool_id')
        .eq('user_id', user.id);
      return data?.map((b) => b.tool_id) || [];
    },
    enabled: !!user,
  });

  const handleBookmark = async (toolId: string) => {
    if (!user) return;
    const isBookmarked = bookmarks?.includes(toolId);
    if (isBookmarked) {
      await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('tool_id', toolId);
      toast.info('Bookmark removed');
    } else {
      await supabase.from('user_bookmarks').insert({ user_id: user.id, tool_id: toolId });
      toast.success('Bookmarked! 🎉');
    }
  };

  const filtered = tools?.filter((t) => {
    const matchCat = categories.length === 0 || categories.includes(t.category);
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          Discover the best AI agents
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="gradient-text">AI Discovery</span>{' '}
          <span className="text-foreground">Marketplace</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover, compare, and launch AI agents. Verified by Polygon Trust Protocol.
        </p>
      </motion.div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search AI tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50 border-border h-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="mb-8 flex justify-center">
        <CategoryFilter selected={categories} onChange={setCategories} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl bg-secondary/30" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool) => (
            <AIToolCard
              key={tool.id}
              tool={tool}
              onBookmark={handleBookmark}
              isBookmarked={bookmarks?.includes(tool.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No AI tools found yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Submit your AI agent or wait for admin approval.</p>
        </div>
      )}
    </div>
  );
}
