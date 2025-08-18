import { Field, Filter } from "@/lib/api";

// UI state for creating new rules
export interface NewRuleState {
  action: "Block" | "Allow" | "FieldTransform";
  filter: Filter;
  transformField?: Field;
  // Weird typescript issue if I do `keyof StringTransform | keyof DateTransform`
  transformType?:
    | "Substitute"
    | "Suffix"
    | "Prefix"
    | "RegexSubstitute"
    | "Replace"
    | "Substring"
    | "Remove"
    | "TimeDiff";
  transformParams?: any;
}

export interface RulesPanelProps {
  calendarId: string | null;
}
