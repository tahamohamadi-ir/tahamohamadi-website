/**
 * Builder Registry — Public Exports
 * @module builder/registry
 */

export { componentRegistry, defineComponent } from './component-registry';

export type {
  ComponentDefinition,
  ComponentRenderProps,
  SlotConstraint,
  InspectorSection,
  ComponentCapabilities,
  ComponentAIMetadata,
} from './registry-types';

export {
  BUILT_IN_COMPONENTS,
  registerBuiltInComponents,
} from './built-in';

import { componentRegistry } from './component-registry';
import { registerBuiltInComponents } from './built-in';

// Auto-register built-ins
registerBuiltInComponents(componentRegistry);
