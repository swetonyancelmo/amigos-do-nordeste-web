'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import {
  IconeCamera,
  IconeChave,
  IconeConfirmar,
  IconePerfil,
} from '@/componentes/Icones';
import { useRecado } from '@/lib/useRecado';
import styles from './perfil.module.css';

/**
 * Perfil da usuária — quem usa o sistema é uma pessoa só (regra 5), então
 * esta tela não tem lista nem busca: são os dados dela e a senha dela.
 *
 * O título "Perfil" já vem do cabeçalho do casco (useCabecalho), por isso a
 * tela não repete nome nenhum no corpo: entra direto nos dados.
 */

/** Mesmo mínimo que o endpoint de senha vai exigir quando existir. */
const MINIMO_DA_SENHA = 8;

const TIPOS_DE_USUARIO = ['NÃO É PRESTADOR', 'PRESTADOR', 'ADMINISTRADOR'];

type DadosPessoais = {
  login: string;
  nome: string;
  nascimento: string;
  telefone: string;
  celular: string;
  tipoDeUsuario: string;
};

type Senhas = {
  atual: string;
  nova: string;
  confirmacao: string;
};

type ErrosDaSenha = Partial<Record<keyof Senhas, string>>;

/**
 * A tela abre vazia, com os textos nos placeholders: enquanto a API não
 * devolve os dados da usuária, um "Seu Nome" dentro do campo só esconderia
 * que ainda não há dado nenhum.
 */
const DADOS_VAZIOS: DadosPessoais = {
  login: '',
  nome: '',
  nascimento: '',
  telefone: '',
  celular: '',
  tipoDeUsuario: TIPOS_DE_USUARIO[0],
};

const SENHAS_VAZIAS: Senhas = { atual: '', nova: '', confirmacao: '' };

/** "NÃO É PRESTADOR" na etiqueta vira "Não é prestador" — caixa alta grita. */
function formatarTipoDeUsuario(tipo: string) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase();
}

export default function Perfil() {
  useCabecalho('Perfil');

  const arquivoRef = useRef<HTMLInputElement>(null);

  const [foto, setFoto] = useState<string | null>(null);
  const [dados, setDados] = useState(DADOS_VAZIOS);
  const [redefinindoSenha, setRedefinindoSenha] = useState(false);
  const [senhas, setSenhas] = useState(SENHAS_VAZIAS);
  const [errosDaSenha, setErrosDaSenha] = useState<ErrosDaSenha>({});

  const recadoDosDados = useRecado();
  const recadoDaSenha = useRecado();

  function alterarDado(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

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

  function escolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    // A foto fica só na tela até a API ter upload. O endereço é liberado
    // quando a próxima foto entra no lugar desta.
    const endereco = URL.createObjectURL(arquivo);
    if (foto) URL.revokeObjectURL(foto);
    setFoto(endereco);
  }

  function salvarDados(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    recadoDosDados.mostrar('Dados atualizados com sucesso!');
  }

  function conferirSenhas(): ErrosDaSenha {
    const erros: ErrosDaSenha = {};

    if (!senhas.atual) {
      erros.atual = 'Informe a senha atual.';
    }

    if (senhas.nova.length < MINIMO_DA_SENHA) {
      erros.nova = `Use pelo menos ${MINIMO_DA_SENHA} caracteres.`;
    }

    if (senhas.confirmacao !== senhas.nova) {
      erros.confirmacao = 'A confirmação precisa ser igual à nova senha.';
    }

    return erros;
  }

  function salvarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const erros = conferirSenhas();
    setErrosDaSenha(erros);
    if (Object.keys(erros).length > 0) return;

    // TODO(equipe frontend): trocar por api.post('/auth/redefinir-senha', …)
    // quando o endpoint existir. Até lá a tela só confirma o que foi digitado,
    // como já fazia o "Salvar alterações".
    fecharSenha();
    recadoDaSenha.mostrar('Senha redefinida com sucesso!');
  }

  function fecharSenha() {
    setRedefinindoSenha(false);
    setSenhas(SENHAS_VAZIAS);
    setErrosDaSenha({});
  }

  return (
    <main className={styles.tela}>
      <section className={`cartao ${styles.bloco}`}>
        <div className={styles.identidade}>
          <div className={styles.quem}>
            <div className={styles.avatar}>
              {foto ? (
                /* A foto vem de um arquivo local (URL de blob), então o
                   otimizador do next/image não tem o que otimizar — e ele
                   tentaria buscar no servidor um endereço que só existe no
                   navegador. Aqui a tag simples é a ferramenta certa. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt={`Foto de ${dados.nome || 'perfil'}`}
                  className={styles.foto}
                />
              ) : (
                <IconePerfil tamanho={46} />
              )}
            </div>

            <div>
              <h2>{dados.nome || 'Usuário'}</h2>
              <p>{formatarTipoDeUsuario(dados.tipoDeUsuario)}</p>
            </div>
          </div>

          {/* O input de arquivo não dá para estilizar; quem aparece é o botão,
              que repassa o clique para ele. */}
          <input
            ref={arquivoRef}
            type="file"
            accept="image/*"
            onChange={escolherFoto}
            className={styles.escondido}
            tabIndex={-1}
            aria-hidden="true"
          />

          <Botao
            variante="secundario"
            type="button"
            onClick={() => arquivoRef.current?.click()}
          >
            <IconeCamera />
            Alterar foto
          </Botao>
        </div>

        <form onSubmit={salvarDados}>
          <div className={styles.grade}>
            <Campo
              rotulo="E-mail / Login"
              name="login"
              type="email"
              autoComplete="username"
              value={dados.login}
              onChange={alterarDado}
              placeholder="voce@exemplo.com"
              required
            />

            <Campo
              rotulo="Data de nascimento"
              name="nascimento"
              type="date"
              autoComplete="bday"
              value={dados.nascimento}
              onChange={alterarDado}
            />

            <Campo
              rotulo="Nome"
              name="nome"
              type="text"
              autoComplete="name"
              value={dados.nome}
              onChange={alterarDado}
              placeholder="Nome completo"
              required
            />

            <Campo
              rotulo="Celular"
              name="celular"
              type="tel"
              autoComplete="tel"
              value={dados.celular}
              onChange={alterarDado}
              placeholder="(00) 00000-0000"
            />

            <Campo
              rotulo="Telefone"
              name="telefone"
              type="tel"
              value={dados.telefone}
              onChange={alterarDado}
              placeholder="(00) 0000-0000"
            />

            <div className="campo">
              <label className="campo__rotulo" htmlFor="tipoDeUsuario">
                Tipo de usuário
              </label>
              <select
                id="tipoDeUsuario"
                name="tipoDeUsuario"
                className="campo__entrada"
                value={dados.tipoDeUsuario}
                onChange={alterarDado}
              >
                {TIPOS_DE_USUARIO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.acoes}>
            <Botao type="submit">
              <IconeConfirmar />
              Salvar alterações
            </Botao>
          </div>
        </form>

        {recadoDosDados.recado && (
          <Aviso titulo="Tudo certo">{recadoDosDados.recado}</Aviso>
        )}
      </section>

      <section className={`cartao ${styles.bloco}`}>
        <div>
          <h2 className={styles.tituloSecao}>Senha</h2>
          <p className="texto-apoio">
            A senha não aparece na tela. Para trocá-la, confirme a atual e
            escolha uma nova.
          </p>
        </div>

        {!redefinindoSenha && (
          <div className={styles.senha}>
            <span className={styles.pontos} aria-hidden="true">
              ••••••••••
            </span>
            <span className="so-leitor-de-tela">Senha cadastrada</span>

            <Botao
              variante="secundario"
              type="button"
              onClick={() => setRedefinindoSenha(true)}
            >
              <IconeChave />
              Redefinir senha
            </Botao>
          </div>
        )}

        {redefinindoSenha && (
          <form className={styles.formSenha} onSubmit={salvarSenha} noValidate>
            {/* Senha sem campo de usuário deixa o gerenciador de senhas do
                navegador perdido — e ele avisa isso no console. É o mesmo
                login do cadastro; fora da tela e sem receber foco. */}
            <input
              type="text"
              name="login"
              autoComplete="username"
              value={dados.login}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="so-leitor-de-tela"
            />

            <div className={styles.grade}>
              <div className={styles.campoLargo}>
                <Campo
                  rotulo="Senha atual"
                  name="atual"
                  type="password"
                  autoComplete="current-password"
                  value={senhas.atual}
                  onChange={alterarSenha}
                  erro={errosDaSenha.atual}
                  required
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

            <div className={styles.acoes}>
              <Botao type="submit">
                <IconeConfirmar />
                Salvar nova senha
              </Botao>

              <Botao variante="secundario" type="button" onClick={fecharSenha}>
                Cancelar
              </Botao>
            </div>
          </form>
        )}

        {recadoDaSenha.recado && (
          <Aviso titulo="Tudo certo">{recadoDaSenha.recado}</Aviso>
        )}
      </section>
    </main>
  );
}
