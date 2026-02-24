import { useState } from 'react';
import type { GameState } from '../../types/game.types';
import { CampaignTrack } from '../CampaignTrack/CampaignTrack';
import { ServiceNode } from '../ServiceNode/ServiceNode';
import styles from './Board.module.css';

interface BoardProps {
  gameState: GameState;
  onServiceSelect?: (serviceId: string) => void;
  selectedServices?: string[];
  targetableServices?: string[];
}

// Minimal world map SVG (simplified continents outline)
const WorldMapSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1000 500"
    className={styles.worldmap}
    aria-hidden="true"
  >
    {/* North America */}
    <path d="M80,60 L200,55 L250,80 L270,130 L230,160 L200,200 L170,220 L140,200 L100,180 L80,140 Z" fill="currentColor" />
    {/* South America */}
    <path d="M160,240 L220,230 L250,260 L240,320 L210,370 L180,380 L155,340 L140,290 Z" fill="currentColor" />
    {/* Europe */}
    <path d="M420,50 L500,45 L520,70 L510,100 L480,110 L450,100 L420,80 Z" fill="currentColor" />
    {/* Africa */}
    <path d="M430,120 L510,110 L540,150 L540,230 L510,280 L470,290 L440,260 L420,200 L415,150 Z" fill="currentColor" />
    {/* Asia */}
    <path d="M520,40 L700,30 L780,50 L820,80 L800,130 L750,150 L680,140 L620,130 L570,110 L530,90 Z" fill="currentColor" />
    {/* Australia */}
    <path d="M720,270 L810,265 L840,290 L830,340 L790,360 L740,350 L710,310 Z" fill="currentColor" />
  </svg>
);

export function Board({
  gameState,
  onServiceSelect,
  selectedServices = [],
  targetableServices = [],
}: BoardProps) {
  const [_localSelected, setLocalSelected] = useState<string | null>(null);

  const services = Object.values(gameState.services);

  const handleNodeClick = (serviceId: string) => {
    setLocalSelected(serviceId);
    if (onServiceSelect) onServiceSelect(serviceId);
  };

  return (
    <div className={styles.board}>
      <WorldMapSVG />
      <div className={styles.campaignRow}>
        <CampaignTrack completedPhases={gameState.campaign.completedPhases} />
      </div>
      <div className={styles.servicesGrid}>
        {services.map(service => (
          <ServiceNode
            key={service.id}
            service={service}
            selected={selectedServices.includes(service.id)}
            targetable={targetableServices.includes(service.id)}
            onClick={onServiceSelect ? () => handleNodeClick(service.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
