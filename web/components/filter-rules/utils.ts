import {
  Field,
  Matcher,
  Action,
  Transform,
  DateTransform,
  StringTransform,
  FieldTransform,
} from "@/lib/api";
import { NewRuleState, ActionState } from "./types";

// Field and match type labels
export const getFieldLabel = (field: Field): string => {
  const labels = {
    Summary: "Title",
    Description: "Description",
    Location: "Location",
    StartDate: "Start Date",
    EndDate: "End Date",
  };
  return labels[field];
};

export const getMatchTypeLabel = (matchType: Matcher["match_type"]): string => {
  const labels = {
    Exact: "equals",
    Contains: "contains",
    StartsWith: "starts with",
    EndsWith: "ends with",
    Regex: "matches regex",
    BetweenDates: "is within date range",
  };
  return labels[matchType];
};

export const getActionColor = (actions: Action[]): string => {
  if (actions.length === 0) return "outline";

  // For multiple actions, check if any are blocking
  const hasBlock = actions.some((action) => action === "Block");
  if (hasBlock) return "destructive";

  const hasAllow = actions.some((action) => action === "Allow");
  if (hasAllow) return "default";

  return "secondary"; // All transforms
};

// Transform description generator
export const getTransformDescription = (action: Action): string | null => {
  if (typeof action === "object" && "FieldTransform" in action) {
    const fieldTransform = action.FieldTransform;
    const field = getFieldLabel(fieldTransform.field);

    if ("StringTransform" in fieldTransform.transform) {
      const stringTransform = fieldTransform.transform.StringTransform;

      if (typeof stringTransform === "string" && stringTransform === "Remove") {
        return `Remove ${field}`;
      } else if (typeof stringTransform === "object") {
        if ("Substitute" in stringTransform) {
          return `Replace "${stringTransform.Substitute.from}" with "${stringTransform.Substitute.to}" in ${field}`;
        } else if ("Suffix" in stringTransform) {
          return `Add suffix "${stringTransform.Suffix.suffix}" to ${field}`;
        } else if ("Prefix" in stringTransform) {
          return `Add prefix "${stringTransform.Prefix.prefix}" to ${field}`;
        } else if ("RegexSubstitute" in stringTransform) {
          return `Replace pattern /${stringTransform.RegexSubstitute.pattern}/ with "${stringTransform.RegexSubstitute.replacement}" in ${field}`;
        } else if ("Replace" in stringTransform) {
          return `Replace ${field} with "${stringTransform.Replace.with}"`;
        } else if ("Substring" in stringTransform) {
          return `Extract substring (${stringTransform.Substring.start}-${stringTransform.Substring.end}) from ${field}`;
        }
      }
    } else if ("DateTransform" in fieldTransform.transform) {
      const dateTransform = fieldTransform.transform.DateTransform;

      if ("TimeDiff" in dateTransform) {
        const seconds = dateTransform.TimeDiff.seconds;
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;

        let amount: number;
        let unit: string;

        if (absSeconds >= 86400 && absSeconds % 86400 === 0) {
          amount = absSeconds / 86400;
          unit = amount === 1 ? "day" : "days";
        } else if (absSeconds >= 3600 && absSeconds % 3600 === 0) {
          amount = absSeconds / 3600;
          unit = amount === 1 ? "hour" : "hours";
        } else if (absSeconds >= 60 && absSeconds % 60 === 0) {
          amount = absSeconds / 60;
          unit = amount === 1 ? "minute" : "minutes";
        } else {
          amount = absSeconds;
          unit = amount === 1 ? "second" : "seconds";
        }

        return `${isNegative ? "Subtract" : "Add"} ${amount} ${unit} ${isNegative ? "from" : "to"} ${field}`;
      }
    }
  }
  return null;
};

// Action builder from action state
export const buildActionFromActionState = (
  actionState: ActionState,
): Action => {
  if (actionState.type === "Block" || actionState.type === "Allow") {
    return actionState.type;
  }

  // Build FieldTransform action
  if (!actionState.transformField || !actionState.transformType) {
    return "Block"; // fallback
  }

  let transform: Transform;

  // Handle date transforms
  if (actionState.transformType === "TimeDiff") {
    let multiplier = 60;
    if (actionState.transformParams?.unit === "hours") {
      multiplier = 3600;
    } else if (actionState.transformParams?.unit === "days") {
      multiplier = 86400;
    }
    const dateTransform: DateTransform = {
      TimeDiff: {
        seconds:
          (actionState.transformParams?.isNegative ? -1 : 1) *
          (actionState.transformParams?.value || 0) *
          multiplier,
      },
    };
    transform = {
      DateTransform: dateTransform,
    };
  } else {
    // Handle string transforms
    let stringTransform: StringTransform;

    switch (actionState.transformType) {
      case "Substitute":
        stringTransform = {
          Substitute: {
            from: actionState.transformParams?.from || "",
            to: actionState.transformParams?.to || "",
          },
        };
        break;
      case "Suffix":
        stringTransform = {
          Suffix: {
            suffix: actionState.transformParams?.suffix || "",
          },
        };
        break;
      case "Prefix":
        stringTransform = {
          Prefix: {
            prefix: actionState.transformParams?.prefix || "",
          },
        };
        break;
      case "RegexSubstitute":
        stringTransform = {
          RegexSubstitute: {
            pattern: actionState.transformParams?.pattern || "",
            replacement: actionState.transformParams?.replacement || "",
          },
        };
        break;
      case "Replace":
        stringTransform = {
          Replace: {
            with: actionState.transformParams?.with || "",
          },
        };
        break;
      case "Substring":
        stringTransform = {
          Substring: {
            start: actionState.transformParams?.start || 0,
            end: actionState.transformParams?.end || 0,
          },
        };
        break;
      case "Remove":
        stringTransform = "Remove";
        break;
      default:
        stringTransform = "Remove";
    }

    transform = {
      StringTransform: stringTransform,
    };
  }

  const fieldTransform: FieldTransform = {
    field: actionState.transformField,
    transform: transform,
  };

  return {
    FieldTransform: fieldTransform,
  };
};

// Actions builder from new rule state
export const buildActionsFromNewRule = (newRule: NewRuleState): Action[] => {
  return newRule.actions.map((actionState) =>
    buildActionFromActionState(actionState),
  );
};

// Validation functions
export const isActionStateValid = (actionState: ActionState): boolean => {
  if (actionState.type === "Block" || actionState.type === "Allow") {
    return true;
  }

  if (actionState.type === "FieldTransform") {
    if (!actionState.transformField || !actionState.transformType) return false;

    switch (actionState.transformType) {
      case "Substitute":
        return !!(
          actionState.transformParams?.from?.trim() &&
          actionState.transformParams?.to?.trim()
        );
      case "Suffix":
        return !!actionState.transformParams?.suffix?.trim();
      case "Prefix":
        return !!actionState.transformParams?.prefix?.trim();
      case "RegexSubstitute":
        return !!(
          actionState.transformParams?.pattern?.trim() &&
          actionState.transformParams?.replacement?.trim()
        );
      case "Replace":
        return !!actionState.transformParams?.with?.trim();
      case "Substring":
        return (
          actionState.transformParams?.start != null &&
          actionState.transformParams?.end != null
        );
      case "Remove":
        return true;
      case "TimeDiff":
        return (
          typeof actionState.transformParams?.seconds === "number" &&
          !Number.isNaN(actionState.transformParams?.seconds) &&
          actionState.transformParams?.seconds !== 0
        );
      default:
        return false;
    }
  }

  return false;
};

export const isAddRuleDisabled = (newRule: NewRuleState): boolean => {
  // Check if there are any actions and all actions are valid
  if (newRule.actions.length === 0) return true;

  const hasInvalidActions = newRule.actions.some(
    (action) => !isActionStateValid(action),
  );
  if (hasInvalidActions) return true;

  // For date fields, allow empty values - no validation needed
  const hasInvalidMatchers = newRule.matchers.some((group) =>
    group.some((matcher) => {
      // Date fields can have empty values
      if (matcher.field === "StartDate" || matcher.field === "EndDate") {
        return false;
      }
      // Other fields require non-empty values
      return !matcher.value?.trim();
    }),
  );

  return hasInvalidMatchers;
};
