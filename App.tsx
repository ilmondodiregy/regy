
import React, { useState } from 'react';
import OrdersView from './components/OrdersView';
import ExpensesView from './components/ExpensesView';
import StocksView from './components/StocksView';

type Tab = 'orders' | 'expenses' | 'stocks';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('stocks');

    const tabConfig: Record<Tab, { label: string; color: string }> = {
        orders: { label: 'Ordini', color: 'blue' },
        expenses: { label: 'Spese', color: 'emerald' },
        stocks: { label: 'Scorte', color: 'purple' },
    };

    const getTabClasses = (tabName: Tab): string => {
        const isActive = activeTab === tabName;
        const color = tabConfig[tabName].color;
        
        const baseClasses = 'px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out whitespace-nowrap';
        
        if (isActive) {
            return `${baseClasses} bg-${color}-600 text-white shadow-md focus:ring-${color}-500`;
        }
        return `${baseClasses} text-slate-600 hover:bg-slate-200 hover:text-slate-800 focus:ring-${color}-500`;
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            <header className="bg-white shadow-sm sticky top-0 z-40 w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center sm:text-left mb-3 sm:mb-0">
                            Gestione Attività
                        </h1>
                        <nav className="w-full sm:w-auto">
                            <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 justify-center">
                                {(Object.keys(tabConfig) as Tab[]).map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={getTabClasses(tab)}>
                                        {tabConfig[tab].label}
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
                {activeTab === 'orders' && <OrdersView />}
                {activeTab === 'expenses' && <ExpensesView />}
                {activeTab === 'stocks' && <StocksView />}
            </main>
        </div>
    );
};

export default App;
