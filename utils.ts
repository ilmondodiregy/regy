
export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                     return reject(new Error("Could not get canvas context."));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
