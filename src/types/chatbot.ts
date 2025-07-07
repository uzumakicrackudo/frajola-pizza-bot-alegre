
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  ingredients: string[];
  category: 'pizza' | 'bebida' | 'sobremesa' | 'entrada';
  available: boolean;
}

export interface Order {
  items: OrderItem[];
  customerInfo: CustomerInfo;
  estimatedTime: number;
  total: number;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  removedIngredients: string[];
}

export interface CustomerInfo {
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatbotState {
  stage: 'greeting' | 'menu' | 'ordering' | 'address' | 'confirmation' | 'human';
  currentOrder: Order;
  messages: ChatMessage[];
  awaitingHuman: boolean;
}
