
import { MenuItem } from '@/types/chatbot';

export class ChatService {
  private menu: MenuItem[];
  
  constructor(menu: MenuItem[]) {
    this.menu = menu;
  }

  // Verifica se a mensagem é sobre a pizzaria (cardápio, pedidos, etc.)
  isPizzariaRelated(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    const pizzariaKeywords = [
      'cardápio', 'menu', 'pizza', 'preço', 'valor', 'custa', 'ingrediente',
      'pedido', 'pedir', 'quero', 'finalizar', 'endereço', 'entrega',
      'calabresa', 'margherita', 'portuguesa', 'frango', 'catupiry',
      'coca', 'refrigerante', 'bebida', 'guaraná', 'suco',
      'borda', 'grande', 'broto', 'tamanho', 'promoção',
      'tempo', 'minutos', 'quanto tempo', 'demora'
    ];

    return pizzariaKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Verifica se é uma saudação ou conversa casual
  isCasualConversation(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    const casualKeywords = [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
      'obrigado', 'obrigada', 'valeu', 'tchau', 'até logo',
      'como vai', 'tudo bem', 'e ai', 'eai', 'beleza'
    ];

    return casualKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Verifica se deve usar ChatGPT
  shouldUseOpenAI(message: string): boolean {
    // Usa ChatGPT para conversas casuais ou perguntas não relacionadas à pizzaria
    return this.isCasualConversation(message) || !this.isPizzariaRelated(message);
  }

  // Cria contexto para o ChatGPT
  createContextForOpenAI(recentMessages: string[]): string {
    const context = recentMessages.slice(-3).join(' | ');
    return `Conversa recente: ${context}`;
  }
}
