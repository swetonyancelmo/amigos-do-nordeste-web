import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

/**
 * O wordmark do logo é uma grotesca pesada e levemente arredondada. A Nunito é
 * o que chega perto disso no que é livre, e entra só em título e assinatura —
 * o corpo e os campos do formulário continuam em system-ui, que carrega na
 * hora e não dá salto de layout na internet da associação.
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--fonte-nunito",
});

export const metadata: Metadata = {
  title: "Cadastro de Famílias · Amigos do Nordeste",
  description:
    "Sistema de cadastro das famílias atendidas pela Associação Amigos do Nordeste.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
