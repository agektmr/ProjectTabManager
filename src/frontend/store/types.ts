/**
 * Controls
 */

export interface ControlsState {
  query: string
  labelText: string
  selectedTab: number
}

/**
 * Dialog
 */

export interface DialogState {
  line1: string
	line2?: string
  placeholder?: string
  answer?: string
  okay: string
  cancel: string
  isPrompt: boolean
  confirmed?: Function
  canceled?: Function
  open: boolean
}

interface InitDialogAction {
  type: 'INIT_DIALOG'
}

interface ConfirmDialogAction {
  type: 'CONFIRM_DIALOG'
}

interface CancelDialogAction {
  type: 'CANCEL_DIALOG'
}

export type DialogActionTypes =
  InitDialogAction |
  ConfirmDialogAction |
  CancelDialogAction;

/**
 * Linker
 */

export interface LinkerState {
  linkingProjectId: string
  projects: ProjectState[]
  open: boolean
}

interface InitLinkerAction {
  type: 'INIT_LINKER'
}

interface OpenLinkerAction {
  type: 'OPEN_LINKER'
  projectId: string
}

interface LinkLinkerAction {
  type: 'LINK_LINKER'
  projectId: string
}

interface UnlinkLinkerAction {
  type: 'UNLINK_LINKER'
}

interface CloseLinkerAction {
  type: 'CLOSE_LINKER'
}

export type LinkerActionTypes =
  InitLinkerAction |
  OpenLinkerAction |
  LinkLinkerAction |
  UnlinkLinkerAction |
  CloseLinkerAction;

/**
 * Options
 */

export interface OptionsState {
  lazyLoad: boolean
  rootName: string
  rootParentId: string
  rootFolders: chrome.bookmarks.BookmarkTreeNode[]
  maxSessions: number
  open: boolean
}

interface InitOptionsAction {
  type: 'INIT_OPTIONS'
}

interface OpenOptionsAction {
  type: 'OPEN_OPTIONS'
}

interface SaveOptionsAction {
  type: 'SAVE_OPTIONS'
  lazyLoad?: boolean
  rootName?: string
  rootParentId?: string
  maxSessions?: number
}

interface CloseOptionsAction {
  type: 'CLOSE_OPTIONS'
}

export type OptionsActionTypes =
  InitOptionsAction |
  OpenOptionsAction |
  SaveOptionsAction |
  CloseOptionsAction;

/**
 * Project
 */

export interface ProjectState {
  id: string
	title: string
	expanded: boolean
  focused: boolean
  loading: boolean
  projectId?: string
  winId?: number
  fields: TabState[]
}

interface InitProjectsAction {
  type: 'INIT_PROJECTS'
}

interface ToggleProjectAction {
  type: 'TOGGLE_PROJECT'
}

interface OpenProjectAction {
  type: 'OPEN_PROJECT'
  winId?: number
  projectId?: string
}

interface RemoveProjectAction {
  type: 'REMOVE_PROJECT'
  projectId: string
}

interface LinkProjectAction {
  type: 'LINK_PROJECT'
  projectId: string
}

interface CreateProjectAction {
  type: 'CREATE_PROJECT'
  winId: number
}

interface RenameProjectAction {
  type: 'RENAME_PROJECT'
  projectId: string
}

export type ProjectActionTypes =
  InitProjectsAction |
  ToggleProjectAction |
  OpenProjectAction |
  RemoveProjectAction |
  LinkProjectAction |
  CreateProjectAction |
  RenameProjectAction;

/**
 * Tab
 */

export interface TabState {
  bookmarkId?: string
  tabId?: number
  title?: string
  url?: string
  pinned: boolean
  favIconUrl?: string
}

interface CloseTabAction {
  type: 'CLOSE_TAB'
  tabId: number
}

interface AddBookmarkAction {
  type: 'ADD_BOOKMARK'
  tabId: number
}

interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK'
  bookmarkId: string
}

export type TabActionTypes =
  CloseTabAction |
  AddBookmarkAction |
  RemoveBookmarkAction;

/**
 * App
 */

export interface AppState {
  controls: ControlsState
  dialog: DialogState
  linker: LinkerState
  options: OptionsState
  projects: ProjectState[]
}

interface InitAppAction {
  type: 'INIT_APP'
}

interface OpenMenuAppAction {
  type: 'OPEN_MENU_APP'
}

interface ReloadAppAction {
  type: 'RELOAD_APP'
}

interface OpenBookmarksAppAction {
  type: 'OPEN_BOOKMARKS_APP'
}

interface OpenHelpAppAction {
  type: 'OPEN_HELP_APP'
}

interface SearchAppAction {
  type: 'SEARCH_APP'
  query: string
}

interface ChangeTabAppAction {
  type: 'CHANGE_TAB_APP'
  selectedTab: number
}

export type AppActionTypes =
  InitAppAction |
  OpenMenuAppAction |
  ReloadAppAction |
  OpenBookmarksAppAction |
  OpenHelpAppAction |
  SearchAppAction |
  ChangeTabAppAction;
