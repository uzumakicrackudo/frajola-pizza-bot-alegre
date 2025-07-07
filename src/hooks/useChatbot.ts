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
    console.log('Procurando por:', lowerQuery);
    
    // Busca exata primeiro - nome completo
    let found = menu.find(item => 
      item.available && item.name.toLowerCase().includes(lowerQuery)
    );
    
    if (found) {
      console.log('Encontrado por busca exata:', found.name);
      return found;
    }
    
    // Busca por palavras-chave específicas expandida
    const searchTerms = [
      { keywords: ['margherita', 'marguerita', 'margarita'], pizza: 'margherita' },
      { keywords: ['calabresa'], pizza: 'calabresa' },
      { keywords: ['portuguesa'], pizza: 'portuguesa' },
      { keywords: ['frango', 'catupiry'], pizza: 'frango' },
      { keywords: ['4 queijos', 'quatro queijos', '4queijos'], pizza: '4 queijos' },
      { keywords: ['presunto', 'queijo'], pizza: 'presunto' },
      { keywords: ['filé', 'file', 'mignon'], pizza: 'filé' },
      { keywords: ['strogonoff'], pizza: 'strogonoff' },
      { keywords: ['fernando'], pizza: 'fernando' },
      { keywords: ['mussarela'], pizza: 'mussarela' },
      { keywords: ['2 queijos', 'dois queijos'], pizza: '2 queijos' },
      { keywords: ['3 queijos', 'três queijos'], pizza: '3 queijos' },
      { keywords: ['4 carnes', 'quatro carnes'], pizza: '4 carnes' },
      { keywords: ['lombo'], pizza: 'lombo' },
      { keywords: ['especial'], pizza: 'especial' },
      { keywords: ['melt'], pizza: 'melt' },
      { keywords: ['palmito'], pizza: 'palmito' },
      { keywords: ['milho'], pizza: 'milho' },
      { keywords: ['brócolis', 'brocolis'], pizza: 'brócolis' },
      { keywords: ['rúcula', 'rucula'], pizza: 'rúcula' },
    ];
    
    // Busca por termos específicos
    for (const term of searchTerms) {
      if (term.keywords.some(keyword => lowerQuery.includes(keyword))) {
        found = menu.find(item => 
          item.available && item.name.toLowerCase().includes(term.pizza)
        );
        if (found) {
          console.log('Encontrado por palavra-chave:', found.name);
          return found;
        }
      }
    }
    
    // Busca por bordas
    if (lowerQuery.includes('borda')) {
      const bordaTypes = ['catupiry', 'cheddar', 'chocolate', 'mista', 'bacon', 'mussarela'];
      for (const type of bordaTypes) {
        if (lowerQuery.includes(type)) {
          found = menu.find(item => 
            item.available && 
            item.name.toLowerCase().includes('borda') && 
            item.name.toLowerCase().includes(type)
          );
          if (found) {
            console.log('Encontrado borda:', found.name);
            return found;
          }
        }
      }
    }
    
    // Busca por bebidas
    if (lowerQuery.includes('coca') || lowerQuery.includes('refrigerante')) {
      found = menu.find(item => item.available && item.name.toLowerCase().includes('coca'));
    } else if (lowerQuery.includes('guaraná') || lowerQuery.includes('guarana')) {
      found = menu.find(item => item.available && item.name.toLowerCase().includes('guaraná'));
    } else if (lowerQuery.includes('suco') || lowerQuery.includes('laranja')) {
      found = menu.find(item => item.available && item.name.toLowerCase().includes('suco'));
    }
    
    if (found) {
      console.log('Encontrado bebida:', found.name);
    } else {
      console.log('Nenhum item encontrado para:', lowerQuery);
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

    // Usar callback para ter acesso ao estado mais atual
    setState(currentState => {
      const lowerMessage = userMessage.toLowerCase();

      // Verificar se quer falar com humano
      if (lowerMessage.includes('humano') || lowerMessage.includes('atendente') || 
          lowerMessage.includes('pessoa') || lowerMessage.includes('ajuda especializada')) {
        
        setTimeout(() => {
          addMessage('🤝 Entendo! Vou conectar você com um de nossos atendentes humanos. Por favor, aguarde um momento...', 'bot');
        }, 100);
        
        return { ...currentState, stage: 'human', awaitingHuman: true };
      }

      // Fluxo de coleta de endereço
      if (currentState.stage === 'address') {
        if (!conversationContext.addressField) {
          // Começar coletando o nome
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
              `• ${item.menuItem.name} - R$ ${item.menuItem.price.toFixed(2)}`
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

      // Comando finalizar - ir para coleta de endereço
      if (lowerMessage.includes('finalizar')) {
        if (currentState.currentOrder.items.length === 0) {
          setTimeout(() => {
            addMessage('🤔 Você ainda não adicionou nenhum item ao pedido! Que tal escolher uma deliciosa pizza primeiro? Digite "cardápio" para ver nossas opções! 😊', 'bot');
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
          addMessage('😋 Que ótimo! O que mais você gostaria de adicionar ao pedido? Posso te mostrar o cardápio novamente se quiser!', 'bot');
        }, 100);
        return { ...currentState, stage: 'ordering' };
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
        
        setTimeout(() => {
          addMessage(priceText, 'bot');
        }, 100);
        
        setConversationContext(prev => ({ ...prev, lastAction: 'price' }));
        return currentState;
      }

      // Verificar se é uma consulta de ingredientes com contexto
      if ((lowerMessage.includes('ingrediente') || lowerMessage.includes('tem o que') || lowerMessage.includes('feita com')) && 
          !findMenuItem(userMessage) && conversationContext.lastQueriedItem) {
        const item = conversationContext.lastQueriedItem;
        let ingredientsText;
        if (item.ingredients.length > 0) {
          const ingredientsList = item.ingredients.join(', ');
          ingredientsText = `🍅 A ${item.name} é feita com: ${ingredientsList}. Fica uma delícia! 😍`;
        } else {
          ingredientsText = `A ${item.name} está pronta para você! 🥤`;
        }
        
        setTimeout(() => {
          addMessage(ingredientsText, 'bot');
        }, 100);
        
        setConversationContext(prev => ({ ...prev, lastAction: 'ingredients' }));
        return currentState;
      }

      // Verificar se quer adicionar o item do contexto
      if ((lowerMessage.includes('quero') || lowerMessage.includes('vou querer') || lowerMessage.includes('adicionar') || 
           lowerMessage.includes('pedir')) && conversationContext.lastQueriedItem && !findMenuItem(userMessage)) {
        const item = conversationContext.lastQueriedItem;
        const newTotal = currentState.currentOrder.total + item.price;
        
        setTimeout(() => {
          addMessage(`🎉 Perfeito! Adicionei a ${item.name} ao seu pedido! 

💰 **Total atual:** R$ ${newTotal.toFixed(2)}

Gostaria de adicionar mais alguma coisa? Digite "continuar pedido" para adicionar mais itens, ou "finalizar" para prosseguir com o endereço de entrega! 😊`, 'bot');
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

      // Consultas sobre preço com item específico
      if (lowerMessage.includes('preço') || lowerMessage.includes('quanto custa') || lowerMessage.includes('valor')) {
        const item = findMenuItem(userMessage);
        if (item) {
          let priceText = `💰 A ${item.name} custa R$ ${item.price.toFixed(2)}`;
          if (item.priceSmall) {
            priceText += ` (tamanho grande) ou R$ ${item.priceSmall.toFixed(2)} (broto)`;
          }
          priceText += '! Uma delícia que vale cada centavo! 😋';
          
          setTimeout(() => {
            addMessage(priceText, 'bot');
          }, 100);
          
          setConversationContext({ lastQueriedItem: item, lastAction: 'price', addressField: null });
        } else {
          setTimeout(() => {
            addMessage('🤔 Não encontrei esse item no nosso cardápio. Que tal dar uma olhada em nossas opções? Digite "cardápio" para ver tudo!', 'bot');
          }, 100);
        }
        return currentState;
      }

      // Consultas sobre ingredientes com item específico
      if (lowerMessage.includes('ingrediente') || lowerMessage.includes('tem o que') || lowerMessage.includes('feita com')) {
        const item = findMenuItem(userMessage);
        if (item) {
          let ingredientsText;
          if (item.ingredients.length > 0) {
            const ingredientsList = item.ingredients.join(', ');
            ingredientsText = `🍅 A ${item.name} é feita com: ${ingredientsList}. Fica uma delícia! 😍`;
          } else {
            ingredientsText = `A ${item.name} está pronta para você! 🥤`;
          }
          
          setTimeout(() => {
            addMessage(ingredientsText, 'bot');
          }, 100);
          
          setConversationContext({ lastQueriedItem: item, lastAction: 'ingredients', addressField: null });
        } else {
          setTimeout(() => {
            addMessage('🤔 Não encontrei esse item. Posso te mostrar nosso cardápio completo! Digite "cardápio" para ver todas as opções.', 'bot');
          }, 100);
        }
        return currentState;
      }

      // Busca direta por item (quando usuário digita apenas o nome da pizza)
      const directItem = findMenuItem(userMessage);
      if (directItem && !lowerMessage.includes('cardápio') && !lowerMessage.includes('menu')) {
        let itemText = `🍕 Ótima escolha! A ${directItem.name} é uma das nossas especialidades!`;
        
        if (directItem.ingredients.length > 0) {
          const ingredientsList = directItem.ingredients.join(', ');
          itemText += `\n\n🍅 Ingredientes: ${ingredientsList}`;
        }
        
        itemText += `\n💰 Preço: R$ ${directItem.price.toFixed(2)}`;
        if (directItem.priceSmall) {
          itemText += ` (grande) ou R$ ${directItem.priceSmall.toFixed(2)} (broto)`;
        }
        
        itemText += '\n\n😋 Gostaria de adicionar ao pedido? Digite "quero" ou "vou querer"!';
        
        setTimeout(() => {
          addMessage(itemText, 'bot');
        }, 100);
        
        setConversationContext({ lastQueriedItem: directItem, lastAction: null, addressField: null });
        return currentState;
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
        
        setTimeout(() => {
          addMessage(menuText, 'bot');
        }, 100);
        
        setConversationContext({ lastQueriedItem: null, lastAction: 'menu', addressField: null });
        return currentState;
      }

      // Fazer pedido
      if (lowerMessage.includes('pedido') || lowerMessage.includes('quero') || lowerMessage.includes('pedir')) {
        setTimeout(() => {
          addMessage('🎉 Que ótimo! Vamos fazer seu pedido! Me diga qual pizza e bebidas você gostaria. Posso também personalizar removendo ingredientes se preferir! E não esqueça das nossas deliciosas bordas recheadas! 😋', 'bot');
        }, 100);
        
        return { ...currentState, stage: 'ordering' };
      }

      // Resposta padrão amigável
      setTimeout(() => {
        addMessage('😊 Desculpe, não entendi muito bem! Posso te ajudar com:\n\n• Ver o cardápio completo\n• Consultar preços e ingredientes\n• Fazer um pedido\n• Falar com um atendente humano\n• Informações sobre delivery\n\nO que você gostaria de fazer? 🍕', 'bot');
      }, 100);
      
      return currentState;
    });
  }, [addMessage, findMenuItem, menu, estimatedTime, conversationContext]);

  return {
    state,
    setState,
    addMessage,
    processMessage,
    findMenuItem,
    conversationContext
  };
};
