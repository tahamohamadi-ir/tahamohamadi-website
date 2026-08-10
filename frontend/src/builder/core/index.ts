/**
 * Builder Core — Public Exports
 * @module builder/core
 */

export { CommandBus } from './command-bus';
export type {
  BuilderCommand,
  CommandResult,
  CommandHandler,
  CommandValidator,
  CommandBusOptions,
  Patch,
  PatchOp,
} from './command-bus';

export {
  NODE_COMMAND_TYPES,
  insertNodeHandler,
  deleteNodeHandler,
  updatePropsHandler,
  moveNodeHandler,
  updateMetadataHandler,
  registerNodeCommands,
} from './commands/node-commands';

export { HistoryEngine } from './history';
export type { HistoryEntry, HistoryOptions } from './history';

export {
  INITIAL_SELECTION_STATE,
  selectNode,
  toggleNodeSelection,
  clearSelection,
  setHoveredNode,
  selectNodes,
} from './selection';
export type { SelectionState } from './selection';

export {
  copyNode,
  getClipboardForPaste,
  hasClipboardData,
  clearClipboard,
} from './clipboard';
export type { ClipboardData } from './clipboard';

export { EventBus, builderEvents } from './events';
export type { BuilderEventMap, EventHandler } from './events';
