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

  // Função melhorada para normalizar texto (remove pontuação e acentos)
  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }, []);

  // Função para calcular similaridade entre strings melhorada
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1.length === 0) return s2.length === 0 ? 1 : 0;
    if (s2.length === 0) return 0;
    
    // Se uma string contém a outra, alta similaridade
    if (s1.includes(s2) || s2.includes(s1)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      return minLen / maxLen * 0.9; // Alta pontuação para contenção
    }
    
    // Algoritmo de Levenshtein melhorado
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
  }, [normalizeText]);

  // Função melhorada para encontrar item no menu com melhor tolerância
  const findMenuItem = useCallback((query: string): MenuItem | null => {
    const normalizedQuery = normalizeText(query);
    console.log('Procurando por (normalizado):', normalizedQuery);
    
    // 1. Busca exata no nome normalizado
    let found = menu.find(item => 
      item.available && normalizeText(item.name).includes(normalizedQuery)
    );
    
    if (found) {
      console.log('Encontrado por busca exata:', found.name);
      return found;
    }
    
    // 2. Busca por palavras-chave expandida com variações
    const searchTerms = [
      { keywords: ['margherita', 'marguerita', 'margarita', 'margaritta', 'margerita', 'margarida'], pizza: 'margherita' },
      { keywords: ['calabresa', 'calabreza', 'calebresa', 'calebresa', 'kalabresa'], pizza: 'calabresa' },
      { keywords: ['portuguesa', 'portugueza', 'portugesa', 'portuguza'], pizza: 'portuguesa' },
      { keywords: ['frango', 'franco', 'catupiry', 'catupiri', 'catupury', 'katupiry'], pizza: 'frango' },
      { keywords: ['4 queijos', 'quatro queijos', '4queijos', 'quatroqueijos', 'quatro queijo', '4queijo'], pizza: '4 queijos' },
      { keywords: ['presunto', 'prezunto', 'preçunto', 'queijo'], pizza: 'presunto' },
      { keywords: ['file', 'filee', 'mignon', 'minion', 'fillet'], pizza: 'filé' },
      { keywords: ['strogonoff', 'strogonof', 'estrogonoff', 'estrogonof'], pizza: 'strogonoff' },
      { keywords: ['fernando'], pizza: 'fernando' },
      { keywords: ['mussarela', 'muçarela', 'mozarela', 'mossarela', 'musarela'], pizza: 'mussarela' },
      { keywords: ['2 queijos', 'dois queijos', 'doisqueijos', '2queijos'], pizza: '2 queijos' },
      { keywords: ['3 queijos', 'três queijos', 'tresqueijos', '3queijos', 'tres queijos'], pizza: '3 queijos' },
      { keywords: ['4 carnes', 'quatro carnes', 'quatrocarnes', '4carnes'], pizza: '4 carnes' },
      { keywords: ['lombo'], pizza: 'lombo' },
      { keywords: ['especial', 'espesial', 'espessial'], pizza: 'especial' },
      { keywords: ['melt'], pizza: 'melt' },
      { keywords: ['palmito', 'palmitto', 'palmetto'], pizza: 'palmito' },
      { keywords: ['milho', 'miho', 'milhu'], pizza: 'milho' },
      { keywords: ['brocolis', 'broculi', 'brócolli', 'broculis'], pizza: 'brócolis' },
      { keywords: ['rucula', 'rukula', 'rucola'], pizza: 'rúcula' },
    ];
    
    // Busca por termos específicos com alta tolerância
    for (const term of searchTerms) {
      for (const keyword of term.keywords) {
        const similarity = calculateSimilarity(normalizedQuery, keyword);
        if (similarity > 0.6) {
          found = menu.find(item => 
            item.available && normalizeText(item.name).includes(term.pizza)
          );
          if (found) {
            console.log('Encontrado por palavra-chave com correção:', found.name, 'Similaridade:', similarity);
            return found;
          }
        }
      }
    }
    
    // 3. Busca fuzzy em todos os itens com limiar mais baixo
    let bestMatch: MenuItem | null = null;
    let bestScore = 0;
    
    for (const item of menu) {
      if (!item.available) continue;
      
      const similarity = calculateSimilarity(normalizedQuery, item.name);
      if (similarity > 0.5 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = item;
      }
      
      // Também testa similaridade com palavras individuais
      const itemWords = normalizeText(item.name).split(' ');
      const queryWords = normalizedQuery.split(' ');
      
      for (const itemWord of itemWords) {
        for (const queryWord of queryWords) {
          if (queryWord.length > 2) { // Só palavras com mais de 2 caracteres
            const wordSimilarity = calculateSimilarity(queryWord, itemWord);
            if (wordSimilarity > 0.7 && wordSimilarity > bestScore) {
              bestScore = wordSimilarity;
              bestMatch = item;
            }
          }
        }
      }
    }
    
    if (bestMatch) {
      console.log('Encontrado por busca fuzzy:', bestMatch.name, 'Score:', bestScore);
      return bestMatch;
    }
    
    // 4. Busca por bordas com tolerância
    if (normalizedQuery.includes('borda')) {
      const bordaTypes = ['catupiry', 'cheddar', 'chocolate', 'mista', 'bacon', 'mussarela'];
      for (const type of bordaTypes) {
        const similarity = calculateSimilarity(normalizedQuery, type);
        if (similarity > 0.6) {
          found = menu.find(item => 
            item.available && 
            normalizeText(item.name).includes('borda') && 
            normalizeText(item.name).includes(type)
          );
          if (found) {
            console.log('Encontrado borda:', found.name);
            return found;
          }
        }
      }
    }
    
    // 5. Busca por bebidas com correção ortográfica melhorada
    const beverageTerms = [
      { keywords: ['coca', 'cocacola', 'coca-cola', 'refrigerante', 'refri', 'koka'], type: 'coca' },
      { keywords: ['guarana', 'guarná', 'guaraná', 'guaranna'], type: 'guaraná' },
      { keywords: ['suco', 'laranja', 'suk', 'laranja', 'zumo'], type: 'suco' }
    ];
    
    for (const beverage of beverageTerms) {
      for (const keyword of beverage.keywords) {
        const similarity = calculateSimilarity(normalizedQuery, keyword);
        if (similarity > 0.6) {
          found = menu.find(item => item.available && normalizeText(item.name).includes(beverage.type));
          if (found) {
            console.log('Encontrado bebida:', found.name);
            return found;
          }
        }
      }
    }
    
    console.log('Nenhum item encontrado para:', normalizedQuery);
    return null;
  }, [menu, calculateSimilarity, normalizeText]);

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
