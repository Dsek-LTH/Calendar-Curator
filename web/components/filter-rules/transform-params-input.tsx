import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionState } from "./types";

interface TransformParamsInputProps {
  action: ActionState;
  onUpdate: (updates: Partial<ActionState>) => void;
}

export function TransformParamsInput({
  action,
  onUpdate,
}: TransformParamsInputProps) {
  if (action.type !== "FieldTransform" || !action.transformType) {
    return null;
  }

  const updateTransformParams = (updates: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    onUpdate({
      transformParams: {
        ...action.transformParams,
        ...updates,
      },
    });
  };

  switch (action.transformType) {
    case "TimeDiff":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={Math.abs(action.transformParams?.value || 0) || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                updateTransformParams({ value });
              }}
            />
            <Select
              value={action.transformParams?.unit || "minutes"}
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
              value={action.transformParams?.isNegative ? "subtract" : "add"}
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
            {action.transformParams?.isNegative ? "Subtract" : "Add"}{" "}
            {action.transformParams?.value || 0}{" "}
            {action.transformParams?.unit || "minutes"}{" "}
            {action.transformParams?.isNegative ? "from" : "to"} the selected
            date field.
          </div>
        </div>
      );

    case "Substitute":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="From (text to replace)"
            value={action.transformParams?.from || ""}
            onChange={(e) => updateTransformParams({ from: e.target.value })}
          />
          <Input
            placeholder="To (replacement text)"
            value={action.transformParams?.to || ""}
            onChange={(e) => updateTransformParams({ to: e.target.value })}
          />
        </div>
      );

    case "Suffix":
      return (
        <Input
          placeholder="Suffix to add"
          value={action.transformParams?.suffix || ""}
          onChange={(e) => updateTransformParams({ suffix: e.target.value })}
        />
      );

    case "Prefix":
      return (
        <Input
          placeholder="Prefix to add"
          value={action.transformParams?.prefix || ""}
          onChange={(e) => updateTransformParams({ prefix: e.target.value })}
        />
      );

    case "RegexSubstitute":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Regex pattern"
            value={action.transformParams?.pattern || ""}
            onChange={(e) => updateTransformParams({ pattern: e.target.value })}
          />
          <Input
            placeholder="Replacement text"
            value={action.transformParams?.replacement || ""}
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
          value={action.transformParams?.with || ""}
          onChange={(e) => updateTransformParams({ with: e.target.value })}
        />
      );

    case "Substring":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Start position"
            value={action.transformParams?.start || ""}
            onChange={(e) =>
              updateTransformParams({ start: parseInt(e.target.value) || 0 })
            }
          />
          <Input
            type="number"
            placeholder="End position"
            value={action.transformParams?.end || ""}
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
