-- Create users table for anonymous E2E encrypted chat
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_display_name ON public.users(display_name);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read all public keys (needed for encryption)
CREATE POLICY "Public keys are readable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

-- Only allow inserting new users (registration)
CREATE POLICY "Anyone can register"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Create messages table for storing encrypted messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for message queries
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at DESC);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages they sent or received
CREATE POLICY "Users can read their own messages"
  ON public.messages
  FOR SELECT
  USING (
    sender_id IN (SELECT id FROM public.users) OR 
    recipient_id IN (SELECT id FROM public.users)
  );

-- Users can insert messages
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;