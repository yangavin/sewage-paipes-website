import * as connected from "./connected";
import * as noCycles from "./no_cycles";
import * as noHalfConnections from "./no_half_connections";

// Connected constraint
export const connectedValidator = connected.validator;
export const connectedPruner = connected.pruner;

// No cycles constraint
export const noCyclesValidator = noCycles.validator;
export const noCyclesPruner = noCycles.pruner;

// No half connections constraint
export const noHalfConnectionsValidatorH = noHalfConnections.validatorH;
export const noHalfConnectionsValidatorV = noHalfConnections.validatorV;
export const noHalfConnectionsPrunerH = noHalfConnections.prunerH;
export const noHalfConnectionsPrunerV = noHalfConnections.prunerV;

// Export all as namespaces too
export { connected, noCycles, noHalfConnections };
