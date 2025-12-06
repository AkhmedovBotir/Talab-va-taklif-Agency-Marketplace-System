import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeltaFormat } from '@/services/vacancyApi';

interface DeltaRendererProps {
  delta?: DeltaFormat | null;
}

export function DeltaRenderer({ delta }: DeltaRendererProps) {
  if (!delta) {
    return null;
  }

  // Handle different delta formats
  let ops: any[] = [];
  
  if (delta.ops && Array.isArray(delta.ops)) {
    ops = delta.ops;
  } else if (Array.isArray(delta)) {
    ops = delta;
  } else if (typeof delta === 'string') {
    // If it's a plain string, wrap it
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{delta}</Text>
      </View>
    );
  }

  if (!ops || ops.length === 0) {
    return null;
  }

  const renderOps = (operations: any[]): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentParagraph: any[] = [];
    let paragraphKey = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <View key={`p-${paragraphKey++}`} style={styles.paragraph}>
            {currentParagraph.map((item, index) => item)}
          </View>
        );
        currentParagraph = [];
      }
    };

    operations.forEach((op, index) => {
      if (typeof op.insert === 'string') {
        const text = op.insert;
        const attributes = op.attributes || {};

        // Check if this is a new line (paragraph break)
        if (text === '\n' || (text.endsWith('\n') && text.length > 1)) {
          const cleanText = text.replace(/\n/g, '');
          if (cleanText) {
            currentParagraph.push(
              <Text key={`text-${index}`} style={buildTextStyle(attributes)}>
                {cleanText}
              </Text>
            );
          }
          flushParagraph();
        } else {
          // Build text style from attributes
          currentParagraph.push(
            <Text key={`text-${index}`} style={buildTextStyle(attributes)}>
              {text}
            </Text>
          );
        }
      } else if (op.insert && typeof op.insert === 'object') {
        // Handle embeds (images, etc.)
        flushParagraph();
        if (op.insert.image) {
          elements.push(
            <Text key={`embed-${index}`} style={styles.text}>
              [Rasm]
            </Text>
          );
        }
      }
    });

    // Flush remaining paragraph
    flushParagraph();

    return elements;
  };

  const buildTextStyle = (attributes: any) => {
    const styles_array: any[] = [styles.text];

    if (attributes.bold) {
      styles_array.push(styles.bold);
    }
    if (attributes.italic) {
      styles_array.push(styles.italic);
    }
    if (attributes.underline) {
      styles_array.push(styles.underline);
    }
    if (attributes.strike) {
      styles_array.push(styles.strike);
    }
    if (attributes.color) {
      styles_array.push({ color: attributes.color });
    }
    if (attributes.background) {
      styles_array.push({ backgroundColor: attributes.background });
    }
    if (attributes.size) {
      styles_array.push({ fontSize: parseInt(attributes.size) || 15 });
    }

    // Handle headings
    if (attributes.header) {
      const headerStyle = 
        attributes.header === 1 ? styles.heading1 :
        attributes.header === 2 ? styles.heading2 :
        styles.heading3;
      styles_array.push(headerStyle);
    }

    // Handle lists
    if (attributes.list) {
      styles_array.push(styles.listItem);
    }

    return styles_array;
  };

  return (
    <View style={styles.container}>
      {renderOps(ops)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  paragraph: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  listItem: {
    marginLeft: 16,
  },
});
