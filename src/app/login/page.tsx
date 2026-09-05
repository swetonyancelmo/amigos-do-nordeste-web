'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, guardarToken } from '@/lib/api';
import { Marca } from '@/componentes/Marca';
import { Sol } from '@/componentes/Sol';
import { Campo } from '@/componentes/Campo';
import { Botao } from '@/componentes/Botao';
import { Aviso } from '@/componentes/Aviso';
import estilos from './login.module.css';

/**
 * Tela de entrada. Não existe "criar conta" aqui de propósito: o sistema tem
 * uma usuária só, criada pelo comando `pnpm usuario:criar` na instalação.
 *
 * Os dois recados do rodapé não são enfeite. Sem eles a pessoa fica procurando
 * "esqueci minha senha" e "criar conta", não acha, e conclui que o sistema
 * está quebrado — quando na verdade é assim que ele foi decidido (ADR-0002).
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
    <main className={estilos.tela}>
      <section className={estilos.identidade}>
        <Sol className={estilos.sol} />
        <div className={estilos.conteudoIdentidade}>
          <Marca largura={208} placa linha="Cadastro das famílias atendidas pela associação" />
          <p className={estilos.lugar}>Sertão do Moxotó · Pernambuco</p>
        </div>
      </section>

      <section className={estilos.acesso}>
        <form className={estilos.formulario} onSubmit={entrar}>
          <h1 className={estilos.titulo}>Entrar</h1>

          <div className={estilos.campos}>
            <Campo
              rotulo="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              disabled={enviando}
            />

            <Campo
              rotulo="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              disabled={enviando}
            />
          </div>

          {erro && (
            <Aviso tom="erro" titulo="Não deu para entrar">
              {erro}
            </Aviso>
          )}

          <Botao type="submit" largo disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>

          <div className={estilos.rodape}>
            <p className="texto-apoio">
              <strong>Esqueceu a senha?</strong> Não há recuperação por e-mail neste sistema — fale
              com quem instalou, que redefine pelo servidor.
            </p>

            <Aviso titulo="Não existe “criar conta” aqui">
              O sistema tem uma usuária. A primeira conta nasce de um comando no servidor, na
              instalação.
            </Aviso>
          </div>
        </form>
      </section>
    </main>
  );
}
