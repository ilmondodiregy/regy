import React, { useState } from 'react';
import { useLocalStorage } from '../hooks';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XCircleIcon, FileDownloadIcon } from './Icons';
import Modal from './Modal';

// Dichiarazione delle librerie globali caricate via CDN
declare const XLSX: any;
declare const jspdf: any;

// FilterControls Component
interface ExpenseFilterControlsProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
}

const ExpenseFilterControls: React.FC<ExpenseFilterControlsProps> = ({ searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate }) => {
    const handleReset = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const isFiltered = searchTerm || startDate || endDate;

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="search-expense" className="block text-sm font-medium text-slate-700">Cerca Descrizione</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <SearchIcon />
                        </div>
                        <input type="text" id="search-expense" placeholder="Cerca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-md border-slate-300 py-2 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="startDate-expense" className="block text-sm font-medium text-slate-700">Da</label>
                        <input type="date" id="startDate-expense" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border" />
                    </div>
                    <div>
                        <label htmlFor="endDate-expense" className="block text-sm font-medium text-slate-700">A</label>
                        <input type="date" id="endDate-expense" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border" />
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

// ExpenseForm Component
interface ExpenseFormProps {
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    onCancel: () => void;
    initialExpense: Expense | null;
}
const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onCancel, initialExpense }) => {
    const [description, setDescription] = useState(initialExpense?.description || '');
    const [quantity, setQuantity] = useState(initialExpense?.quantity || 1);
    const [price, setPrice] = useState(initialExpense?.price?.toString() || '');
    const [date, setDate] = useState(initialExpense?.date || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || quantity <= 0 || price === '' || Number(price) < 0) {
            alert('Per favore, compila tutti i campi obbligatori. Quantità e prezzo non possono essere negativi.');
            return;
        }

        const expenseData = {
            date, description,
            quantity: Number(quantity),
            price: Number(price),
        };

        if (initialExpense) {
            onSave({ ...expenseData, id: initialExpense.id });
        } else {
            onSave(expenseData);
        }
    };

    const total = (quantity > 0 && price !== '' && Number(price) >= 0)
        ? (quantity * Number(price)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00';

    return (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrizione *</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantità *</label>
                    <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} min="1" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-slate-700">Prezzo (€) *</label>
                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" required placeholder="Es. 19.99" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-right">
                <span className="text-sm font-medium text-slate-600">Totale: </span>
                <span className="text-xl font-bold text-slate-900">€ {total}</span>
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data *</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-emerald-700">Salva Spesa</button>
            </div>
        </form>
    );
};


// ExpenseItem Component
interface ExpenseItemProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}
const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onEdit, onDelete }) => {
    const total = expense.quantity * expense.price;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
            <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-lg font-bold text-slate-800 flex-1 pr-4">{expense.description}</h3>
                    <p className="text-sm text-slate-500 whitespace-nowrap">{formatDate(expense.date)}</p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center md:text-left">
                        <div>
                            <p className="text-sm text-slate-500">Quantità</p>
                            <p className="font-semibold text-slate-800">{expense.quantity}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Prezzo Unit.</p>
                            <p className="font-semibold text-slate-800">{formatCurrency(expense.price)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Totale</p>
                            <p className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-1">
                 <button onClick={() => onEdit(expense)} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-full" title="Modifica"><EditIcon /></button>
                <button onClick={() => onDelete(expense.id)} className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-100 rounded-full" title="Elimina"><TrashIcon /></button>
            </div>
        </div>
    );
};

// Main View Component
const ExpensesView: React.FC = () => {
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSaveExpense = (expenseToSave: Omit<Expense, 'id'> | Expense) => {
        if ('id' in expenseToSave) {
            setExpenses(expenses.map(e => e.id === expenseToSave.id ? expenseToSave : e));
        } else {
            const newExpense = { ...expenseToSave, id: new Date().toISOString() };
            setExpenses([...expenses, newExpense]);
        }
        setIsFormVisible(false);
    };

    const handleDeleteExpense = (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa spesa?")) {
            setExpenses(expenses.filter(e => e.id !== id));
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setIsFormVisible(true);
    };

    const filteredExpenses = expenses.filter(expense => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = searchTermLower === '' ||
            expense.description.toLowerCase().includes(searchTermLower);

        const matchesStartDate = startDate === '' || expense.date >= startDate;
        const matchesEndDate = endDate === '' || expense.date <= endDate;

        return matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleExportExcel = () => {
        const dataToExport = filteredExpenses.map(e => ({
            'Data': formatDate(e.date),
            'Descrizione': e.description,
            'Quantità': e.quantity,
            'Prezzo (€)': e.price,
            'Totale (€)': e.quantity * e.price,
        }));
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Spese");
        XLSX.writeFile(workbook, `spese_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    const handleExportPdf = () => {
        const doc = new jspdf.jsPDF();
        doc.autoTable({
            head: [['Data', 'Descrizione', 'Qtà', 'Prezzo', 'Totale']],
            body: filteredExpenses.map(e => [
                formatDate(e.date),
                e.description,
                e.quantity,
                formatCurrency(e.price),
                formatCurrency(e.quantity * e.price),
            ]),
        });
        doc.save(`spese_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <>
            <ExpenseFilterControls {...{ searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate }} />
            
            <div className="flex justify-end gap-2 mb-4">
                 <button
                    onClick={handleExportExcel}
                    disabled={filteredExpenses.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> Excel
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={filteredExpenses.length === 0}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDownloadIcon className="h-5 w-5 mr-1" /> PDF
                </button>
            </div>

            {filteredExpenses.length > 0 ? (
                 <div className="space-y-4">
                    {filteredExpenses.map(expense => (
                        <ExpenseItem key={expense.id} expense={expense} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-slate-700">
                        {expenses.length > 0 ? 'Nessuna spesa corrisponde ai filtri' : 'Nessuna spesa trovata.'}
                    </h2>
                    <p className="text-slate-500 mt-2">
                        {expenses.length > 0 ? 'Prova a modificare o reimpostare i filtri.' : "Premi il pulsante '+' per creare una nuova spesa."}
                    </p>
                </div>
            )}

            {isFormVisible && (
                 <Modal title={editingExpense ? 'Modifica Spesa' : 'Nuova Spesa'} onClose={() => setIsFormVisible(false)}>
                    <ExpenseForm onSave={handleSaveExpense} onCancel={() => setIsFormVisible(false)} initialExpense={editingExpense} />
                </Modal>
            )}

            <button onClick={() => { setEditingExpense(null); setIsFormVisible(true); }} className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full p-4 shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-transform duration-200 ease-in-out hover:scale-110 z-30" aria-label="Aggiungi Spesa">
                <PlusIcon />
            </button>
        </>
    );
};

export default ExpensesView;