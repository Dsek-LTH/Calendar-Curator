"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScaleIcon } from "lucide-react";
import { useRulesManager } from "./filter-rules/use-rules-manager";
import { RuleForm } from "./filter-rules/rule-form";
import { RuleList } from "./filter-rules/rule-list";

export function RulesPanel({
  calendarId,
  onRuleHover,
  onRuleChange,
}: {
  calendarId: string | null;
  onRuleHover?: (ruleId: string | null) => void;
  onRuleChange?: () => void;
}) {
  const {
    rules,
    error,
    createRule,
    deleteRule,
    reorderRules,
    updateRule,
    duplicateRule,
  } = useRulesManager(calendarId, onRuleChange);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="h-5 w-5" />
          Filter Rules ({rules.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {error && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!calendarId && (
          <div className="text-center py-6 text-slate-500 text-sm bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
            Please create or load a calendar to manage filter rules.
          </div>
        )}

        {calendarId && (
          <>
            {/* Add New Rule Form */}
            <RuleForm onCreateRule={createRule} />

            {/* Existing Rules List */}
            <RuleList
              rules={rules}
              onDeleteRule={deleteRule}
              onReorderRules={reorderRules}
              onUpdateRule={updateRule}
              onDuplicateRule={duplicateRule}
              onRuleHover={onRuleHover}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
