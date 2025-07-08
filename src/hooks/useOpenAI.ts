
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const callOpenAI = async (message: string, context?: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-openai', {
        body: {
          message,
          context
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      return data.response || 'Desculpe, não consegui processar sua mensagem.';
    } catch (error) {
      console.error('OpenAI call error:', error);
      return 'Desculpe, estou com problemas técnicos no momento. Posso te ajudar com informações sobre nossa pizzaria!';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    callOpenAI,
    isLoading
  };
};
