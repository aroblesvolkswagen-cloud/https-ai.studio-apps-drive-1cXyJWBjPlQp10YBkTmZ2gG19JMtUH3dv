import React, { useState, useEffect } from 'react';
import { useAppStore } from '../useAppStore';
import { Role, Employee } from '../types';
import { TEXT_INPUT_STYLE } from '../constants';
import VenkiLogo from './VenkiLogo';

const LoginScreen: React.FC = () => {
  const login = useAppStore(state => state.login);
  const error = useAppStore(state => state.authError);
  const employees = useAppStore(state => state.employees);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [password, setPassword] = useState('');

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      login(selectedEmployee, password);
    }
  };
  
  useEffect(() => {
      if (selectedEmployee?.role !== Role.Admin) {
          setPassword('');
      }
  }, [selectedEmployee]);

  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="glass glass-noise w-full max-w-md p-6 sm:p-8 space-y-8">
        <div className="glass-specular"></div>
        <div className="glass-glare"></div>
        <div className="text-center">
            <VenkiLogo className="w-48 h-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold venki-text-gradient">Bienvenido a Venki Quality Hub</h2>
          <p className="mt-2 text-sm text-muted">Inicia sesión para continuar</p>
        </div>
        {error && <p className="text-sm text-center text-red-300 bg-red-500/30 p-3 rounded-md">{error}</p>}
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-text-default mb-1">
              Empleado
            </label>
            <select
              id="employee"
              name="employee"
              required
              className={TEXT_INPUT_STYLE}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id} className="bg-gray-800 text-white">
                  {employee.name} ({employee.position})
                </option>
              ))}
            </select>
          </div>
          
          {selectedEmployee?.role === Role.Admin && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-default mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={TEXT_INPUT_STYLE}
                placeholder="Contraseña de administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full btn-primary"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;