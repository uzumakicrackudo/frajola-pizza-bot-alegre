
import { MenuItem } from '@/types/chatbot';

export const defaultMenu: MenuItem[] = [
  // PIZZAS CLÁSSICAS
  {
    id: '1',
    name: 'Pizza Margherita',
    price: 50.00,
    ingredients: ['mussarela', 'manjericão', 'tomate'],
    category: 'pizza',
    available: true
  },
  {
    id: '2',
    name: 'Pizza Presunto e Queijo',
    price: 55.00,
    ingredients: ['presunto', 'mussarela', 'tomate'],
    category: 'pizza',
    available: true
  },
  {
    id: '3',
    name: 'Pizza Frango com Catupiry',
    price: 55.00,
    ingredients: ['frango', 'mussarela', 'catupiry'],
    category: 'pizza',
    available: true
  },
  {
    id: '4',
    name: 'Pizza Portuguesa',
    price: 60.00,
    ingredients: ['mussarela', 'presunto', 'ervilha', 'palmito', 'ovos', 'cebola'],
    category: 'pizza',
    available: true
  },
  {
    id: '5',
    name: 'Pizza Fernando',
    price: 67.00,
    ingredients: ['mussarela', 'lombo defumado', 'bacon', 'calabresa', 'palmito', 'tomate', 'catupiry'],
    category: 'pizza',
    available: true
  },
  
  // PIZZAS DE QUEIJO
  {
    id: '6',
    name: 'Pizza Mussarela',
    price: 50.00,
    ingredients: ['mussarela', 'tomate', 'orégano', 'azeitona'],
    category: 'pizza',
    available: true
  },
  {
    id: '7',
    name: 'Pizza 2 Queijos',
    price: 56.00,
    ingredients: ['mussarela', 'catupiry', 'tomate', 'orégano', 'azeitona'],
    category: 'pizza',
    available: true
  },
  {
    id: '8',
    name: 'Pizza 3 Queijos',
    price: 57.00,
    ingredients: ['mussarela', 'catupiry', 'provolone', 'tomate', 'orégano', 'azeitona'],
    category: 'pizza',
    available: true
  },
  {
    id: '9',
    name: 'Pizza 4 Queijos',
    price: 60.00,
    ingredients: ['mussarela', 'catupiry', 'provolone', 'gorgonzola', 'tomate', 'orégano', 'azeitona'],
    category: 'pizza',
    available: true
  },

  // PIZZAS DE CARNE
  {
    id: '10',
    name: 'Pizza Filé Mignon',
    price: 78.00,
    ingredients: ['filé mignon', 'cebola', 'mussarela', 'catupiry', 'orégano', 'azeitona'],
    category: 'pizza',
    available: true
  },
  {
    id: '11',
    name: 'Pizza Calabresa',
    price: 55.00,
    ingredients: ['calabresa', 'mussarela', 'cebola', 'azeitona'],
    category: 'pizza',
    available: true
  },
  {
    id: '12',
    name: 'Pizza 4 Carnes',
    price: 70.00,
    ingredients: ['presunto', 'calabresa', 'bacon', 'mussarela', 'lombo canadense'],
    category: 'pizza',
    available: true
  },
  {
    id: '13',
    name: 'Pizza Lombo com Catupiry',
    price: 55.00,
    ingredients: ['mussarela', 'lombo canadense', 'catupiry'],
    category: 'pizza',
    available: true
  },

  // PIZZAS DE FRANGO
  {
    id: '14',
    name: 'Pizza Frango com Catupiry',
    price: 55.00,
    ingredients: ['mussarela', 'frango', 'catupiry'],
    category: 'pizza',
    available: true
  },
  {
    id: '15',
    name: 'Pizza Frango Especial',
    price: 63.00,
    ingredients: ['mussarela', 'frango', 'catupiry', 'ovos', 'palmito', 'milho', 'bacon'],
    category: 'pizza',
    available: true
  },
  {
    id: '16',
    name: 'Pizza Strogonoff',
    price: 56.00,
    ingredients: ['mussarela', 'frango ao molho', 'batata palha'],
    category: 'pizza',
    available: true
  },
  {
    id: '17',
    name: 'Pizza Frango Melt',
    price: 60.00,
    ingredients: ['mussarela', 'frango', 'cheddar', 'cebola caramelizada'],
    category: 'pizza',
    available: true
  },

  // PIZZAS VEGETARIANAS
  {
    id: '18',
    name: 'Pizza Palmito com Catupiry',
    price: 56.00,
    ingredients: ['mussarela', 'palmito', 'catupiry', 'tomate'],
    category: 'pizza',
    available: true
  },
  {
    id: '19',
    name: 'Pizza Milho com Catupiry',
    price: 55.00,
    ingredients: ['mussarela', 'milho', 'catupiry', 'tomate'],
    category: 'pizza',
    available: true
  },
  {
    id: '20',
    name: 'Pizza Brócolis',
    price: 60.00,
    ingredients: ['mussarela', 'brócolis', 'catupiry', 'bacon', 'tomate', 'palmito'],
    category: 'pizza',
    available: true
  },
  {
    id: '21',
    name: 'Pizza Rúcula',
    price: 55.00,
    ingredients: ['mussarela', 'rúcula', 'palmito', 'tomate seco'],
    category: 'pizza',
    available: true
  },

  // BORDAS RECHEADAS
  {
    id: '22',
    name: 'Borda Catupiry',
    price: 8.00,
    ingredients: ['catupiry'],
    category: 'entrada',
    available: true
  },
  {
    id: '23',
    name: 'Borda Cheddar',
    price: 8.00,
    ingredients: ['cheddar'],
    category: 'entrada',
    available: true
  },
  {
    id: '24',
    name: 'Borda Chocolate',
    price: 10.00,
    ingredients: ['chocolate'],
    category: 'sobremesa',
    available: true
  },
  {
    id: '25',
    name: 'Borda Mista Cheddar e Catupiry',
    price: 10.00,
    ingredients: ['cheddar', 'catupiry'],
    category: 'entrada',
    available: true
  },
  {
    id: '26',
    name: 'Borda Catupiry com Bacon',
    price: 12.00,
    ingredients: ['catupiry', 'bacon'],
    category: 'entrada',
    available: true
  },
  {
    id: '27',
    name: 'Borda Chocolate Branco',
    price: 10.00,
    ingredients: ['chocolate branco'],
    category: 'sobremesa',
    available: true
  },
  {
    id: '28',
    name: 'Borda Mussarela',
    price: 12.00,
    ingredients: ['mussarela'],
    category: 'entrada',
    available: true
  },

  // BEBIDAS (mantendo algumas básicas já que não estão nas imagens)
  {
    id: '29',
    name: 'Coca Cola 350ml',
    price: 5.50,
    ingredients: [],
    category: 'bebida',
    available: true
  },
  {
    id: '30',
    name: 'Guaraná 350ml',
    price: 5.50,
    ingredients: [],
    category: 'bebida',
    available: true
  },
  {
    id: '31',
    name: 'Suco de Laranja 300ml',
    price: 8.90,
    ingredients: ['laranja natural'],
    category: 'bebida',
    available: true
  }
];
