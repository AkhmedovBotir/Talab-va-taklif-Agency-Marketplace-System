import React from 'react';

export function renderProductDescriptionWeb(descJson: string): React.ReactNode {
  try {
    const delta = JSON.parse(descJson);
    if (!Array.isArray(delta?.ops)) return descJson;
    return delta.ops.map((op: { insert?: string; attributes?: { bold?: boolean; italic?: boolean } }, i: number) => {
      let content: React.ReactNode = op.insert;
      if (op.attributes?.bold) content = <strong key={i}>{content}</strong>;
      if (op.attributes?.italic) content = <em key={i}>{content}</em>;
      return <React.Fragment key={i}>{content}</React.Fragment>;
    });
  } catch {
    return descJson;
  }
}
