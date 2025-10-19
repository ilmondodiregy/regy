
export enum OrderStatus {
    DaIniziare = 'Da Iniziare',
    InSvolgimento = 'In Svolgimento',
    Terminato = 'Terminato',
}

export interface Order {
    id: string;
    date: string;
    customer: string;
    article: string;
    quantity: number;
    salePrice: number;
    status: OrderStatus;
    cloudLink?: string;
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    quantity: number;
    price: number;
}

export interface StockMovement {
    id: string;
    date: string;
    codice: string;
    descrizione: string;
    quantity: number;
    price: number | null;
    thumbnail?: string;
    fullImage?: string;
}
