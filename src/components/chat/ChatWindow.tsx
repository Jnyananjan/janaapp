import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Lock, ArrowLeft } from "lucide-react";
import { AuthUser } from "@/lib/auth";
import { encryptMessage, decryptMessage, importPublicKey } from "@/lib/crypto";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  encrypted_content: string;
  created_at: string;
  decrypted?: string;
  sender_username?: string;
}

interface ChatWindowProps {
  currentUser: AuthUser;
  recipientId: string | null;
  onBack: () => void;
  className?: string;
}

export function ChatWindow({ currentUser, recipientId, onBack, className }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientUser, setRecipientUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recipientId) {
      fetchRecipient();
      fetchMessages();
      subscribeToMessages();
    }
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRecipient = async () => {
    if (!recipientId) return;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", recipientId)
      .single();

    if (error) {
      console.error("Error fetching recipient:", error);
      return;
    }

    setRecipientUser(data);
  };

  const fetchMessages = async () => {
    if (!recipientId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    // Decrypt messages
    const decryptedMessages = await Promise.all(
      data.map(async (msg) => {
        try {
          const decrypted = await decryptMessage(msg.encrypted_content, currentUser.privateKey);
          return { ...msg, decrypted };
        } catch (error) {
          console.error("Error decrypting message:", error);
          return { ...msg, decrypted: "[Failed to decrypt]" };
        }
      })
    );

    setMessages(decryptedMessages);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === recipientId || newMsg.recipient_id === recipientId) {
            try {
              const decrypted = await decryptMessage(newMsg.encrypted_content, currentUser.privateKey);
              setMessages((prev) => [...prev, { ...newMsg, decrypted }]);
            } catch (error) {
              console.error("Error decrypting new message:", error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipientId || !recipientUser) return;

    setSending(true);
    try {
      // Import recipient's public key
      const recipientPublicKey = await importPublicKey(recipientUser.public_key);

      // Encrypt message
      const encryptedContent = await encryptMessage(newMessage, recipientPublicKey);

      // Send message
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          encrypted_content: encryptedContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      setMessages((prev) => [...prev, { ...data, decrypted: newMessage }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!recipientId) {
    return (
      <div className={cn("flex-1 flex-col items-center justify-center bg-background/50", className)}>
        <div className="text-center space-y-3">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20 inline-block">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex-col", className)}>
      {/* Chat header */}
      {recipientUser && (
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold">{recipientUser.display_name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                End-to-end encrypted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((msg) => {
            const isSent = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isSent ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isSent
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  <p className="text-sm break-words">{msg.decrypted}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type an encrypted message..."
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
