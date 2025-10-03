import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Key, MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        navigate("/chat");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
            <Lock className="h-4 w-4" />
            <span>End-to-End Encrypted</span>
          </div>
          
          <h1 className="text-6xl font-bold tracking-tight">
            CipherChat
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Anonymous, secure messaging with client-side encryption. Your privacy is our priority.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/register")} className="text-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-lg">
              Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Anonymous Identity</h3>
            <p className="text-sm text-muted-foreground">
              No email required. Just choose a username and you're ready to chat securely.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 w-fit mb-4">
              <Key className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Client-Side Encryption</h3>
            <p className="text-sm text-muted-foreground">
              Your keys never leave your device. Messages are encrypted before they're sent.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Messaging</h3>
            <p className="text-sm text-muted-foreground">
              Instant, encrypted communication with anyone on the platform.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Register Anonymously</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a username and password. Your encryption keys are generated locally on your device.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Find Users</h4>
                <p className="text-sm text-muted-foreground">
                  Search for other users by username or display name to start a conversation.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Chat Securely</h4>
                <p className="text-sm text-muted-foreground">
                  Messages are encrypted with the recipient's public key before sending. Only they can decrypt them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
