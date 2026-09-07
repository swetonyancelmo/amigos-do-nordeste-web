'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Marca } from './Marca';
import { Botao } from './Botao';
import { guardarToken } from '@/lib/api';

const ITENS = [
  { href: '/familias', rotulo: 'Famílias' },
  { href: '/relatorios', rotulo: 'Relatórios' },
];

/**
 * Navegação lateral, fixa em toda tela logada. A usuária é uma pessoa só
 * (ver regra 5 do sistema), então não há menu de conta — só as telas e Sair.
 */
export function Navegacao() {
  const pathname = usePathname();
  const router = useRouter();

  function sair() {
    // TODO(equipe frontend): chamar POST /auth/sair para invalidar o cookie
    // de refresh no servidor, quando esse endpoint existir na API.
    guardarToken(null);
    router.push('/login');
  }

  return (
    <nav className="navegacao" aria-label="Navegação principal">
      <div className="navegacao__marca">
        <Marca largura={104} />
      </div>

      <ul className="navegacao__links">
        {ITENS.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="navegacao__link"
                aria-current={ativo ? 'page' : undefined}
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="navegacao__rodape">
        <Botao variante="secundario" largo onClick={sair}>
          Sair
        </Botao>
      </div>
    </nav>
  );
}
