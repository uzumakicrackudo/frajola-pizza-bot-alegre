import { useState, useCallback } from 'react';
import { ChatMessage, ChatbotState, MenuItem, OrderItem, CustomerInfo } from '@/types/chatbot';
import { useOpenAI } from './useOpenAI';
import { ChatService } from '@/services/chatService';

export const useChatbot = (menu: MenuItem[], estimatedTime: number) => {
  const [state, setState] = useState<ChatbotState>({
    stage: 'greeting',
    currentOrder: {
      items: [],
      customerInfo: { name: '', street: '', number: '', neighborhood: '' },
      estimatedTime,
      total: 0
    },
    messages: [
      {
        id: '1',
        text: '🍕 Oi! Eu sou a Frajola, sua assistente virtual da pizzaria! 😊 Estou aqui para te ajudar a fazer o melhor pedido! Como posso te ajudar hoje?',
        sender: 'bot',
        timestamp: new Date()
      }
    ],
    awaitingHuman: false
  });

  const { callOpenAI, isLoading } = useOpenAI();
  const chatService = new ChatService(menu);

  // Contexto da conversa
  const [conversationContext, setConversationContext] = useState<{
    lastQueriedItem: MenuItem | null;
    lastAction: 'price' | 'ingredients' | 'menu' | null;
    addressField: 'name' | 'street' | 'number' | 'neighborhood' | null;
  }>({
    lastQueriedItem: null,
    lastAction: null,
    addressField: null
  });

  const addMessage = useCallback((text: string, sender: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  // Função melhorada para normalizar texto
  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Substitui pontuação por espaço
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }, []);

  // Função MUITO mais restritiva para encontrar itens no menu
  const findMenuItem = useCallback((query: string): MenuItem | null => {
    const normalizedQuery = normalizeText(query);
    console.log('🔍 Buscando por:', normalizedQuery);
    
    // Se a query for muito pequena, não buscar
    if (normalizedQuery.length < 3) {
      console.log('❌ Query muito pequena');
      return null;
    }
    
    // Palavras que NÃO são itens do menu (expandida)
    const stopWords = [
      'ola', 'olá', 'oi', 'e ai', 'eai', 'bom dia', 'boa tarde', 'boa noite',
      'obrigado', 'obrigada', 'valeu', 'tchau', 'ate logo', 'até logo',
      'sim', 'nao', 'não', 'ok', 'certo', 'beleza', 'legal', 'show',
      'quanto', 'como', 'onde', 'quando', 'porque', 'por que', 'que',
      'cardapio', 'menu', 'pedido', 'pedir', 'quero', 'gostaria', 
      'pode', 'consegue', 'ajuda', 'ajudar', 'oque', 'o que',
      'vai', 'tem', 'ingrediente', 'ingredientes', 'feita', 'pizza', 'de'
    ];
    
    // Se for apenas uma palavra comum, não buscar
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);
    if (queryWords.every(word => stopWords.includes(word))) {
      console.log('❌ Apenas palavras comuns detectadas');
      return null;
    }
    
    // Mapeamento EXATO de nomes (mais restritivo)
    const exactMatches: { [key: string]: string } = {
      'calabresa': 'Pizza Calabresa',
      'margherita': 'Pizza Margherita',
      'marguerita': 'Pizza Margherita',
      'portuguesa': 'Pizza Portuguesa',
      'frango catupiry': 'Pizza Frango com Catupiry',
      'frango': 'Pizza Frango com Catupiry',
      'presunto queijo': 'Pizza Presunto e Queijo',
      'presunto': 'Pizza Presunto e Queijo',
      'fernando': 'Pizza Fernando',
      'mussarela': 'Pizza Mussarela',
      '4 queijos': 'Pizza 4 Queijos',
      'quatro queijos': 'Pizza 4 Queijos',
      '3 queijos': 'Pizza 3 Queijos',
      'tres queijos': 'Pizza 3 Queijos',
      '2 queijos': 'Pizza 2 Queijos',
      'dois queijos': 'Pizza 2 Queijos',
      'file mignon': 'Pizza Filé Mignon',
      'file': 'Pizza Filé Mignon',
      'mignon': 'Pizza Filé Mignon',
      '4 carnes': 'Pizza 4 Carnes',
      'quatro carnes': 'Pizza 4 Carnes',
      'lombo catupiry': 'Pizza Lombo com Catupiry',
      'lombo': 'Pizza Lombo com Catupiry',
      'frango especial': 'Pizza Frango Especial',
      'strogonoff': 'Pizza Strogonoff',
      'frango melt': 'Pizza Frango Melt',
      'melt': 'Pizza Frango Melt',
      'palmito catupiry': 'Pizza Palmito com Catupiry',
      'palmito': 'Pizza Palmito com Catupiry',
      'milho catupiry': 'Pizza Milho com Catupiry',
      'milho': 'Pizza Milho com Catupiry',
      'brocolis': 'Pizza Brócolis',
      'rucula': 'Pizza Rúcula',
      'coca': 'Coca Cola 350ml',
      'coca cola': 'Coca Cola 350ml',
      'guarana': 'Guaraná 350ml',
      'suco laranja': 'Suco de Laranja 300ml',
      'suco': 'Suco de Laranja 300ml'
    };

    // 1. Busca por correspondência exata primeiro
    for (const [key, itemName] of Object.entries(exactMatches)) {
      if (normalizedQuery.includes(key)) {
        const found = menu.find(item => 
          item.available && normalizeText(item.name) === normalizeText(itemName)
        );
        if (found) {
          console.log('✅ Encontrado por mapeamento exato:', found.name);
          return found;
        }
      }
    }

    // 2. Busca por palavras-chave específicas mais restritiva
    const specificKeywords = [
      { keywords: ['calabresa'], requiredWords: ['calabresa'] },
      { keywords: ['margherita', 'marguerita'], requiredWords: ['margherita'] },
      { keywords: ['portuguesa'], requiredWords: ['portuguesa'] },
      { keywords: ['frango'], requiredWords: ['frango'] },
      { keywords: ['presunto'], requiredWords: ['presunto'] },
      { keywords: ['fernando'], requiredWords: ['fernando'] },
      { keywords: ['mussarela'], requiredWords: ['mussarela'] },
      { keywords: ['file', 'mignon'], requiredWords: ['file', 'mignon'] },
      { keywords: ['lombo'], requiredWords: ['lombo'] },
      { keywords: ['strogonoff'], requiredWords: ['strogonoff'] },
      { keywords: ['palmito'], requiredWords: ['palmito'] },
      { keywords: ['milho'], requiredWords: ['milho'] },
      { keywords: ['brocolis'], requiredWords: ['brocolis'] },
      { keywords: ['rucula'], requiredWords: ['rucula'] }
    ];

    for (const keywordGroup of specificKeywords) {
      const hasAllRequired = keywordGroup.requiredWords.every(word => 
        normalizedQuery.includes(word)
      );
      
      if (hasAllRequired) {
        const hasKeyword = keywordGroup.keywords.some(keyword => 
          normalizedQuery.includes(keyword)
        );
        
        if (hasKeyword) {
          const found = menu.find(item => {
            if (!item.available) return false;
            const itemNormalized = normalizeText(item.name);
            return keywordGroup.requiredWords.every(word => itemNormalized.includes(word));
          });
          
          if (found) {
            console.log('✅ Encontrado por palavra-chave específica:', found.name);
            return found;
          }
        }
      }
    }

    console.log('❌ Nenhum item encontrado para:', normalizedQuery);
    return null;
  }, [menu, normalizeText]);

  const getItemIcon = useCallback((item: MenuItem): string => {
    switch (item.category) {
      case 'pizza':
        return '🍕';
      case 'bebida':
        if (item.name.toLowerCase().includes('coca')) return '🥤';
        if (item.name.toLowerCase().includes('guaraná')) return '🥤';
        if (item.name.toLowerCase().includes('suco')) return '🧃';
        return '🥤';
      case 'entrada':
        return '🥖';
      case 'sobremesa':
        return '🍰';
      default:
        return '🍽️';
    }
  }, []);

  const addItemToOrder = useCallback((item: MenuItem, size: 'grande' | 'broto' = 'grande') => {
    const price = size === 'broto' && item.priceSmall ? item.priceSmall : item.price;
    
    setState(prev => ({
      ...prev,
      currentOrder: {
        ...prev.currentOrder,
        items: [...prev.currentOrder.items, {
          menuItem: { ...item, price },
          quantity: 1,
          removedIngredients: []
        }],
        total: prev.currentOrder.total + price
      }
    }));
  }, []);

  const processMessage = useCallback(async (userMessage: string) => {
    addMessage(userMessage, 'user');

    const shouldUseAI = chatService.shouldUseOpenAI(userMessage);
    
    setState(currentState => {
      const lowerMessage = userMessage.toLowerCase();

      // Sempre processar solicitações de humano primeiro
      if (lowerMessage.includes('humano') || lowerMessage.includes('atendente') || 
          lowerMessage.includes('pessoa') || lowerMessage.includes('ajuda especializada')) {
        
        setTimeout(() => {
          addMessage('🤝 Claro! Vou te conectar com um de nossos atendentes humanos. Aguarde só um instantinho...', 'bot');
        }, 100);
        
        return { ...currentState, stage: 'human', awaitingHuman: true };
      }

      // Lógica específica da pizzaria (sempre prioritária)
      if (!shouldUseAI || currentState.stage === 'address' || currentState.stage === 'ordering') {
        
        if (currentState.stage === 'address') {
          if (!conversationContext.addressField) {
            setTimeout(() => {
              addMessage('📍 Perfeito! Agora me diga o nome da sua rua:', 'bot');
            }, 100);
            
            setConversationContext(prev => ({ ...prev, addressField: 'street' }));
            
            return {
              ...currentState,
              currentOrder: {
                ...currentState.currentOrder,
                customerInfo: { ...currentState.currentOrder.customerInfo, name: userMessage }
              }
            };
          } else if (conversationContext.addressField === 'street') {
            setTimeout(() => {
              addMessage('🏠 Agora me diga o número da sua casa:', 'bot');
            }, 100);
            
            setConversationContext(prev => ({ ...prev, addressField: 'number' }));
            
            return {
              ...currentState,
              currentOrder: {
                ...currentState.currentOrder,
                customerInfo: { ...currentState.currentOrder.customerInfo, street: userMessage }
              }
            };
          } else if (conversationContext.addressField === 'number') {
            setTimeout(() => {
              addMessage('🏘️ Por último, qual é o seu bairro?', 'bot');
            }, 100);
            
            setConversationContext(prev => ({ ...prev, addressField: 'neighborhood' }));
            
            return {
              ...currentState,
              currentOrder: {
                ...currentState.currentOrder,
                customerInfo: { ...currentState.currentOrder.customerInfo, number: userMessage }
              }
            };
          } else if (conversationContext.addressField === 'neighborhood') {
            const updatedOrder = {
              ...currentState.currentOrder,
              customerInfo: { ...currentState.currentOrder.customerInfo, neighborhood: userMessage }
            };
            
            setTimeout(() => {
              const orderSummary = updatedOrder.items.map(item => 
                `${getItemIcon(item.menuItem)} ${item.menuItem.name} - R$ ${item.menuItem.price.toFixed(2)}`
              ).join('\n');
              
              addMessage(`🎉 Pedido confirmado! Aqui está o resumo:

📋 **RESUMO DO PEDIDO:**
${orderSummary}

💰 **Total:** R$ ${updatedOrder.total.toFixed(2)}

🏠 **Endereço de entrega:**
${updatedOrder.customerInfo.name}
${updatedOrder.customerInfo.street}, ${updatedOrder.customerInfo.number}
${updatedOrder.customerInfo.neighborhood}

⏰ **Tempo estimado:** ${estimatedTime} minutos

✅ Seu pedido foi registrado! Nossa equipe já começou a preparar. Você receberá uma ligação para confirmar os detalhes!

Obrigada por escolher a Pizzaria Frajola! 🍕❤️`, 'bot');
            }, 100);
            
            setConversationContext(prev => ({ ...prev, addressField: null }));
            
            return {
              ...currentState,
              stage: 'confirmation',
              currentOrder: updatedOrder
            };
          }
        }

        // Comando finalizar pedido
        if (lowerMessage.includes('finalizar')) {
          if (currentState.currentOrder.items.length === 0) {
            setTimeout(() => {
              addMessage('🤔 Opa! Você ainda não escolheu nada! Que tal dar uma olhada no nosso cardápio? Digite "cardápio" para ver nossas delícias! 😊', 'bot');
            }, 100);
            return currentState;
          }
          
          setTimeout(() => {
            addMessage('🏠 Perfeito! Agora vou precisar do seu endereço para entrega. Primeiro, qual é o seu nome?', 'bot');
          }, 100);
          
          setConversationContext(prev => ({ ...prev, addressField: null }));
          return { ...currentState, stage: 'address' };
        }

        // Comando continuar pedido
        if (lowerMessage.includes('continuar pedido') || lowerMessage.includes('continuar')) {
          setTimeout(() => {
            addMessage('😋 Ótimo! O que mais você gostaria de adicionar? Posso te mostrar o cardápio novamente se quiser!', 'bot');
          }, 100);
          return { ...currentState, stage: 'ordering' };
        }

        // Consultas sobre ingredientes - MELHORADA
        if (lowerMessage.includes('ingrediente') || lowerMessage.includes('tem o que') || 
            lowerMessage.includes('feita com') || lowerMessage.includes('oque vai') || 
            lowerMessage.includes('o que vai')) {
          const item = findMenuItem(userMessage);
          if (item) {
            let ingredientsText;
            if (item.ingredients.length > 0) {
              const ingredientsList = item.ingredients.join(', ');
              ingredientsText = `🍅 A ${getItemIcon(item)} ${item.name} leva: ${ingredientsList}! 

Uma combinação perfeita que vai te deixar com água na boca! 😋 

Gostaria de adicionar ao pedido? É só falar "quero"!`;
            } else {
              ingredientsText = `${getItemIcon(item)} A ${item.name} já vem prontinha para você! 🥤

Que tal adicionar ao pedido? Fala "quero" que eu coloco! 😊`;
            }
            
            setTimeout(() => {
              addMessage(ingredientsText, 'bot');
            }, 100);
            
            setConversationContext({ lastQueriedItem: item, lastAction: 'ingredients', addressField: null });
          } else {
            setTimeout(() => {
              addMessage('🤔 Hmm, não consegui identificar qual item você está perguntando! Pode me falar o nome da pizza de novo? Ou digite "cardápio" para ver todas as opções! 😊', 'bot');
            }, 100);
          }
          return currentState;
        }

        // Consultas sobre preço - MELHORADA
        if (lowerMessage.includes('preço') || lowerMessage.includes('quanto custa') || 
            lowerMessage.includes('valor') || lowerMessage.includes('quanto')) {
          const item = findMenuItem(userMessage);
          if (item) {
            let priceText = `💰 A ${getItemIcon(item)} ${item.name} sai por R$ ${item.price.toFixed(2)}`;
            if (item.priceSmall) {
              priceText += ` (tamanho grande) ou R$ ${item.priceSmall.toFixed(2)} (broto)`;
            }
            priceText += `! 

Um preço justo por uma pizza deliciosa! 😋 Gostaria de adicionar ao pedido?`;
            
            setTimeout(() => {
              addMessage(priceText, 'bot');
            }, 100);
            
            setConversationContext({ lastQueriedItem: item, lastAction: 'price', addressField: null });
          } else {
            setTimeout(() => {
              addMessage('🤔 Não consegui identificar qual item você quer saber o preço! Pode repetir o nome? Ou digite "cardápio" para ver tudo com os preços! 💰', 'bot');
            }, 100);
          }
          return currentState;
        }

        // Busca direta por item - MUITO MELHORADA
        const directItem = findMenuItem(userMessage);
        if (directItem && !lowerMessage.includes('cardápio') && !lowerMessage.includes('menu')) {
          let itemText = `${getItemIcon(directItem)} Ótima escolha! A ${directItem.name} é uma das nossas queridinhas! 😍`;
          
          if (directItem.ingredients.length > 0) {
            const ingredientsList = directItem.ingredients.join(', ');
            itemText += `\n\n🍅 Vem com: ${ingredientsList}`;
          }
          
          itemText += `\n💰 Preço: R$ ${directItem.price.toFixed(2)}`;
          if (directItem.priceSmall) {
            itemText += ` (grande) ou R$ ${directItem.priceSmall.toFixed(2)} (broto)`;
          }
          
          itemText += '\n\n😋 Quer colocar no pedido? É só falar "quero"!';
          
          setTimeout(() => {
            addMessage(itemText, 'bot');
          }, 100);
          
          setConversationContext({ lastQueriedItem: directItem, lastAction: null, addressField: null });
          return currentState;
        }

        // Verificar se quer adicionar o item do contexto
        if ((lowerMessage.includes('quero') || lowerMessage.includes('vou querer') || 
             lowerMessage.includes('adicionar') || lowerMessage.includes('pedir')) && 
             conversationContext.lastQueriedItem && !findMenuItem(userMessage)) {
          const item = conversationContext.lastQueriedItem;
          const newTotal = currentState.currentOrder.total + item.price;
          
          setTimeout(() => {
            addMessage(`🎉 Perfeito! Coloquei a ${getItemIcon(item)} ${item.name} no seu pedido! 

💰 **Total atual:** R$ ${newTotal.toFixed(2)}

Quer adicionar mais alguma coisa? Fala "continuar pedido" ou "finalizar" para prosseguir! 😊`, 'bot');
          }, 100);

          return {
            ...currentState,
            stage: 'ordering',
            currentOrder: {
              ...currentState.currentOrder,
              items: [...currentState.currentOrder.items, {
                menuItem: { ...item },
                quantity: 1,
                removedIngredients: []
              }],
              total: newTotal
            }
          };
        }

        if (lowerMessage.includes('cardápio') || lowerMessage.includes('menu') || lowerMessage.includes('opções')) {
          const pizzas = menu.filter(item => item.category === 'pizza' && item.available);
          const bebidas = menu.filter(item => item.category === 'bebida' && item.available);
          const bordas = menu.filter(item => item.category === 'entrada' && item.available);
          const sobremesas = menu.filter(item => item.category === 'sobremesa' && item.available);
          
          let menuText = '📋 Aqui está nosso delicioso cardápio da Pizzaria Frajola! 🍕\n\n🍕 PIZZAS CLÁSSICAS & ESPECIAIS:\n';
          pizzas.slice(0, 10).forEach(pizza => {
            menuText += `${getItemIcon(pizza)} ${pizza.name} - R$ ${pizza.price.toFixed(2)}\n`;
          });
          
          if (bordas.length > 0) {
            menuText += '\n🥖 BORDAS RECHEADAS:\n';
            bordas.forEach(borda => {
              menuText += `${getItemIcon(borda)} ${borda.name} - R$ ${borda.price.toFixed(2)}\n`;
            });
          }
          
          if (bebidas.length > 0) {
            menuText += '\n🥤 BEBIDAS:\n';
            bebidas.forEach(bebida => {
              menuText += `${getItemIcon(bebida)} ${bebida.name} - R$ ${bebida.price.toFixed(2)}\n`;
            });
          }
          
          menuText += '\n💡 Dica: Pergunte "o que vai na pizza de calabresa?" ou "quanto custa a margherita?" 😊\n📱 Delivery: (17) - @pizzariamassamia';
          
          setTimeout(() => {
            addMessage(menuText, 'bot');
          }, 100);
          
          setConversationContext({ lastQueriedItem: null, lastAction: 'menu', addressField: null });
          return currentState;
        }

        // Fazer pedido
        if (lowerMessage.includes('pedido') || lowerMessage.includes('quero') || lowerMessage.includes('pedir')) {
          setTimeout(() => {
            addMessage('🎉 Que bom! Vamos fazer seu pedido! Me diga qual pizza você quer, posso personalizar removendo ingredientes se preferir! E não esqueça das nossas bordas recheadas! 😋', 'bot');
          }, 100);
          
          return { ...currentState, stage: 'ordering' };
        }
      }

      // Usar ChatGPT para conversas casuais
      if (shouldUseAI) {
        const recentMessages = currentState.messages.slice(-5).map(msg => msg.text);
        const context = chatService.createContextForOpenAI(recentMessages);
        
        callOpenAI(userMessage, context).then(aiResponse => {
          if (aiResponse.includes('problemas técnicos') || aiResponse.includes('quota')) {
            if (chatService.isCasualConversation(userMessage)) {
              addMessage('😊 Oi! Eu sou a Frajola da Pizzaria! Como posso te ajudar hoje? Posso mostrar nosso cardápio, ajudar com pedidos ou tirar suas dúvidas sobre nossas deliciosas pizzas! 🍕', 'bot');
            } else {
              addMessage('😊 Desculpe, não entendi muito bem! Mas posso te ajudar com:\n\n• Ver o cardápio completo\n• Consultar preços e ingredientes\n• Fazer um pedido\n• Falar com um atendente humano\n\nO que você gostaria de fazer? 🍕', 'bot');
            }
          } else {
            addMessage(aiResponse, 'bot');
          }
        }).catch(() => {
          addMessage('😊 Oi! Sou a Frajola da Pizzaria! Como posso te ajudar hoje? Digite "cardápio" para ver nossas deliciosas opções! 🍕', 'bot');
        });
        
        return currentState;
      }

      // Fallback melhorado
      setTimeout(() => {
        addMessage('😊 Ops! Não entendi direito! Mas posso te ajudar com:\n\n• "cardápio" - ver todas as pizzas\n• "o que vai na pizza de calabresa?" - ingredientes\n• "quanto custa a margherita?" - preços\n• "quero fazer um pedido" - começar pedido\n• "humano" - falar com atendente\n\nO que você gostaria? 🍕', 'bot');
      }, 100);
      
      return currentState;
    });
  }, [addMessage, findMenuItem, menu, estimatedTime, conversationContext, getItemIcon, callOpenAI, chatService]);

  return {
    state,
    setState,
    addMessage,
    processMessage,
    findMenuItem,
    conversationContext,
    isLoadingAI: isLoading
  };
};
