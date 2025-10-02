import React from 'react';

const Settings: React.FC = () => {

  return (
    <div className="space-y-6">
        <div className="glass glass-noise p-6 space-y-6 text-center">
          <h3 className="text-lg venki-subtitle">Ajustes Generales</h3>
           <p className="text-text-muted">
              Este módulo está reservado para futuras configuraciones generales de la aplicación.
           </p>
            <p className="text-text-muted">
                La configuración de objetivos de scrap se ha movido al módulo de <strong>Control de Scrap</strong>, en la pestaña de <strong>"Objetivos y Cumplimiento"</strong>.
            </p>
        </div>
    </div>
  );
};

export default Settings;