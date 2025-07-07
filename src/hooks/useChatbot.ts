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

  // Função para calcular similaridade entre strings (Levenshtein distance simplificada)
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[^a-z]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z]/g, '');
    
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLen = Math.max(s1.length, s2.length);
    return (maxLen - matrix[s2.length][s1.length]) / maxLen;
  }, []);

  // Função melhorada para encontrar item no menu com tolerância a erros ortográficos
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
    
    // Busca por palavras-chave específicas expandida com variações ortográficas
    const searchTerms = [
      { keywords: ['margherita', 'marguerita', 'margarita', 'margaritta', 'margerita'], pizza: 'margherita' },
      { keywords: ['calabresa', 'calabreza', 'calebresa', 'calebresa'], pizza: 'calabresa' },
      { keywords: ['portuguesa', 'portugueza', 'portugesa'], pizza: 'portuguesa' },
      { keywords: ['frango', 'franco', 'catupiry', 'catupiri', 'catupury'], pizza: 'frango' },
      { keywords: ['4 queijos', 'quatro queijos', '4queijos', 'quatroqueijos', 'quatro queijo'], pizza: '4 queijos' },
      { keywords: ['presunto', 'prezunto', 'preçunto', 'queijo'], pizza: 'presunto' },
      { keywords: ['filé', 'file', 'mignon', 'minion'], pizza: 'filé' },
      { keywords: ['strogonoff', 'strogonof', 'estrogonoff'], pizza: 'strogonoff' },
      { keywords: ['fernando'], pizza: 'fernando' },
      { keywords: ['mussarela', 'muçarela', 'mozarela', 'mossarela'], pizza: 'mussarela' },
      { keywords: ['2 queijos', 'dois queijos', 'doisqueijos'], pizza: '2 queijos' },
      { keywords: ['3 queijos', 'três queijos', 'tresqueijos'], pizza: '3 queijos' },
      { keywords: ['4 carnes', 'quatro carnes', 'quatrocarnes'], pizza: '4 carnes' },
      { keywords: ['lombo'], pizza: 'lombo' },
      { keywords: ['especial', 'espesial'], pizza: 'especial' },
      { keywords: ['melt'], pizza: 'melt' },
      { keywords: ['palmito', 'palmitto'], pizza: 'palmito' },
      { keywords: ['milho', 'miho'], pizza: 'milho' },
      { keywords: ['brócolis', 'brocolis', 'broculi', 'brócolli'], pizza: 'brócolis' },
      { keywords: ['rúcula', 'rucula', 'rukula'], pizza: 'rúcula' },
    ];
    
    // Busca por termos específicos com tolerância a erros
    for (const term of searchTerms) {
      for (const keyword of term.keywords) {
        if (lowerQuery.includes(keyword) || calculateSimilarity(lowerQuery, keyword) > 0.7) {
          found = menu.find(item => 
            item.available && item.name.toLowerCase().includes(term.pizza)
          );
          if (found) {
            console.log('Encontrado por palavra-chave com correção:', found.name);
            return found;
          }
        }
      }
    }
    
    // Busca fuzzy em todos os itens do menu
    let bestMatch: MenuItem | null = null;
    let bestScore = 0;
    
    for (const item of menu) {
      if (!item.available) continue;
      
      const similarity = calculateSimilarity(lowerQuery, item.name);
      if (similarity > 0.6 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = item;
      }
    }
    
    if (bestMatch) {
      console.log('Encontrado por busca fuzzy:', bestMatch.name, 'Score:', bestScore);
      return bestMatch;
    }
    
    // Busca por bordas
    if (lowerQuery.includes('borda')) {
      const bordaTypes = ['catupiry', 'cheddar', 'chocolate', 'mista', 'bacon', 'mussarela'];
      for (const type of bordaTypes) {
        if (lowerQuery.includes(type) || calculateSimilarity(lowerQuery, type) > 0.7) {
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
    
    // Busca por bebidas com correção ortográfica
    const beverageTerms = [
      { keywords: ['coca', 'cocacola', 'coca-cola', 'refrigerante', 'refri'], type: 'coca' },
      { keywords: ['guaraná', 'guarana', 'guarná'], type: 'guaraná' },
      { keywords: ['suco', 'laranja', 'suk', 'laranja'], type: 'suco' }
    ];
    
    for (const beverage of beverageTerms) {
      for (const keyword of beverage.keywords) {
        if (lowerQuery.includes(keyword) || calculateSimilarity(lowerQuery, keyword) > 0.7) {
          found = menu.find(item => item.available && item.name.toLowerCase().includes(beverage.type));
          if (found) {
            console.log('Encontrado bebida:', found.name);
            return found;
          }
        }
      }
    }
    
    console.log('Nenhum item encontrado para:', lowerQuery);
    return null;
  }, [menu, calculateSimilarity]);

  // Função para obter ícone baseado na categoria
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
          addMessage(`🎉 Perfeito! Adicionei a ${getItemIcon(item)} ${item.name} ao seu pedido! 

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
          let priceText = `💰 A ${getItemIcon(item)} ${item.name} custa R$ ${item.price.toFixed(2)}`;
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
            ingredientsText = `🍅 A ${getItemIcon(item)} ${item.name} é feita com: ${ingredientsList}. Fica uma delícia! 😍`;
          } else {
            ingredientsText = `A ${getItemIcon(item)} ${item.name} está pronta para você! 🥤`;
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
        let itemText = `${getItemIcon(directItem)} Ótima escolha! A ${directItem.name} é uma das nossas especialidades!`;
        
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

      // Mostrar cardápio com ícones
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
  }, [addMessage, findMenuItem, menu, estimatedTime, conversationContext, getItemIcon]);

  return {
    state,
    setState,
    addMessage,
    processMessage,
    findMenuItem,
    conversationContext
  };
};
