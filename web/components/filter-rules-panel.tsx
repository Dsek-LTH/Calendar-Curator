"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScaleIcon } from "lucide-react";
import { RulesPanelProps } from "./filter-rules/types";
import { useRulesManager } from "./filter-rules/use-rules-manager";
import { NewRuleForm } from "./filter-rules/new-rule-form";
import { RuleList } from "./filter-rules/rule-list";

export function RulesPanel({ calendarId }: RulesPanelProps) {
  const { rules, error, createRule, deleteRule, reorderRules } =
    useRulesManager(calendarId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="h-5 w-5" />
          Filter Rules ({rules.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {!calendarId && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Please create or load a calendar to manage filter rules.
          </div>
        )}

        {calendarId && (
          <>
            {/* Add New Rule Form */}
            <NewRuleForm onCreateRule={createRule} />

            {/* Existing Rules List */}
            <RuleList
              rules={rules}
              onDeleteRule={deleteRule}
              onReorderRules={reorderRules}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
