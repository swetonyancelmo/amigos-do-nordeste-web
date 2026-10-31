'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, guardarToken, guardarUsuario } from '@/lib/api';
import type { UsuarioResumo } from '@/tipos/dominio';
import { Marca } from '@/componentes/Marca';
import { Sol } from '@/componentes/Sol';
import { Aviso } from '@/componentes/Aviso';
import { Button } from '@/componentes/ui/button';
import { Campo } from '@/componentes/ui/campo';

/**
 * Tela de entrada. Não existe "criar conta" aqui de propósito: o sistema tem
 * uma usuária só, criada pelo perfil `criar-usuario` da API na instalação.
 *
 * Também não há "esqueci minha senha": a redefinição é feita no servidor por
 * quem instalou. A tela não explica nenhuma das duas coisas — quem usa é uma
 * pessoa só, que já sabe disso, e o aviso permanente só ocupava espaço.
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
      const { accessToken, usuario } = await api.post<{ accessToken: string; usuario: UsuarioResumo }>(
        '/auth/login',
        { email, senha },
      );
      guardarToken(accessToken);
      guardarUsuario(usuario);
      router.push('/inicio');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    // data-preflight: o reset do Tailwind vale nesta tela. Ver tailwind.css.
    // A tela é dividida: à esquerda o lugar, à direita o trabalho. No celular
    // a identidade vira faixa de topo, para o formulário caber na primeira dobra.
    <main data-preflight className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] min-[900px]:grid-cols-[1.05fr_1fr] min-[900px]:grid-rows-1">
      <section className="relative flex flex-col justify-center overflow-hidden bg-accent px-6 py-8 min-[900px]:px-12 min-[900px]:py-16">
        {/* Marca d'água, cortada pela borda de propósito. */}
        <Sol className="pointer-events-none absolute -right-[7%] -bottom-[32%] aspect-square w-[180px] opacity-[0.22] min-[900px]:-bottom-[16%] min-[900px]:w-[min(300px,46%)]" />
        <div className="relative flex flex-col items-center gap-4 max-[899px]:[&_.marca>p]:text-[0.9375rem]! max-[899px]:[&_img]:w-[124px] min-[900px]:gap-8">
          <Marca largura={208} placa linha="Cadastro das famílias atendidas pela associação" />
          <p className="text-center text-sm font-bold tracking-[0.14em] text-primary uppercase">
            Sertão do Moxotó · Pernambuco
          </p>
        </div>
      </section>

      <section className="flex flex-col bg-card px-6 pt-8 pb-12 min-[900px]:justify-center min-[900px]:border-l min-[900px]:px-12 min-[900px]:py-16">
        <form className="mx-auto flex w-full max-w-[380px] flex-col gap-6" onSubmit={entrar}>
          <h1 className="font-heading text-[1.375rem] font-extrabold tracking-[-0.01em] text-foreground before:mb-4 before:block before:h-1 before:w-14 before:rounded-full before:bg-primary before:content-['']">
            Entrar
          </h1>

          <div className="flex flex-col gap-4">
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

          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </main>
  );
}
