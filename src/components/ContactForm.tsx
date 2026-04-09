"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().min(9, { message: 'El número de teléfono debe tener al menos 9 dígitos' }),
  sportCenterName: z.string().min(2, { message: 'El nombre del centro deportivo es requerido' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres' }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      sportCenterName: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    if (!turnstileToken) {
      toast.error('Por favor, completa la validación de seguridad');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      await axios.post(`${apiUrl}/contact`, {
        ...values,
        turnstileToken,
      });
      
      toast.success('Mensaje enviado correctamente. Nos pondremos en contacto pronto.');
      form.reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast.error('Hubo un error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border-slate-200 overflow-hidden">
      <div className="h-2 bg-emerald-600 w-full" />
      <CardHeader className="space-y-1 pb-6 bg-white">
        <CardTitle className="text-2xl font-bold text-slate-900">Formulario Comercial</CardTitle>
        <CardDescription className="text-slate-500">
          Complete los datos de su complejo deportivo para iniciar el proceso de alta en nuestra plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-white">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Nombre del Representante</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Juan Pérez" 
                        className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Correo Electrónico Corporativo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ejemplo@centro.cl" 
                        className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Número de Teléfono / WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: +56 9 1234 5678" 
                      className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sportCenterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Razón Social o Nombre Fantasía</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre oficial del centro deportivo" 
                      className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Breve descripción de su infraestructura</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Indique cantidad de canchas, tipos de deportes y servicios adicionales..." 
                      className="min-h-[120px] border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-2">
              <span className="text-xs text-slate-500 font-medium">Validación de Seguridad</span>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md active:scale-[0.98]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando solicitud...
                </span>
              ) : 'Enviar Solicitud de Información'}
            </Button>
            <p className="text-[10px] text-center text-slate-400 mt-4">
              Al enviar este formulario, usted acepta ser contactado por nuestro equipo comercial para fines informativos y de alta en la plataforma.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
