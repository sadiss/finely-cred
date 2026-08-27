import React from 'react';
import { MapPin, Target } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { DEFAULT_OVERNIGHT50_CITIES } from '../../features/overnight50/queryExpander';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const CITY_ACCENTS = ['emerald', 'violet', 'sky', 'rose', 'violet'] as const;

export default function AdminGeoWarRoomPage() {
  return (
    <PageShell badge="Admin" title="Geo War Room" subtitle="City clusters, offer focus, saturation warnings, and route-to-agent planning.">
      <div className={FINELY_OS_PAGE}>
        <FinelyOsGlassPanel
          icon={MapPin}
          title="City domination map"
          subtitle="Start with five cities, then expand only when the math asks for it. Each city gets localized pages, source queues, budget cells, and attribution."
          accent="emerald"
        >
          <p className={FINELY_OS_ENTITY_BODY}>
            Default cities: Dallas, Houston, Atlanta, Phoenix, Charlotte.
          </p>
        </FinelyOsGlassPanel>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {DEFAULT_OVERNIGHT50_CITIES.map((city, i) => (
            <article key={city} className={finelyOsCatalogCard(CITY_ACCENTS[i % CITY_ACCENTS.length])}>
              <Target className="text-sky-300" size={22} />
              <h3 className={`${FINELY_OS_ENTITY_VALUE} mt-4`}>{city}</h3>
              <div className={`${FINELY_OS_ENTITY_BODY} mt-2`}>
                Focus: credit repair, business credit, funding readiness, partner recruiting, AU sellers.
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-4`}>Saturation: waiting for data</div>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
