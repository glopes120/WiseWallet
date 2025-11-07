
import React, { useState, useEffect } from 'react';
import './App.css'; // O seu CSS original
import { supabase } from './supabaseClient'; // O seu cliente Supabase
import LoginForm from './components/LoginForm'; // O seu formulário de login

// 1. IMPORTAR o componente Dashboard
import Dashboard from './components/dashboard.jsx'; // Verifique se este caminho está certo

function App() {
    const [session, setSession] = useState(null);
    const [view, setView] = useState('dashboard'); // Lifted state

    useEffect(() => {
        // Tenta obter a sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // "Ouve" por mudanças no estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // 'cleanup'
        return () => subscription.unsubscribe();
    }, []);

    
    // Se NÃO houver sessão (utilizador não logado), mostramos a página de Login
    if (!session) {
        return (
            <div className="App"> 
                <div className="left-side">
                    <LoginForm onLoginSuccess={(session) => setSession(session)} />
                </div>
                <div className="right-side">
                    <h1 className="app-title">WiseWallet</h1>
                    <p className="app-description">A minha app de gestão de despesas!</p>
                </div>
            </div>
        );
    } else {
        // Se HÁ sessão (utilizador logado), mostramos o Dashboard
        return (
            <div className="App-logged-in"> 
                
                {/* Cabeçalho */}
                <header style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 20px', 
                    background: '#f4f4f4', 
                    borderBottom: '1px solid #ddd' 
                }}>
                    <h1>WiseWallet</h1>
                    <button onClick={() => setView('profile')} className="profile-button">Profile</button>
                </header>

                {/* 2. RENDERIZAR o componente Dashboard aqui */}
                
                <Dashboard view={view} setView={setView} />
            </div>
        );
    }
}

export default App;