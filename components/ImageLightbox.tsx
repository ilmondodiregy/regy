
import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

interface ImageLightboxProps {
    imageUrl: string;
    onClose: () => void;
    metadata?: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose, metadata }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
            onClick={onClose}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                 <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white hover:text-slate-300 p-2 z-10 bg-black bg-opacity-20 rounded-full"
                    aria-label="Close image viewer"
                >
                    <CloseIcon />
                </button>
                <img 
                    src={imageUrl} 
                    alt="Ingrandimento" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
                {metadata && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 text-sm text-center">
                        {metadata}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageLightbox;
