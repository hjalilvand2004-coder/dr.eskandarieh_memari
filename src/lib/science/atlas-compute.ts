/**
 * محاسبه واقعی شاخص‌های ریخت‌شناختی از موجودیت‌های فضایی
 * - مجاورت و دیوار مشترک از هندسه محاسبه می‌شود (نه ورودی دستی)
 * - شاخص فاقد داده کافی محاسبه نمی‌شود و وضعیت آن صریح اعلام می‌گردد
 */
import type { Polygon } from "./morphology";
import {
  polygonArea,
  polygonPerimeter,
  buildingIndicators,
  skylineHeterogeneity,
  coverageRatio,
  hwRatio,
  minDistanceBetween,
  sharedWallLength,
} from "./morphology";

export interface EntityLike {
  code: string;
  kind: string;
  name: string;
  parentId?: string | null;
  blockName?: string | null;
  geometry: string; // JSON polygon
  props: string; // JSON props
}

export interface BuildingComputed {
  code: string;
  block: string;
  name: string;
  polygon: Polygon;
  courtyard: Polygon | null;
  props: {
    heightM: number;
    floors: number;
    era: string;
    material: string;
    condition: string;
    wwrPct: number;
    envelopeQuality: number;
    protectiveStatus: string;
  };
  indicators: {
    footprintM2: number;
    perimeterM: number;
    volumeM3: number;
    svRatio: number;
    compactness: number;
    courtyardShare: number;
    orientationDeg: number;
    wwrPct: number;
    heightM: number;
    sharedWallsM: number;
    adjacentCount: number;
  };
  energy?: {
    heatingKwhM2a: number;
    coolingKwhM2a: number;
    totalKwhM2a: number;
    comfortHoursOut: number;
  };
}

export interface BlockComputed {
  code: string;
  name: string;
  polygon: Polygon;
  areaM2: number;
  buildingCount: number;
  coverage: number; // نسبت سطح اشغال
  hwRatio: number; // ارتفاع به عرض گذر
  skylineCv: number;
  avgHeightM: number;
  avgCourtyardShare: number;
  vegetationFraction: number;
  permeableFraction: number;
  totalFootprintM2: number;
}

export interface AtlasComputed {
  buildings: BuildingComputed[];
  blocks: BlockComputed[];
  district: {
    buildingCount: number;
    blockCount: number;
    totalFootprintM2: number;
    totalBlockAreaM2: number;
    coverage: number;
    avgHeightM: number;
    meanSvRatio: number;
    courtyardBuildings: number;
  };
  dataAvailability: {
    solarAccess: false;
    vegetation: "demo_only";
    wwr: "demo_only";
  };
}

export function computeAtlas(entities: EntityLike[], energyByCode: Map<string, { heatingKwhM2a: number; coolingKwhM2a: number; totalKwhM2a: number; comfortHoursOut: number }>): AtlasComputed {
  const buildingsRaw = entities.filter((e) => e.kind === "building");
  const blocksRaw = entities.filter((e) => e.kind === "block");

  // ── گام ۱: پارس هندسه ──
  const parsed = buildingsRaw.map((e) => {
    const polygon = JSON.parse(e.geometry) as Polygon;
    const p = JSON.parse(e.props) as BuildingComputed["props"];
    const courtyard = (p as { courtyard?: Polygon | null }).courtyard ?? null;
    return { e, polygon, p, courtyard };
  });

  // ── گام ۲: مجاورت و دیوار مشترک (محاسبه واقعی از هندسه) ──
  const sharedWalls = new Map<string, { length: number; count: number }>();
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const a = parsed[i];
      const b = parsed[j];
      if (a.e.blockName !== b.e.blockName) continue;
      const d = minDistanceBetween(a.polygon, b.polygon);
      if (d < 1.6) {
        const len = sharedWallLength(a.polygon, b.polygon, 0.9);
        if (len > 0.5) {
          sharedWalls.set(a.e.code, {
            length: (sharedWalls.get(a.e.code)?.length ?? 0) + len,
            count: (sharedWalls.get(a.e.code)?.count ?? 0) + 1,
          });
          sharedWalls.set(b.e.code, {
            length: (sharedWalls.get(b.e.code)?.length ?? 0) + len,
            count: (sharedWalls.get(b.e.code)?.count ?? 0) + 1,
          });
        }
      }
    }
  }

  // ── گام ۳: شاخص‌های بنا ──
  const buildings: BuildingComputed[] = parsed.map(({ e, polygon, p, courtyard }) => {
    const sw = sharedWalls.get(e.code) ?? { length: 0, count: 0 };
    const indicators = buildingIndicators(
      polygon,
      courtyard,
      {
        heightM: p.heightM,
        floors: p.floors,
        footprintM2: polygonArea(polygon),
        courtyardM2: courtyard ? polygonArea(courtyard) : 0,
        wwrPct: p.wwrPct,
        era: p.era,
        material: p.material,
        condition: p.condition,
        sharedWallsM: sw.length,
        adjacentCount: sw.count,
        envelopeQuality: p.envelopeQuality,
      }
    );
    return {
      code: e.code,
      block: e.blockName ?? "",
      name: e.name,
      polygon,
      courtyard,
      props: p,
      indicators: {
        footprintM2: indicators.footprintM2,
        perimeterM: polygonPerimeter(polygon),
        volumeM3: indicators.volumeM3,
        svRatio: indicators.svRatio,
        compactness: indicators.compactness,
        courtyardShare: indicators.courtyardShare,
        orientationDeg: indicators.orientationDeg,
        wwrPct: indicators.wwrPct,
        heightM: indicators.heightM,
        sharedWallsM: Math.round(sw.length * 10) / 10,
        adjacentCount: sw.count,
      },
      energy: energyByCode.get(e.code),
    };
  });

  // ── گام ۴: شاخص‌های بلوک ──
  const blocks: BlockComputed[] = blocksRaw.map((e) => {
    const polygon = JSON.parse(e.geometry) as Polygon;
    const bp = JSON.parse(e.props) as { passageWidthM: number; vegetationFraction: number; permeableFraction: number; areaM2: number };
    const members = buildings.filter((b) => b.block === e.code);
    const footprintSum = members.reduce((a, b) => a + b.indicators.footprintM2, 0);
    const heights = members.map((m) => m.indicators.heightM);
    const sky = skylineHeterogeneity(heights);
    return {
      code: e.code,
      name: e.name,
      polygon,
      areaM2: bp.areaM2,
      buildingCount: members.length,
      coverage: coverageRatio(footprintSum, bp.areaM2),
      hwRatio: hwRatio(sky.mean, bp.passageWidthM),
      skylineCv: sky.cv,
      avgHeightM: sky.mean,
      avgCourtyardShare: members.length ? members.reduce((a, b) => a + b.indicators.courtyardShare, 0) / members.length : 0,
      vegetationFraction: bp.vegetationFraction,
      permeableFraction: bp.permeableFraction,
      totalFootprintM2: footprintSum,
    };
  });

  // ── گام ۵: خلاصه محدوده ──
  const totalFootprint = buildings.reduce((a, b) => a + b.indicators.footprintM2, 0);
  const totalBlockArea = blocks.reduce((a, b) => a + b.areaM2, 0);
  const svs = buildings.map((b) => b.indicators.svRatio).filter((v) => Number.isFinite(v));

  return {
    buildings,
    blocks,
    district: {
      buildingCount: buildings.length,
      blockCount: blocks.length,
      totalFootprintM2: Math.round(totalFootprint),
      totalBlockAreaM2: Math.round(totalBlockArea),
      coverage: coverageRatio(totalFootprint, totalBlockArea),
      avgHeightM: Math.round((buildings.reduce((a, b) => a + b.indicators.heightM, 0) / (buildings.length || 1)) * 100) / 100,
      meanSvRatio: Math.round((svs.reduce((a, b) => a + b, 0) / (svs.length || 1)) * 1000) / 1000,
      courtyardBuildings: buildings.filter((b) => b.courtyard).length,
    },
    dataAvailability: {
      solarAccess: false,
      vegetation: "demo_only",
      wwr: "demo_only",
    },
  };
}
