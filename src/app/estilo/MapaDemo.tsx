'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

/*
 * Mapa de prova para a armadilha Leaflet × preflight (ver tailwind.css).
 * Fica DENTRO do escopo novo ([data-preflight]), como ficará o mapa do
 * Início e o da Nova comunidade depois de migrados. Se os tiles saírem
 * picotados ou desalinhados aqui, a regra do tailwind.css foi removida.
 *
 * Sem marcador nenhum: só o Sertão do Moxotó de fundo.
 */
export default function MapaDemo() {
  return (
    <MapContainer
      center={[-8.35, -37.4]}
      zoom={8}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-64 w-full rounded-lg border"
    >
      {/* O controle padrão diz "Zoom in"/"Zoom out" ao leitor de tela (WCAG 3.1.2). */}
      <ZoomControl position="topleft" zoomInTitle="Aproximar" zoomOutTitle="Afastar" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
