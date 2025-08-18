import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewRuleState } from "./types";

interface TransformParamsInputProps {
  newRule: NewRuleState;
  onUpdate: (updates: Partial<NewRuleState>) => void;
}

export function TransformParamsInput({
  newRule,
  onUpdate,
}: TransformParamsInputProps) {
  if (newRule.action !== "FieldTransform" || !newRule.transformType) {
    return null;
  }

  const updateTransformParams = (updates: any) => {
    onUpdate({
      transformParams: {
        ...newRule.transformParams,
        ...updates,
      },
    });
  };

  switch (newRule.transformType) {
    case "TimeDiff":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={Math.abs(newRule.transformParams?.value || 0) || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                updateTransformParams({ value });
              }}
            />
            <Select
              value={newRule.transformParams?.unit || "minutes"}
              onValueChange={(value) => {
                updateTransformParams({
                  unit: value as "minutes" | "hours" | "days",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newRule.transformParams?.isNegative ? "subtract" : "add"}
              onValueChange={(value) => {
                updateTransformParams({ isNegative: value === "subtract" });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="subtract">Subtract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {newRule.transformParams?.isNegative ? "Subtract" : "Add"}{" "}
            {newRule.transformParams?.value || 0}{" "}
            {newRule.transformParams?.unit || "minutes"}{" "}
            {newRule.transformParams?.isNegative ? "from" : "to"} the selected
            date field.
          </div>
        </div>
      );

    case "Substitute":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="From (text to replace)"
            value={newRule.transformParams?.from || ""}
            onChange={(e) => updateTransformParams({ from: e.target.value })}
          />
          <Input
            placeholder="To (replacement text)"
            value={newRule.transformParams?.to || ""}
            onChange={(e) => updateTransformParams({ to: e.target.value })}
          />
        </div>
      );

    case "Suffix":
      return (
        <Input
          placeholder="Suffix to add"
          value={newRule.transformParams?.suffix || ""}
          onChange={(e) => updateTransformParams({ suffix: e.target.value })}
        />
      );

    case "Prefix":
      return (
        <Input
          placeholder="Prefix to add"
          value={newRule.transformParams?.prefix || ""}
          onChange={(e) => updateTransformParams({ prefix: e.target.value })}
        />
      );

    case "RegexSubstitute":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Regex pattern"
            value={newRule.transformParams?.pattern || ""}
            onChange={(e) => updateTransformParams({ pattern: e.target.value })}
          />
          <Input
            placeholder="Replacement text"
            value={newRule.transformParams?.replacement || ""}
            onChange={(e) =>
              updateTransformParams({ replacement: e.target.value })
            }
          />
        </div>
      );

    case "Replace":
      return (
        <Input
          placeholder="Replace entire field with"
          value={newRule.transformParams?.with || ""}
          onChange={(e) => updateTransformParams({ with: e.target.value })}
        />
      );

    case "Substring":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Start position"
            value={newRule.transformParams?.start || ""}
            onChange={(e) =>
              updateTransformParams({ start: parseInt(e.target.value) || 0 })
            }
          />
          <Input
            type="number"
            placeholder="End position"
            value={newRule.transformParams?.end || ""}
            onChange={(e) =>
              updateTransformParams({ end: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      );

    case "Remove":
      return (
        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
          This will remove the entire content of the selected field.
        </div>
      );

    default:
      return null;
  }
}
