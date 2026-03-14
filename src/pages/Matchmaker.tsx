import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AIToolCard from '@/components/AIToolCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';

// Simple intent keywords mapping
const intentMap: Record<string, { categories: string[]; keywords: string[] }> = {
  video: { categories: ['Creative'], keywords: ['video', 'youtube', 'edit', 'movie', 'animation'] },
  code: { categories: ['Dev Tools'], keywords: ['code', 'develop', 'programming', 'debug', 'build', 'api'] },
  write: { categories: ['Creative', 'Productivity'], keywords: ['write', 'content', 'blog', 'article', 'copy', 'script'] },
  research: { categories: ['Research'], keywords: ['research', 'analyze', 'data', 'study', 'find'] },
  design: { categories: ['Creative'], keywords: ['design', 'image', 'logo', 'graphic', 'ui', 'art'] },
  productivity: { categories: ['Productivity'], keywords: ['automate', 'workflow', 'organize', 'manage', 'schedule', 'task'] },
};

function analyzeIntent(query: string) {
  const lower = query.toLowerCase();
  const scores: Record<string, number> = {};
  
  for (const [intent, { keywords }] of Object.entries(intentMap)) {
    scores[intent] = keywords.filter((k) => lower.includes(k)).length;
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topIntent = sorted[0];
  if (topIntent[1] === 0) return { intent: 'general', categories: [] as string[] };
  
  return {
    intent: topIntent[0],
    categories: intentMap[topIntent[0]].categories,
  };
}

function generateReasoning(tool: { name: string; category: string; description: string }, query: string) {
  const lower = query.toLowerCase();
  if (lower.includes('video') || lower.includes('youtube'))
    return `${tool.name} excels at video-related workflows, matching your need for video content creation.`;
  if (lower.includes('code') || lower.includes('develop'))
    return `${tool.name} is designed for developers, perfect for your coding needs.`;
  if (lower.includes('write') || lower.includes('content'))
    return `${tool.name} specializes in content generation, ideal for your writing requirements.`;
  return `${tool.name} is a top-rated ${tool.category} tool that fits your described use case.`;
}

const suggestedQueries = [
  'I want to generate YouTube videos automatically',
  'Help me write viral Twitter threads',
  'I need to build a SaaS app fast',
  'Research AI papers and summarize them',
  'Design a brand identity from scratch',
];

export default function Matchmaker() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tool: any; reason: string }[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: tools } = useQuery({
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

  const handleMatch = async () => {
    if (!query.trim() || !tools) return;
    setAnalyzing(true);
    
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));
    
    const { categories } = analyzeIntent(query);
    
    let matched = tools;
    if (categories.length > 0) {
      matched = tools.filter((t) => categories.includes(t.category));
    }
    
    // Sort by trust + rating
    matched.sort((a, b) => ((b.trust_score || 0) + (Number(b.rating) || 0) * 10) - ((a.trust_score || 0) + (Number(a.rating) || 0) * 10));
    
    const top3 = matched.slice(0, 3).map((tool) => ({
      tool,
      reason: generateReasoning(tool, query),
    }));
    
    setResults(top3);
    setAnalyzing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 text-sm text-accent">
          <Brain className="h-4 w-4" />
          AI-Powered Matching
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3">
          <span className="gradient-text">AI Matchmaker</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Describe your problem in natural language. Our AI finds the perfect tools for you.
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="glass-strong p-6 space-y-4">
          <Textarea
            placeholder="Describe your problem... (e.g., 'I want to generate YouTube videos automatically')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-secondary/50 border-border min-h-[100px] text-base resize-none"
          />
          <Button
            variant="neon"
            onClick={handleMatch}
            disabled={analyzing || !query.trim()}
            className="w-full gap-2"
          >
            {analyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Analyzing Intent...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Find My AI Match
              </>
            )}
          </Button>
        </div>

        {/* Suggested queries */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {suggestedQueries.map((sq) => (
            <button
              key={sq}
              onClick={() => setQuery(sq)}
              className="text-xs px-3 py-1.5 rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {results.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-6 text-center">
                  <Sparkles className="inline h-5 w-5 text-primary mr-2" />
                  Top Matches for Your Intent
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.map(({ tool, reason }) => (
                    <AIToolCard key={tool.id} tool={tool} isMatch matchReason={reason} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">
                No matching tools found. Try a different description.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
