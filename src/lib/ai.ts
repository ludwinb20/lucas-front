export const generateAIResponse = (text: string): Promise<string> => {
  return new Promise((resolve) => {
    console.log("Simulando respuesta de IA para:", text);
    
    setTimeout(() => {
      const response = "Hola que ase"; // Respuesta simulada
      resolve(response);
    }, 10000); // 10 segundos de retardo
  });
};