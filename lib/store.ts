
import { Configuration } from './types';
import { defaultFactory } from './boilerplate-data';

// Initial Mock Interface
let layouts: Configuration[] = [
    {
        id: 'default-v1',
        version: '1.0.0',
        name: 'Default Factory Layout',
        factory: defaultFactory,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'pending-v2',
        version: '1.1.0-beta',
        name: 'Optimized Machine Shop Layout',
        factory: { ...defaultFactory, name: 'Optimized Layout' }, // Just a slight variant
        isActive: false,
        createdAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        updatedAt: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    }
];

export const getLayouts = () => layouts;

export const addLayout = (layout: Configuration) => {
    layouts.push(layout);
    return layout;
};

export const activateLayout = (id: string) => {
    // Deactivate all
    layouts = layouts.map(l => ({ ...l, isActive: false, status: l.status === 'active' ? 'inactive' : l.status }));
    // Activate target
    const index = layouts.findIndex(l => l.id === id);
    if (index !== -1) {
        layouts[index].isActive = true;
        layouts[index].status = 'active';
        return layouts[index];
    }
    return null;
};

export const getActiveLayout = () => {
    return layouts.find(l => l.isActive) || layouts[0];
};

export const updateLayout = (id: string, updates: Partial<Configuration>) => {
    const index = layouts.findIndex(l => l.id === id);
    if (index !== -1) {
        layouts[index] = { ...layouts[index], ...updates, updatedAt: new Date().toISOString() };
        return layouts[index];
    }
    return null;
};

export const removeLayout = (id: string) => {
    layouts = layouts.filter(l => l.id !== id);
};
