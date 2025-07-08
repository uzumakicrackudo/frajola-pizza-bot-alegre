
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Você é a Frajola, assistente virtual da Pizzaria Frajola. Você é amigável, prestativa e especializada em pizzas. 
            
            IMPORTANTE: Se a pergunta for sobre cardápio, preços, pedidos, ingredientes ou qualquer coisa relacionada à pizzaria, responda que você vai processar isso com a lógica específica da pizzaria.
            
            Para outras perguntas gerais (cumprimentos, conversas casuais, perguntas não relacionadas à pizzaria), seja amigável e útil, mas sempre mantenha o foco na pizzaria.
            
            Contexto da conversa: ${context || 'Início da conversa'}
            
            Seja concisa e amigável. Use emojis moderadamente.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error')
    }

    const aiResponse = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Desculpe, estou com problemas técnicos. Posso te ajudar com informações sobre nossa pizzaria!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})
