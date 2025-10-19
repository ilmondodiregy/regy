import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks';
import { StockMovement } from '../types';
import { resizeImage, formatCurrency, formatDate } from '../utils';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XCircleIcon, CopyIcon, CameraIcon, MinusIcon, PlusSmallIcon, FileDownloadIcon } from './Icons';
import Modal from './Modal';
import ImageLightbox from './ImageLightbox';

// Dichiarazione delle librerie globali caricate via CDN
declare const XLSX: any;
declare const jspdf: any;

type UndoAction = { action: 'delete'; stock: StockMovement };

// FilterControls Component
interface StockFilterControlsProps {
    searchTerm: string; setSearchTerm: (v: string) => void;
    quantityFilter: string; setQuantityFilter: (v: string) => void;
    hasImage: string; setHasImage: (v: string) => void;
}
const StockFilterControls: React.FC<StockFilterControlsProps> = ({ searchTerm, setSearchTerm, quantityFilter, setQuantityFilter, hasImage, setHasImage }) => {
    const handleReset = () => {
        setSearchTerm('');
        setQuantityFilter('all');
        setHasImage('all');
    };
    const isFiltered = searchTerm || quantityFilter !== 'all' || hasImage !== 'all';

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-3 lg:col-span-1">
                    <label htmlFor="search-stock" className="block text-sm font-medium text-slate-700">Cerca Codice o Descrizione</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><SearchIcon /></div>
                        <input type="text" id="search-stock" placeholder="Cerca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-md border-slate-300 py-2 pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border" />
                    </div>
                </div>
                <div>
                    <label htmlFor="quantityFilter" className="block text-sm font-medium text-slate-700">Quantità</label>
                    <select id="quantityFilter" value={quantityFilter} onChange={(e) => setQuantityFilter(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border">
                        <option value="all">Tutte</option>
                        <option value="available">Disponibili (&gt;0)</option>
                        <option value="one">Singola unità (1)</option>
                        <option value="low">Sotto soglia (&lt;5)</option>
                        <option value="zero">Esauriti (0)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="hasImage" className="block text-sm font-medium text-slate-700">Immagine</label>
                    <select id="hasImage" value={hasImage} onChange={(e) => setHasImage(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border">
                        <option value="all">Tutte</option>
                        <option value="with">Con immagine</option>
                        <option value="without">Senza immagine</option>
                    </select>
                </div>
            </div>
            {isFiltered && (
                <div className="mt-4 flex justify-end">
                    <button onClick={handleReset} className="inline-flex items-center rounded-md border border-transparent bg-slate-100 px-3 py-2 text-sm font-medium leading-4 text-slate-700 hover:bg-slate-200">
                        <XCircleIcon /> Resetta Filtri
                    </button>
                </div>
            )}
        </div>
    );
};

// StockForm Component
interface StockFormProps {
    onSave: (stock: Omit<StockMovement, 'id'> | StockMovement) => void;
    onCancel: () => void;
    initialStock: Partial<StockMovement> | null;
    existingCodes: string[];
}
const StockForm: React.FC<StockFormProps> = ({ onSave, onCancel, initialStock, existingCodes }) => {
    const [date, setDate] = useState(initialStock?.date || new Date().toISOString().split('T')[0]);
    const [codice, setCodice] = useState(initialStock?.codice || '');
    const [descrizione, setDescrizione] = useState(initialStock?.descrizione || '');
    const [quantity, setQuantity] = useState(initialStock?.quantity?.toString() || '1');
    const [price, setPrice] = useState(initialStock?.price?.toString() || '');
    const [thumbnail, setThumbnail] = useState(initialStock?.thumbnail || '');
    const [fullImage, setFullImage] = useState(initialStock?.fullImage || '');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (file: File) => {
        if (!file || !file.type.startsWith('image/')) return;
        try {
            const thumb = await resizeImage(file, 150, 150);
            const full = await resizeImage(file, 1200, 1200);
            setThumbnail(thumb); setFullImage(full);
        } catch (error) {
            console.error('Errore nel ridimensionamento immagine:', error);
        }
    };
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !codice || !descrizione || quantity === '') { alert('Compila tutti i campi obbligatori.'); return; }
        if (!initialStock?.id && existingCodes.includes(codice.toUpperCase()) && !confirm(`Il codice "${codice}" esiste già. Continuare?`)) return;

        const stockData = { date, codice: codice.toUpperCase(), descrizione, quantity: Number(quantity), price: price === '' ? null : Number(price), thumbnail, fullImage };
        onSave(initialStock?.id ? { ...stockData, id: initialStock.id } : stockData);
    };

    const total = (quantity !== '' && price !== '' && !isNaN(Number(quantity)) && !isNaN(Number(price))) ? (Number(quantity) * Number(price)) : null;

    return (
         <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data *</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="codice" className="block text-sm font-medium text-slate-700">Codice * {initialStock?.id && <span className="text-xs text-slate-500">(non modificabile)</span>}</label>
                    <input type="text" id="codice" value={codice} onChange={e => setCodice(e.target.value)} disabled={!!initialStock?.id} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-slate-100" />
                </div>
            </div>
            <div>
                <label htmlFor="descrizione" className="block text-sm font-medium text-slate-700">Descrizione *</label>
                <input type="text" id="descrizione" value={descrizione} onChange={e => setDescrizione(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantità *</label>
                    <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    <p className="mt-1 text-xs text-slate-500">Usa numeri negativi per scarichi</p>
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-slate-700">Prezzo (€)</label>
                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" placeholder="Opzionale" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
            </div>
             <div className="p-3 bg-purple-50 rounded-md text-right">
                <span className="text-sm font-medium text-slate-600">Totale riga: </span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Immagine</label>
                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300'}`}>
                    {thumbnail ? (
                        <div className="space-y-3">
                            <img src={thumbnail} alt="Anteprima" className="mx-auto rounded-lg" style={{ maxWidth: '150px' }} />
                            <div className="flex justify-center gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Cambia</button><button type="button" onClick={() => { setThumbnail(''); setFullImage(''); }} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Rimuovi</button></div>
                        </div>
                    ) : (
                        <div className="space-y-2 flex flex-col items-center"><CameraIcon /><p className="text-sm text-slate-600">Trascina un'immagine qui o</p><button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Seleziona File</button></div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Annulla</button><button type="submit" className="px-4 py-2 bg-purple-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-purple-700">Salva</button></div>
        </form>
    );
};


// StockItem Component
interface StockItemProps {
    stock: StockMovement;
    onEdit: (stock: StockMovement) => void;
    onDelete: (id: string) => void;
    onDuplicate: (stock: StockMovement) => void;
    onAdjustQuantity: (stock: StockMovement, adjustment: number) => void;
    onImageClick: (url: string) => void;
}
const StockItem: React.FC<StockItemProps> = ({ stock, onEdit, onDelete, onDuplicate, onAdjustQuantity, onImageClick }) => {
    const total = stock.price !== null ? stock.quantity * stock.price : null;
    const quantityColor = stock.quantity === 0 ? 'text-red-600' : stock.quantity < 5 ? 'text-yellow-600' : 'text-green-600';
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
            <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                            {stock.thumbnail && <img src={stock.thumbnail} alt={stock.descrizione} className="w-16 h-16 object-cover rounded-md cursor-pointer shrink-0" onClick={() => onImageClick(stock.fullImage || stock.thumbnail!)} />}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{stock.codice}</h3>
                                <p className="text-slate-600 truncate">{stock.descrizione}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-3xl font-bold ${quantityColor}`}>{stock.quantity}</p>
                        <p className="text-xs text-slate-500">Pezzi</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 flex justify-between items-center flex-wrap gap-2">
                <div className="flex space-x-1">
                    <button onClick={() => onAdjustQuantity(stock, -1)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Diminuisci"><MinusIcon /></button>
                    <button onClick={() => onAdjustQuantity(stock, 1)} className="p-2 text-green-500 hover:bg-green-100 rounded-full" title="Aumenta"><PlusSmallIcon /></button>
                </div>
                <div className="flex space-x-1">
                    <button onClick={() => onDuplicate(stock)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title="Duplica"><CopyIcon className="h-5 w-5"/></button>
                    <button onClick={() => onEdit(stock)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title="Modifica"><EditIcon className="h-5 w-5"/></button>
                    <button onClick={() => onDelete(stock.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Elimina"><TrashIcon className="h-5 w-5"/></button>
                </div>
            </div>
        </div>
    );
};

// Main View Component
const StocksView: React.FC = () => {
    const [stocks, setStocks] = useLocalStorage<StockMovement[]>('stocks', []);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingStock, setEditingStock] = useState<Partial<StockMovement> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantityFilter, setQuantityFilter] = useState('all');
    const [hasImage, setHasImage] = useState('all');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

    useEffect(() => {
        if (undoStack.length > 0) {
            const timer = setTimeout(() => setUndoStack([]), 5000);
            return () => clearTimeout(timer);
        }
    }, [undoStack]);
    
    const handleSaveStock = (stockToSave: Omit<StockMovement, 'id'> | StockMovement) => {
        if ('id' in stockToSave) { // Update existing item
             const updatedStock = stocks.find(s => s.codice.toUpperCase() === stockToSave.codice.toUpperCase());
             setStocks(stocks.map(s => s.codice.toUpperCase() === stockToSave.codice.toUpperCase() ? { ...s, ...stockToSave, quantity: stockToSave.quantity } : s));
        } else { // Create new one
            const existingStock = stocks.find(s => s.codice.toUpperCase() === stockToSave.codice.toUpperCase());
            if (existingStock) { // if code exists, just update quantity
                 setStocks(stocks.map(s => s.codice.toUpperCase() === stockToSave.codice.toUpperCase() ? { ...s, quantity: s.quantity + stockToSave.quantity } : s));
            } else { // if not, create new stock item
                const newStock: StockMovement = { ...stockToSave, id: new Date().toISOString() };
                setStocks([...stocks, newStock]);
            }
        }
        setIsFormVisible(false);
    };

    const handleDeleteStock = (id: string) => {
        const stockToDelete = stocks.find(s => s.id === id);
        if (stockToDelete && window.confirm(`Sei sicuro di voler eliminare "${stockToDelete.codice}"?`)) {
            setUndoStack(prev => [...prev.filter(u => u.stock.id !== id), { action: 'delete', stock: stockToDelete }]);
            setStocks(stocks.filter(s => s.id !== id));
        }
    };

    const handleUndo = () => {
        const lastAction = undoStack.pop();
        if (lastAction?.action === 'delete') setStocks(prev => [...prev, lastAction.stock]);
        setUndoStack([...undoStack]);
    };
    
    const handleEditStock = (stock: StockMovement) => { setEditingStock(stock); setIsFormVisible(true); };
    const handleDuplicateStock = (stock: StockMovement) => { setEditingStock({ ...stock, id: undefined, date: new Date().toISOString().split('T')[0] }); setIsFormVisible(true); };
    const handleAdjustQuantity = (stock: StockMovement, adjustment: number) => setStocks(stocks.map(s => s.id === stock.id ? { ...s, quantity: s.quantity + adjustment } : s));

    const aggregatedStocks = stocks.reduce((acc, stock) => {
        const key = stock.codice.toUpperCase();
        if (!acc[key]) {
            acc[key] = { ...stock, quantity: 0 };
        }
        acc[key].quantity += stock.quantity;
        if (!acc[key].thumbnail && stock.thumbnail) acc[key].thumbnail = stock.thumbnail;
        if (!acc[key].fullImage && stock.fullImage) acc[key].fullImage = stock.fullImage;
        return acc;
    }, {} as Record<string, StockMovement>);

    const filteredStocks = Object.values(aggregatedStocks).filter(stock => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = searchTermLower === '' || stock.codice.toLowerCase().includes(searchTermLower) || stock.descrizione.toLowerCase().includes(searchTermLower);
        const matchesQuantity = quantityFilter === 'all' || 
            (quantityFilter === 'zero' && stock.quantity === 0) || 
            (quantityFilter === 'low' && stock.quantity > 0 && stock.quantity < 5) || 
            (quantityFilter === 'available' && stock.quantity > 0) ||
            (quantityFilter === 'one' && stock.quantity === 1);
        const matchesImage = hasImage === 'all' || (hasImage === 'with' && !!stock.thumbnail) || (hasImage === 'without' && !stock.thumbnail);
        return matchesSearch && matchesQuantity && matchesImage;
    }).sort((a, b) => a.codice.localeCompare(b.codice));

    const { uniqueItems, totalQuantity, totalValue } = filteredStocks.reduce((acc, s) => {
        acc.uniqueItems += 1;
        acc.totalQuantity += s.quantity;
        acc.totalValue += s.price !== null ? (s.quantity * s.price) : 0;
        return acc;
    }, { uniqueItems: 0, totalQuantity: 0, totalValue: 0 });

    const existingCodes = [...new Set(stocks.map(s => s.codice.toUpperCase()))];
    
    const handleExportExcel = () => {
        const dataToExport = filteredStocks.map(s => ({
            'Codice': s.codice,
            'Descrizione': s.descrizione,
            'Quantità': s.quantity,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Scorte");
        XLSX.writeFile(workbook, `scorte_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jspdf.jsPDF();
        doc.autoTable({
            head: [['Codice', 'Descrizione', 'Quantità']],
            body: filteredStocks.map(s => [
                s.codice,
                s.descrizione,
                s.quantity,
            ]),
        });
        doc.save(`scorte_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <>
            <StockFilterControls {...{ searchTerm, setSearchTerm, quantityFilter, setQuantityFilter, hasImage, setHasImage }} />
            
            <div className="flex justify-end gap-2 mb-4">
                 <button
                    onClick={handleExportExcel}
                    disabled={filteredStocks.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> Excel
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={filteredStocks.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> PDF
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-slate-600">Articoli Unici (filtrati)</p><p className="text-2xl font-bold text-purple-600">{uniqueItems}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-slate-600">Quantità Totale (filtrata)</p><p className="text-2xl font-bold text-slate-900">{totalQuantity}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-slate-600">Valore Stimato (filtrato)</p><p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p></div>
            </div>
            {undoStack.length > 0 && <div className="mb-4 bg-slate-800 text-white px-4 py-3 rounded-lg flex justify-between items-center"><span className="text-sm">Elemento eliminato</span><button onClick={handleUndo} className="px-3 py-1 bg-white text-slate-800 rounded text-sm font-medium hover:bg-slate-100">Annulla</button></div>}
            
            {filteredStocks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredStocks.map(stock => <StockItem key={stock.id} {...{ stock, onEdit: handleEditStock, onDelete: handleDeleteStock, onDuplicate: handleDuplicateStock, onAdjustQuantity: handleAdjustQuantity, onImageClick: setLightboxImage }} />)}
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-slate-700">{stocks.length > 0 ? 'Nessun articolo corrisponde ai filtri' : 'Nessun articolo in magazzino.'}</h2>
                    <p className="text-slate-500 mt-2">{stocks.length > 0 ? 'Prova a modificare i filtri.' : "Premi il pulsante '+' per aggiungere un articolo."}</p>
                </div>
            )}

            {isFormVisible && <Modal title={editingStock?.id ? 'Modifica Articolo' : 'Nuovo Articolo'} onClose={() => setIsFormVisible(false)}><StockForm onSave={handleSaveStock} onCancel={() => setIsFormVisible(false)} initialStock={editingStock} existingCodes={existingCodes} /></Modal>}
            {lightboxImage && <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
            
            <button onClick={() => { setEditingStock(null); setIsFormVisible(true); }} className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform duration-200 ease-in-out hover:scale-110 z-30" aria-label="Aggiungi Articolo">
                <PlusIcon />
            </button>
        </>
    );
};

export default StocksView;