
import { Factory, Area, Line, WorkCenter } from './types';
import { randomUUID } from 'crypto';

export const CSV_HEADERS = [
  'areaName', 'areaX', 'areaY', 'areaWidth', 'areaHeight',
  'lineName', 'lineX', 'lineY', 'lineWidth', 'lineHeight',
  'machineName', 'machineX', 'machineY', 'machineWidth', 'machineHeight', 'status'
];

export const generateSampleCSV = (): string => {
  const headers = CSV_HEADERS.join(',');
  const rows = [
    'Floor Left,0,0,450,800,Line A,20,50,400,100,CNC Machine 1,30,60,80,80,operational',
    'Floor Left,0,0,450,800,Line A,20,50,400,100,CNC Machine 2,150,60,80,80,idle',
    'Floor Mid,500,0,450,800,Line B,520,50,400,100,Assembly Stn 1,530,60,100,80,operational',
  ];
  return `${headers}\n${rows.join('\n')}`;
};

export const parseCSV = (csvContent: string): Factory => {
  const lines = csvContent.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Invalid CSV format: Missing data.');
  }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Check if it's the complex CSV format
  if (headers.includes('factory_id') || headers.includes('canvas_width')) {
    const wsDetails: any[] = [];
    const flows: any[] = [];

    let factoryId = '101', factoryName = 'Automotive Plant';
    let areaId = '11', areaName = 'Assembly Area', areaX = 50, areaY = 50, areaW = 800, areaH = 600;
    let lineId = '201', lineName = 'Assembly Line';

    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 30) continue;

        factoryId = parts[0] || factoryId;
        factoryName = parts[1] || factoryName;
        areaId = parts[9] || areaId;
        areaName = parts[10] || areaName;

        lineId = parts[15] || lineId;
        lineName = parts[16] || lineName;

        const wId = parts[22];
        const wName = parts[23];
        const wX = parseFloat(parts[25]);
        const wY = parseFloat(parts[26]);
        const wW = parseFloat(parts[27]);
        const wH = parseFloat(parts[28]);
        const mName = parts[30];

        const fId = parts[35];
        const fFrom = parts[36];
        const fTo = parts[37];
        const fType = parts[38];
        const fLabel = parts[39];
        const detail = parts.slice(40).join(',');

        wsDetails.push({
            id: wId, workCenterId: wId, machineName: wName || mName, name: wName,
            x: wX * 2.5, y: wY * 2.5, 
            width: Math.max(wW * 6, 90), height: Math.max(wH * 6, 90),
            icon: 'tool', status: 'operational', detail: detail.replace(/"/g, '').trim()
        });

        if (fId && fFrom && fTo) {
            flows.push({ id: fId, fromWsId: fFrom, toWsId: parseFloat(fTo).toString(), arrowType: fType, label: fLabel });
        }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    wsDetails.forEach(w => {
       if (w.x < minX) minX = w.x;
       if (w.y < minY) minY = w.y;
       if (w.x + w.width > maxX) maxX = w.x + w.width;
       if (w.y + w.height > maxY) maxY = w.y + w.height;
    });

    areaX = minX - 100;
    areaY = minY - 100;
    areaW = (maxX - minX) + 200;
    areaH = (maxY - minY) + 150;

    return {
      id: factoryId, name: factoryName, width: Math.max(2000, maxX + 500), height: Math.max(1500, maxY + 500), gridUnit: 50,
      areas: [{
        id: areaId, areaId: areaId, areaName: areaName,
        x: areaX, y: areaY, width: areaW, height: areaH,
        lines: [{
          id: lineId, lineId: lineId, lineName: lineName,
          x: areaX, y: areaY, width: areaW, height: areaH,
          workCenters: wsDetails
        }],
        buffers: [], storage: []
      }],
      flows
    };
  }

  // --- Start of SIMPLE format fallback ---
  const csvHeaders = lines[0].split(',').map(h => h.trim());

  const factory: Factory = {
    id: randomUUID(),
    name: 'Imported Factory',
    width: 2000,
    height: 1000,
    gridUnit: 50,
    areas: []
  };

  const areaMap = new Map<string, Area>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const values = row.split(',').map(v => v.trim());
    const data: any = {};
    csvHeaders.forEach((h, idx) => data[h] = values[idx]);

    if (!data.areaName) continue; // Skip rows causing error

    if (!areaMap.has(data.areaName)) {
      areaMap.set(data.areaName, {
        id: randomUUID(),
        areaId: data.areaName.toLowerCase().replace(/\s/g, '-'),
        areaName: data.areaName,
        x: parseFloat(data.areaX) || 0,
        y: parseFloat(data.areaY) || 0,
        width: parseFloat(data.areaWidth) || 400,
        height: parseFloat(data.areaHeight) || 800,
        lines: [],
        buffers: [],
        storage: []
      });
    }

    const area = areaMap.get(data.areaName)!;
    
    let line = area.lines.find(l => l.lineName === data.lineName);
    if (!line) {
      if (!data.lineName) continue;
      line = {
        id: randomUUID(),
        lineId: data.lineName.toLowerCase().replace(/\s/g, '-'),
        lineName: data.lineName,
        x: parseFloat(data.lineX) || 0,
        y: parseFloat(data.lineY) || 0,
        width: parseFloat(data.lineWidth) || 400,
        height: parseFloat(data.lineHeight) || 100,
        workCenters: []
      };
      area.lines.push(line);
    }

    if (data.machineName) {
      const wc: WorkCenter = {
        id: randomUUID(),
        workCenterId: randomUUID(),
        machineName: data.machineName,
        x: parseFloat(data.machineX) || 0,
        y: parseFloat(data.machineY) || 0,
        width: parseFloat(data.machineWidth) || 50,
        height: parseFloat(data.machineHeight) || 50,
        status: (data.status as any) || 'operational',
        areaId: area.id
      };
      line.workCenters.push(wc);
    }
  }

  factory.areas = Array.from(areaMap.values());
  return factory;
};
