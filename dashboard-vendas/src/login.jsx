import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });
      const data = await response.json();
      if (data.auth) {
        localStorage.setItem('token_prohair', data.token);
        onLogin(); // Avisa o App.jsx que liberou a entrada!
      } else {
        setErro('Usuário ou senha incorretos');
      }
    } catch (err) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md bg-[#161616] rounded-2xl border border-[#ffc107]/20 p-8 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-[#ffc107] text-3xl font-bold tracking-widest uppercase m-0">Prohair</h2>
          <p className="text-gray-500 text-sm mt-2">Painel Comercial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div style={{ marginBottom: '20px' }}>
            <label className="text-gray-400 text-xs uppercase font-semibold mb-2 block">Usuário</label>
            <input 
              type="text" 
              style={{ width: '100%', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '16px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="text-gray-400 text-xs uppercase font-semibold mb-2 block">Senha</label>
            <input 
              type="password" 
              style={{ width: '100%', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '16px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {erro && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{erro}</p>}

          <button 
            type="submit"
            style={{ width: '100%', backgroundColor: '#ffc107', color: 'black', fontWeight: 'bold', padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '10px' }}
          >
            ACESSAR PAINEL
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;