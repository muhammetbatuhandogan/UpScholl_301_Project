export type BagItem = {
  id: string;
  label: string;
  category: string;
  checked?: boolean;
};

export const BAG_DEFAULT_ITEMS: BagItem[] = [
  { id: 'water', label: 'Su (3 günlük)', category: 'Temel' },
  { id: 'food', label: 'Bozulmayan gıda', category: 'Temel' },
  { id: 'first_aid', label: 'İlk yardım çantası', category: 'Sağlık' },
  { id: 'meds', label: 'Kişisel ilaçlar', category: 'Sağlık' },
  { id: 'docs', label: 'Önemli belge kopyaları', category: 'Belgeler' },
  { id: 'flashlight', label: 'El feneri + yedek pil', category: 'Ekipman' },
  { id: 'whistle', label: 'Düdük', category: 'Ekipman' },
  { id: 'cash', label: 'Nakit (küçük banknot)', category: 'Belgeler' },
];

export const STATUS_ORDER = ['todo', 'in-progress', 'done'] as const;
