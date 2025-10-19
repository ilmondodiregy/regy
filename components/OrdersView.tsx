import React, { useState } from 'react';
import { useLocalStorage } from '../hooks';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XCircleIcon, LinkIcon, FileDownloadIcon } from './Icons';
import Modal from './Modal';

// Dichiarazione delle librerie globali caricate via CDN
declare const XLSX: any;
declare const jspdf: any;


// FilterControls Component
interface FilterControlsProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
}

const OrderFilterControls: React.FC<FilterControlsProps> = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, startDate, setStartDate, endDate, setEndDate }) => {
    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const isFiltered = searchTerm || statusFilter !== 'all' || startDate || endDate;

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-slate-700">Cerca Cliente o Articolo</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <SearchIcon />
                        </div>
                        <input type="text" id="search" placeholder="Cerca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-md border-slate-300 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border" />
                    </div>
                </div>
                <div>
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700">Stato</label>
                    <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border">
                        <option value="all">Tutti gli stati</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2 md:col-span-2 lg:col-span-1">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Da</label>
                        <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">A</label>
                        <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border" />
                    </div>
                </div>
            </div>
            {isFiltered && (
                <div className="mt-4 flex justify-end">
                    <button onClick={handleReset} className="inline-flex items-center rounded-md border border-transparent bg-slate-100 px-3 py-2 text-sm font-medium leading-4 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
                        <XCircleIcon /> Resetta Filtri
                    </button>
                </div>
            )}
        </div>
    );
};

// OrderForm Component
interface OrderFormProps {
    onSave: (order: Omit<Order, 'id'> | Order) => void;
    onCancel: () => void;
    initialOrder: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSave, onCancel, initialOrder }) => {
    const [customer, setCustomer] = useState(initialOrder?.customer || '');
    const [article, setArticle] = useState(initialOrder?.article || '');
    const [quantity, setQuantity] = useState(initialOrder?.quantity || 1);
    const [salePrice, setSalePrice] = useState(initialOrder?.salePrice?.toString() || '');
    const [date, setDate] = useState(initialOrder?.date || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState(initialOrder?.status || OrderStatus.DaIniziare);
    const [cloudLink, setCloudLink] = useState(initialOrder?.cloudLink || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !article || quantity <= 0 || salePrice === '' || Number(salePrice) < 0) {
            alert('Per favore, compila tutti i campi obbligatori. Quantità e prezzo non possono essere negativi.');
            return;
        }

        const orderData = {
            date, customer, article, status, cloudLink,
            quantity: Number(quantity),
            salePrice: Number(salePrice),
        };

        if (initialOrder) {
            onSave({ ...orderData, id: initialOrder.id });
        } else {
            onSave(orderData);
        }
    };

    const total = (quantity > 0 && salePrice !== '' && Number(salePrice) >= 0)
        ? (quantity * Number(salePrice)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00';
    
    return (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
                <label htmlFor="customer" className="block text-sm font-medium text-slate-700">Cliente *</label>
                <input type="text" id="customer" value={customer} onChange={e => setCustomer(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="article" className="block text-sm font-medium text-slate-700">Articolo *</label>
                <input type="text" id="article" value={article} onChange={e => setArticle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantità *</label>
                    <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} min="1" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="salePrice" className="block text-sm font-medium text-slate-700">Prezzo Vendita (€) *</label>
                    <input type="number" id="salePrice" value={salePrice} onChange={e => setSalePrice(e.target.value)} min="0" step="0.01" required placeholder="Es. 19.99" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-right">
                <span className="text-sm font-medium text-slate-600">Totale: </span>
                <span className="text-xl font-bold text-slate-900">€ {total}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data *</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">Stato *</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="cloudLink" className="block text-sm font-medium text-slate-700">Link Cloud (Opzionale)</label>
                <input type="url" id="cloudLink" value={cloudLink} onChange={e => setCloudLink(e.target.value)} placeholder="https://..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">Salva Ordine</button>
            </div>
        </form>
    );
};

// OrderItem Component
interface OrderItemProps {
    order: Order;
    onEdit: (order: Order) => void;
    onDelete: (id: string) => void;
}
const OrderItem: React.FC<OrderItemProps> = ({ order, onEdit, onDelete }) => {
    const statusColors: Record<OrderStatus, string> = {
        [OrderStatus.DaIniziare]: 'bg-slate-100 text-slate-800',
        [OrderStatus.InSvolgimento]: 'bg-yellow-100 text-yellow-800',
        [OrderStatus.Terminato]: 'bg-green-100 text-green-800',
    };

    const total = order.quantity * order.salePrice;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
            <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800">{order.customer}</h3>
                        <p className="text-sm text-slate-500">{formatDate(order.date)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${statusColors[order.status]} whitespace-nowrap`}>{order.status}</span>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-2">
                    <p className="text-slate-700"><span className="font-semibold">Articolo:</span> {order.article}</p>
                    <div className="grid grid-cols-3 gap-4 text-center md:text-left">
                        <div>
                            <p className="text-sm text-slate-500">Quantità</p>
                            <p className="font-semibold text-slate-800">{order.quantity}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Prezzo Unit.</p>
                            <p className="font-semibold text-slate-800">{formatCurrency(order.salePrice)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Totale</p>
                            <p className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</p>
                        </div>
                    </div>
                    {order.cloudLink && (
                        <div className="mt-3 flex items-center space-x-2 border-t border-slate-100 pt-3">
                            <LinkIcon />
                            <a href={order.cloudLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate text-sm">
                                {order.cloudLink}
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-1">
                <button onClick={() => onEdit(order)} className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-full" title="Modifica"><EditIcon /></button>
                <button onClick={() => onDelete(order.id)} className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-100 rounded-full" title="Elimina"><TrashIcon /></button>
            </div>
        </div>
    );
};


// Main View Component
const OrdersView: React.FC = () => {
    const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSaveOrder = (orderToSave: Omit<Order, 'id'> | Order) => {
        if ('id' in orderToSave) {
            setOrders(orders.map(o => o.id === orderToSave.id ? orderToSave : o));
        } else {
            const newOrder = { ...orderToSave, id: new Date().toISOString() };
            setOrders([...orders, newOrder]);
        }
        setIsFormVisible(false);
    };

    const handleDeleteOrder = (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo ordine?")) {
            setOrders(orders.filter(o => o.id !== id));
        }
    };

    const handleEditOrder = (order: Order) => {
        setEditingOrder(order);
        setIsFormVisible(true);
    };

    const filteredOrders = orders.filter(order => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = searchTermLower === '' ||
            order.customer.toLowerCase().includes(searchTermLower) ||
            order.article.toLowerCase().includes(searchTermLower);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesStartDate = startDate === '' || order.date >= startDate;
        const matchesEndDate = endDate === '' || order.date <= endDate;

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleExportExcel = () => {
        const dataToExport = filteredOrders.map(o => ({
            'Data': formatDate(o.date),
            'Cliente': o.customer,
            'Articolo': o.article,
            'Quantità': o.quantity,
            'Prezzo Vendita (€)': o.salePrice,
            'Totale (€)': o.quantity * o.salePrice,
            'Stato': o.status,
            'Link Cloud': o.cloudLink || ''
        }));
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ordini");
        XLSX.writeFile(workbook, `ordini_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    const handleExportPdf = () => {
        const doc = new jspdf.jsPDF();
        doc.autoTable({
            head: [['Data', 'Cliente', 'Articolo', 'Qtà', 'Prezzo', 'Totale', 'Stato']],
            body: filteredOrders.map(o => [
                formatDate(o.date),
                o.customer,
                o.article,
                o.quantity,
                formatCurrency(o.salePrice),
                formatCurrency(o.quantity * o.salePrice),
                o.status
            ]),
        });
        doc.save(`ordini_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <>
            <OrderFilterControls {...{ searchTerm, setSearchTerm, statusFilter, setStatusFilter, startDate, setStartDate, endDate, setEndDate }} />
            
            <div className="flex justify-end gap-2 mb-4">
                <button
                    onClick={handleExportExcel}
                    disabled={filteredOrders.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> Excel
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={filteredOrders.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> PDF
                </button>
            </div>

            {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <OrderItem key={order.id} order={order} onEdit={handleEditOrder} onDelete={handleDeleteOrder} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-slate-700">
                        {orders.length > 0 ? 'Nessun ordine corrisponde ai filtri' : 'Nessun ordine trovato.'}
                    </h2>
                    <p className="text-slate-500 mt-2">
                        {orders.length > 0 ? 'Prova a modificare o reimpostare i filtri.' : "Premi il pulsante '+' per creare un nuovo ordine."}
                    </p>
                </div>
            )}

            {isFormVisible && (
                <Modal title={editingOrder ? 'Modifica Ordine' : 'Nuovo Ordine'} onClose={() => setIsFormVisible(false)}>
                    <OrderForm onSave={handleSaveOrder} onCancel={() => setIsFormVisible(false)} initialOrder={editingOrder} />
                </Modal>
            )}

            <button onClick={() => { setEditingOrder(null); setIsFormVisible(true); }} className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-200 ease-in-out hover:scale-110 z-30" aria-label="Aggiungi Ordine">
                <PlusIcon />
            </button>
        </>
    );
};

export default OrdersView;