import React from 'react';
import VenkiLogo from './VenkiLogo';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <VenkiLogo className="w-64 h-auto mx-auto mb-8" />
      <h1 className="text-4xl font-bold venki-text-gradient">Bienvenido a Venki Quality Hub</h1>
      <p className="mt-4 text-lg text-gray-200">
        Tu centro de control para la excelencia operativa.
      </p>
      <p className="mt-2 text-gray-300">
        Selecciona un módulo en el menú de la parte superior para comenzar.
      </p>
    </div>
  );
};

export default WelcomeScreen;