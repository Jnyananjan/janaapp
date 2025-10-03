import { supabase } from "@/integrations/supabase/client";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptPrivateKey,
  decryptPrivateKey,
  importPrivateKey,
} from "./crypto";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  privateKey: CryptoKey;
}

const AUTH_STORAGE_KEY = "cipher_chat_auth";

// Register new user
export async function register(username: string, displayName: string, password: string) {
  // Check if username already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    throw new Error("Username already taken");
  }

  // Generate key pair
  const keyPair = await generateKeyPair();
  const publicKey = await exportPublicKey(keyPair.publicKey);
  const privateKeyString = await exportPrivateKey(keyPair.privateKey);

  // Encrypt private key with password
  const encryptedPrivateKey = await encryptPrivateKey(privateKeyString, password);

  // Store user in database
  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      display_name: displayName,
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey,
    })
    .select()
    .single();

  if (error) throw error;

  // Store auth locally
  const authUser: AuthUser = {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    privateKey: keyPair.privateKey,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    id: authUser.id,
    username: authUser.username,
    displayName: authUser.displayName,
  }));

  // Store private key separately (only in memory ideally, but for MVP we'll use sessionStorage)
  const privateKeyExport = await exportPrivateKey(authUser.privateKey);
  sessionStorage.setItem("cipher_private_key", privateKeyExport);

  return authUser;
}

// Login existing user
export async function login(username: string, password: string) {
  // Fetch user from database
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  // Decrypt private key
  let privateKeyString: string;
  try {
    privateKeyString = await decryptPrivateKey(user.encrypted_private_key, password);
  } catch (error) {
    throw new Error("Invalid password");
  }

  const privateKey = await importPrivateKey(privateKeyString);

  // Store auth locally
  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    privateKey,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    id: authUser.id,
    username: authUser.username,
    displayName: authUser.displayName,
  }));

  sessionStorage.setItem("cipher_private_key", privateKeyString);

  return authUser;
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  const privateKeyString = sessionStorage.getItem("cipher_private_key");

  if (!authData || !privateKeyString) {
    return null;
  }

  const { id, username, displayName } = JSON.parse(authData);
  const privateKey = await importPrivateKey(privateKeyString);

  return {
    id,
    username,
    displayName,
    privateKey,
  };
}

// Logout
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem("cipher_private_key");
}
