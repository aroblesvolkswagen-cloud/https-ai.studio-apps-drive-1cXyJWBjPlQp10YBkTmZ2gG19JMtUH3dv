import React, { useState, useMemo } from 'react';
import { useAppStore } from '../useAppStore';
import { Module, Role } from '../types';
import { ICONS } from '../constants';
import VenkiLogo from './VenkiLogo';
import PasswordChangeModal from './PasswordChangeModal';

/**
 * Subcomponente PURO, declarado FUERA de HorizontalNav.
 * No usa hooks. Sólo recibe props. Evita error #185.
 */
const NavLinks: React.FC<{
  modules: Module[];
  activeModule: Module;
  onClick: (m: Module) => void;
  isMobile?: boolean;
}> = ({ modules, activeModule, onClick, isMobile }) => {
  return (
    <>
      {modules.map((module) => {
        const isTrashModule = module === Module.Trash;
        const isActive = activeModule === module;

        const baseClasses = `px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 ${isMobile ? 'w-full text-left' : 'lg:w-auto'}`;
        
        let moduleClasses = '';
        if (isTrashModule) {
          moduleClasses = isActive 
            ? 'bg-red-500/30 text-red-200' 
            : 'text-red-300 hover:bg-red-500/20 hover:text-red-200';
        } else {
          moduleClasses = isActive
            ? 'bg-cyan-500/20 text-cyan-300'
            : 'text-gray-300 hover:bg-white/10 hover:text-white';
        }

        return (
            <button
              key={module}
              onClick={() => onClick(module)}
              className={`${baseClasses} ${moduleClasses}`}
            >
              {ICONS[module] ? React.cloneElement(ICONS[module], { className: 'h-5 w-5' }) : null}
              <span>{module}</span>
            </button>
        );
      })}
    </>
  );
};


const HorizontalNav: React.FC = () => {
    const user = useAppStore(state => state.user);
    const logout = useAppStore(state => state.logout);
    const activeModule = useAppStore(state => state.activeModule);
    const setActiveModule = useAppStore(state => state.setActiveModule);
    const isMobileMenuOpen = useAppStore(state => state.isMobileMenuOpen);
    const setIsMobileMenuOpen = useAppStore(state => state.setIsMobileMenuOpen);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const availableModules = useMemo(() => {
        if (!user) return [];
        // Admin sees all modules defined in the enum
        if (user.role === Role.Admin) {
            return Object.values(Module);
        }
        // Other users see modules assigned to their profile
        return user.modules || [];
    }, [user]);
    
    const handleModuleClick = (module: Module) => {
        setActiveModule(module);
        setIsMobileMenuOpen(false); // Close mobile menu on selection
    };

    return (
        <>
            <header className="glass glass-strong glass-noise flex items-center justify-between p-2 sm:p-4 m-4 mb-0 no-print">
                <div className="flex items-center gap-4">
                    <VenkiLogo className="w-24 h-auto" />
                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <NavLinks 
                            modules={availableModules}
                            activeModule={activeModule}
                            onClick={handleModuleClick}
                        />
                    </nav>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right">
                        <p className="font-semibold text-white truncate max-w-[120px] sm:max-w-none">{user?.name}</p>
                        <p className="text-xs sm:text-sm text-gray-300">{user?.role}</p>
                    </div>
                    {user?.role === Role.Admin && (
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="btn-secondary p-2"
                            title="Cambiar contraseña"
                            aria-label="Cambiar contraseña de administrador"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 8a6 6 0 11-12 0 6 6 0 0112 0zM7 8a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M5.433 13.407A6.002 6.002 0 0110 12c1.92 0 3.65.91 4.767 2.353A.5.5 0 0114.33 15H5.67a.5.5 0 01-.437-.647z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                     <button
                        onClick={logout}
                        className="btn-secondary p-2"
                        title="Cerrar Sesión"
                        aria-label="Cerrar Sesión"
                    >
                       {React.cloneElement(ICONS.Logout, { className: 'h-5 w-5' })}
                    </button>
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden btn-secondary p-2"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                        ) : (
                             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                             </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                 <nav className="lg:hidden glass glass-noise m-4 mt-2 p-4 no-print animate-fade-in-down">
                    <div className="flex flex-col gap-2">
                        <NavLinks 
                            modules={availableModules}
                            activeModule={activeModule}
                            onClick={handleModuleClick}
                            isMobile={true}
                        />
                    </div>
                </nav>
            )}

            {user?.role === Role.Admin && (
                <PasswordChangeModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                />
            )}
        </>
    );
};

export default HorizontalNav;