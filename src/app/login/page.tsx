'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, guardarToken } from '@/lib/api';

/**
 * Tela de entrada. Não existe "criar conta" aqui de propósito: o sistema tem
 * uma usuária só, criada pelo comando `pnpm usuario:criar` na instalação.
 */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/login', { email, senha });
      guardarToken(accessToken);
      router.push('/familias');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form
        onSubmit={entrar}
        style={{
          width: '100%', maxWidth: 380, background: 'var(--superficie)',
          border: '1px solid var(--linha)', borderRadius: 'var(--raio)',
          padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: 'var(--sombra)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: 'var(--laranja)' }}>Amigos do Nordeste</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--texto-medio)', fontSize: 14 }}>
            Cadastro de famílias
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--texto-medio)' }}>E-mail</span>
          <input
            type="email" value={email} required autoComplete="username"
            onChange={(e) => setEmail(e.target.value)} style={campo}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--texto-medio)' }}>Senha</span>
          <input
            type="password" value={senha} required autoComplete="current-password"
            onChange={(e) => setSenha(e.target.value)} style={campo}
          />
        </label>

        {erro && (
          <p role="alert" style={{ margin: 0, color: '#96382b', fontSize: 13 }}>{erro}</p>
        )}

        <button type="submit" disabled={enviando} style={botao}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

const campo: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid var(--linha)',
  fontSize: 14, fontFamily: 'inherit',
};

const botao: React.CSSProperties = {
  padding: '11px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'var(--laranja)', color: '#fff', fontWeight: 600, fontSize: 14,
};
