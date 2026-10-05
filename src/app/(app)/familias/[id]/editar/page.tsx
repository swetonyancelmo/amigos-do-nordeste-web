'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Aviso } from '@/componentes/Aviso';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { FormularioFamilia } from '@/componentes/familia/FormularioFamilia';
import { formularioDaFicha, montarCorpoAtualizacao, type Formulario } from '@/componentes/familia/formularioFamilia';
import { ErroApi, api } from '@/lib/api';
import { deixarRecado } from '@/lib/recado';
import type { FamiliaDetalhe, FamiliaGravada } from '@/tipos/dominio';

const ACOES = (
  <Link href="/familias" className="botao botao--secundario">
    Voltar para a lista
  </Link>
);

type Carga =
  | { estado: 'carregando' }
  | { estado: 'pronta'; ficha: FamiliaDetalhe; inicial: Formulario }
  | { estado: 'inexistente' }
  | { estado: 'erro'; mensagem: string };

/**
 * Edição de família (`PUT /api/familias/{id}`), com o mesmo formulário da
 * Nova família já preenchido com a ficha. Salvou, volta para a lista, que
 * anuncia "Família atualizada".
 */
export default function EditarFamilia() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [carga, setCarga] = useState<Carga>({ estado: 'carregando' });

  // O nome do título é o da ficha carregada, não o que está sendo digitado.
  useCabecalho(
    carga.estado === 'pronta' ? `Editar família de ${carga.ficha.responsavelNome}` : 'Editar família',
    ACOES,
  );

  useEffect(() => {
    let ativo = true;
    api
      .get<FamiliaDetalhe>(`/familias/${id}`)
      .then((ficha) => ativo && setCarga({ estado: 'pronta', ficha, inicial: formularioDaFicha(ficha) }))
      .catch((e) => {
        if (!ativo) return;
        if (e instanceof ErroApi && e.status === 404) setCarga({ estado: 'inexistente' });
        else setCarga({ estado: 'erro', mensagem: e instanceof Error ? e.message : 'Não foi possível carregar a família.' });
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  async function atualizar(form: Formulario) {
    await api.put<FamiliaGravada>(`/familias/${id}`, montarCorpoAtualizacao(form));
    deixarRecado('Família atualizada');
    router.push('/familias');
  }

  if (carga.estado === 'carregando') return <p className="texto-apoio" role="status">Carregando…</p>;
  if (carga.estado === 'inexistente') {
    return (
      <Aviso titulo="Família não encontrada">
        Não encontramos esta família. O endereço pode estar errado. Volte para a lista e abra a ficha
        de novo pelo nome da responsável.
      </Aviso>
    );
  }
  if (carga.estado === 'erro') return <Aviso tom="erro" titulo="Não deu para abrir a família">{carga.mensagem}</Aviso>;

  return <FormularioFamilia inicial={carga.inicial} rotuloSalvar="Salvar alterações" aoEnviar={atualizar} edicao />;
}
