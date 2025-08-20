import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  CopyIcon,
} from "lucide-react";
import { Rule } from "@/lib/api";
import { getActionColor } from "./utils";
import { RuleDescription } from "./rule-description";
import { RuleForm } from "./rule-form";
import { useState } from "react";

interface RuleListProps {
  rules: Rule[];
  onDeleteRule: (ruleId: string) => Promise<void>;
  onReorderRules: (fromIndex: number, toIndex: number) => Promise<void>;
  onUpdateRule: (ruleId: string, rule: Rule) => Promise<void>;
  onDuplicateRule: (rule: Rule) => Promise<void>;
  onRuleHover?: (ruleId: string | null) => void;
}

export function RuleList({
  rules,
  onDeleteRule,
  onReorderRules,
  onUpdateRule,
  onDuplicateRule,
  onRuleHover,
}: RuleListProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

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
        <div key={rule.id}>
          {editingRuleId === rule.id ? (
            <RuleForm
              rule={rule}
              onUpdateRule={async (ruleId, updatedRule) => {
                await onUpdateRule(ruleId, updatedRule);
                setEditingRuleId(null);
              }}
            />
          ) : (
            <div
              className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              onMouseEnter={() => onRuleHover?.(rule.id)}
              onMouseLeave={() => onRuleHover?.(null)}
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
                    variant={getActionColor(rule.actions)}
                    className="text-xs"
                  >
                    {rule.actions.length === 1
                      ? typeof rule.actions[0] === "string"
                        ? rule.actions[0]
                        : "Transform"
                      : `${rule.actions.length} Actions`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Rule #{index + 1}
                  </span>
                </div>
                <RuleDescription rule={rule} />
              </div>

              {/* Edit, Duplicate and Delete */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRuleId(rule.id)}
                  title="Edit rule"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicateRule(rule)}
                  title="Duplicate rule"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRule(rule.id)}
                  title="Delete rule"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
