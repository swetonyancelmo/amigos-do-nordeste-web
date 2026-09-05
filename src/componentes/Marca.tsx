import Image from 'next/image';

type Props = {
  /** Largura do logo em px. A altura acompanha a proporção do arquivo. */
  largura?: number;
  /** Linha de apoio abaixo do logo. `null` mostra só o logo. */
  linha?: string | null;
  /**
   * Assenta o logo numa placa branca. Ligue sempre que o fundo atrás não for
   * branco — ver o comentário sobre o arquivo ser JPEG, logo abaixo.
   */
  placa?: boolean;
};

/**
 * Assinatura da Associação Amigos do Nordeste.
 *
 * O arquivo é `public/logo-amigos-do-nordeste.jpeg`, a logo oficial — sol,
 * cacto, abelha e o nome, tudo junto. Por isso este componente NÃO escreve
 * "Amigos do Nordeste" em texto ao lado: o nome já está na imagem, e repetir
 * dá leitura dobrada no leitor de tela.
 *
 * ATENÇÃO — o arquivo é JPEG, então tem fundo branco opaco, não transparente.
 * Sobre qualquer fundo que não seja branco ele aparece como um retângulo
 * branco. Por isso existe a prop `placa`, que transforma esse retângulo numa
 * placa arredondada de propósito. Se um dia a associação mandar um PNG ou SVG
 * com fundo transparente, troque o arquivo e a `placa` vira opcional de fato.
 *
 * Não recorte, não recolora e não redesenhe a marca. Se precisar de outra
 * versão (fundo escuro, monocromática, só o selo), peça à associação — a
 * marca não é nossa para reinterpretar. Para decoração use o `Sol`, que é
 * geometria solta e não a logo.
 */
export function Marca({ largura = 168, linha = null, placa = false }: Props) {
  return (
    <div className="marca">
      {/* A placa é uma moldura à parte, nunca padding na <img>: com
          box-sizing: border-box o padding comeria a largura do logo. */}
      <div className={placa ? 'marca__moldura marca__moldura--placa' : 'marca__moldura'}>
        <Image
          className="marca__logo"
          src="/logo-amigos-do-nordeste.jpeg"
          alt="Associação Amigos do Nordeste"
          width={largura}
          height={Math.round((largura * 694) / 649)}
          priority
        />
      </div>
      {linha && <p className="marca__linha">{linha}</p>}
    </div>
  );
}
