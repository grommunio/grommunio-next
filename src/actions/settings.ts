import {
  CHANGE_SETTINGS,
} from './types';

export function changeSettings(field: string, value: any) {
  return { type: CHANGE_SETTINGS, field, value };
}