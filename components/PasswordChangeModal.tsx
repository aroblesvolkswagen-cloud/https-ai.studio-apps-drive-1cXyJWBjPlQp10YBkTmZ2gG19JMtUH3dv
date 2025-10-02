import React, { useState } from 'react';
import { useAppStore } from '../useAppStore';
import Modal from './Modal';
import { TEXT_INPUT_STYLE } from '../constants';

interface PasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
    const changePassword = useAppStore(state => state.changePassword);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setIsError(true);
            setMessage('Todos los campos son obligatorios.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setIsError(true);
            setMessage('Las nuevas contraseñas no coinciden.');
            return;
        }

        const success = changePassword(oldPassword, newPassword);

        if (success) {
            setIsError(false);
            setMessage('¡Contraseña actualizada con éxito!');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } else {
            setIsError(true);
            setMessage('La contraseña antigua es incorrecta.');
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        setIsError(false);
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Contraseña de Administrador">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="old-password" className="block text-sm font-medium text-gray-200 mb-1">Contraseña Antigua</label>
                    <input
                        id="old-password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className={TEXT_INPUT_STYLE}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-200 mb-1">Nueva Contraseña</label>
                    <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={TEXT_INPUT_STYLE}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-200 mb-1">Confirmar Nueva Contraseña</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={TEXT_INPUT_STYLE}
                        required
                    />
                </div>
                {message && (
                    <p className={`text-sm text-center p-2 rounded-md ${isError ? 'bg-red-500/30 text-red-400' : 'bg-green-500/30 text-green-300'}`}>
                        {message}
                    </p>
                )}
                <button type="submit" className="w-full btn-primary">
                    Actualizar Contraseña
                </button>
            </form>
        </Modal>
    );
};

export default PasswordChangeModal;