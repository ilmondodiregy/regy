
import React, { ReactNode } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-lg">
                    <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
