
import { MenuItem } from '@/types/chatbot';

export const defaultMenu: MenuItem[] = [
  {
    id: '1',
    name: 'Pizza Margherita',
    price: 35.90,
    ingredients: ['molho de tomate', 'mussarela', 'manjericão', 'azeite'],
    category: 'pizza',
    available: true
  },
  {
    id: '2',
    name: 'Pizza Calabresa',
    price: 39.90,
    ingredients: ['molho de tomate', 'mussarela', 'calabresa', 'cebola'],
    category: 'pizza',
    available: true
  },
  {
    id: '3',
    name: 'Pizza Portuguesa',
    price: 45.90,
    ingredients: ['molho de tomate', 'mussarela', 'presunto', 'ovos', 'cebola', 'azeitona', 'ervilha'],
    category: 'pizza',
    available: true
  },
  {
    id: '4',
    name: 'Pizza Quatro Queijos',
    price: 42.90,
    ingredients: ['molho de tomate', 'mussarela', 'provolone', 'parmesão', 'gorgonzola'],
    category: 'pizza',
    available: true
  },
  {
    id: '5',
    name: 'Coca Cola 350ml',
    price: 5.50,
    ingredients: [],
    category: 'bebida',
    available: true
  },
  {
    id: '6',
    name: 'Guaraná 350ml',
    price: 5.50,
    ingredients: [],
    category: 'bebida',
    available: true
  },
  {
    id: '7',
    name: 'Suco de Laranja 300ml',
    price: 8.90,
    ingredients: ['laranja natural'],
    category: 'bebida',
    available: true
  }
];
