import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Rule } from "@/lib/api";
import { getActionColor } from "./utils";
import { RuleDescription } from "./rule-description";

interface RuleListProps {
  rules: Rule[];
  onDeleteRule: (ruleId: string) => Promise<void>;
  onReorderRules: (fromIndex: number, toIndex: number) => Promise<void>;
}

export function RuleList({
  rules,
  onDeleteRule,
  onReorderRules,
}: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No rules configured. Add a rule above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          key={rule.id}
          className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
        >
          {/* Actions */}
          <div className="flex flex-col items-center gap-1">
            {/* Move Up */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReorderRules(index, index - 1)}
              disabled={index === 0}
              className="h-6 w-6 p-0"
            >
              <ChevronUpIcon className="h-3 w-3" />
            </Button>

            {/* Drag Handle */}
            <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />

            {/* Move Down */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReorderRules(index, index + 1)}
              disabled={index === rules.length - 1}
              className="h-6 w-6 p-0"
            >
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </div>

          {/* Rule Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={getActionColor(rule.action) as any}
                className="text-xs"
              >
                {typeof rule.action === "string" ? rule.action : "Transform"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Rule #{index + 1}
              </span>
            </div>
            <RuleDescription rule={rule} />
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteRule(rule.id)}
            title="Delete rule"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
