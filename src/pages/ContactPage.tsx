import React from 'react';
import { ContactForm } from '@/components/ContactForm';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            ¿Quieres que tu <span className="text-emerald-600">Centro Deportivo</span> aparezca aquí?
          </h1>
          <p className="text-xl text-slate-600">
            Únete a nuestra plataforma y digitaliza la gestión de tus canchas. Envíanos el formulario y nos contactaremos contigo lo antes posible.
          </p>
        </div>
        
        <div className="w-full max-w-xl">
          <div className="relative z-0 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
