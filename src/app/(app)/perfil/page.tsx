'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Aviso } from '@/componentes/Aviso';
import { IconeChave, IconeConfirmar, IconePerfil } from '@/componentes/Icones';
import { Button } from '@/componentes/ui/button';
import { Campo } from '@/componentes/ui/campo';
import { Card } from '@/componentes/ui/card';
import { api, usuarioDaSessao } from '@/lib/api';
import { useRecado } from '@/lib/useRecado';

/**
 * Perfil da usuária — quem usa o sistema é uma pessoa só (regra 5), então
 * esta tela não tem lista nem busca: são os dados dela e a senha dela.
 *
 * O título "Perfil" já vem do cabeçalho do casco (useCabecalho), por isso a
 * tela não repete nome nenhum no corpo: entra direto nos dados.
 *
 * A API não tem rota de perfil (não existe /api/usuario): nome e e-mail vêm
 * da resposta do login ou da renovação e aqui são só leitura. Editar dados ou trocar foto
 * pede essa rota no repositório da API antes.
 */

/** Mesmo mínimo do `TrocarSenhaRequisicao` da API (@Size(min = 10)). */
const MINIMO_DA_SENHA = 10;

type Senhas = {
  atual: string;
  nova: string;
  confirmacao: string;
};

type ErrosDaSenha = Partial<Record<keyof Senhas, string>>;

const SENHAS_VAZIAS: Senhas = { atual: '', nova: '', confirmacao: '' };

const BLOCO = 'gap-6 p-8 text-[1rem] celular:p-6';
const TITULO = 'font-heading text-[1.375rem] font-bold text-foreground';
const APOIO = 'text-sm text-muted-foreground';

export default function Perfil() {
  useCabecalho('Perfil');

  // Lido uma vez: a GuardaSessao só monta a tela depois do login ou da
  // renovação, então o usuário já está em memória.
  const [usuario] = useState(usuarioDaSessao);
  const [redefinindoSenha, setRedefinindoSenha] = useState(false);
  const [senhas, setSenhas] = useState(SENHAS_VAZIAS);
  const [errosDaSenha, setErrosDaSenha] = useState<ErrosDaSenha>({});
  const [erroDoEnvio, setErroDoEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const recadoDaSenha = useRecado();

  function alterarSenha(evento: ChangeEvent<HTMLInputElement>) {
    const campo = evento.target.name as keyof Senhas;
    const { value } = evento.target;

    setSenhas((anterior) => ({ ...anterior, [campo]: value }));

    // O erro daquele campo some assim que a pessoa começa a corrigir: deixar
    // a marca vermelha depois da correção diria que ainda está errado.
    setErrosDaSenha((anterior) => {
      if (!anterior[campo]) return anterior;

      const proximo = { ...anterior };
      delete proximo[campo];
      return proximo;
    });
  }

  function conferirSenhas(): ErrosDaSenha {
    const erros: ErrosDaSenha = {};

    if (!senhas.atual) {
      erros.atual = 'Informe a senha atual.';
    }

    if (senhas.nova.length < MINIMO_DA_SENHA) {
      erros.nova = `Use pelo menos ${MINIMO_DA_SENHA} caracteres.`;
    } else if (senhas.nova === senhas.atual) {
      erros.nova = 'A nova senha precisa ser diferente da atual.';
    }

    if (senhas.confirmacao !== senhas.nova) {
      erros.confirmacao = 'A confirmação precisa ser igual à nova senha.';
    }

    return erros;
  }

  async function salvarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const erros = conferirSenhas();
    setErrosDaSenha(erros);
    setErroDoEnvio(null);
    if (Object.keys(erros).length > 0) return;

    setEnviando(true);
    try {
      await api.post('/auth/trocar-senha', {
        senhaAtual: senhas.atual,
        senhaNova: senhas.nova,
      });
      fecharSenha();
      recadoDaSenha.mostrar('Senha alterada. Use a nova no próximo login.');
    } catch (erro) {
      // 400 traz a mensagem da API ("A senha atual está incorreta.", tamanho
      // mínimo); rede caída já vem traduzida pelo api.ts.
      setErroDoEnvio(erro instanceof Error ? erro.message : 'Não foi possível trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  function fecharSenha() {
    setRedefinindoSenha(false);
    setSenhas(SENHAS_VAZIAS);
    setErrosDaSenha({});
    setErroDoEnvio(null);
  }

  return (
    // data-preflight: o reset do Tailwind vale nesta tela. Ver tailwind.css.
    <div data-preflight className="flex flex-col gap-6">
      <Card className={BLOCO}>
        <div className="flex min-w-0 items-center gap-4 celular:flex-col celular:items-start">
          <div className="flex size-24 flex-none items-center justify-center rounded-full border border-border bg-accent text-muted-foreground">
            <IconePerfil tamanho={46} />
          </div>

          <div>
            <h2 className={`${TITULO} mb-1 wrap-anywhere`}>{usuario?.nome || 'Usuária do painel'}</h2>
            {usuario?.email && <p className={`${APOIO} wrap-anywhere`}>{usuario.email}</p>}
          </div>
        </div>

        <p className={APOIO}>
          Nome e e-mail são definidos na instalação do sistema e ainda não podem
          ser alterados por aqui.
        </p>
      </Card>

      <Card className={BLOCO}>
        <div>
          <h2 className={`${TITULO} mb-2`}>Senha</h2>
          <p className={APOIO}>
            A senha não aparece na tela. Para trocá-la, confirme a atual e
            escolha uma nova.
          </p>
        </div>

        {!redefinindoSenha && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-background p-4">
            <span className="text-[1.375rem] tracking-[0.18em] text-muted-foreground" aria-hidden="true">
              ••••••••••
            </span>
            <span className="so-leitor-de-tela">Senha cadastrada</span>

            <Button
              variant="outline"
              type="button"
              onClick={() => setRedefinindoSenha(true)}
            >
              <IconeChave />
              Redefinir senha
            </Button>
          </div>
        )}

        {redefinindoSenha && (
          <form className="flex flex-col gap-6" onSubmit={salvarSenha} noValidate>
            {/* Senha sem campo de usuário deixa o gerenciador de senhas do
                navegador perdido — e ele avisa isso no console. É o e-mail
                do login; fora da tela e sem receber foco. */}
            {usuario?.email && (
              <input
                type="text"
                name="login"
                autoComplete="username"
                value={usuario.email}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="so-leitor-de-tela"
              />
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 celular:grid-cols-1">
              <div className="col-span-full">
                <Campo
                  rotulo="Senha atual"
                  name="atual"
                  type="password"
                  autoComplete="current-password"
                  value={senhas.atual}
                  onChange={alterarSenha}
                  erro={errosDaSenha.atual}
                  required
                  autoFocus
                />
              </div>

              <Campo
                rotulo="Nova senha"
                name="nova"
                type="password"
                autoComplete="new-password"
                value={senhas.nova}
                onChange={alterarSenha}
                ajuda={`Pelo menos ${MINIMO_DA_SENHA} caracteres.`}
                erro={errosDaSenha.nova}
                required
              />

              <Campo
                rotulo="Confirmar nova senha"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                value={senhas.confirmacao}
                onChange={alterarSenha}
                erro={errosDaSenha.confirmacao}
                required
              />
            </div>

            {erroDoEnvio && (
              <Aviso tom="erro" titulo="Senha não alterada">
                {erroDoEnvio}
              </Aviso>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={enviando}>
                <IconeConfirmar />
                {enviando ? 'Salvando…' : 'Salvar nova senha'}
              </Button>

              <Button variant="outline" type="button" onClick={fecharSenha} disabled={enviando}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* A região fica sempre na página: o leitor de tela só anuncia o que
            muda dentro de uma região que já existia. */}
        <div role="status">
          {recadoDaSenha.recado && (
            <Aviso titulo="Tudo certo">{recadoDaSenha.recado}</Aviso>
          )}
        </div>
      </Card>
    </div>
  );
}
