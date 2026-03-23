import React from 'react';
import { Text, View, StyleSheet, TextProps } from 'react-native';

interface DeltaOp {
  insert?: string | any;
  attributes?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    header?: 1 | 2 | 3 | 4 | 5 | 6;
    list?: 'ordered' | 'bullet';
    link?: string;
    color?: string;
    background?: string;
    size?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    indent?: number;
  };
}

interface QuillDelta {
  ops?: DeltaOp[];
}

interface QuillDeltaRendererProps {
  delta: QuillDelta | null | undefined;
  style?: TextProps['style'];
}

export default function QuillDeltaRenderer({
  delta,
  style,
}: QuillDeltaRendererProps) {
  if (!delta || !delta.ops || delta.ops.length === 0) {
    return <Text style={style}>Tavsif yo'q</Text>;
  }

  const elements: React.ReactNode[] = [];
  let keyCounter = 0;

  const getTextStyle = (attributes?: DeltaOp['attributes']) => {
    if (!attributes) return {};

    const textStyle: any = {};

    if (attributes.bold) {
      textStyle.fontWeight = 'bold';
    }
    if (attributes.italic) {
      textStyle.fontStyle = 'italic';
    }
    if (attributes.underline) {
      textStyle.textDecorationLine = 'underline';
    }

    // Header styles
    if (attributes.header) {
      const headerSizes: { [key: number]: number } = {
        1: 28,
        2: 24,
        3: 20,
        4: 18,
        5: 16,
        6: 14,
      };
      textStyle.fontSize = headerSizes[attributes.header] || 16;
      textStyle.fontWeight = 'bold';
      textStyle.marginTop = attributes.header > 1 ? 12 : 0;
      textStyle.marginBottom = 8;
    }

    // Color
    if (attributes.color) {
      textStyle.color = attributes.color;
    }
    if (attributes.background) {
      textStyle.backgroundColor = attributes.background;
    }

    // Size
    if (attributes.size) {
      const sizeMap: { [key: string]: number } = {
        small: 12,
        normal: 14,
        large: 18,
        huge: 22,
      };
      if (sizeMap[attributes.size]) {
        textStyle.fontSize = sizeMap[attributes.size];
      }
    }

    // Align
    if (attributes.align) {
      textStyle.textAlign = attributes.align;
    }

    return textStyle;
  };

  // Process operations
  let listCounter = 0;
  let inList = false;
  let listType: 'ordered' | 'bullet' | null = null;

  delta.ops.forEach((op) => {
    if (typeof op.insert === 'string') {
      const text = op.insert;
      const attributes = op.attributes || {};

      // Handle lists
      if (attributes.list) {
        // Start new list if type changed
        if (listType !== attributes.list) {
          if (inList) {
            // Close previous list
            elements.push(<View key={`list-spacing-${keyCounter++}`} style={styles.listSpacing} />);
          }
          listType = attributes.list;
          listCounter = 0;
          inList = true;
        }

        // Process list items
        const lines = text.split('\n');
        lines.forEach((line, lineIdx) => {
          if (line.trim().length > 0) {
            listCounter++;
            const marker = attributes.list === 'ordered' ? `${listCounter}. ` : '• ';

            elements.push(
              <View key={`list-item-${keyCounter++}`} style={styles.listItem}>
                <Text style={[styles.listMarker, getTextStyle(attributes), style]}>
                  {marker}
                </Text>
                <Text style={[getTextStyle(attributes), style, { flex: 1 }]}>
                  {line}
                </Text>
              </View>
            );
          } else if (lineIdx < lines.length - 1) {
            // Empty line - end list
            inList = false;
            listType = null;
            listCounter = 0;
            elements.push(<View key={`list-break-${keyCounter++}`} style={styles.lineBreak} />);
          }
        });
      } else {
        // Regular text (not in list)
        if (inList) {
          // Close list
          elements.push(<View key={`list-end-${keyCounter++}`} style={styles.listSpacing} />);
          inList = false;
          listType = null;
          listCounter = 0;
        }

        // Process text with line breaks
        const lines = text.split('\n');
        lines.forEach((line, lineIdx) => {
          if (line.length > 0) {
            elements.push(
              <Text
                key={`text-${keyCounter++}`}
                style={[getTextStyle(attributes), style]}
              >
                {line}
              </Text>
            );
          }
          // Add line break between lines (except last empty)
          if (lineIdx < lines.length - 1) {
            elements.push(
              <Text key={`break-${keyCounter++}`} style={[style, styles.lineBreak]}>
                {'\n'}
              </Text>
            );
          }
        });
      }
    }
  });

  // Close list if still open
  if (inList) {
    elements.push(<View key={`list-final-spacing-${keyCounter++}`} style={styles.listSpacing} />);
  }

  return <View>{elements}</View>;
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
    alignItems: 'flex-start',
  },
  listMarker: {
    marginRight: 8,
    minWidth: 24,
  },
  listSpacing: {
    height: 8,
  },
  lineBreak: {
    fontSize: 12,
  },
});
