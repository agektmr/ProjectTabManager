/** @format */

import { LinkerActionTypes } from '../store/types';

export const initLinker = (): LinkerActionTypes => {
  return {
    type: 'INIT',
  };
};

export const openLinker = (projectId: string): LinkerActionTypes => {
  return {
    type: 'OPEN_LINKER',
    projectId,
  };
};

export const linkLinker = (projectId: string): LinkerActionTypes => {
  return {
    type: 'LINK_LINKER',
    projectId,
  };
};

export const unlinkLinker = (): LinkerActionTypes => {
  return {
    type: 'UNLINK_LINKER',
  };
};

export const closeLinker = (): LinkerActionTypes => {
  return {
    type: 'CLOSE_LINKER',
  };
};
