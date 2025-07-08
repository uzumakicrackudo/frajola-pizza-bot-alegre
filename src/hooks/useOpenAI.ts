
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const callOpenAI = async (message: string, context?: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      console.log('Calling OpenAI with message:', message);
      
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

      console.log('OpenAI response received:', data);
      return data?.response || 'Desculpe, não consegui processar sua mensagem.';
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
