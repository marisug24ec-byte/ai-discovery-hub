import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function Submit() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    url: '',
    logo_url: '',
    price_free: '',
    price_paid: '',
  });

  // Fetch user's submissions
  const { data: mySubmissions } = useQuery({
    queryKey: ['my-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('ai_tools').insert({
      name: form.name,
      description: form.description,
      category: form.category,
      url: form.url,
      logo_url: form.logo_url || null,
      price_free: form.price_free || null,
      price_paid: form.price_paid || null,
      submitted_by: user.id,
      trust_score: Math.floor(Math.random() * 30 + 60), // Simulated safety scan
      safety_score: Math.floor(Math.random() * 20 + 70),
      polygon_tx_hash: `0x${Math.random().toString(16).slice(2, 18).toUpperCase()}`,
    });

    if (error) {
      toast.error('Failed to submit: ' + error.message);
    } else {
      setSubmitted(true);
      toast.success('AI Agent submitted for review!');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block">
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Submission Received!</h2>
        <p className="text-muted-foreground mb-6">Your AI agent is pending admin review.</p>
        <Button variant="neon-outline" onClick={() => setSubmitted(false)}>
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Submit AI Agent</span>
          </h1>
          <p className="text-muted-foreground">List your AI tool on the marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong p-6 space-y-5">
          <div>
            <Label>Tool Name *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., AutoCoder AI"
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does your AI tool do?"
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Creative">Creative</SelectItem>
                <SelectItem value="Dev Tools">Dev Tools</SelectItem>
                <SelectItem value="Productivity">Productivity</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Website URL *</Label>
            <Input
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://your-ai-tool.com"
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Free Tier</Label>
              <Input
                value={form.price_free}
                onChange={(e) => setForm({ ...form, price_free: e.target.value })}
                placeholder="e.g., 100 requests/mo"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label>Paid Tier</Label>
              <Input
                value={form.price_paid}
                onChange={(e) => setForm({ ...form, price_paid: e.target.value })}
                placeholder="e.g., $20/mo"
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>

          <Button type="submit" variant="neon" className="w-full gap-2" disabled={loading || !form.category}>
            <Send className="h-4 w-4" />
            {loading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </form>

        {/* My Submissions */}
        {mySubmissions && mySubmissions.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>
            <div className="space-y-3">
              {mySubmissions.map((tool) => (
                <div key={tool.id} className="glass p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.category}</p>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      tool.status === 'active'
                        ? 'bg-primary/20 text-primary'
                        : tool.status === 'rejected'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
