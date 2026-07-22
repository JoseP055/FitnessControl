import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabaseClient } from "../services/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!supabaseClient) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabaseClient.auth.getSession();

      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    }

    loadSession();

    if (!supabaseClient) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email, password) {
    if (!supabaseClient) {
      throw new Error("El cliente de Supabase no esta configurado.");
    }

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signIn(email, password) {
    if (!supabaseClient) {
      throw new Error("El cliente de Supabase no esta configurado.");
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    if (!supabaseClient) {
      throw new Error("El cliente de Supabase no esta configurado.");
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
