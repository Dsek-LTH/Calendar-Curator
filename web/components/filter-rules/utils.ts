import {
  Field,
  Matcher,
  Rule,
  Action,
  Transform,
  DateTransform,
  StringTransform,
  FieldTransform,
} from "@/lib/api";
import { NewRuleState } from "./types";

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

export const getActionColor = (action: Rule["action"]): string => {
  if (typeof action === "string") {
    switch (action) {
      case "Block":
        return "destructive";
      case "Allow":
        return "default";
      default:
        return "outline";
    }
  } else {
    return "secondary";
  }
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

// Action builder from new rule state
export const buildActionFromNewRule = (newRule: NewRuleState): Action => {
  if (newRule.action === "Block" || newRule.action === "Allow") {
    return newRule.action;
  }

  // Build FieldTransform action
  if (!newRule.transformField || !newRule.transformType) {
    return "Block"; // fallback
  }

  let transform: Transform;

  // Handle date transforms
  if (newRule.transformType === "TimeDiff") {
    let multiplier = 60;
    if (newRule.transformParams?.unit === "hours") {
      multiplier = 3600;
    } else if (newRule.transformParams?.unit === "days") {
      multiplier = 86400;
    }
    const dateTransform: DateTransform = {
      TimeDiff: {
        seconds:
          (newRule.transformParams?.isNegative ? -1 : 1) *
          (newRule.transformParams?.value || 0) *
          multiplier,
      },
    };
    transform = {
      DateTransform: dateTransform,
    };
  } else {
    // Handle string transforms
    let stringTransform: StringTransform;

    switch (newRule.transformType) {
      case "Substitute":
        stringTransform = {
          Substitute: {
            from: newRule.transformParams?.from || "",
            to: newRule.transformParams?.to || "",
          },
        };
        break;
      case "Suffix":
        stringTransform = {
          Suffix: {
            suffix: newRule.transformParams?.suffix || "",
          },
        };
        break;
      case "Prefix":
        stringTransform = {
          Prefix: {
            prefix: newRule.transformParams?.prefix || "",
          },
        };
        break;
      case "RegexSubstitute":
        stringTransform = {
          RegexSubstitute: {
            pattern: newRule.transformParams?.pattern || "",
            replacement: newRule.transformParams?.replacement || "",
          },
        };
        break;
      case "Replace":
        stringTransform = {
          Replace: {
            with: newRule.transformParams?.with || "",
          },
        };
        break;
      case "Substring":
        stringTransform = {
          Substring: {
            start: newRule.transformParams?.start || 0,
            end: newRule.transformParams?.end || 0,
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
    field: newRule.transformField,
    transform: transform,
  };

  return {
    FieldTransform: fieldTransform,
  };
};

// Validation functions
export const isAddRuleDisabled = (newRule: NewRuleState): boolean => {
  // For date fields, allow empty values - no validation needed
  const hasInvalidMatchers = newRule.filter.matchers.some((group) =>
    group.some((matcher) => {
      // Date fields can have empty values
      if (matcher.field === "StartDate" || matcher.field === "EndDate") {
        return false;
      }
      // Other fields require non-empty values
      return !matcher.value?.trim();
    }),
  );

  if (hasInvalidMatchers) return true;

  if (newRule.action === "FieldTransform") {
    if (!newRule.transformField || !newRule.transformType) return true;

    switch (newRule.transformType) {
      case "Substitute":
        return (
          !newRule.transformParams?.from?.trim() ||
          !newRule.transformParams?.to?.trim()
        );
      case "Suffix":
        return !newRule.transformParams?.suffix?.trim();
      case "Prefix":
        return !newRule.transformParams?.prefix?.trim();
      case "RegexSubstitute":
        return (
          !newRule.transformParams?.pattern?.trim() ||
          !newRule.transformParams?.replacement?.trim()
        );
      case "Replace":
        return !newRule.transformParams?.with?.trim();
      case "Substring":
        return (
          newRule.transformParams?.start == null ||
          newRule.transformParams?.end == null
        );
      case "Remove":
        return false;
      case "TimeDiff":
        return (
          typeof newRule.transformParams?.seconds !== "number" ||
          Number.isNaN(newRule.transformParams?.seconds) ||
          newRule.transformParams?.seconds === 0
        );
      default:
        return true;
    }
  }

  return false;
};
