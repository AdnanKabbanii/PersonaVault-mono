import React from 'react';

export function formatLLMText(text: string): React.ReactNode {
  if (!text) return null;

  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((paragraph, index) => {
    // Handle bullet points
    if (paragraph.includes('\n-') || paragraph.includes('\n •')) {
      const lines = paragraph.split('\n');
      const beforeList: string[] = [];
      const listItems: string[] = [];
      const afterList: string[] = [];
      
      let currentSection: 'before' | 'list' | 'after' = 'before';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          currentSection = 'list';
          listItems.push(trimmedLine.replace(/^[-•]\s*/, ''));
        } else if (currentSection === 'list' && trimmedLine.match(/^\s*-/)) {
          listItems.push(trimmedLine.replace(/^\s*-\s*/, ''));
        } else if (currentSection === 'list' && trimmedLine === '') {
          // Empty line in list, continue
        } else if (currentSection === 'list') {
          currentSection = 'after';
          afterList.push(trimmedLine);
        } else if (currentSection === 'before') {
          beforeList.push(trimmedLine);
        } else {
          afterList.push(trimmedLine);
        }
      });
      
      return (
        <div key={index} className={index > 0 ? 'mt-4' : ''}>
          {beforeList.length > 0 && (
            <p className="mb-2">
              {beforeList.join(' ')}
            </p>
          )}
          {listItems.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 mb-2">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-200">
                  {item}
                </li>
              ))}
            </ul>
          )}
          {afterList.length > 0 && (
            <p>
              {afterList.join(' ')}
            </p>
          )}
        </div>
      );
    }
    
    // Handle numbered lists
    if (paragraph.match(/^\d+\./m)) {
      const lines = paragraph.split('\n');
      const beforeList: string[] = [];
      const listItems: { number: string; text: string }[] = [];
      const afterList: string[] = [];
      
      let currentSection: 'before' | 'list' | 'after' = 'before';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
        
        if (numberedMatch) {
          currentSection = 'list';
          listItems.push({
            number: numberedMatch[1],
            text: numberedMatch[2]
          });
        } else if (currentSection === 'list' && trimmedLine === '') {
          // Empty line in list, continue
        } else if (currentSection === 'list') {
          currentSection = 'after';
          afterList.push(trimmedLine);
        } else if (currentSection === 'before') {
          beforeList.push(trimmedLine);
        } else {
          afterList.push(trimmedLine);
        }
      });
      
      return (
        <div key={index} className={index > 0 ? 'mt-4' : ''}>
          {beforeList.length > 0 && (
            <p className="mb-2">
              {beforeList.join(' ')}
            </p>
          )}
          {listItems.length > 0 && (
            <ol className="list-decimal pl-5 space-y-1 mb-2">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-200">
                  {item.text}
                </li>
              ))}
            </ol>
          )}
          {afterList.length > 0 && (
            <p>
              {afterList.join(' ')}
            </p>
          )}
        </div>
      );
    }
    
    // Regular paragraph - handle single line breaks within
    const processedText = paragraph
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
    
    if (processedText.trim() === '') return null;
    
    return (
      <p key={index} className={`text-gray-200 leading-relaxed ${index > 0 ? 'mt-4' : ''}`}>
        {processedText}
      </p>
    );
  }).filter(Boolean);
}

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      {formatLLMText(content)}
    </div>
  );
}
