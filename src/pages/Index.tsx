
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { AdminPanel } from '@/components/AdminPanel';
import { useChatbot } from '@/hooks/useChatbot';
import { defaultMenu } from '@/data/menuData';
import { MenuItem } from '@/types/chatbot';
import { Settings, MessageCircle } from 'lucide-react';

const Index = () => {
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu);
  const [estimatedTime, setEstimatedTime] = useState(45); // 45 minutos padrão
  const [showAdmin, setShowAdmin] = useState(false);

  const { state, processMessage } = useChatbot(menu, estimatedTime);

  const handleUpdateMenu = (newMenu: MenuItem[]) => {
    setMenu(newMenu);
  };

  const handleUpdateTime = (newTime: number) => {
    setEstimatedTime(newTime);
  };

  if (showAdmin) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-10">
          <Button
            onClick={() => setShowAdmin(false)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Voltar ao Chat
          </Button>
        </div>
        <AdminPanel
          menu={menu}
          estimatedTime={estimatedTime}
          onUpdateMenu={handleUpdateMenu}
          onUpdateTime={handleUpdateTime}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🍕 Pizzaria Frajola
            </h1>
            <p className="text-lg text-gray-600">
              Sua assistente virtual está pronta para te atender!
            </p>
          </div>
          <Button
            onClick={() => setShowAdmin(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChatInterface
              messages={state.messages}
              onSendMessage={processMessage}
              awaitingHuman={state.awaitingHuman}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                ⏰ Informações
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Tempo de entrega:</strong> {estimatedTime} minutos</p>
                <p><strong>Status:</strong> Online</p>
                <p><strong>Itens disponíveis:</strong> {menu.filter(item => item.available).length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                💡 Dicas Rápidas
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Digite "cardápio" para ver todas as opções</p>
                <p>• Pergunte sobre preços: "Quanto custa a margherita?"</p>
                <p>• Consulte ingredientes: "Ingredientes da portuguesa"</p>
                <p>• Fale "humano" se precisar de ajuda especial</p>
              </div>
            </div>

            <div className="bg-orange-100 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-orange-800">
                🎉 Promoção do Dia!
              </h3>
              <p className="text-sm text-orange-700">
                Peça 2 pizzas grandes e ganhe 1 refrigerante grátis!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
