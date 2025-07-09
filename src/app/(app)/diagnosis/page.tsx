'use client';

import { useState, useEffect } from 'react';
import type { Message } from '@/components/chat/ChatInterface';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { diagnoseSymptoms, type DiagnoseSymptomOutput } from '@/ai/flows/diagnose-flow';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, AlertTriangle, Stethoscope, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

type DiagnosisRole = 'user' | 'model';

interface DiagnosisMessage extends Message {
  sender: 'user' | 'ai';
  role: DiagnosisRole;
}

export default function DiagnosisPage() {
  const [messages, setMessages] = useState<DiagnosisMessage[]>([]);
  const [isSending, setIsSending] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState<DiagnoseSymptomOutput | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const startConversation = async () => {
    setIsSending(true);
    setIsComplete(false);
    setFinalDiagnosis(null);
    setMessages([]);
    
    const newDiagnosisId = crypto.randomUUID();
    setDiagnosisId(newDiagnosisId);

    try {
      const initialResponse = await diagnoseSymptoms({ history: [] });

      if (user) {
        // Create the main diagnosis document
        await setDoc(doc(db, 'users', user.uid, 'diagnoses', newDiagnosisId), {
          createdAt: serverTimestamp(),
          status: 'in-progress',
        });
      }

      if (initialResponse.followUpQuestion) {
        const initialAiMessage: DiagnosisMessage = {
            id: crypto.randomUUID(),
            text: initialResponse.followUpQuestion,
            sender: 'ai',
            role: 'model',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([initialAiMessage]);

         if (user) {
            const messagesCollection = collection(db, 'users', user.uid, 'diagnoses', newDiagnosisId, 'messages');
            await addDoc(messagesCollection, {
                text: initialAiMessage.text,
                role: initialAiMessage.role,
                createdAt: serverTimestamp(),
            });
         }
      }
    } catch (error) {
      console.error('Error starting diagnosis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo iniciar el diagnóstico. Inténtalo de nuevo.',
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    // We only want to start the conversation once the user is identified.
    if(user) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: DiagnosisMessage = {
      id: crypto.randomUUID(),
      text: text,
      sender: 'user',
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setIsSending(true);

    // Persist user message if logged in
    if (user && diagnosisId) {
        const messagesCollection = collection(db, 'users', user.uid, 'diagnoses', diagnosisId, 'messages');
        await addDoc(messagesCollection, {
            text: newUserMessage.text,
            role: newUserMessage.role,
            createdAt: serverTimestamp(),
        });
    }

    const history = currentMessages.map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));

    try {
      const aiResponse = await diagnoseSymptoms({ history });

      if (aiResponse.isFinal && aiResponse.diagnoses?.length) {
        setFinalDiagnosis(aiResponse);
        setIsComplete(true);
        const aiSummaryMessage: DiagnosisMessage = {
          id: crypto.randomUUID(),
          text: "Gracias por tu información. He preparado una evaluación preliminar. Recuerda que esto no es un diagnóstico definitivo.",
          sender: 'ai',
          role: 'model',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiSummaryMessage]);

        // Persist final AI message and diagnosis result if logged in
        if (user && diagnosisId) {
            const messagesCollection = collection(db, 'users', user.uid, 'diagnoses', diagnosisId, 'messages');
            await addDoc(messagesCollection, {
                text: aiSummaryMessage.text,
                role: aiSummaryMessage.role,
                createdAt: serverTimestamp(),
            });

            const diagnosisDocRef = doc(db, 'users', user.uid, 'diagnoses', diagnosisId);
            await updateDoc(diagnosisDocRef, {
                status: 'completed',
                result: aiResponse,
                completedAt: serverTimestamp()
            });
        }

      } else if (aiResponse.followUpQuestion) {
        const newAiMessage: DiagnosisMessage = {
          id: crypto.randomUUID(),
          text: aiResponse.followUpQuestion,
          sender: 'ai',
          role: 'model',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newAiMessage]);
        
        // Persist follow-up AI message if logged in
        if (user && diagnosisId) {
            const messagesCollection = collection(db, 'users', user.uid, 'diagnoses', diagnosisId, 'messages');
            await addDoc(messagesCollection, {
                text: newAiMessage.text,
                role: newAiMessage.role,
                createdAt: serverTimestamp(),
            });
        }
      }
    } catch (error) {
      console.error('Error getting diagnosis step:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al procesar tu respuesta. Inténtalo de nuevo.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                  <CardTitle className="text-2xl">Asistente de Diagnóstico IA</CardTitle>
                  <CardDescription>Responde las preguntas para que la IA pueda evaluar tus síntomas.</CardDescription>
              </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-1 flex flex-col min-h-0">
        {isComplete && finalDiagnosis ? (
          <Card className="flex-1 animate-in fade-in overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent" />Resultados Preliminares</CardTitle>
              <CardDescription>Estos son los posibles diagnósticos basados en la conversación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {finalDiagnosis.diagnoses?.map((diag, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                            <span>{diag.condition}</span>
                            <span className="text-primary font-bold text-lg">{diag.likelihood}%</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Probabilidad</Label>
                        <Progress value={diag.likelihood} className="mt-1" />
                      </div>
                      <div>
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Lightbulb className="h-4 w-4" /> Recomendación</Label>
                          <p className="text-sm pt-1 text-foreground/80">{diag.recommendation}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
                  <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      <h3 className="font-bold text-destructive">Advertencia Importante</h3>
                  </div>
                  <p className="text-destructive/90 text-sm mt-2 ml-9">{finalDiagnosis.disclaimer}</p>
              </div>

               <div className="pt-2 text-center">
                   <Button onClick={startConversation}>
                     <Sparkles className="mr-2 h-4 w-4" />
                     Iniciar Nuevo Diagnóstico
                   </Button>
               </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col flex-1 shadow-xl overflow-hidden rounded-lg border">
            <MessageList messages={messages} isLoadingAiResponse={isSending} />
            <MessageInput onSendMessage={handleSendMessage} isSending={isSending} placeholder="Describe tus síntomas o responde aquí..." />
          </Card>
        )}
      </div>
    </div>
  );
}
