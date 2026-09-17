type PessoaResumo = {
  id?: string;
  nome: string;
  familia: string;
  comunidade: string;
  dataNascimento?: string;
  idadeEstimada?: string;
  cadastroIncompleto: boolean;
  estuda: boolean;
  gestante: boolean;
};

type Props = {
  pessoas: PessoaResumo[];
};

export function ListaPessoas({ pessoas }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pessoas.map((pessoa) => (
        <article key={pessoa.id ?? pessoa.nome} className="cartao" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.7fr) minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(110px, 0.8fr) auto', gap: 12, alignItems: 'center' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--texto-forte)', fontSize: '1rem' }}>{pessoa.nome}</strong>
              <span style={{ fontSize: 12, color: 'var(--texto-medio)' }}>{pessoa.familia}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--texto-medio)', fontSize: 12 }}>
              <span>Comunidade</span>
              <strong style={{ color: 'var(--texto-forte)' }}>{pessoa.comunidade}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--texto-medio)', fontSize: 12 }}>
              <span>Idade</span>
              <strong style={{ color: 'var(--texto-forte)' }}>
                {pessoa.dataNascimento ? pessoa.dataNascimento : pessoa.idadeEstimada ? `${pessoa.idadeEstimada} anos` : '—'}
              </strong>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pessoa.cadastroIncompleto && (
                <span style={{ background: 'var(--erro-claro)', color: 'var(--erro)', padding: '6px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Incompleto
                </span>
              )}

              {pessoa.estuda && (
                <span style={{ background: 'var(--verde-claro)', color: 'var(--verde-escuro)', padding: '6px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Estuda
                </span>
              )}

              {pessoa.gestante && (
                <span style={{ background: 'var(--laranja-claro)', color: 'var(--laranja-escuro)', padding: '6px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Gestante
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="botao botao--secundario" style={{ minHeight: 38 }}>
                Ver
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
