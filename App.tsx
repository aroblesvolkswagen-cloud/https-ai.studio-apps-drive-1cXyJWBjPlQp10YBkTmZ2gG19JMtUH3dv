import React, { useEffect } from 'react';
import { useAppStore } from './useAppStore';
import LoginScreen from './components/LoginScreen';
import HorizontalNav from './components/HorizontalNav';
import ExecutiveDashboard from './modules/ExecutiveDashboard';
import OrderManagement from './modules/InkManagement';
import ScrapControl from './modules/ScrapControl';
import Inventory from './modules/Inventory';
import MachineManagement from './modules/MachineManagement';
import EmployeeManagement from './modules/EmployeeManagement';
import FmeaManagement from './modules/FmeaManagement';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './modules/Settings';
import Trash from './modules/Trash';
import { Module } from './types';

const Notification: React.FC = () => {
    const notification = useAppStore(state => state.notification);
    const clearNotification = useAppStore(state => state.clearNotification);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                clearNotification();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);

    if (!notification) return null;

    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white font-semibold z-[100] animate-fade-in-down glass glass-noise";
    const styles = {
        success: `${baseStyle} bg-green-500/80 border border-green-400`,
        error: `${baseStyle} bg-red-500/80 border border-red-400`,
    };

    return (
        <div className={styles[notification.type]}>
            <div className="glass-specular"></div>
            <div className="glass-glare"></div>
            {notification.message}
        </div>
    );
};

const ConfirmDialog: React.FC = () => {
    const dialog = useAppStore(state => state.confirmDialog);
    const hideConfirm = useAppStore(state => state.hideConfirm);

    if (!dialog) return null;

    const handleConfirm = () => {
        dialog.onConfirm();
        hideConfirm();
    };
    
    const handleCancel = () => {
        if(dialog.onCancel) dialog.onCancel();
        hideConfirm();
    };

    return (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm no-print p-4">
            <div className="glass glass-magenta glass-noise w-full max-w-sm flex flex-col">
                <div className="glass-specular"></div>
                <div className="glass-glare"></div>
                <div className="p-4 border-b border-white/20">
                    <h3 className="text-lg font-semibold text-white">{dialog.title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-200">{dialog.message}</p>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-black/10">
                    <button onClick={handleCancel} className="btn-secondary">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="btn-primary">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const user = useAppStore(state => state.user);
  const activeModule = useAppStore(state => state.activeModule);

  const renderModule = () => {
    switch (activeModule) {
      case Module.Home:
        return <WelcomeScreen />;
      case Module.Dashboard:
        return <ExecutiveDashboard />;
      case Module.OrderManagement:
        return <OrderManagement />;
      case Module.ScrapControl:
        return <ScrapControl />;
      case Module.InventoryAndMaterials:
        return <Inventory />;
      case Module.MachineManagement:
        return <MachineManagement />;
      case Module.EmployeeManagement:
        return <EmployeeManagement />;
      case Module.FMEA:
        return <FmeaManagement />;
      case Module.Settings:
        return <Settings />;
      case Module.Trash:
        return <Trash />;
      default:
        return <WelcomeScreen />;
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
       <HorizontalNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <h2 className="text-3xl font-bold venki-title-gradient mb-6">{activeModule}</h2>
          {renderModule()}
        </main>
        <Notification />
        <ConfirmDialog />
    </div>
  );
};

export default App;