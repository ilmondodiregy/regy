// =================================================================
// 🔐 NUOVI COMPONENTI FIREBASE AUTH
// =================================================================
// Questi componenti sostituiscono il vecchio sistema auth (linee 330-558)

// =================================================================
// 1. LOGIN/SIGNUP VIEW CON FIREBASE
// =================================================================
const LoginView = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const { login, signup, resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignup) {
                await signup(email, password, displayName);
            } else {
                await login(email, password);
            }
        } catch (err) {
            console.error('Auth error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('❌ Questa email è già registrata');
            } else if (err.code === 'auth/weak-password') {
                setError('❌ Password troppo debole (min 6 caratteri)');
            } else if (err.code === 'auth/user-not-found') {
                setError('❌ Utente non trovato');
            } else if (err.code === 'auth/wrong-password') {
                setError('❌ Password errata');
            } else if (err.code === 'auth/invalid-email') {
                setError('❌ Email non valida');
            } else {
                setError('❌ ' + (err.message || 'Errore di autenticazione'));
            }
        }

        setIsLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await resetPassword(resetEmail);
            setResetSuccess(true);
        } catch (err) {
            setError('❌ ' + (err.message || 'Errore invio email'));
        }

        setIsLoading(false);
    };

    if (resetMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">🔑 Reset Password</h1>
                        <p className="text-slate-600 text-sm">Ti invieremo un'email per reimpostare la password</p>
                    </div>

                    {resetSuccess ? (
                        <div>
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                                ✅ Email inviata! Controlla la tua casella di posta.
                            </div>
                            <button
                                onClick={() => { setResetMode(false); setResetSuccess(false); }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                ← Torna al Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="tua@email.com"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg"
                            >
                                {isLoading ? 'Invio...' : '📧 Invia Email Reset'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setResetMode(false)}
                                className="w-full text-slate-600 hover:text-slate-800 py-2 text-sm"
                            >
                                ← Torna al Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestione Pro v5.0</h1>
                    <p className="text-slate-600">{isSignup ? 'Crea il tuo account' : 'Accedi per continuare'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                autoFocus
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Mario Rossi"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus={!isSignup}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="tua@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Minimo 6 caratteri"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? (isSignup ? 'Registrazione...' : 'Accesso...') : (isSignup ? '✨ Registrati' : '🔐 Accedi')}
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    <button
                        onClick={() => { setIsSignup(!isSignup); setError(''); }}
                        className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        {isSignup ? '← Hai già un account? Accedi' : '✨ Non hai un account? Registrati'}
                    </button>

                    {!isSignup && (
                        <button
                            onClick={() => setResetMode(true)}
                            className="w-full text-slate-600 hover:text-slate-800 text-sm"
                        >
                            🔑 Password dimenticata?
                        </button>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                        🔥 Powered by Firebase Authentication
                    </p>
                </div>
            </div>
        </div>
    );
};

// =================================================================
// 2. ISTRUZIONI DI INTEGRAZIONE
// =================================================================

/*
STEP-BY-STEP PER INTEGRARE:

1. APRI index.html

2. TROVA la sezione "// Login View Component" (circa linea 334)

3. ELIMINA tutto da "const LoginView = () => {" fino a "};" della funzione AccountSettings
   (circa linee 334-558)

4. INCOLLA il nuovo LoginView qui sopra

5. TROVA la sezione dove viene renderizzato l'app principale (cerca "const App = () =>")

6. MODIFICA il componente App per includere la protezione auth:

   const App = () => {
       const { currentUser } = useAuth();

       // Se non c'è utente loggato, mostra login
       if (!currentUser) {
           return <LoginView />;
       }

       // Se c'è utente, mostra l'app normale
       return <MainAppContent />;
   };

7. MODIFICA la funzione principale dove si fa il render:

   const root = ReactDOM.createRoot(document.getElementById('root'));
   root.render(
       <StrictMode>
           <AuthProvider>
               <ToastProvider>
                   <App />
               </ToastProvider>
           </AuthProvider>
       </StrictMode>
   );

8. AGGIUNGI pulsante Logout nella navbar (dove c'è il menu utente):

   const { logout, currentUser } = useAuth();

   <button onClick={logout} className="...">
       🚪 Logout ({currentUser.email})
   </button>

9. SALVA il file

10. RICARICA la pagina - Dovrebbe apparire la schermata di login!
*/
