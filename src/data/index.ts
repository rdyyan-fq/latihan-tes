import { bagian1Modules } from './bagian1';
import { bagian2Modules } from './bagian2';
import { bagian3Modules } from './bagian3';
import { bagian4Modules, bagianMetaList } from './bagian4';
import { ModuleDefinition } from '../types/assessment';

export const allModules: ModuleDefinition[] = [
  ...bagian1Modules,
  ...bagian2Modules,
  ...bagian3Modules,
  ...bagian4Modules,
];

export { bagianMetaList };

export function getModuleById(id: string): ModuleDefinition | undefined {
  return allModules.find((m) => m.id === id);
}
