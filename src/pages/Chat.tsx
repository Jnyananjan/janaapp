import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout, AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { toast } from "sonner";

const Chat = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">CipherChat</h1>
            <p className="text-xs text-muted-foreground">End-to-End Encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          currentUserId={user.id}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
        <ChatWindow
          currentUser={user}
          recipientId={selectedUserId}
        />
      </div>
    </div>
  );
};

export default Chat;
