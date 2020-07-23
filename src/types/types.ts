export interface ControlsState {
  query: string
  labelText: string
  selectedTab: number
}

interface SearchControlsAction {
  type: 'SEARCH_CONTROL'
  query: string
}

interface ChangeTabControlsAction {
  type: 'CHANGE_TAB_CONTROL'
  selectedTab: number
}

export type ControlsActionTypes =
  SearchControlsAction |
  ChangeTabControlsAction;

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

interface ConfirmDialogAction {
  type: 'CONFIRM_DIALOG'
}

interface CancelDialogAction {
  type: 'CANCEL_DIALOG'
}

export type DialogActionTypes =
  ConfirmDialogAction |
  CancelDialogAction;


export interface LinkerState {
  linkingProjectId: string
  projects: ProjectState[]
  open: boolean
}

interface LinkLinkerAction {
  type: 'LINK_LINKER'
}

interface UnlinkLinkerAction {
  type: 'UNLINK_LINKER'
}

interface CloseLinkerAction {
  type: 'CLOSE_LINKER'
}

export type LinkerActionTypes =
  LinkLinkerAction |
  UnlinkLinkerAction |
  CloseLinkerAction;

export interface OptionsState {
  lazyLoad: boolean
  rootName: string
  rootParentId: string
  rootFolders: chrome.bookmarks.BookmarkTreeNode[]
  maxSessions: number
  open: boolean
}

interface SaveOptionsAction {
  type: 'SAVE_OPTIONS'
  lazyLoad: boolean
  rootName: string
  rootParentId: string
  maxSessions: number
  option: boolean
}

interface CloseOptionsAction {
  type: 'CLOSE_OPTIONS'
}

export type OptionsActionTypes =
  SaveOptionsAction |
  CloseOptionsAction;

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

interface ToggleProjectAction {
  type: 'TOGGLE_PROJECT'
}

interface OpenProjectAction {
  type: 'OPEN_PROJECT'
  projectId: string
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
  ToggleProjectAction |
  OpenProjectAction |
  RemoveProjectAction |
  LinkProjectAction |
  CreateProjectAction |
  RenameProjectAction;

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

export interface AppState {
  controls: ControlsState
  dialog: DialogState
  linker: LinkerState
  options: OptionsState
  projects: ProjectState[]
}
