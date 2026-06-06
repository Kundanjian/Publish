import { Request, Response } from 'express';
import { marketplaceProperties } from '../data/marketplace.store';

type KnownLocation = {
  label: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  aliases: string[];
};

const knownLocations: KnownLocation[] = [
  {
    label: 'Jabalpur, Madhya Pradesh',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1815,
    lng: 79.9864,
    aliases: ['jabalpur', 'jabalpur mp', 'jabalpur madhya pradesh']
  },
  {
    label: 'Napier Town, Jabalpur',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1667,
    lng: 79.9333,
    aliases: ['napier town', 'napier town jabalpur']
  },
  {
    label: 'Civil Lines, Jabalpur',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1599,
    lng: 79.9501,
    aliases: ['civil lines', 'civil lines jabalpur']
  },
  {
    label: 'Wright Town, Jabalpur',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1682,
    lng: 79.9401,
    aliases: ['wright town', 'wright town jabalpur']
  },
  {
    label: 'Madan Mahal, Jabalpur',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1531,
    lng: 79.9065,
    aliases: ['madan mahal', 'madan mahal jabalpur']
  },
  {
    label: 'Bhedaghat, Jabalpur',
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    lat: 23.1288,
    lng: 79.8019,
    aliases: ['bhedaghat', 'bhedaghat jabalpur']
  },
  {
    label: 'Indore, Madhya Pradesh',
    city: 'Indore',
    state: 'Madhya Pradesh',
    lat: 22.7196,
    lng: 75.8577,
    aliases: ['indore', 'indore mp']
  },
  {
    label: 'Bhopal, Madhya Pradesh',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2599,
    lng: 77.4126,
    aliases: ['bhopal', 'bhopal mp']
  }
];

export const suggestLocations = async (req: Request, res: Response) => {
  const query = String(req.query.query || '').trim().toLowerCase();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const propertyLocations = marketplaceProperties.map((property) => property.location);
  const combined = uniqueLocations([
    ...knownLocations.map((location) => location.label),
    ...propertyLocations
  ]);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const nearest = [...knownLocations]
      .sort((a, b) => distanceScore(a, lat, lng) - distanceScore(b, lat, lng))
      .slice(0, 6)
      .map((location) => location.label);

    return res.status(200).json({ suggestions: uniqueLocations(nearest) });
  }

  if (!query) {
    return res.status(200).json({ suggestions: combined.slice(0, 8) });
  }

  const suggestions = combined
    .map((label) => ({ label, score: matchScore(label, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .map((item) => item.label)
    .slice(0, 8);

  return res.status(200).json({ suggestions });
};

const uniqueLocations = (locations: string[]): string[] => {
  const seen = new Set<string>();
  return locations.filter((location) => {
    const key = normalize(location);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const matchScore = (label: string, query: string): number => {
  const normalized = normalize(label);
  const known = knownLocations.find((location) => normalize(location.label) === normalized);
  const aliasMatch = known?.aliases.some((alias) => alias.includes(query) || query.includes(alias));

  if (normalized === query) {
    return 100;
  }
  if (normalized.startsWith(query)) {
    return 80;
  }
  if (aliasMatch) {
    return 70;
  }
  if (normalized.includes(query)) {
    return 60;
  }

  return query
    .split(/\s+/)
    .filter((part) => part.length > 1 && normalized.includes(part)).length * 10;
};

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const distanceScore = (location: KnownLocation, lat: number, lng: number): number => {
  const latDelta = location.lat - lat;
  const lngDelta = location.lng - lng;
  return latDelta * latDelta + lngDelta * lngDelta;
};
