import { Badge } from "@/components/ui/badge";
import { Rule } from "@/lib/api";
import {
  getFieldLabel,
  getMatchTypeLabel,
  getTransformDescription,
} from "./utils";

interface RuleDescriptionProps {
  rule: Rule;
}

export function RuleDescription({ rule }: RuleDescriptionProps) {
  const actionDescriptions = rule.actions.map((action, _) => {
    if (typeof action === "string") {
      return { type: action, description: action };
    } else {
      return {
        type: "Transform",
        description: getTransformDescription(action) || "Transform field",
      };
    }
  });

  return (
    <div className="text-sm">
      {/* Actions Section */}
      <div className="mb-2">
        {actionDescriptions.map((actionDesc, index) => (
          <div key={index} className="mb-1">
            <Badge variant="outline" className="mr-2 text-xs">
              {index + 1}
            </Badge>
            <span
              className={`font-medium ${
                actionDesc.type === "Block"
                  ? "text-red-600"
                  : actionDesc.type === "Allow"
                    ? "text-green-600"
                    : "text-blue-600"
              }`}
            >
              {actionDesc.description}
            </span>
          </div>
        ))}
      </div>

      {/* Conditions Section */}
      {rule.matchers.length === 0 ||
      rule.matchers.every((group) => group.length === 0) ? (
        <span className="text-muted-foreground italic">
          No conditions (applies to all events)
        </span>
      ) : (
        <div>
          <span className="text-muted-foreground">when </span>
          {rule.matchers.map((group, groupIndex) =>
            group.map((matcher, matcherIndex) => (
              <span key={`${groupIndex}-${matcherIndex}`}>
                {groupIndex > 0 && matcherIndex === 0 && (
                  <Badge variant="outline" className="mx-1 text-xs">
                    OR
                  </Badge>
                )}
                {matcherIndex > 0 && (
                  <Badge variant="outline" className="mx-1 text-xs">
                    AND
                  </Badge>
                )}
                {matcher.negated && (
                  <span className="text-red-500 font-medium">NOT </span>
                )}
                <span className="font-medium">
                  {getFieldLabel(matcher.field)}
                </span>
                <span className="text-muted-foreground mx-1">
                  {getMatchTypeLabel(matcher.match_type)}
                </span>
                <span className="font-medium">&quot;{matcher.value}&quot;</span>
              </span>
            )),
          )}
        </div>
      )}
    </div>
  );
}
