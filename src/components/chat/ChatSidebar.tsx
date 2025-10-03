import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  display_name: string;
}

interface ChatSidebarProps {
  currentUserId: string;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function ChatSidebar({ currentUserId, selectedUserId, onSelectUser }: ChatSidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, currentUserId]);

  const fetchUsers = async () => {
    let query = supabase
      .from("users")
      .select("id, username, display_name")
      .neq("id", currentUserId)
      .order("username");

    if (searchQuery) {
      query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data || []);
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className={cn(
                "w-full p-3 rounded-lg text-left transition-colors hover:bg-secondary/50",
                selectedUserId === user.id && "bg-secondary"
              )}
            >
              <div className="font-medium text-sm">{user.display_name}</div>
              <div className="text-xs text-muted-foreground">@{user.username}</div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-8">
              No users found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
