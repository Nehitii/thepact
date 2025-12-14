import { useState, useEffect, useCallback } from 'react';

export interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  size: 'full' | 'half'; // full = full width, half = 50% (2 per row)
}

export interface ModuleLayoutState {
  modules: ModuleConfig[];
  isEditMode: boolean;
}

const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'timeline', name: 'Project Timeline', enabled: true, order: 0, size: 'full' },
  { id: 'goals-gauge', name: 'Goals Completed', enabled: true, order: 1, size: 'half' },
  { id: 'steps-gauge', name: 'Steps Completed', enabled: true, order: 2, size: 'half' },
  { id: 'status-summary', name: 'Goals Status Summary', enabled: true, order: 3, size: 'full' },
  { id: 'progress-difficulty', name: 'Progress by Difficulty', enabled: true, order: 4, size: 'full' },
  { id: 'cost-tracking', name: 'Cost Tracking', enabled: true, order: 5, size: 'half' },
  { id: 'focus-goals', name: 'Focus Goals', enabled: true, order: 6, size: 'full' },
  { id: 'the-call', name: 'The Call', enabled: true, order: 7, size: 'half' },
  { id: 'finance', name: 'Track Finance', enabled: true, order: 8, size: 'full' },
  { id: 'achievements', name: 'Achievements', enabled: true, order: 9, size: 'full' },
];

const STORAGE_KEY = 'home-module-layout';

export function useModuleLayout() {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [pendingModules, setPendingModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load saved layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ModuleConfig[];
        // Merge with defaults in case new modules were added
        const merged = DEFAULT_MODULES.map(defaultModule => {
          const savedModule = parsed.find(m => m.id === defaultModule.id);
          return savedModule ? { ...defaultModule, ...savedModule } : defaultModule;
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
    reorderModules,
    validateLayout,
    resetToDefault,
    getVisibleModules,
    getAllModules,
  };
}
