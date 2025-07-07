
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItem } from '@/types/chatbot';
import { Trash2, Edit, Plus, Clock } from 'lucide-react';

interface AdminPanelProps {
  menu: MenuItem[];
  estimatedTime: number;
  onUpdateMenu: (menu: MenuItem[]) => void;
  onUpdateTime: (time: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  menu,
  estimatedTime,
  onUpdateMenu,
  onUpdateTime
}) => {
  const [newTime, setNewTime] = useState(estimatedTime);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    ingredients: [],
    category: 'pizza',
    available: true
  });

  const handleToggleAvailability = (itemId: string) => {
    const updatedMenu = menu.map(item =>
      item.id === itemId ? { ...item, available: !item.available } : item
    );
    onUpdateMenu(updatedMenu);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedMenu = menu.filter(item => item.id !== itemId);
    onUpdateMenu(updatedMenu);
  };

  const handleUpdateTime = () => {
    onUpdateTime(newTime);
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.price) {
      const item: MenuItem = {
        id: Date.now().toString(),
        name: newItem.name,
        price: newItem.price,
        ingredients: newItem.ingredients || [],
        category: newItem.category as 'pizza' | 'bebida' | 'sobremesa' | 'entrada',
        available: true
      };
      onUpdateMenu([...menu, item]);
      setNewItem({ name: '', price: 0, ingredients: [], category: 'pizza', available: true });
    }
  };

  const handleRemoveIngredient = (itemId: string, ingredient: string) => {
    const updatedMenu = menu.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ingredients: item.ingredients.filter(ing => ing !== ingredient)
        };
      }
      return item;
    });
    onUpdateMenu(updatedMenu);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">🍕 Painel Administrativo - Frajola</h1>
      
      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="menu">Gerenciar Cardápio</TabsTrigger>
          <TabsTrigger value="time">Tempo de Entrega</TabsTrigger>
          <TabsTrigger value="add">Adicionar Item</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Cardápio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menu.map((item) => (
                  <div key={item.id} className="border p-4 rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-green-600 font-medium">R$ {item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                        {item.ingredients.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Ingredientes:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.ingredients.map((ingredient, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-200 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                                >
                                  {ingredient}
                                  <button
                                    onClick={() => handleRemoveIngredient(item.id, ingredient)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`available-${item.id}`}>Disponível</Label>
                          <Switch
                            id={`available-${item.id}`}
                            checked={item.available}
                            onCheckedChange={() => handleToggleAvailability(item.id)}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configurar Tempo de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="delivery-time">Tempo estimado (minutos)</Label>
                  <Input
                    id="delivery-time"
                    type="number"
                    value={newTime}
                    onChange={(e) => setNewTime(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleUpdateTime}>
                  Atualizar Tempo de Entrega
                </Button>
                <p className="text-sm text-gray-600">
                  Tempo atual: {estimatedTime} minutos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Novo Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Nome do Item</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Ex: Pizza Especial"
                  />
                </div>
                <div>
                  <Label htmlFor="item-price">Preço (R$)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="item-category">Categoria</Label>
                  <select
                    id="item-category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="pizza">Pizza</option>
                    <option value="bebida">Bebida</option>
                    <option value="sobremesa">Sobremesa</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="item-ingredients">Ingredientes (separados por vírgula)</Label>
                  <Input
                    id="item-ingredients"
                    value={newItem.ingredients?.join(', ') || ''}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      ingredients: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="Ex: molho de tomate, mussarela, manjericão"
                  />
                </div>
                <Button onClick={handleAddItem} className="w-full">
                  Adicionar Item ao Cardápio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
