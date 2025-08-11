import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // First, set the HTML content
    containerRef.current.innerHTML = content;

    // Then, find and render all LaTeX elements
    const inlineElements = containerRef.current.querySelectorAll('.latex-inline');
    const blockElements = containerRef.current.querySelectorAll('.latex-block');

    inlineElements.forEach(element => {
      try {
        const latex = element.getAttribute('data-latex');
        if (latex) {
          katex.render(latex, element as HTMLElement, {
            throwOnError: false,
            displayMode: false
          });
        }
      } catch (error) {
        console.error('Error rendering inline LaTeX:', error);
      }
    });

    blockElements.forEach(element => {
      try {
        const latex = element.getAttribute('data-latex');
        if (latex) {
          katex.render(latex, element as HTMLElement, {
            throwOnError: false,
            displayMode: true
          });
        }
      } catch (error) {
        console.error('Error rendering block LaTeX:', error);
      }
    });
  }, [content]);

  return <div ref={containerRef} className={className}></div>;
};

export default LatexRenderer;