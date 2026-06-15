import React, { useEffect, useState } from 'react';

import { Activity } from 'lucide-react';

import { getRecentPlatformEvents, onPlatformEvent, type PlatformEvent } from '../../domain/platformEvents';

import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';

import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';

import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';



function formatEvent(e: PlatformEvent) {

  const when = new Date(e.createdAt).toLocaleString();

  return `${when} · ${e.type}${e.entityId ? ` · ${e.entityId}` : ''}`;

}



export function AdminPlatformEventsFeed({ limit = 24 }: { limit?: number }) {

  const [events, setEvents] = useState<PlatformEvent[]>(() => getRecentPlatformEvents(limit));



  useEffect(() => {

    setEvents(getRecentPlatformEvents(limit));

    return onPlatformEvent(() => setEvents(getRecentPlatformEvents(limit)));

  }, [limit]);



  return (

    <FinelyOsGlassPanel icon={Activity} title="Platform pulse" subtitle="Live events from funnels, commerce, voice, and automations" accent="sky">

      <FinelyOsPaginatedStack

        items={events}

        pageSize={8}

        itemSpacingClassName="space-y-2"

        emptyMessage="No platform events yet — submit a funnel or purchase a book to see activity."

        renderItem={(e) => (

          <div key={e.id} className={`text-xs ${FINELY_OS_ENTITY_BODY} border-b border-white/5 pb-2 last:border-0`}>

            <span className="text-sky-300 font-mono">{e.type}</span>

            <div className={FINELY_OS_ENTITY_SUBLABEL}>{formatEvent(e)}</div>

          </div>

        )}

      />

    </FinelyOsGlassPanel>

  );

}

