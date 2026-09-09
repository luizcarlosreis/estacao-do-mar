const WINKER_API_TOKEN = '5c90521e-d469-4b39-b938-81ea1f4e9543';
const ID_PORTAL = '10493';

// Cache em memória de curto prazo (60 segundos) para respostas rápidas
let cachedBoletos: { timestamp: number; data: any[] } | null = null;
const CACHE_TTL_MS = 60 * 1000;

export async function fetchAllCondominiumBoletos(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cachedBoletos && now - cachedBoletos.timestamp < CACHE_TTL_MS) {
    return cachedBoletos.data;
  }

  // 1. Obter todas as unidades do condomínio
  const unitsRes = await fetch(`https://api.winker.com.br/v1/portal/${ID_PORTAL}/unit`, {
    headers: {
      'Authorization': WINKER_API_TOKEN,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!unitsRes.ok) {
    throw new Error(`Falha ao buscar unidades no Winker: status ${unitsRes.status}`);
  }

  const units = await unitsRes.json();
  if (!Array.isArray(units)) {
    throw new Error('Formato inesperado ao buscar unidades no Winker');
  }

  // 2. Buscar cobranças de todas as unidades em lotes paralelos (chunks)
  const batchSize = 14;
  const allBoletos: any[] = [];

  for (let i = 0; i < units.length; i += batchSize) {
    const batch = units.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (unit: any) => {
        try {
          const res = await fetch(
            `https://api.winker.com.br/v1/billing_unit?id_portal=${ID_PORTAL}&id_unit=${unit.id_unit}`,
            {
              headers: {
                'Authorization': WINKER_API_TOKEN,
                'Accept': 'application/json'
              },
              cache: 'no-store'
            }
          );
          if (!res.ok) return [];
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.items || data.data || []);
          return items.map((item: any) => ({
            ...item,
            id_unit: item.id_unit || unit.id_unit,
            unit_name: unit.name,
            unit: unit.name,
            division: unit.division
          }));
        } catch (e) {
          console.error(`Erro ao buscar boletos da unidade ${unit.name} (${unit.id_unit}):`, e);
          return [];
        }
      })
    );

    for (const items of batchResults) {
      allBoletos.push(...items);
    }
  }

  cachedBoletos = {
    timestamp: now,
    data: allBoletos
  };

  return allBoletos;
}
