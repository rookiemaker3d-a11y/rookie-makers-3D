import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

const PREDEFINED_QUESTIONS = [
  "¿Qué material necesito?",
  "¿Hacen envíos a todo México?",
  "¿Cómo cotizo un proyecto?",
  "Quiero hacer un pedido"
];

const BOT_RESPONSES: Record<string, string> = {
  "¿Qué material necesito?": "Depende del uso, bro. Para figuras o detalles súper finos, Resina 8K. Para piezas funcionales que aguanten golpes, PETG o ABS. PLA es el todoterreno. ¿Para qué lo vas a usar?",
  "¿Hacen envíos a todo México?": "¡Simón! Enviamos a toda la república por paquetería exprés. Tardamos 1-2 días en imprimir y otro par de días en que te llegue. 📦",
  "¿Cómo cotizo un proyecto?": "Usa la calculadora que está arriba para darte una idea rápida, o mándanos tu STL/OBJ por aquí y te armamos la cotización chida.",
  "Quiero hacer un pedido": "¡A huevo! Mándanos tus archivos a ventas@rookiemakers3d.mx o escríbenos por WhatsApp con los detalles. ¡Nos ponemos a imprimir en fa! 🖨️🔥",
  "default": "¡Qué onda! Soy MakerBot 🤖. Aún estoy en fase beta pero te ayudo con dudas de materiales, envíos o cotizaciones. ¿Qué necesitas?"
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: '¡Qué rollo! Soy MakerBot 🤖. ¿Qué vamos a imprimir hoy?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate bot thinking
    setTimeout(() => {
      const responseText = BOT_RESPONSES[text as keyof typeof BOT_RESPONSES] || BOT_RESPONSES['default'];
      const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] z-50 transition-all hover:scale-110"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[90vw] max-w-[380px] h-[500px] max-h-[80vh] glass-panel rounded-2xl flex flex-col z-50 overflow-hidden shadow-2xl shadow-primary/20 border-primary/30"
          >
            {/* Header */}
            <div className="bg-primary/20 border-b border-primary/30 p-4 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-lg">🤖</div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-black rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-white text-sm">MakerBot</h4>
                  <p className="text-xs text-primary font-mono">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-sans ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-white/10 text-foreground border border-white/5 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none no-scrollbar">
              {PREDEFINED_QUESTIONS.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-primary/20 text-primary text-xs font-mono whitespace-nowrap hover:bg-primary/20 transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/50 border-t border-white/10 backdrop-blur-md flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-sans transition-all"
              />
              <button 
                onClick={() => handleSend(input)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
