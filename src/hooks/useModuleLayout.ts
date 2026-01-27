import { useState, useEffect, useCallback } from 'react';

export type ModuleSize = 'full' | 'half' | 'quarter';
export type ModuleCategory = 'display' | 'action';
export type DisplayMode = 'compact' | 'full';

export interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  size: ModuleSize;
  category: ModuleCategory;
  allowedSizes: ModuleSize[];
  isPlaceholder?: boolean;
  displayMode?: DisplayMode;
}

export interface ModuleLayoutState {
  modules: ModuleConfig[];
  isEditMode: boolean;
}

const DEFAULT_MODULES: ModuleConfig[] = [
  // Display modules - paired sizes for visual consistency
  // All display modules use half size for uniform grid
  { id: 'focus-goals', name: 'Focus Goals', enabled: true, order: 0, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  { id: 'progress-difficulty', name: 'Progress by Difficulty', enabled: true, order: 1, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  { id: 'progress-overview', name: 'Progress Overview', enabled: true, order: 2, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  { id: 'cost-tracking', name: 'Cost Tracking', enabled: true, order: 3, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  { id: 'timeline', name: 'Project Timeline', enabled: true, order: 4, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  { id: 'achievements', name: 'Achievements', enabled: true, order: 5, size: 'half', category: 'display', allowedSizes: ['full', 'half'], displayMode: 'compact' },
  
  // Action modules - ALL use 'half' size for consistent appearance
  { id: 'the-call', name: 'The Call', enabled: true, order: 6, size: 'half', category: 'action', allowedSizes: ['full', 'half'] },
  { id: 'finance', name: 'Track Finance', enabled: true, order: 7, size: 'half', category: 'action', allowedSizes: ['full', 'half'] },
  { id: 'todo-list', name: 'To Do List', enabled: true, order: 8, size: 'half', category: 'action', allowedSizes: ['full', 'half'], isPlaceholder: true },
  { id: 'journal', name: 'Journal', enabled: true, order: 9, size: 'half', category: 'action', allowedSizes: ['full', 'half'], isPlaceholder: true },
  { id: 'track-health', name: 'Track Health', enabled: true, order: 10, size: 'half', category: 'action', allowedSizes: ['full', 'half'], isPlaceholder: true },
  { id: 'wishlist', name: 'Wishlist', enabled: true, order: 11, size: 'half', category: 'action', allowedSizes: ['full', 'half'], isPlaceholder: true },
];

const STORAGE_KEY = 'home-module-layout-v3';
const DISPLAY_MODE_KEY = 'home-widget-display-modes';

export function useModuleLayout() {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [pendingModules, setPendingModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [isEditMode, setIsEditMode] = useState(false);
  const [displayModes, setDisplayModes] = useState<Record<string, DisplayMode>>({});

  // Load saved layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedDisplayModes = localStorage.getItem(DISPLAY_MODE_KEY);
    
    // Load display modes
    if (savedDisplayModes) {
      try {
        setDisplayModes(JSON.parse(savedDisplayModes));
      } catch (e) {
        console.error('Failed to parse saved display modes', e);
      }
    }
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ModuleConfig[];
        // Merge with defaults in case new modules were added
        const merged = DEFAULT_MODULES.map(defaultModule => {
          const savedModule = parsed.find(m => m.id === defaultModule.id);
          if (savedModule) {
            return { 
              ...defaultModule, 
              enabled: savedModule.enabled,
              order: savedModule.order,
              size: savedModule.size,
              displayMode: savedModule.displayMode || defaultModule.displayMode,
            };
          }
          return defaultModule;
        });
        setModules(merged);
        setPendingModules(merged);
      } catch (e) {
        console.error('Failed to parse saved module layout', e);
      }
    }
  }, []);

  const enterEditMode = useCallback(() => {
    setPendingModules([...modules]);
    setIsEditMode(true);
  }, [modules]);

  const exitEditMode = useCallback(() => {
    setPendingModules([...modules]);
    setIsEditMode(false);
  }, [modules]);

  const toggleModule = useCallback((moduleId: string) => {
    setPendingModules(prev => 
      prev.map(m => m.id === moduleId ? { ...m, enabled: !m.enabled } : m)
    );
  }, []);

  const cycleModuleSize = useCallback((moduleId: string) => {
    setPendingModules(prev => 
      prev.map(m => {
        if (m.id !== moduleId) return m;
        const currentIndex = m.allowedSizes.indexOf(m.size);
        const nextIndex = (currentIndex + 1) % m.allowedSizes.length;
        return { ...m, size: m.allowedSizes[nextIndex] };
      })
    );
  }, []);

  const toggleDisplayMode = useCallback((moduleId: string) => {
    setDisplayModes(prev => {
      const currentMode = prev[moduleId] || 'compact';
      const newMode: DisplayMode = currentMode === 'compact' ? 'full' : 'compact';
      const updated = { ...prev, [moduleId]: newMode };
      localStorage.setItem(DISPLAY_MODE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getDisplayMode = useCallback((moduleId: string): DisplayMode => {
    return displayModes[moduleId] || 'compact';
  }, [displayModes]);

  const reorderModules = useCallback((activeId: string, overId: string) => {
    setPendingModules(prev => {
      const oldIndex = prev.findIndex(m => m.id === activeId);
      const newIndex = prev.findIndex(m => m.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newModules = [...prev];
      const [removed] = newModules.splice(oldIndex, 1);
      newModules.splice(newIndex, 0, removed);
      
      // Update order values
      return newModules.map((m, i) => ({ ...m, order: i }));
    });
  }, []);

  const validateLayout = useCallback(() => {
    setModules([...pendingModules]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingModules));
    setIsEditMode(false);
  }, [pendingModules]);

  const resetToDefault = useCallback(() => {
    setPendingModules(DEFAULT_MODULES);
    setDisplayModes({});
    localStorage.removeItem(DISPLAY_MODE_KEY);
  }, []);

  const getVisibleModules = useCallback(() => {
    const source = isEditMode ? pendingModules : modules;
    return source
      .filter(m => m.enabled)
      .sort((a, b) => a.order - b.order);
  }, [modules, pendingModules, isEditMode]);

  const getAllModules = useCallback(() => {
    const source = isEditMode ? pendingModules : modules;
    return source.sort((a, b) => a.order - b.order);
  }, [modules, pendingModules, isEditMode]);

  return {
    modules: isEditMode ? pendingModules : modules,
    isEditMode,
    enterEditMode,
    exitEditMode,
    toggleModule,
    cycleModuleSize,
    toggleDisplayMode,
    getDisplayMode,
    reorderModules,
    validateLayout,
    resetToDefault,
    getVisibleModules,
    getAllModules,
  };
}
