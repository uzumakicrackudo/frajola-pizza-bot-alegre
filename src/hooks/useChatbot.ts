import { useState, useCallback } from 'react';
import { ChatMessage, ChatbotState, MenuItem, OrderItem, CustomerInfo } from '@/types/chatbot';

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
        text: '🍕 Olá! Eu sou a Frajola, sua assistente virtual da pizzaria! 😊 Estou aqui para ajudar você a fazer o melhor pedido! Como posso te ajudar hoje?',
        sender: 'bot',
        timestamp: new Date()
      }
    ],
    awaitingHuman: false
  });

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

  const findMenuItem = useCallback((query: string): MenuItem | null => {
    const lowerQuery = query.toLowerCase();
    
    // Busca exata primeiro
    let found = menu.find(item => 
      item.available && item.name.toLowerCase().includes(lowerQuery)
    );
    
    // Se não encontrar, busca por palavras-chave específicas
    if (!found) {
      if (lowerQuery.includes('margherita') || lowerQuery.includes('marguerita')) {
        found = menu.find(item => item.name.toLowerCase().includes('margherita'));
      } else if (lowerQuery.includes('calabresa')) {
        found = menu.find(item => item.name.toLowerCase().includes('calabresa'));
      } else if (lowerQuery.includes('portuguesa')) {
        found = menu.find(item => item.name.toLowerCase().includes('portuguesa'));
      } else if (lowerQuery.includes('frango')) {
        found = menu.find(item => item.name.toLowerCase().includes('frango'));
      } else if (lowerQuery.includes('4 queijos') || lowerQuery.includes('quatro queijos')) {
        found = menu.find(item => item.name.toLowerCase().includes('4 queijos'));
      } else if (lowerQuery.includes('presunto')) {
        found = menu.find(item => item.name.toLowerCase().includes('presunto'));
      } else if (lowerQuery.includes('filé') || lowerQuery.includes('file')) {
        found = menu.find(item => item.name.toLowerCase().includes('filé'));
      } else if (lowerQuery.includes('strogonoff')) {
        found = menu.find(item => item.name.toLowerCase().includes('strogonoff'));
      } else if (lowerQuery.includes('borda')) {
        found = menu.find(item => item.name.toLowerCase().includes('borda') && item.name.toLowerCase().includes(lowerQuery.replace('borda', '').trim()));
      }
    }
    
    return found || null;
  }, [menu]);

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

  const processMessage = useCallback((userMessage: string) => {
    addMessage(userMessage, 'user');

    const lowerMessage = userMessage.toLowerCase();

    // Verificar se quer falar com humano
    if (lowerMessage.includes('humano') || lowerMessage.includes('atendente') || 
        lowerMessage.includes('pessoa') || lowerMessage.includes('ajuda especializada')) {
      setState(prev => ({ ...prev, stage: 'human', awaitingHuman: true }));
      addMessage('🤝 Entendo! Vou conectar você com um de nossos atendentes humanos. Por favor, aguarde um momento...', 'bot');
      return;
    }

    // Fluxo de coleta de endereço
    if (state.stage === 'address') {
      if (!conversationContext.addressField) {
        // Começar coletando o nome
        setState(prev => ({
          ...prev,
          currentOrder: {
            ...prev.currentOrder,
            customerInfo: { ...prev.currentOrder.customerInfo, name: userMessage }
          }
        }));
        setConversationContext(prev => ({ ...prev, addressField: 'street' }));
        addMessage('📍 Perfeito! Agora me diga o nome da sua rua:', 'bot');
        return;
      } else if (conversationContext.addressField === 'street') {
        setState(prev => ({
          ...prev,
          currentOrder: {
            ...prev.currentOrder,
            customerInfo: { ...prev.currentOrder.customerInfo, street: userMessage }
          }
        }));
        setConversationContext(prev => ({ ...prev, addressField: 'number' }));
        addMessage('🏠 Agora me diga o número da sua casa:', 'bot');
        return;
      } else if (conversationContext.addressField === 'number') {
        setState(prev => ({
          ...prev,
          currentOrder: {
            ...prev.currentOrder,
            customerInfo: { ...prev.currentOrder.customerInfo, number: userMessage }
          }
        }));
        setConversationContext(prev => ({ ...prev, addressField: 'neighborhood' }));
        addMessage('🏘️ Por último, qual é o seu bairro?', 'bot');
        return;
      } else if (conversationContext.addressField === 'neighborhood') {
        setState(prev => ({
          ...prev,
          currentOrder: {
            ...prev.currentOrder,
            customerInfo: { ...prev.currentOrder.customerInfo, neighborhood: userMessage }
          },
          stage: 'confirmation'
        }));
        setConversationContext(prev => ({ ...prev, addressField: null }));
        
        // Mostrar resumo do pedido
        const orderSummary = state.currentOrder.items.map(item => 
          `• ${item.menuItem.name} - R$ ${item.menuItem.price.toFixed(2)}`
        ).join('\n');
        
        addMessage(`🎉 Pedido confirmado! Aqui está o resumo:

📋 **RESUMO DO PEDIDO:**
${orderSummary}

💰 **Total:** R$ ${state.currentOrder.total.toFixed(2)}

🏠 **Endereço de entrega:**
${state.currentOrder.customerInfo.name}
${state.currentOrder.customerInfo.street}, ${state.currentOrder.customerInfo.number}
${state.currentOrder.customerInfo.neighborhood}

⏰ **Tempo estimado:** ${estimatedTime} minutos

✅ Seu pedido foi registrado! Nossa equipe já começou a preparar. Você receberá uma ligação para confirmar os detalhes!

Obrigada por escolher a Pizzaria Frajola! 🍕❤️`, 'bot');
        return;
      }
    }

    // Comando finalizar - ir para coleta de endereço
    if (lowerMessage.includes('finalizar')) {
      if (state.currentOrder.items.length === 0) {
        addMessage('🤔 Você ainda não adicionou nenhum item ao pedido! Que tal escolher uma deliciosa pizza primeiro? Digite "cardápio" para ver nossas opções! 😊', 'bot');
        return;
      }
      
      setState(prev => ({ ...prev, stage: 'address' }));
      setConversationContext(prev => ({ ...prev, addressField: null }));
      addMessage('🏠 Perfeito! Agora vou precisar do seu endereço para entrega. Primeiro, qual é o seu nome?', 'bot');
      return;
    }

    // Comando continuar pedido
    if (lowerMessage.includes('continuar pedido') || lowerMessage.includes('continuar')) {
      setState(prev => ({ ...prev, stage: 'ordering' }));
      addMessage('😋 Que ótimo! O que mais você gostaria de adicionar ao pedido? Posso te mostrar o cardápio novamente se quiser!', 'bot');
      return;
    }

    // Verificar se é uma consulta de preço com contexto
    if ((lowerMessage.includes('preço') || lowerMessage.includes('quanto custa') || lowerMessage.includes('valor')) && 
        !findMenuItem(userMessage) && conversationContext.lastQueriedItem) {
      const item = conversationContext.lastQueriedItem;
      let priceText = `💰 A ${item.name} custa R$ ${item.price.toFixed(2)}`;
      if (item.priceSmall) {
        priceText += ` (tamanho grande) ou R$ ${item.priceSmall.toFixed(2)} (broto)`;
      }
      priceText += '! Uma delícia que vale cada centavo! 😋';
      addMessage(priceText, 'bot');
      setConversationContext(prev => ({ ...prev, lastAction: 'price' }));
      return;
    }

    // Verificar se é uma consulta de ingredientes com contexto
    if ((lowerMessage.includes('ingrediente') || lowerMessage.includes('tem o que') || lowerMessage.includes('feita com')) && 
        !findMenuItem(userMessage) && conversationContext.lastQueriedItem) {
      const item = conversationContext.lastQueriedItem;
      if (item.ingredients.length > 0) {
        const ingredientsList = item.ingredients.join(', ');
        addMessage(`🍅 A ${item.name} é feita com: ${ingredientsList}. Fica uma delícia! 😍`, 'bot');
      } else {
        addMessage(`A ${item.name} está pronta para você! 🥤`, 'bot');
      }
      setConversationContext(prev => ({ ...prev, lastAction: 'ingredients' }));
      return;
    }

    // Verificar se quer adicionar o item do contexto
    if ((lowerMessage.includes('quero') || lowerMessage.includes('vou querer') || lowerMessage.includes('adicionar') || 
         lowerMessage.includes('pedir')) && conversationContext.lastQueriedItem && !findMenuItem(userMessage)) {
      const item = conversationContext.lastQueriedItem;
      addItemToOrder(item);
      setState(prev => ({ ...prev, stage: 'ordering' }));
      addMessage(`🎉 Perfeito! Adicionei a ${item.name} ao seu pedido! 

💰 **Total atual:** R$ ${(state.currentOrder.total + item.price).toFixed(2)}

Gostaria de adicionar mais alguma coisa? Digite "continuar pedido" para adicionar mais itens, ou "finalizar" para prosseguir com o endereço de entrega! 😊`, 'bot');
      return;
    }

    // Consultas sobre preço com item específico
    if (lowerMessage.includes('preço') || lowerMessage.includes('quanto custa') || lowerMessage.includes('valor')) {
      const item = findMenuItem(userMessage);
      if (item) {
        let priceText = `💰 A ${item.name} custa R$ ${item.price.toFixed(2)}`;
        if (item.priceSmall) {
          priceText += ` (tamanho grande) ou R$ ${item.priceSmall.toFixed(2)} (broto)`;
        }
        priceText += '! Uma delícia que vale cada centavo! 😋';
        addMessage(priceText, 'bot');
        setConversationContext({ lastQueriedItem: item, lastAction: 'price', addressField: null });
        return;
      } else {
        addMessage('🤔 Não encontrei esse item no nosso cardápio. Que tal dar uma olhada em nossas opções? Digite "cardápio" para ver tudo!', 'bot');
        return;
      }
    }

    // Consultas sobre ingredientes com item específico
    if (lowerMessage.includes('ingrediente') || lowerMessage.includes('tem o que') || lowerMessage.includes('feita com')) {
      const item = findMenuItem(userMessage);
      if (item) {
        if (item.ingredients.length > 0) {
          const ingredientsList = item.ingredients.join(', ');
          addMessage(`🍅 A ${item.name} é feita com: ${ingredientsList}. Fica uma delícia! 😍`, 'bot');
        } else {
          addMessage(`A ${item.name} está pronta para você! 🥤`, 'bot');
        }
        setConversationContext({ lastQueriedItem: item, lastAction: 'ingredients', addressField: null });
        return;
      } else {
        addMessage('🤔 Não encontrei esse item. Posso te mostrar nosso cardápio completo! Digite "cardápio" para ver todas as opções.', 'bot');
        return;
      }
    }

    // Mostrar cardápio
    if (lowerMessage.includes('cardápio') || lowerMessage.includes('menu') || lowerMessage.includes('opções')) {
      const pizzas = menu.filter(item => item.category === 'pizza' && item.available);
      const bebidas = menu.filter(item => item.category === 'bebida' && item.available);
      const bordas = menu.filter(item => item.category === 'entrada' && item.available);
      const sobremesas = menu.filter(item => item.category === 'sobremesa' && item.available);
      
      let menuText = '📋 Aqui está nosso delicioso cardápio da Pizzaria Frajola! 🍕\n\n🍕 PIZZAS CLÁSSICAS & ESPECIAIS:\n';
      pizzas.slice(0, 10).forEach(pizza => {
        menuText += `• ${pizza.name} - R$ ${pizza.price.toFixed(2)}\n`;
      });
      
      if (bordas.length > 0) {
        menuText += '\n🥖 BORDAS RECHEADAS:\n';
        bordas.forEach(borda => {
          menuText += `• ${borda.name} - R$ ${borda.price.toFixed(2)}\n`;
        });
      }
      
      if (bebidas.length > 0) {
        menuText += '\n🥤 BEBIDAS:\n';
        bebidas.forEach(bebida => {
          menuText += `• ${bebida.name} - R$ ${bebida.price.toFixed(2)}\n`;
        });
      }
      
      menuText += '\n💡 Dica: Pergunte sobre ingredientes ou preços de qualquer item! O que te chama atenção? 😊\n📱 Também temos delivery! (17) - @pizzariamassamia';
      
      addMessage(menuText, 'bot');
      setConversationContext({ lastQueriedItem: null, lastAction: 'menu', addressField: null });
      return;
    }

    // Fazer pedido
    if (lowerMessage.includes('pedido') || lowerMessage.includes('quero') || lowerMessage.includes('pedir')) {
      setState(prev => ({ ...prev, stage: 'ordering' }));
      addMessage('🎉 Que ótimo! Vamos fazer seu pedido! Me diga qual pizza e bebidas você gostaria. Posso também personalizar removendo ingredientes se preferir! E não esqueça das nossas deliciosas bordas recheadas! 😋', 'bot');
      return;
    }

    // Resposta padrão amigável
    addMessage('😊 Desculpe, não entendi muito bem! Posso te ajudar com:\n\n• Ver o cardápio completo\n• Consultar preços e ingredientes\n• Fazer um pedido\n• Falar com um atendente humano\n• Informações sobre delivery\n\nO que você gostaria de fazer? 🍕', 'bot');
  }, [addMessage, findMenuItem, menu, setState, conversationContext, state.stage, state.currentOrder, estimatedTime, addItemToOrder]);

  return {
    state,
    setState,
    addMessage,
    processMessage,
    findMenuItem,
    conversationContext
  };
};
